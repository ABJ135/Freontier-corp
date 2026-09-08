import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { ArrowLeft, Undo2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getInactiveProducts,
  restoreInactiveProduct,
  removeInactiveProduct,
  purgeInactiveProducts,
} from "../../services/productApi";
import ConfirmDialog from "../../components/ConfirmDialog";
import type { Product } from "../../types/product";

function centsToDollarsInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2);
}

function primaryImage(product: Product): string | null {
  const primary = product.images.find((img) => img.isPrimary);
  return primary?.imageUrl ?? product.images[0]?.imageUrl ?? null;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data;
    if (Array.isArray(data?.message)) return data.message.join(", ");
    return data?.message ?? fallback;
  }
  return fallback;
}

function InactiveProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [restoringId, setRestoringId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeletingOne, setIsDeletingOne] = useState(false);

  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  const loadProducts = async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      setProducts(await getInactiveProducts());
    } catch (err) {
      setListError(extractErrorMessage(err, "Could not load inactive products."));
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleRestore = async (product: Product) => {
    setRestoringId(product.id);
    setListError(null);
    try {
      await restoreInactiveProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      setListError(extractErrorMessage(err, "Could not restore product."));
    } finally {
      setRestoringId(null);
    }
  };

  const confirmDeleteOne = async () => {
    if (!deleteTarget) return;
    setIsDeletingOne(true);
    setListError(null);
    try {
      await removeInactiveProduct(deleteTarget.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setListError(extractErrorMessage(err, "Could not delete product."));
    } finally {
      setIsDeletingOne(false);
    }
  };

  const confirmPurgeAll = async () => {
    setIsPurging(true);
    setListError(null);
    try {
      await purgeInactiveProducts();
      setProducts([]);
      setShowPurgeDialog(false);
    } catch (err) {
      setListError(extractErrorMessage(err, "Could not delete all products."));
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-10 sm:py-10">
      {/* Back link */}
      <button
        onClick={() => navigate("/admin/products")}
        className="mb-4 flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={15} strokeWidth={1.75} />
        Back to products
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[Space_Grotesk] text-xl font-bold text-text-primary sm:text-2xl">
            Inactive Products
          </h1>
          <p className="mt-1 text-sm text-text-secondary sm:text-[15px]">
            Products that have been soft-deleted.
          </p>
        </div>

        <button
          onClick={() => setShowPurgeDialog(true)}
          disabled={isLoadingList || products.length === 0}
          className="flex items-center justify-center gap-2 rounded-md border border-danger-border bg-danger-bg px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-bg-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={16} strokeWidth={1.75} />
          Delete all
        </button>
      </div>

      {listError && (
        <div className="mt-6 rounded-md border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
          {listError}
        </div>
      )}

      {isLoadingList && (
        <div className="mt-8 py-10 text-center text-sm text-text-muted">
          Loading inactive products…
        </div>
      )}

      {!isLoadingList && !listError && products.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-bg-border px-6 py-14 text-center">
          <p className="text-sm text-text-muted">No inactive products.</p>
        </div>
      )}

      {!isLoadingList && !listError && products.length > 0 && (
        <>
          {/* Mobile: stacked cards */}
          <div className="mt-6 flex flex-col gap-3 sm:hidden">
            {products.map((product) => {
              const thumb = primaryImage(product);
              return (
                <div
                  key={product.id}
                  className="rounded-lg border border-bg-border bg-bg-panel p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={product.name}
                          className="h-12 w-12 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 shrink-0 rounded-md bg-bg-hover" />
                      )}

                      <div className="min-w-0">
                        <p className="truncate font-medium text-text-primary">
                          {product.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-text-secondary">
                          {product.sku}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-text-secondary">
                          {product.category?.name ?? "—"}
                        </p>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-text-secondary">
                          <span>${centsToDollarsInput(product.priceCents)}</span>
                          <span>Stock: {product.stock}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => handleRestore(product)}
                        disabled={restoringId === product.id}
                        className="rounded-md p-2 text-text-secondary hover:bg-bg-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Restore ${product.name}`}
                      >
                        <Undo2 size={16} strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(product)}
                        className="rounded-md p-2 text-text-secondary hover:bg-bg-hover hover:text-danger"
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 size={16} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop / tablet: table */}
          <div className="mt-6 hidden overflow-x-auto rounded-lg border border-bg-border sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-panel text-text-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium">Image</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const thumb = primaryImage(product);
                  return (
                    <tr
                      key={product.id}
                      className="border-t border-bg-border text-text-primary"
                    >
                      <td className="px-4 py-3">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={product.name}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-bg-hover" />
                        )}
                      </td>
                      <td className="px-4 py-3">{product.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{product.sku}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {product.category?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        ${centsToDollarsInput(product.priceCents)}
                      </td>
                      <td className="px-4 py-3">{product.stock}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleRestore(product)}
                            disabled={restoringId === product.id}
                            className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Restore ${product.name}`}
                          >
                            <Undo2 size={16} strokeWidth={1.75} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(product)}
                            className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-danger"
                            aria-label={`Delete ${product.name}`}
                          >
                            <Trash2 size={16} strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete product"
        message={`Delete "${deleteTarget?.name}" permanently? This can't be undone.`}
        isLoading={isDeletingOne}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteOne}
      />

      <ConfirmDialog
        isOpen={showPurgeDialog}
        title="Delete all inactive products"
        message={`Permanently delete all ${products.length} inactive products? This can't be undone.`}
        isLoading={isPurging}
        onCancel={() => setShowPurgeDialog(false)}
        onConfirm={confirmPurgeAll}
      />
    </div>
  );
}

export default InactiveProducts;