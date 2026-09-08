import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { ArrowLeft, ImagePlus, Loader2, X } from "lucide-react";
import { createProduct, uploadProductImage } from "../../services/productApi";
import { getCategories } from "../../services/categoryApi";
import type { Category } from "../../types/category";
import { useTheme } from "../../hooks/useTheme";
import RichTextEditor from "../../components/RichTextEditor";

interface PendingImage {
  file: File;
  previewUrl: string;
}

function dollarsInputToCents(value: string): number {
  return Math.round(parseFloat(value || "0") * 100);
}

function centsToDisplay(cents: number): string {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data;
    if (Array.isArray(data?.message)) return data.message.join(", ");
    return data?.message ?? fallback;
  }
  return fallback;
}

const inputClasses =
  "mt-1.5 w-full rounded-lg border border-[#E4E4E9] bg-white px-3 py-2.5 text-[#111114] outline-none placeholder:text-[#9C9CA6] transition-colors focus:border-[#3A5CFF] focus:ring-1 focus:ring-[#3A5CFF]/40 dark:border-[#2A2A34] dark:bg-[#15151C] dark:text-[#F4F3F1] dark:placeholder:text-[#5C5B66]";

// Every image tile — the primary box and each grid thumbnail — shares this
// shape (a square that fills its parent), per the "all boxes same size"
// requirement.
const imageBoxBaseClasses = "relative aspect-square w-full overflow-hidden rounded-lg";

const filledBoxClasses = `${imageBoxBaseClasses} border border-[#E4E4E9] bg-[#F7F7F8] dark:border-[#2A2A34] dark:bg-[#15151C]`;

function addTileClasses(isDraggingOver: boolean) {
  return `${imageBoxBaseClasses} flex cursor-pointer flex-col items-center justify-center gap-1 border border-dashed text-[11px] transition-colors ${
    isDraggingOver
      ? "border-[#3A5CFF] bg-[#EEF1FF] text-[#3A5CFF] dark:bg-[#151A2E]"
      : "border-[#D5D5DC] text-[#9C9CA6] hover:border-[#3A5CFF] hover:text-[#3A5CFF] dark:border-[#33333F] dark:text-[#5C5B66]"
  }`;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[#3A3A44] dark:text-[#D8D7DE]">
        {label}
      </span>
      {children}
      {hint && (
        <p className="mt-1.5 text-xs text-[#9C9CA6] dark:text-[#5C5B66]">
          {hint}
        </p>
      )}
    </label>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#E4E4E9] bg-white p-6 dark:border-[#22222C] dark:bg-[#101014]">
      <h2 className="text-[15px] font-semibold text-[#111114] dark:text-[#F4F3F1]">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-[#6B6B76] dark:text-[#8B8A96]">
          {description}
        </p>
      )}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function AddProduct() {
  const navigate = useNavigate();
  // Keeps the page in sync with the stored theme preference. Once the
  // Settings toggle exists, it can call setTheme/toggleTheme from this same
  // hook and every page picks it up automatically.
  useTheme();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");

  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isDraggingOverAdd, setIsDraggingOverAdd] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const pendingImagesRef = useRef(pendingImages);
  pendingImagesRef.current = pendingImages;

  useEffect(() => {
    (async () => {
      setIsLoadingCategories(true);
      try {
        const data = await getCategories();
        setCategories(data);
        if (data.length > 0) setCategoryId(data[0].id);
      } catch (err) {
        setFormError(extractErrorMessage(err, "Could not load categories."));
      } finally {
        setIsLoadingCategories(false);
      }
    })();

    return () => {
      pendingImagesRef.current.forEach((img) =>
        URL.revokeObjectURL(img.previewUrl),
      );
    };
  }, []);

  const addFiles = (files: FileList | File[]) => {
    const newImages = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
    if (newImages.length > 0) {
      setPendingImages((prev) => [...prev, ...newImages]);
    }
  };

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    addFiles(files);
    event.target.value = "";
  };

  const removePendingImage = (index: number) => {
    setPendingImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  // --- Drag to reorder -----------------------------------------------
  // Any tile (the primary box or a grid thumbnail) can be dragged onto any
  // other tile. Dropping onto the primary box promotes that image; dropping
  // a primary image into the grid demotes it.
  const handleTileDragStart = (index: number) => (event: DragEvent) => {
    setDraggedIndex(index);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleTileDragOver = (index: number) => (event: DragEvent) => {
    event.preventDefault();
    if (draggedIndex === null) return;
    setDropTargetIndex(index);
  };

  const handleTileDrop = (index: number) => (event: DragEvent) => {
    event.preventDefault();
    setDropTargetIndex(null);
    if (draggedIndex === null || draggedIndex === index) return;
    setPendingImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDraggedIndex(null);
  };

  const handleTileDragEnd = () => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  // Empty slots (the "add" tiles) accept two different things: a photo
  // being reordered from elsewhere in the grid, or new files dragged in
  // from outside the browser. Same box, either source.
  const handleSlotDragOver = (index: number) => (event: DragEvent) => {
    event.preventDefault();
    if (draggedIndex !== null) {
      setDropTargetIndex(index);
    } else {
      setIsDraggingOverAdd(true);
    }
  };

  const handleSlotDrop = (index: number) => (event: DragEvent) => {
    event.preventDefault();
    setIsDraggingOverAdd(false);
    setDropTargetIndex(null);

    if (draggedIndex !== null) {
      if (draggedIndex !== index) {
        setPendingImages((prev) => {
          const next = [...prev];
          const [moved] = next.splice(draggedIndex, 1);
          next.splice(index, 0, moved);
          return next;
        });
      }
      setDraggedIndex(null);
      return;
    }

    if (event.dataTransfer.files.length > 0) {
      addFiles(event.dataTransfer.files);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const product = await createProduct({
        sku,
        name,
        priceCents: dollarsInputToCents(price),
        compareAtPriceCents: compareAtPrice
          ? dollarsInputToCents(compareAtPrice)
          : undefined,
        stock: parseInt(stock || "0", 10),
        categoryId,
        description: description || undefined,
      });

      for (let i = 0; i < pendingImages.length; i++) {
        setUploadProgress({ current: i + 1, total: pendingImages.length });
        await uploadProductImage(product.id, pendingImages[i].file);
      }

      navigate("/admin/products");
    } catch (err) {
      setFormError(extractErrorMessage(err, "Could not create product."));
      setUploadProgress(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const priceCents = dollarsInputToCents(price);
  const compareCents = compareAtPrice ? dollarsInputToCents(compareAtPrice) : 0;
  const discountPct =
    compareCents > priceCents && compareCents > 0
      ? Math.round(((compareCents - priceCents) / compareCents) * 100)
      : null;

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const [primaryImage, ...otherImages] = pendingImages;

  return (
    <div className="min-h-screen bg-[#F7F7F8] px-6 py-8 pb-28 transition-colors dark:bg-[#0B0B0F] lg:px-10">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate("/admin/products")}
          className="flex items-center gap-2 text-sm text-[#6B6B76] transition-colors hover:text-[#111114] dark:text-[#9A99A6] dark:hover:text-[#F4F3F1]"
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
          Back to products
        </button>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-[Space_Grotesk] text-2xl font-bold text-[#111114] dark:text-[#F4F3F1]">
              Add product
            </h1>
            <p className="mt-1 text-[15px] text-[#6B6B76] dark:text-[#9A99A6]">
              Fill in the details below, then create the product.
            </p>
          </div>
        </div>

        {formError && (
          <div className="mt-6 rounded-lg border border-[#F3C6C6] bg-[#FDECEC] px-4 py-3 text-sm text-[#B3261E] dark:border-[#3A2226] dark:bg-[#241417] dark:text-[#FF8A8A]">
            {formError}
          </div>
        )}

        <form
          id="add-product-form"
          onSubmit={handleSubmit}
          className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            <Section title="General" description="Basic identifying details.">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="SKU">
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="SKU-001"
                    required
                    className={inputClasses}
                  />
                </Field>
                <Field label="Category">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    disabled={isLoadingCategories}
                    className={`${inputClasses} [&>option]:bg-white dark:[&>option]:bg-[#15151C]`}
                  >
                    {isLoadingCategories && <option value="">Loading...</option>}
                    {!isLoadingCategories && categories.length === 0 && (
                      <option value="">No categories yet</option>
                    )}
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Name">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Product name"
                  required
                  className={inputClasses}
                />
              </Field>

              {!isLoadingCategories && categories.length === 0 && (
                <p className="rounded-lg border border-[#E9DCA8] bg-[#FBF3DC] px-3 py-2 text-xs text-[#8A6D1B] dark:border-[#3A3221] dark:bg-[#1E1B14] dark:text-[#E4C878]">
                  You need at least one category before you can create a
                  product.
                </p>
              )}
            </Section>

            <Section
              title="Pricing & inventory"
              description="What this product costs and how many are in stock."
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <Field label="Price">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9CA6] dark:text-[#5C5B66]">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="24.99"
                      required
                      className={`${inputClasses} pl-6`}
                    />
                  </div>
                </Field>
                <Field label="Compare-at" hint="Optional">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9CA6] dark:text-[#5C5B66]">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={compareAtPrice}
                      onChange={(e) => setCompareAtPrice(e.target.value)}
                      placeholder="29.99"
                      className={`${inputClasses} pl-6`}
                    />
                  </div>
                </Field>
                <Field label="Stock">
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="0"
                    required
                    className={inputClasses}
                  />
                </Field>
              </div>
              {discountPct !== null && (
                <p className="text-xs text-[#2F8F4E] dark:text-[#7FB88A]">
                  Shows as {discountPct}% off compare-at price.
                </p>
              )}
            </Section>

            <Section title="Description" description="Optional — shown on the product page.">
              {/* Editor lives in its own div, unrelated to the media div below. */}
              <div>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Short description — use the toolbar for headings and lists."
                />
              </div>
            </Section>

            <Section
              title="Media"
              description="The first image is used as the primary image in the catalog."
            >
              {/* Media div: one div for the primary image input, one div for
                  the grid of the other 8 image slots. 3-column split so the
                  grid div gets twice the width of the primary div. */}
              <div className="grid grid-cols-3 gap-6">
                {/* Div 1: primary image input only */}
                <div>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[#9C9CA6] dark:text-[#5C5B66]">
                    Primary
                  </p>
                  {primaryImage ? (
                    <div
                      draggable
                      onDragStart={handleTileDragStart(0)}
                      onDragEnd={handleTileDragEnd}
                      onDragOver={handleTileDragOver(0)}
                      onDrop={handleTileDrop(0)}
                      className={`group ${filledBoxClasses} cursor-grab active:cursor-grabbing ${
                        dropTargetIndex === 0 ? "ring-2 ring-[#3A5CFF]" : ""
                      }`}
                    >
                      <img
                        src={primaryImage.previewUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePendingImage(0)}
                        className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Remove image"
                      >
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  ) : (
                    <label
                      onDragOver={handleSlotDragOver(0)}
                      onDragLeave={() => setIsDraggingOverAdd(false)}
                      onDrop={handleSlotDrop(0)}
                      className={addTileClasses(isDraggingOverAdd)}
                    >
                      <ImagePlus size={20} strokeWidth={1.75} />
                      Add photo
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFilesSelected}
                      />
                    </label>
                  )}
                </div>

                {/* Div 2: grid of 8 boxes for the other images */}
                <div className="col-span-2">
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[#9C9CA6] dark:text-[#5C5B66]">
                    Other images
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 8 }).map((_, i) => {
                      const actualIndex = i + 1;
                      const img = otherImages[i];

                      if (img) {
                        return (
                          <div
                            key={img.previewUrl}
                            draggable
                            onDragStart={handleTileDragStart(actualIndex)}
                            onDragEnd={handleTileDragEnd}
                            onDragOver={handleTileDragOver(actualIndex)}
                            onDrop={handleTileDrop(actualIndex)}
                            className={`group ${filledBoxClasses} cursor-grab active:cursor-grabbing ${
                              dropTargetIndex === actualIndex
                                ? "ring-2 ring-[#3A5CFF]"
                                : ""
                            }`}
                          >
                            <img
                              src={img.previewUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removePendingImage(actualIndex)}
                              className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                              aria-label="Remove image"
                            >
                              <X size={12} strokeWidth={2.5} />
                            </button>
                          </div>
                        );
                      }

                      // Every empty slot is a clickable/droppable add tile —
                      // not just the next one in line.
                      return (
                        <label
                          key={`add-${actualIndex}`}
                          onDragOver={handleSlotDragOver(actualIndex)}
                          onDragLeave={() => setIsDraggingOverAdd(false)}
                          onDrop={handleSlotDrop(actualIndex)}
                          className={addTileClasses(isDraggingOverAdd)}
                        >
                          <ImagePlus size={18} strokeWidth={1.75} />
                          Add
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleFilesSelected}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-[#9C9CA6] dark:text-[#5C5B66]">
                Drag any photo onto another box to reorder, or onto the
                primary box to swap it in.
              </p>
            </Section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 rounded-xl border border-[#E4E4E9] bg-white p-6 dark:border-[#22222C] dark:bg-[#101014]">
              <h2 className="text-[15px] font-semibold text-[#111114] dark:text-[#F4F3F1]">
                Summary
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-[#6B6B76] dark:text-[#8B8A96]">Name</dt>
                  <dd className="max-w-[60%] truncate text-right text-[#111114] dark:text-[#F4F3F1]">
                    {name || "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[#6B6B76] dark:text-[#8B8A96]">
                    Category
                  </dt>
                  <dd className="text-[#111114] dark:text-[#F4F3F1]">
                    {selectedCategory?.name ?? "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[#6B6B76] dark:text-[#8B8A96]">
                    Price
                  </dt>
                  <dd className="text-[#111114] dark:text-[#F4F3F1]">
                    {price ? centsToDisplay(priceCents) : "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[#6B6B76] dark:text-[#8B8A96]">
                    Stock
                  </dt>
                  <dd className="text-[#111114] dark:text-[#F4F3F1]">
                    {stock || "0"} units
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[#6B6B76] dark:text-[#8B8A96]">
                    Images
                  </dt>
                  <dd className="text-[#111114] dark:text-[#F4F3F1]">
                    {pendingImages.length}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </form>
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 border-t border-[#E4E4E9] bg-white/95 backdrop-blur transition-colors dark:border-[#22222C] dark:bg-[#0B0B0F]/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4 lg:px-10">
          <p className="text-xs text-[#9C9CA6] dark:text-[#5C5B66]">
            {uploadProgress
              ? `Uploading image ${uploadProgress.current} of ${uploadProgress.total}...`
              : isSubmitting
                ? "Creating product..."
                : "Ready to publish"}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-[#6B6B76] hover:text-[#111114] dark:text-[#9A99A6] dark:hover:text-[#F4F3F1]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-product-form"
              disabled={isSubmitting || categories.length === 0}
              className="flex items-center gap-2 rounded-lg bg-[#3A5CFF] px-5 py-2.5 text-sm font-medium text-white transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isSubmitting ? "Creating..." : "Create product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddProduct;