import { useEffect, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { ArrowLeft, ImagePlus, Loader2, Star, X } from "lucide-react";
import {
  deleteProductImage,
  getProduct,
  setPrimaryProductImage,
  updateProduct,
  uploadProductImage,
} from "../../services/productApi";
import { getCategories } from "../../services/categoryApi";
import type { Category } from "../../types/category";
import type { Product, ProductImage } from "../../types/product";
import { useTheme } from "../../hooks/useTheme";
import RichTextEditor from "../../components/RichTextEditor";

interface PendingImage {
  file: File;
  previewUrl: string;
}

function dollarsInputToCents(value: string): number {
  return Math.round(parseFloat(value || "0") * 100);
}

function centsToDollarsInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2);
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
  "mt-1.5 w-full rounded-lg border border-bg-border bg-bg px-3 py-2.5 text-text-primary outline-none placeholder:text-text-muted transition-colors focus:border-accent focus:ring-1 focus:ring-accent/40";

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
      {hint && <p className="mt-1.5 text-xs text-text-muted">{hint}</p>}
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

function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const stateProduct = (location.state as { product?: Product } | null)
    ?.product;

  // Keep page in sync with theme store
  useTheme();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [isLoadingProduct, setIsLoadingProduct] = useState(!stateProduct);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");

  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [busyImageId, setBusyImageId] = useState<string | null>(null);
  const [imageActionError, setImageActionError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const isImageActionBusy = busyImageId !== null;

  const applyProduct = (product: Product) => {
    setSku(product.sku);
    setName(product.name);
    setPrice(centsToDollarsInput(product.priceCents));
    setCompareAtPrice(centsToDollarsInput(product.compareAtPriceCents));
    setStock(String(product.stock));
    setCategoryId(product.categoryId);
    setDescription(product.description ?? "");
    setExistingImages(product.images);
  };

  useEffect(() => {
    (async () => {
      setIsLoadingCategories(true);
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        setLoadError(extractErrorMessage(err, "Could not load categories."));
      } finally {
        setIsLoadingCategories(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    if (stateProduct) {
      applyProduct(stateProduct);
      setIsLoadingProduct(false);
      return;
    }
    (async () => {
      setIsLoadingProduct(true);
      try {
        const product = await getProduct(id);
        applyProduct(product);
      } catch (err) {
        setLoadError(extractErrorMessage(err, "Could not load product."));
      } finally {
        setIsLoadingProduct(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
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

  const removeExistingImage = async (image: ProductImage) => {
    if (!id) return;
    const confirmed = window.confirm("Remove this image?");
    if (!confirmed) return;

    setImageActionError(null);
    setBusyImageId(image.id);
    try {
      await deleteProductImage(id, image.id);
      setExistingImages((prev) => {
        const remaining = prev.filter((img) => img.id !== image.id);
        if (
          image.isPrimary &&
          remaining.length > 0 &&
          !remaining.some((i) => i.isPrimary)
        ) {
          remaining[0] = { ...remaining[0], isPrimary: true };
        }
        return remaining;
      });
    } catch (err) {
      setImageActionError(extractErrorMessage(err, "Could not remove image."));
    } finally {
      setBusyImageId(null);
    }
  };

  const makeExistingPrimary = async (image: ProductImage) => {
    if (!id || image.isPrimary) return;
    setImageActionError(null);
    setBusyImageId(image.id);
    try {
      await setPrimaryProductImage(id, image.id);
      setExistingImages((prev) =>
        prev.map((img) => ({ ...img, isPrimary: img.id === image.id })),
      );
    } catch (err) {
      setImageActionError(
        extractErrorMessage(err, "Could not update primary image."),
      );
    } finally {
      setBusyImageId(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      await updateProduct(id, {
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
        await uploadProductImage(id, pendingImages[i].file);
      }

      navigate("/admin/products");
    } catch (err) {
      setFormError(extractErrorMessage(err, "Could not save product."));
      setUploadProgress(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Loader2 className="animate-spin text-text-muted" size={22} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="px-6 py-10 lg:px-10">
        <button
          onClick={() => navigate("/admin/products")}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
          Back to products
        </button>
        <div className="mt-6 max-w-xl rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
          {loadError}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg px-6 py-8 pb-28 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate("/admin/products")}
          className="flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
          Back to products
        </button>

        <h1 className="mt-4 font-[Space_Grotesk] text-2xl font-bold text-text-primary">
          Edit product
        </h1>
        <p className="mt-1 text-[15px] text-text-secondary">{name}</p>

        {formError && (
          <div className="mt-6 rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
            {formError}
          </div>
        )}

        <form
          id="edit-product-form"
          onSubmit={handleSubmit}
          className="mt-6 space-y-6"
        >
          <Section title="General" description="Basic identifying details.">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="SKU">
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
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
                required
                className={inputClasses}
              />
            </Field>

            <Field label="Description" hint="Optional — shown on the product page.">
              <div className="mt-1.5">
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Short description — use the toolbar for headings and lists."
                />
              </div>
            </Field>
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
                  required
                  className={inputClasses}
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Media"
            description="Click the star to set an image as primary. New images are uploaded when you save."
          >
            {imageActionError && (
              <div className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger">
                {imageActionError}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {existingImages.map((img) => (
                <div key={img.id} className="group relative h-24 w-24 shrink-0">
                  <img
                    src={img.imageUrl}
                    alt=""
                    className="h-full w-full rounded-lg object-cover ring-1 ring-bg-border"
                  />
                  {busyImageId === img.id && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                      <Loader2 className="animate-spin text-white" size={16} />
                    </div>
                  )}
                  {img.isPrimary ? (
                    <span className="absolute -top-2 -left-2 flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-white">
                      <Star size={10} fill="currentColor" />
                      Primary
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => makeExistingPrimary(img)}
                      disabled={isImageActionBusy}
                      className="absolute inset-x-0 bottom-0 rounded-b-lg bg-black/70 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed"
                    >
                      Make primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeExistingImage(img)}
                    disabled={isImageActionBusy}
                    className="absolute -top-2 -right-2 rounded-full bg-bg-panel p-1 text-text-secondary ring-1 ring-bg-border hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Remove image"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </div>
              ))}

              {pendingImages.map((img, index) => (
                <div
                  key={img.previewUrl}
                  className="group relative h-24 w-24 shrink-0"
                >
                  <img
                    src={img.previewUrl}
                    alt=""
                    className="h-full w-full rounded-lg object-cover opacity-70 ring-1 ring-dashed ring-accent"
                  />
                  <span className="absolute -top-2 -left-2 rounded-full bg-bg-panel px-2 py-0.5 text-[10px] text-text-muted ring-1 ring-bg-border">
                    New
                  </span>
                  <button
                    type="button"
                    onClick={() => removePendingImage(index)}
                    className="absolute -top-2 -right-2 rounded-full bg-bg-panel p-1 text-text-secondary ring-1 ring-bg-border hover:text-danger"
                    aria-label="Remove pending image"
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
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-bg-border text-text-muted hover:border-accent hover:text-accent"
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

            {existingImages.length === 0 && pendingImages.length === 0 && (
              <p className="text-xs text-text-muted">
                No images yet. The first one you add becomes primary.
              </p>
            )}
          </Section>
        </form>
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 border-t border-bg-border bg-bg-panel/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4 lg:px-10">
          <p className="text-xs text-text-muted">
            {uploadProgress
              ? `Uploading image ${uploadProgress.current} of ${uploadProgress.total}…`
              : isSubmitting
                ? "Saving changes…"
                : "Editing product"}
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
              form="edit-product-form"
              disabled={isSubmitting || isImageActionBusy}
              className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isSubmitting ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditProduct;