import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  Package,
  RefreshCw,
  RotateCcw,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  getInactiveProducts,
  restoreInactiveProduct,
  removeInactiveProduct,
  purgeInactiveProducts,
} from "../../services/productApi";
import ConfirmDialog from "../../components/ConfirmDialog";
import type { Product } from "../../types/product";

function centsToDollars(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "0.00";
  return (cents / 100).toFixed(2);
}

function primaryImage(product: Product): string | null {
  const p = product.images?.find((img) => img.isPrimary);
  return p?.imageUrl ?? product.images?.[0]?.imageUrl ?? null;
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
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  const loadProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setProducts(await getInactiveProducts());
    } catch (err) {
      setError(extractErrorMessage(err, "Could not load inactive products."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const handleRestore = async (product: Product) => {
    setRestoringId(product.id);
    setError(null);
    try {
      await restoreInactiveProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      setError(extractErrorMessage(err, "Could not restore product."));
    } finally {
      setRestoringId(null);
    }
  };

  const confirmDeleteOne = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setError(null);
    try {
      await removeInactiveProduct(deleteTarget.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not delete product."));
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmPurgeAll = async () => {
    setIsPurging(true);
    setError(null);
    try {
      await purgeInactiveProducts();
      setProducts([]);
      setShowPurgeDialog(false);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not purge products."));
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      {/* Back */}
      <Link
        to="/admin/products"
        className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={16} />
        Back to Products
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-[Space_Grotesk] text-2xl font-bold text-text-primary">
              Inactive Products
            </h1>
            {!isLoading && (
              <span className="rounded-full border border-warning-border bg-warning-bg px-3 py-0.5 text-xs font-bold text-warning">
                {products.length} archived
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Soft-deleted products. Restore them to make them live again, or permanently remove them.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadProducts}
            className="flex items-center gap-2 rounded-lg border border-bg-border px-3.5 py-2 text-sm font-medium text-text-secondary hover:bg-bg-hover"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowPurgeDialog(true)}
            disabled={isLoading || products.length === 0}
            className="flex items-center gap-2 rounded-lg border border-danger-border bg-danger-bg px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger-bg-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={15} strokeWidth={1.75} />
            Purge All
          </button>
        </div>
      </div>

      {/* Warning banner if items exist */}
      {!isLoading && products.length > 0 && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-warning-border bg-warning-bg px-4 py-3 text-sm text-warning">
          <AlertTriangle size={16} />
          <span>
            <strong>{products.length} products</strong> are archived. Purging them is permanent and cannot be undone.
          </span>
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mt-12 flex flex-col items-center py-10 text-text-muted">
          <RefreshCw size={28} className="animate-spin text-accent" />
          <p className="mt-3 text-sm">Loading archived products...</p>
        </div>
      )}

      {!isLoading && !error && products.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-bg-border px-6 py-16 text-center">
          <Package size={40} className="mx-auto text-text-muted opacity-50" />
          <p className="mt-3 text-sm font-medium text-text-primary">
            No inactive products in archive.
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Products you deactivate will appear here for recovery or permanent deletion.
          </p>
          <Link
            to="/admin/products"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-bg-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-hover"
          >
            <ArrowLeft size={14} /> Back to active products
          </Link>
        </div>
      )}

      {/* Products list */}
      {!isLoading && !error && products.length > 0 && (
        <>
          {/* Mobile cards */}
          <div className="mt-5 flex flex-col gap-3 sm:hidden">
            {products.map((product) => {
              const thumb = primaryImage(product);
              return (
                <div key={product.id} className="rounded-xl border border-bg-border bg-bg-panel p-4 opacity-75">
                  <div className="flex items-start gap-3">
                    {thumb ? (
                      <img src={thumb} alt={product.name} className="h-12 w-12 shrink-0 rounded-lg object-cover grayscale" />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-bg-hover text-text-muted">
                        <Package size={20} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-text-primary">{product.name}</p>
                      <p className="font-mono text-xs text-text-secondary">{product.sku}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-text-secondary">
                        <span>${centsToDollars(product.priceCents)}</span>
                        <span>Stock: {product.stock}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <button
                        onClick={() => handleRestore(product)}
                        disabled={restoringId === product.id}
                        className="rounded-lg p-2 text-text-secondary hover:bg-success-bg hover:text-success disabled:opacity-40"
                        title="Restore"
                      >
                        <RotateCcw size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(product)}
                        className="rounded-lg p-2 text-text-secondary hover:bg-danger-bg hover:text-danger"
                        title="Delete permanently"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="mt-5 hidden overflow-hidden rounded-xl border border-bg-border sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-panel text-xs text-text-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const thumb = primaryImage(product);
                  return (
                    <tr key={product.id} className="border-t border-bg-border opacity-70 transition-opacity hover:opacity-100">
                      <td className="px-4 py-3">
                        {thumb ? (
                          <img src={thumb} alt={product.name} className="h-11 w-11 rounded-lg object-cover grayscale" />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-bg-hover text-text-muted">
                            <Package size={18} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-text-primary">{product.name}</p>
                        <p className="font-mono text-xs text-text-muted">{product.sku}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md border border-bg-border bg-bg px-2 py-0.5 text-xs text-text-secondary">
                          {product.category?.name ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-text-primary">
                        ${centsToDollars(product.priceCents)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{product.stock}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestore(product)}
                            disabled={restoringId === product.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-success-border bg-success-bg px-3 py-1.5 text-xs font-semibold text-success transition-colors hover:bg-success hover:text-white disabled:opacity-40"
                          >
                            {restoringId === product.id ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <RotateCcw size={12} />
                            )}
                            Restore
                          </button>
                          <button
                            onClick={() => setDeleteTarget(product)}
                            className="rounded-lg border border-danger-border p-1.5 text-danger hover:bg-danger hover:text-white"
                            title="Permanently delete"
                          >
                            <Trash2 size={14} strokeWidth={1.75} />
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
        title="Permanently Delete Product"
        message={`Delete "${deleteTarget?.name}" forever? This action cannot be undone.`}
        isLoading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteOne}
      />
      <ConfirmDialog
        isOpen={showPurgeDialog}
        title="Purge All Inactive Products"
        message={`Permanently delete all ${products.length} inactive products? This cannot be undone.`}
        isLoading={isPurging}
        onCancel={() => setShowPurgeDialog(false)}
        onConfirm={confirmPurgeAll}
      />
    </div>
  );
}

export default InactiveProducts;