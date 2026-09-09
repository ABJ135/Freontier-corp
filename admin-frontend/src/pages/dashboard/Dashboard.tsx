import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
} from "lucide-react";
import { getProducts } from "../../services/productApi";
import { getOrders } from "../../services/orderApi";
import { getCustomers } from "../../services/customerApi";
import type { Product } from "../../types/product";
import type { Order } from "../../types/order";
import type { Customer } from "../../types/customer";

// ─── Tiny SVG chart helpers ──────────────────────────────────────────────────

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 120;
  const h = 36;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-[120px]" preserveAspectRatio="none">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BarChart({
  data,
  label,
  color,
  valueFormatter,
}: {
  data: { key: string; value: number }[];
  label: string;
  color: string;
  valueFormatter: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-full flex-col">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
        {label}
      </p>
      <div className="flex flex-1 items-end gap-1">
        {data.map((d) => {
          const pct = (d.value / max) * 100;
          return (
            <div
              key={d.key}
              className="group relative flex flex-1 flex-col items-center"
            >
              {/* Tooltip */}
              <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-bg-panel border border-bg-border px-2 py-0.5 text-[10px] text-text-primary opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                {d.key}: {valueFormatter(d.value)}
              </div>
              <div
                className="w-full min-h-[2px] rounded-t-sm transition-all duration-300"
                style={{
                  height: `${Math.max(pct, 2)}%`,
                  backgroundColor: color,
                  opacity: 0.85,
                }}
              />
              <span className="mt-1 text-[9px] text-text-muted">{d.key}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function centsToDollars(cents: number) {
  return (cents / 100).toFixed(2);
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Generate last 7 days labels starting from today's weekday
function last7DayLabels(): string[] {
  const today = new Date().getDay();
  return Array.from({ length: 7 }, (_, i) => DAY_LABELS[(today - 6 + i + 7) % 7]);
}

function last7DayRevenue(orders: Order[]): { key: string; value: number }[] {
  const labels = last7DayLabels();
  const buckets: Record<string, number> = {};
  labels.forEach((l) => (buckets[l] = 0));

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    if (now - d.getTime() <= sevenDaysMs) {
      const label = DAY_LABELS[d.getDay()];
      if (label in buckets) buckets[label] += o.totalCents ?? 0;
    }
  });

  return labels.map((l) => ({ key: l, value: buckets[l] / 100 }));
}

function last7DayOrders(orders: Order[]): { key: string; value: number }[] {
  const labels = last7DayLabels();
  const buckets: Record<string, number> = {};
  labels.forEach((l) => (buckets[l] = 0));

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    if (now - d.getTime() <= sevenDaysMs) {
      const label = DAY_LABELS[d.getDay()];
      if (label in buckets) buckets[label] += 1;
    }
  });

  return labels.map((l) => ({ key: l, value: buckets[l] }));
}

// ─── Component ───────────────────────────────────────────────────────────────

function Dashboard() {
  const { admin } = useAuthStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([getProducts(), getOrders(), getCustomers()]).then(
      ([p, o, c]) => {
        if (p.status === "fulfilled") setProducts(p.value);
        if (o.status === "fulfilled") setOrders(o.value);
        if (c.status === "fulfilled") setCustomers(c.value);
        setIsLoading(false);
      },
    );
  }, []);

  // ── Derived metrics ──────────────────────────────────────────────
  const totalRevenueCents = useMemo(
    () =>
      orders
        .filter((o) => o.status === "DELIVERED")
        .reduce((s, o) => s + (o.totalCents ?? 0), 0),
    [orders],
  );

  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => p.stock < 10).length;
  const totalOrders = orders.length;
  const totalCustomers = customers.length;

  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const processingCount = orders.filter((o) => o.status === "PROCESSING").length;
  const shippedCount = orders.filter((o) => o.status === "SHIPPED").length;
  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;
  const cancelledCount = orders.filter((o) => o.status === "CANCELLED").length;

  // Revenue sparkline (7 days)
  const revenueChartData = useMemo(() => last7DayRevenue(orders), [orders]);
  const ordersChartData = useMemo(() => last7DayOrders(orders), [orders]);

  const sparklineValues = revenueChartData.map((d) => d.value);

  // Recent orders (last 5)
  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5),
    [orders],
  );

  const L = isLoading ? "..." : "";

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="font-[Space_Grotesk] text-2xl font-bold text-text-primary sm:text-3xl">
          Good {getTimeGreeting()},{" "}
          <span className="text-accent">{admin?.name?.split(" ")[0]}</span> 👋
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Here's a snapshot of your store performance today.
        </p>
      </div>

      {/* ── KPI Section: Revenue card + 3 stat cards ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Revenue card — occupies 1 column on lg */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-accent/30 bg-accent p-6 shadow-lg lg:col-span-1">
          {/* Decorative blur blob */}
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5 blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Total Revenue (Delivered)
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
                <DollarSign size={18} className="text-white" />
              </div>
            </div>

            <p className="mt-3 font-[Space_Grotesk] text-4xl font-bold text-white">
              {isLoading ? "..." : `$${centsToDollars(totalRevenueCents)}`}
            </p>
            <p className="mt-1 text-sm text-white/60">
              Across {isLoading ? "..." : deliveredCount} completed orders
            </p>
          </div>

          <div className="relative z-10 mt-6 flex items-end justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white">
                <TrendingUp size={12} />
                Last 7 days
              </span>
            </div>
            <Sparkline values={sparklineValues.length ? sparklineValues : [0, 0]} color="rgba(255,255,255,0.8)" />
          </div>
        </div>

        {/* Right side: 3 stat cards in list style */}
        <div className="flex flex-col gap-3 lg:col-span-2">
          {/* Orders stat */}
          <StatRow
            icon={<ShoppingCart size={18} className="text-accent" />}
            label="Total Orders"
            value={isLoading ? L : totalOrders.toString()}
            sub={isLoading ? "" : `${pendingCount} pending · ${processingCount} processing`}
            trend="up"
            trendLabel={isLoading ? "" : `${deliveredCount} delivered`}
            iconBg="bg-accent/10"
          />

          {/* Customers stat */}
          <StatRow
            icon={<Users size={18} className="text-indigo-500" />}
            label="Total Customers"
            value={isLoading ? L : totalCustomers.toString()}
            sub="Registered accounts"
            trend="up"
            trendLabel="Active"
            iconBg="bg-indigo-500/10"
          />

          {/* Products / Low stock stat */}
          <StatRow
            icon={<Package size={18} className="text-warning" />}
            label="Catalog Products"
            value={isLoading ? L : totalProducts.toString()}
            sub={isLoading ? "" : `${lowStockCount} items below 10 units`}
            trend={lowStockCount > 0 ? "down" : "up"}
            trendLabel={lowStockCount > 0 ? `${lowStockCount} low stock` : "Stock healthy"}
            iconBg="bg-warning/10"
          />
        </div>
      </div>

      {/* ── Order Status Breakdown ── */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Pending", count: pendingCount, icon: <Clock size={14} />, color: "text-warning border-warning-border bg-warning-bg" },
          { label: "Processing", count: processingCount, icon: <TrendingUp size={14} />, color: "text-accent border-accent/30 bg-accent/10" },
          { label: "Shipped", count: shippedCount, icon: <Truck size={14} />, color: "text-indigo-500 border-indigo-500/30 bg-indigo-500/10" },
          { label: "Delivered", count: deliveredCount, icon: <CheckCircle2 size={14} />, color: "text-success border-success-border bg-success-bg" },
          { label: "Cancelled", count: cancelledCount, icon: <XCircle size={14} />, color: "text-danger border-danger-border bg-danger-bg" },
        ].map((s) => (
          <div
            key={s.label}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl border py-3 text-center ${s.color}`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold opacity-80">
              {s.icon}
              {s.label}
            </div>
            <span className="font-[Space_Grotesk] text-2xl font-bold">
              {isLoading ? "..." : s.count}
            </span>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* Revenue by Day chart */}
        <div className="rounded-xl border border-bg-border bg-bg-panel p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-[Space_Grotesk] text-sm font-semibold text-text-primary">
              Revenue per Day
            </h3>
            <span className="rounded-full border border-success-border bg-success-bg px-2.5 py-0.5 text-[10px] font-semibold text-success">
              Last 7 days
            </span>
          </div>
          <p className="mb-4 text-xs text-text-muted">Daily revenue from delivered orders</p>
          <div className="h-44">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-xs text-text-muted">
                Loading chart...
              </div>
            ) : (
              <BarChart
                data={revenueChartData}
                label=""
                color="var(--accent)"
                valueFormatter={(v) => `$${v.toFixed(2)}`}
              />
            )}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-bg-border/60 pt-3">
            <span className="text-xs text-text-secondary">
              Total:{" "}
              <span className="font-semibold text-text-primary">
                {formatCompact(totalRevenueCents / 100)}
              </span>
            </span>
            <Link
              to="/admin/orders"
              className="flex items-center gap-1 text-xs text-accent hover:underline"
            >
              View all orders <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        {/* Orders per Day chart */}
        <div className="rounded-xl border border-bg-border bg-bg-panel p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-[Space_Grotesk] text-sm font-semibold text-text-primary">
              Orders per Day
            </h3>
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent">
              Last 7 days
            </span>
          </div>
          <p className="mb-4 text-xs text-text-muted">Number of orders placed per day</p>
          <div className="h-44">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-xs text-text-muted">
                Loading chart...
              </div>
            ) : (
              <BarChart
                data={ordersChartData}
                label=""
                color="var(--success)"
                valueFormatter={(v) => `${v} orders`}
              />
            )}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-bg-border/60 pt-3">
            <span className="text-xs text-text-secondary">
              Total:{" "}
              <span className="font-semibold text-text-primary">{totalOrders} orders</span>
            </span>
            <Link
              to="/admin/orders"
              className="flex items-center gap-1 text-xs text-accent hover:underline"
            >
              View all orders <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Recent Orders + Quick Actions ── */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Recent Orders table */}
        <div className="overflow-hidden rounded-xl border border-bg-border bg-bg-panel lg:col-span-2">
          <div className="flex items-center justify-between border-b border-bg-border px-5 py-4">
            <h3 className="font-[Space_Grotesk] text-sm font-semibold text-text-primary">
              Recent Orders
            </h3>
            <Link
              to="/admin/orders"
              className="flex items-center gap-1 text-xs text-accent hover:underline"
            >
              View all <ArrowUpRight size={12} />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-xs text-text-muted">Loading orders...</div>
          ) : recentOrders.length === 0 ? (
            <div className="py-10 text-center text-xs text-text-muted">No orders yet.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-bg-border bg-bg text-text-muted">
                  <th className="px-5 py-2.5 font-medium">Order</th>
                  <th className="px-5 py-2.5 font-medium hidden sm:table-cell">Customer</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-bg-border/50 hover:bg-bg-hover/40 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="font-mono font-semibold text-accent hover:underline"
                      >
                        #{order.orderNumber ?? order.id.slice(0, 6)}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-text-secondary hidden sm:table-cell">
                      {order.customerName ?? order.customerEmail ?? "Guest"}
                    </td>
                    <td className="px-5 py-3">
                      <OrderStatusPill status={order.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-text-primary">
                      ${centsToDollars(order.totalCents ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick Actions panel */}
        <div className="rounded-xl border border-bg-border bg-bg-panel p-5">
          <h3 className="font-[Space_Grotesk] text-sm font-semibold text-text-primary">
            Quick Actions
          </h3>
          <p className="mt-0.5 text-xs text-text-muted">Jump to common tasks</p>

          <div className="mt-4 flex flex-col gap-2">
            {[
              { label: "Add New Product", to: "/admin/products/new", icon: <Package size={16} />, color: "text-accent bg-accent/10 hover:bg-accent hover:text-white border-accent/20" },
              { label: "View All Orders", to: "/admin/orders", icon: <ShoppingCart size={16} />, color: "text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white border-indigo-500/20" },
              { label: "Manage Customers", to: "/admin/customers", icon: <Users size={16} />, color: "text-success bg-success-bg hover:bg-success hover:text-white border-success-border" },
              { label: "Low Stock Products", to: "/admin/products", icon: <AlertTriangle size={16} />, color: "text-warning bg-warning-bg hover:bg-warning hover:text-white border-warning-border" },
            ].map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-xs font-semibold transition-all ${action.color}`}
              >
                {action.icon}
                {action.label}
              </Link>
            ))}
          </div>

          {/* Store health badge */}
          <div className="mt-5 rounded-lg border border-bg-border bg-bg px-4 py-3">
            <p className="text-xs font-semibold text-text-secondary">Store Health</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-hover">
                <div
                  className="h-2 rounded-full bg-success transition-all"
                  style={{
                    width: `${
                      isLoading
                        ? 0
                        : Math.max(
                            0,
                            Math.min(
                              100,
                              100 - (lowStockCount / Math.max(totalProducts, 1)) * 100,
                            ),
                          ).toFixed(0)
                    }%`,
                  }}
                />
              </div>
              <span className="text-xs font-bold text-text-primary">
                {isLoading
                  ? "..."
                  : `${(100 - (lowStockCount / Math.max(totalProducts, 1)) * 100).toFixed(0)}%`}
              </span>
            </div>
            <p className="mt-1.5 text-[10px] text-text-muted">
              {isLoading
                ? "Calculating..."
                : lowStockCount > 0
                ? `${lowStockCount} products need restocking.`
                : "All products are well stocked!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatRow({
  icon,
  label,
  value,
  sub,
  trend,
  trendLabel,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  trend: "up" | "down";
  trendLabel: string;
  iconBg: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-bg-border bg-bg-panel px-5 py-4 transition-colors hover:bg-bg-hover/30">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="mt-0.5 font-[Space_Grotesk] text-2xl font-bold text-text-primary">
          {value}
        </p>
        <p className="mt-0.5 text-[11px] text-text-muted">{sub}</p>
      </div>
      <div
        className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          trend === "up"
            ? "bg-success-bg text-success"
            : "bg-warning-bg text-warning"
        }`}
      >
        {trend === "up" ? (
          <ArrowUpRight size={11} />
        ) : (
          <ArrowDownRight size={11} />
        )}
        {trendLabel}
      </div>
    </div>
  );
}

function OrderStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-warning-bg text-warning border-warning-border",
    PROCESSING: "bg-accent/10 text-accent border-accent/20",
    SHIPPED: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    DELIVERED: "bg-success-bg text-success border-success-border",
    CANCELLED: "bg-danger-bg text-danger border-danger-border",
  };
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        map[status] ?? "bg-bg-hover text-text-secondary"
      }`}
    >
      {status}
    </span>
  );
}

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export default Dashboard;