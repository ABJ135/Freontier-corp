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

// Uses CSS token classes so both light and dark themes work correctly
const inputClasses =
  "mt-1.5 w-full rounded-lg border border-bg-border bg-bg px-3 py-2.5 text-text-primary outline-none placeholder:text-text-muted transition-colors focus:border-accent focus:ring-1 focus:ring-accent/40";

const imageBoxBaseClasses = "relative aspect-square w-full overflow-hidden rounded-lg";

const filledBoxClasses = `${imageBoxBaseClasses} border border-bg-border bg-bg-hover`;

function addTileClasses(isDraggingOver: boolean) {
  return `${imageBoxBaseClasses} flex cursor-pointer flex-col items-center justify-center gap-1 border border-dashed text-[11px] transition-colors ${
    isDraggingOver
      ? "border-accent bg-accent/10 text-accent"
      : "border-bg-border text-text-muted hover:border-accent hover:text-accent"
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
      <span className="text-sm font-medium text-text-secondary">{label}</span>
      {children}
      {hint && (
        <p className="mt-1.5 text-xs text-text-muted">{hint}</p>
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
    <section className="rounded-xl border border-bg-border bg-bg-panel p-6">
      <h2 className="text-[15px] font-semibold text-text-primary">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      )}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function AddProduct() {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-bg px-6 py-8 pb-28 transition-colors lg:px-10">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate("/admin/products")}
          className="flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
          Back to products
        </button>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-[Space_Grotesk] text-2xl font-bold text-text-primary">
              Add product
            </h1>
            <p className="mt-1 text-[15px] text-text-secondary">
              Fill in the details below, then create the product.
            </p>
          </div>
        </div>

        {formError && (
          <div className="mt-6 rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
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
                    className={`${inputClasses} [&>option]:bg-bg-panel`}
                  >
                    {isLoadingCategories && <option value="">Loading…</option>}
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
                <p className="rounded-lg border border-warning-border bg-warning-bg px-3 py-2 text-xs text-warning">
                  You need at least one category before you can create a product.
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
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
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
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
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
                <p className="text-xs text-success">
                  Shows as {discountPct}% off compare-at price.
                </p>
              )}
            </Section>

            <Section title="Description" description="Optional — shown on the product page.">
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
              <div className="grid grid-cols-3 gap-6">
                {/* Primary image slot */}
                <div>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">
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
                        dropTargetIndex === 0 ? "ring-2 ring-accent" : ""
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

                {/* Other image slots */}
                <div className="col-span-2">
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">
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
                                ? "ring-2 ring-accent"
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
              <p className="mt-3 text-xs text-text-muted">
                Drag any photo onto another box to reorder, or onto the primary
                box to swap it in.
              </p>
            </Section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 rounded-xl border border-bg-border bg-bg-panel p-6">
              <h2 className="text-[15px] font-semibold text-text-primary">
                Summary
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-text-secondary">Name</dt>
                  <dd className="max-w-[60%] truncate text-right text-text-primary">
                    {name || "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-text-secondary">Category</dt>
                  <dd className="text-text-primary">
                    {selectedCategory?.name ?? "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-text-secondary">Price</dt>
                  <dd className="text-text-primary">
                    {price ? centsToDisplay(priceCents) : "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-text-secondary">Stock</dt>
                  <dd className="text-text-primary">{stock || "0"} units</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-text-secondary">Images</dt>
                  <dd className="text-text-primary">{pendingImages.length}</dd>
                </div>
              </dl>
            </div>
          </div>
        </form>
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 border-t border-bg-border bg-bg-panel/95 backdrop-blur transition-colors">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4 lg:px-10">
          <p className="text-xs text-text-muted">
            {uploadProgress
              ? `Uploading image ${uploadProgress.current} of ${uploadProgress.total}…`
              : isSubmitting
                ? "Creating product…"
                : "Ready to publish"}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-product-form"
              disabled={isSubmitting || categories.length === 0}
              className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isSubmitting ? "Creating…" : "Create product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddProduct;