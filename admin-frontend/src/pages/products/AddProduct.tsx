import { useEffect, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { ArrowLeft, ImagePlus, Loader2, X } from "lucide-react";
import { createProduct, uploadProductImage } from "../../services/productApi";
import { getCategories } from "../../services/categoryApi";
import type { Category } from "../../types/category";

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
  "mt-1.5 w-full rounded-lg border border-[#2A2A34] bg-[#15151C] px-3 py-2.5 text-[#F4F3F1] outline-none placeholder:text-[#5C5B66] transition-colors focus:border-[#3A5CFF] focus:ring-1 focus:ring-[#3A5CFF]/40";

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
      <span className="text-sm font-medium text-[#D8D7DE]">{label}</span>
      {children}
      {hint && <p className="mt-1.5 text-xs text-[#5C5B66]">{hint}</p>}
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
    <section className="rounded-xl border border-[#22222C] bg-[#101014] p-6">
      <h2 className="text-[15px] font-semibold text-[#F4F3F1]">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-[#8B8A96]">{description}</p>
      )}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function AddProduct() {
  const navigate = useNavigate();

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
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

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
      pendingImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    if (event.dataTransfer.files.length > 0) {
      addFiles(event.dataTransfer.files);
    }
  };

  const removePendingImage = (index: number) => {
    setPendingImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const makePrimary = (index: number) => {
    setPendingImages((prev) => {
      const next = [...prev];
      const [chosen] = next.splice(index, 1);
      next.unshift(chosen);
      return next;
    });
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

  return (
    <div className="min-h-screen bg-[#0B0B0F] px-6 py-8 pb-28 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate("/admin/products")}
          className="flex items-center gap-2 text-sm text-[#9A99A6] transition-colors hover:text-[#F4F3F1]"
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
          Back to products
        </button>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-[Space_Grotesk] text-2xl font-bold text-[#F4F3F1]">
              Add product
            </h1>
            <p className="mt-1 text-[15px] text-[#9A99A6]">
              Fill in the details below, then create the product.
            </p>
          </div>
        </div>

        {formError && (
          <div className="mt-6 rounded-lg border border-[#3A2226] bg-[#241417] px-4 py-3 text-sm text-[#FF8A8A]">
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
                    className={`${inputClasses} [&>option]:bg-[#15151C]`}
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

              <Field
                label="Description"
                hint="Optional — shown on the product page."
              >
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description"
                  rows={4}
                  className={`${inputClasses} resize-none`}
                />
              </Field>

              {!isLoadingCategories && categories.length === 0 && (
                <p className="rounded-lg border border-[#3A3221] bg-[#1E1B14] px-3 py-2 text-xs text-[#E4C878]">
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
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5C5B66]">
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
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5C5B66]">
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
                <p className="text-xs text-[#7FB88A]">
                  Shows as {discountPct}% off compare-at price.
                </p>
              )}
            </Section>

            <Section
              title="Media"
              description="The first image is used as the primary image in the catalog."
            >
              <div className="flex flex-wrap gap-3">
                {pendingImages.map((img, index) => (
                  <div
                    key={img.previewUrl}
                    className="group relative h-24 w-24 shrink-0"
                  >
                    <img
                      src={img.previewUrl}
                      alt=""
                      className="h-full w-full rounded-lg object-cover ring-1 ring-[#2A2A34]"
                    />
                    {index === 0 ? (
                      <span className="absolute -top-2 -left-2 rounded-full bg-[#3A5CFF] px-2 py-0.5 text-[10px] font-medium text-white">
                        Primary
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => makePrimary(index)}
                        className="absolute inset-x-0 bottom-0 rounded-b-lg bg-black/70 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        Make primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removePendingImage(index)}
                      className="absolute -top-2 -right-2 rounded-full bg-[#1A1A22] p-1 text-[#9A99A6] ring-1 ring-[#2A2A34] hover:text-[#FF8A8A]"
                      aria-label="Remove image"
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}

                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={handleDrop}
                  className={`flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-xs transition-colors ${
                    isDraggingOver
                      ? "border-[#3A5CFF] bg-[#151A2E] text-[#3A5CFF]"
                      : "border-[#2A2A34] text-[#5C5B66] hover:border-[#3A5CFF] hover:text-[#3A5CFF]"
                  }`}
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
              </div>
              <p className="text-xs text-[#5C5B66]">
                Drag images in, or click to browse. Hover a non-primary image
                to promote it.
              </p>
            </Section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 rounded-xl border border-[#22222C] bg-[#101014] p-6">
              <h2 className="text-[15px] font-semibold text-[#F4F3F1]">
                Summary
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-[#8B8A96]">Name</dt>
                  <dd className="max-w-[60%] truncate text-right text-[#F4F3F1]">
                    {name || "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[#8B8A96]">Category</dt>
                  <dd className="text-[#F4F3F1]">
                    {selectedCategory?.name ?? "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[#8B8A96]">Price</dt>
                  <dd className="text-[#F4F3F1]">
                    {price ? centsToDisplay(priceCents) : "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[#8B8A96]">Stock</dt>
                  <dd className="text-[#F4F3F1]">{stock || "0"} units</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[#8B8A96]">Images</dt>
                  <dd className="text-[#F4F3F1]">{pendingImages.length}</dd>
                </div>
              </dl>
            </div>
          </div>
        </form>
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 border-t border-[#22222C] bg-[#0B0B0F]/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4 lg:px-10">
          <p className="text-xs text-[#5C5B66]">
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
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-[#9A99A6] hover:text-[#F4F3F1]"
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