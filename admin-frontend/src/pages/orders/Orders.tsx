import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { getOrders, updateOrderStatus } from "../../services/orderApi";
import type { Order, OrderStatus } from "../../types/order";

type FilterTab = "ALL" | OrderStatus;

const FILTER_TABS: { label: string; value: FilterTab; color: string }[] = [
  { label: "All", value: "ALL", color: "" },
  { label: "Pending", value: "PENDING", color: "text-warning" },
  { label: "Processing", value: "PROCESSING", color: "text-accent" },
  { label: "Shipped", value: "SHIPPED", color: "text-indigo-500" },
  { label: "Delivered", value: "DELIVERED", color: "text-success" },
  { label: "Cancelled", value: "CANCELLED", color: "text-danger" },
];

function centsToDollars(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "0.00";
  return (cents / 100).toFixed(2);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

export function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { label: string; icon: React.ReactNode; cls: string }> = {
    PENDING: { label: "Pending", icon: <Clock size={11} strokeWidth={2} />, cls: "border-warning-border bg-warning-bg text-warning" },
    PROCESSING: { label: "Processing", icon: <RefreshCw size={11} strokeWidth={2} className="animate-spin" />, cls: "border-accent/30 bg-accent/10 text-accent" },
    SHIPPED: { label: "Shipped", icon: <Truck size={11} strokeWidth={2} />, cls: "border-indigo-500/30 bg-indigo-500/10 text-indigo-500" },
    DELIVERED: { label: "Delivered", icon: <CheckCircle2 size={11} strokeWidth={2} />, cls: "border-success-border bg-success-bg text-success" },
    CANCELLED: { label: "Cancelled", icon: <XCircle size={11} strokeWidth={2} />, cls: "border-danger-border bg-danger-bg text-danger" },
  };
  const s = map[status] ?? { label: status, icon: null, cls: "border-bg-border bg-bg-hover text-text-secondary" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${s.cls}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setOrders(await getOrders());
    } catch (err) {
      setError(extractErrorMessage(err, "Could not load orders."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const handleQuickStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: updated.status } : o)));
    } catch (err) {
      setError(extractErrorMessage(err, "Could not update order status."));
    } finally {
      setUpdatingId(null);
    }
  };

  const getCount = (tab: FilterTab) =>
    tab === "ALL" ? orders.length : orders.filter((o) => o.status === tab).length;

  const totalRevenue = orders
    .filter((o) => o.status === "DELIVERED")
    .reduce((s, o) => s + (o.totalCents ?? 0), 0);

  const filteredOrders = useMemo(() => {
    const byTab = activeTab === "ALL" ? orders : orders.filter((o) => o.status === activeTab);
    if (!search.trim()) return byTab;
    const q = search.toLowerCase();
    return byTab.filter(
      (o) =>
        (o.orderNumber ?? "").toLowerCase().includes(q) ||
        (o.customerName ?? "").toLowerCase().includes(q) ||
        (o.customerEmail ?? "").toLowerCase().includes(q),
    );
  }, [orders, activeTab, search]);

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-[Space_Grotesk] text-2xl font-bold text-text-primary">Orders</h1>
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-0.5 text-xs font-bold text-accent">
              {isLoading ? "..." : `${orders.length} total`}
            </span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Manage, filter, and update the status of customer orders.
          </p>
        </div>
        <button
          onClick={loadOrders}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg border border-bg-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-hover disabled:opacity-50 self-start"
        >
          <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ── KPI strip ── */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15"><DollarSign size={16} className="text-accent" /></div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-text-secondary">Revenue</p>
            <p className="font-[Space_Grotesk] text-lg font-bold text-accent">${centsToDollars(totalRevenue)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-warning-border bg-warning-bg px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/20"><Clock size={16} className="text-warning" /></div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-text-secondary">Pending</p>
            <p className="font-[Space_Grotesk] text-lg font-bold text-warning">{getCount("PENDING")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15"><Truck size={16} className="text-indigo-500" /></div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-text-secondary">Shipped</p>
            <p className="font-[Space_Grotesk] text-lg font-bold text-indigo-500">{getCount("SHIPPED")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-success-border bg-success-bg px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/20"><CheckCircle2 size={16} className="text-success" /></div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-text-secondary">Delivered</p>
            <p className="font-[Space_Grotesk] text-lg font-bold text-success">{getCount("DELIVERED")}</p>
          </div>
        </div>
      </div>

      {/* ── Filter tabs + search ── */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            const count = getCount(tab.value);
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-accent text-white shadow-sm"
                    : "border border-bg-border bg-bg-panel text-text-secondary hover:bg-bg-hover"
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? "bg-white/25 text-white" : "bg-bg-hover text-text-muted"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative shrink-0 sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders..."
            className="w-full rounded-lg border border-bg-border bg-bg-panel py-2 pl-9 pr-3 text-sm placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">{error}</div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="mt-12 flex flex-col items-center py-10 text-text-muted">
          <RefreshCw size={28} className="animate-spin text-accent" />
          <p className="mt-3 text-sm">Loading orders...</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && filteredOrders.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-bg-border px-6 py-16 text-center">
          <ShoppingBag size={38} className="mx-auto text-text-muted opacity-50" />
          <p className="mt-3 text-sm font-medium text-text-primary">
            {search ? "No orders match your search." : `No ${activeTab !== "ALL" ? activeTab.toLowerCase() : ""} orders.`}
          </p>
        </div>
      )}

      {/* Orders list */}
      {!isLoading && !error && filteredOrders.length > 0 && (
        <>
          {/* Mobile cards */}
          <div className="mt-5 flex flex-col gap-3 sm:hidden">
            {filteredOrders.map((order) => (
              <div key={order.id} className="rounded-xl border border-bg-border bg-bg-panel p-4 transition-all hover:border-accent/30">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-accent">
                      #{order.orderNumber ?? order.id.slice(0, 8)}
                    </span>
                    <p className="mt-0.5 font-semibold text-text-primary">
                      {order.customerName || order.customerEmail || "Guest"}
                    </p>
                    <p className="text-xs text-text-muted">{formatDate(order.createdAt)}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-bg-border/50 pt-3">
                  <div className="text-xs text-text-secondary">
                    <PackageCheck size={12} className="mr-1 inline" />{order.items?.length ?? 0} items
                  </div>
                  <span className="font-semibold text-text-primary">${centsToDollars(order.totalCents)}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-bg-border/50 pt-3">
                  <select
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) => handleQuickStatusChange(order.id, e.target.value as OrderStatus)}
                    className="flex-1 rounded-lg border border-bg-border bg-bg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent [&>option]:bg-bg-panel"
                  >
                    {(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as OrderStatus[]).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <Link
                    to={`/admin/orders/${order.id}`}
                    className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent hover:text-white"
                  >
                    <Eye size={13} /> View
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="mt-5 hidden overflow-hidden rounded-xl border border-bg-border sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-panel text-xs text-text-secondary">
                <tr>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Items</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t border-bg-border transition-colors hover:bg-bg-hover/30">
                    <td className="px-5 py-3.5">
                      <Link to={`/admin/orders/${order.id}`} className="font-mono text-xs font-bold text-accent hover:underline">
                        #{order.orderNumber ?? order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-text-primary">{order.customerName || "Guest"}</p>
                      {order.customerEmail && <p className="text-xs text-text-secondary">{order.customerEmail}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-text-secondary">{formatDate(order.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                        <PackageCheck size={13} /> {order.items?.length ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-text-primary">
                      ${centsToDollars(order.totalCents)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleQuickStatusChange(order.id, e.target.value as OrderStatus)}
                          className="rounded-lg border border-bg-border bg-bg-panel px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent [&>option]:bg-bg-panel"
                        >
                          {(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as OrderStatus[]).map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-accent/10 hover:text-accent"
                          title="View details"
                        >
                          <Eye size={16} strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Orders;
