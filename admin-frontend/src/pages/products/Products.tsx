import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  LayoutGrid,
  List,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
  Tag,
} from "lucide-react";
import { deleteProduct, getProducts } from "../../services/productApi";
import ConfirmDialog from "../../components/ConfirmDialog";
import type { Product } from "../../types/product";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-danger-border bg-danger-bg px-2 py-0.5 text-[10px] font-semibold text-danger">
        <span className="h-1.5 w-1.5 rounded-full bg-danger" />
        Out of stock
      </span>
    );
  if (stock < 10)
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-warning-border bg-warning-bg px-2 py-0.5 text-[10px] font-semibold text-warning">
        <AlertTriangle size={10} />
        Low · {stock}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-success-border bg-success-bg px-2 py-0.5 text-[10px] font-semibold text-success">
      <CheckCircle2 size={10} />
      {stock} in stock
    </span>
  );
}

type ViewMode = "table" | "grid";
type SortKey = "name" | "priceCents" | "stock";

// ─── Component ────────────────────────────────────────────────────────────────

function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const loadProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setProducts(await getProducts());
    } catch (err) {
      setError(extractErrorMessage(err, "Could not load products."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      <span className="ml-0.5 text-accent">{sortDir === "asc" ? "↑" : "↓"}</span>
    ) : null;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.category?.name ?? "").toLowerCase().includes(q),
      )
      .sort((a, b) => {
        let av: string | number, bv: string | number;
        if (sortKey === "name") { av = a.name; bv = b.name; }
        else if (sortKey === "priceCents") { av = a.priceCents; bv = b.priceCents; }
        else { av = a.stock; bv = b.stock; }
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
  }, [products, search, sortKey, sortDir]);

  // KPI stats
  const totalValue = products.reduce((s, p) => s + p.priceCents * p.stock, 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 10).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const categories = new Set(products.map((p) => p.category?.name)).size;

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteProduct(deleteTarget.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not delete product."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-[Space_Grotesk] text-2xl font-bold text-text-primary">
              Products
            </h1>
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-0.5 text-xs font-bold text-accent">
              {isLoading ? "..." : `${products.length} total`}
            </span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your entire product catalog — pricing, inventory, and images.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:items-center">
          <Link
            to="/admin/products/inactive"
            className="flex items-center gap-2 rounded-lg border border-bg-border px-3.5 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            <Archive size={15} strokeWidth={1.75} />
            Inactive
          </Link>
          <button
            onClick={loadProducts}
            className="flex items-center gap-2 rounded-lg border border-bg-border px-3.5 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </button>
          <Link
            to="/admin/products/new"
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={2} />
            Add Product
          </Link>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Inventory Value" value={`$${centsToDollars(totalValue)}`} icon={<Tag size={16} className="text-accent" />} color="text-accent" />
        <KpiCard label="Categories" value={isLoading ? "..." : `${categories}`} icon={<Package size={16} className="text-indigo-500" />} color="text-indigo-500" />
        <KpiCard
          label="Low Stock Items"
          value={isLoading ? "..." : `${lowStock}`}
          icon={<AlertTriangle size={16} className="text-warning" />}
          color="text-warning"
          alert={lowStock > 0}
        />
        <KpiCard
          label="Out of Stock"
          value={isLoading ? "..." : `${outOfStock}`}
          icon={<TrendingDown size={16} className="text-danger" />}
          color="text-danger"
          alert={outOfStock > 0}
        />
      </div>

      {/* ── Toolbar ── */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, or category..."
            className="w-full rounded-lg border border-bg-border bg-bg-panel py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-bg-border bg-bg-panel p-1">
          <button
            onClick={() => setViewMode("table")}
            className={`rounded-md p-1.5 transition-colors ${viewMode === "table" ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"}`}
            title="Table view"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-md p-1.5 transition-colors ${viewMode === "grid" ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"}`}
            title="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {search && (
        <p className="mt-2 text-xs text-text-secondary">
          Showing <span className="font-semibold text-text-primary">{filtered.length}</span> of {products.length} products
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="mt-12 flex flex-col items-center py-10 text-text-muted">
          <RefreshCw size={28} className="animate-spin text-accent" />
          <p className="mt-3 text-sm">Loading products...</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-bg-border px-6 py-16 text-center">
          <Package size={40} className="mx-auto text-text-muted opacity-50" />
          <p className="mt-3 text-sm font-medium text-text-primary">
            {search ? "No products match your search." : "No products yet."}
          </p>
          {!search && (
            <Link
              to="/admin/products/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              <Plus size={15} /> Add your first product
            </Link>
          )}
        </div>
      )}

      {/* ── Table View ── */}
      {!isLoading && !error && filtered.length > 0 && viewMode === "table" && (
        <>
          {/* Mobile cards */}
          <div className="mt-5 flex flex-col gap-3 sm:hidden">
            {filtered.map((product) => {
              const thumb = primaryImage(product);
              return (
                <div
                  key={product.id}
                  className="rounded-xl border border-bg-border bg-bg-panel p-4 transition-all hover:border-accent/30"
                >
                  <div className="flex items-start gap-3">
                    {thumb ? (
                      <img src={thumb} alt={product.name} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-bg-hover text-text-muted">
                        <Package size={22} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-text-primary">{product.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-text-secondary">{product.sku}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{product.category?.name ?? "Uncategorized"}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-text-primary">${centsToDollars(product.priceCents)}</span>
                        {product.compareAtPriceCents && (
                          <span className="text-xs text-text-muted line-through">${centsToDollars(product.compareAtPriceCents)}</span>
                        )}
                        <StockBadge stock={product.stock} />
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <button onClick={() => navigate(`/admin/products/${product.id}/edit`, { state: { product } })} className="rounded-lg p-2 text-text-secondary hover:bg-accent/10 hover:text-accent" aria-label="Edit">
                        <Pencil size={15} strokeWidth={1.75} />
                      </button>
                      <button onClick={() => setDeleteTarget(product)} className="rounded-lg p-2 text-text-secondary hover:bg-danger-bg hover:text-danger" aria-label="Delete">
                        <Trash2 size={15} strokeWidth={1.75} />
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
                  <th className="cursor-pointer px-4 py-3 font-medium hover:text-text-primary" onClick={() => toggleSort("name")}>
                    Name <SortIcon k="name" />
                  </th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="cursor-pointer px-4 py-3 font-medium hover:text-text-primary" onClick={() => toggleSort("priceCents")}>
                    Price <SortIcon k="priceCents" />
                  </th>
                  <th className="cursor-pointer px-4 py-3 font-medium hover:text-text-primary" onClick={() => toggleSort("stock")}>
                    Stock <SortIcon k="stock" />
                  </th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const thumb = primaryImage(product);
                  return (
                    <tr key={product.id} className="border-t border-bg-border transition-colors hover:bg-bg-hover/30">
                      <td className="px-4 py-3">
                        {thumb ? (
                          <img src={thumb} alt={product.name} className="h-11 w-11 rounded-lg object-cover" />
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
                      <td className="px-4 py-3">
                        <p className="font-semibold text-text-primary">${centsToDollars(product.priceCents)}</p>
                        {product.compareAtPriceCents && (
                          <p className="text-xs text-text-muted line-through">${centsToDollars(product.compareAtPriceCents)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-semibold text-text-primary">{product.stock}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StockBadge stock={product.stock} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/admin/products/${product.id}/edit`, { state: { product } })}
                            className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-accent/10 hover:text-accent"
                            aria-label={`Edit ${product.name}`}
                          >
                            <Pencil size={16} strokeWidth={1.75} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(product)}
                            className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-danger-bg hover:text-danger"
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

      {/* ── Grid View ── */}
      {!isLoading && !error && filtered.length > 0 && viewMode === "grid" && (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((product) => {
            const thumb = primaryImage(product);
            const hasDiscount = Boolean(product.compareAtPriceCents && product.compareAtPriceCents > product.priceCents);
            const discountPct = hasDiscount
              ? Math.round((1 - product.priceCents / product.compareAtPriceCents!) * 100)
              : 0;

            return (
              <div
                key={product.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-bg-border bg-bg-panel transition-all hover:border-accent/30 hover:shadow-md"
              >
                {/* Discount badge */}
                {hasDiscount && (
                  <div className="absolute left-2.5 top-2.5 z-10 rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white">
                    -{discountPct}%
                  </div>
                )}

                {/* Product image */}
                <div className="relative h-36 w-full bg-bg-hover">
                  {thumb ? (
                    <img src={thumb} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-text-muted">
                      <Package size={32} />
                    </div>
                  )}
                  {/* Hover actions */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => navigate(`/admin/products/${product.id}/edit`, { state: { product } })}
                      className="rounded-lg bg-white/90 p-2 text-text-primary hover:bg-white"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(product)}
                      className="rounded-lg bg-danger/90 p-2 text-white hover:bg-danger"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-3">
                  <p className="line-clamp-2 text-xs font-semibold leading-snug text-text-primary">
                    {product.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-text-muted">{product.sku}</p>
                  <div className="mt-auto pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-text-primary">${centsToDollars(product.priceCents)}</span>
                      <StockBadge stock={product.stock} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Deactivate Product"
        message={`Deactivate "${deleteTarget?.name}"? It will be moved to the inactive products archive.`}
        isLoading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

// ─── KPI Card Sub-component ───────────────────────────────────────────────────

function KpiCard({
  label, value, icon, color, alert = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  alert?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border bg-bg-panel px-4 py-3.5 ${alert ? "border-warning-border" : "border-bg-border"}`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-hover ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-text-secondary">{label}</p>
        <p className={`font-[Space_Grotesk] text-xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

export default Products;