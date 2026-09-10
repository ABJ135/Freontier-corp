import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  CreditCard,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  User,
  Check,
  Clock,
} from "lucide-react";
import { getOrder, updateOrderStatus } from "../../services/orderApi";
import type { Order, OrderStatus } from "../../types/order";
import { StatusBadge } from "./Orders";

const ALL_STATUSES: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

function centsToDollars(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "0.00";
  return (cents / 100).toFixed(2);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(dateStr: string): string {
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

/** Parse shipping address from either the linked object or the JSON snapshot */
function resolveShippingAddress(order: Order) {
  if (order.shippingAddress) return order.shippingAddress;
  if (order.shippingAddressSnapshot) {
    try {
      return JSON.parse(order.shippingAddressSnapshot);
    } catch {
      return null;
    }
  }
  return null;
}

function OrderDetail() {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchOrderDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getOrder(id);
      setOrder(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load order details."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order || order.status === newStatus) return;
    setIsUpdatingStatus(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const updated = await updateOrderStatus(order.id, newStatus);
      setOrder(updated);
      setSuccessMsg(`Order status successfully updated to "${newStatus}".`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to update order status."));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-sm text-text-muted">
        <RefreshCw size={28} className="mb-3 animate-spin text-accent" />
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="px-4 py-8 sm:px-10">
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={16} />
          Back to Orders
        </Link>
        <div className="mt-6 rounded-md border border-danger-border bg-danger-bg px-4 py-4 text-sm text-danger">
          {error ?? "Order not found."}
        </div>
      </div>
    );
  }

  // Resolve customer info — backend now returns nested order.customer object
  const customerName =
    order.customer?.name || order.customerName || "Unknown Customer";
  const customerEmail = order.customer?.email || order.customerEmail;
  const customerPhone = order.customer?.phone || order.customerPhone;
  const customerId = order.customer?.id || order.userId;
  const customerSince = order.customer?.createdAt;

  const shippingAddr = resolveShippingAddress(order);

  return (
    <div className="px-4 py-6 sm:px-10 sm:py-10">
      {/* Back Navigation */}
      <Link
        to="/admin/orders"
        className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={16} />
        Back to Orders
      </Link>

      {/* Main Order Header */}
      <div className="mt-4 flex flex-col gap-4 border-b border-bg-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-[Space_Grotesk] text-2xl font-bold text-text-primary sm:text-3xl">
              Order #{order.orderNumber ?? order.id.slice(0, 8)}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-text-secondary">
            <Calendar size={14} />
            <span>Placed on {formatDate(order.createdAt)}</span>
          </div>
        </div>

        <button
          onClick={fetchOrderDetails}
          className="flex items-center justify-center gap-2 rounded-md border border-bg-border bg-bg-panel px-3.5 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
        >
          <RefreshCw size={14} />
          Refresh Details
        </button>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-success-border bg-success-bg px-4 py-3 text-sm text-success">
          <Check size={16} />
          {successMsg}
        </div>
      )}

      {/* Interactive Status Transition Section */}
      <div className="mt-6 rounded-lg border border-bg-border bg-bg-panel p-4 sm:p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Update Order Status
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {ALL_STATUSES.map((status) => {
            const isCurrent = order.status === status;
            return (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={isUpdatingStatus || isCurrent}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  isCurrent
                    ? "bg-accent text-white shadow-sm ring-2 ring-accent/30"
                    : "border border-bg-border bg-bg text-text-secondary hover:bg-bg-hover hover:text-text-primary disabled:opacity-50"
                }`}
              >
                {status}
                {isCurrent && <Check size={13} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Order Items */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-bg-border bg-bg-panel p-5">
            <div className="flex items-center gap-2 border-b border-bg-border pb-4 font-[Space_Grotesk] font-semibold text-text-primary">
              <Package size={18} className="text-accent" />
              Order Items ({order.items?.length ?? 0})
            </div>

            <div className="mt-4 divide-y divide-bg-border/60">
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => {
                  const productImg =
                    item.product?.images?.find((i) => i.isPrimary)?.imageUrl ??
                    item.product?.images?.[0]?.imageUrl;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 py-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {productImg ? (
                          <img
                            src={productImg}
                            alt={item.product?.name ?? "Product"}
                            className="h-12 w-12 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-bg-hover text-text-muted">
                            <Package size={20} />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate font-medium text-text-primary text-sm">
                            {item.product?.name ?? `Product #${item.productId}`}
                          </p>
                          {item.product?.sku && (
                            <p className="mt-0.5 text-xs text-text-secondary font-mono">
                              SKU: {item.product.sku}
                            </p>
                          )}
                          <p className="mt-0.5 text-xs text-text-muted">
                            Qty: {item.quantity} × ${centsToDollars(item.priceCents)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-semibold text-text-primary text-sm">
                        ${centsToDollars(item.priceCents * item.quantity)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-text-muted">
                  No items in this order.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Details & Financial Summary */}
        <div className="flex flex-col gap-6">
          {/* Customer Card */}
          <div className="rounded-lg border border-bg-border bg-bg-panel p-5">
            <div className="flex items-center justify-between border-b border-bg-border pb-4">
              <div className="flex items-center gap-2 font-[Space_Grotesk] font-semibold text-text-primary">
                <User size={18} className="text-accent" />
                Customer
              </div>
              {customerId && (
                <Link
                  to={`/admin/customers/${customerId}`}
                  className="inline-flex items-center gap-1 rounded-md border border-bg-border px-2.5 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-bg-hover"
                  title="Open customer profile"
                >
                  View Profile
                  <ArrowUpRight size={11} />
                </Link>
              )}
            </div>

            <div className="mt-4 space-y-3 text-xs text-text-secondary">
              {/* Name + member since */}
              <div className="flex items-start gap-2.5">
                <User size={15} className="mt-0.5 text-text-muted shrink-0" />
                <div>
                  <span className="block font-semibold text-text-primary text-sm">
                    {customerName}
                  </span>
                  {customerSince && (
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-text-muted">
                      <Clock size={10} />
                      Member since {formatDateShort(customerSince)}
                    </span>
                  )}
                </div>
              </div>

              {/* Email */}
              {customerEmail && (
                <div className="flex items-center gap-2.5">
                  <Mail size={15} className="text-text-muted shrink-0" />
                  <span className="truncate">{customerEmail}</span>
                </div>
              )}

              {/* Phone */}
              {customerPhone && (
                <div className="flex items-center gap-2.5">
                  <Phone size={15} className="text-text-muted shrink-0" />
                  <span>{customerPhone}</span>
                </div>
              )}

              {/* Shipping Address */}
              {shippingAddr && (
                <div className="flex items-start gap-2.5 pt-2 border-t border-bg-border/60">
                  <MapPin size={15} className="mt-0.5 text-text-muted shrink-0" />
                  <div>
                    <span className="block font-medium text-text-primary mb-1">
                      {shippingAddr.label
                        ? `Ship to: ${shippingAddr.label}`
                        : "Shipping Address"}
                    </span>
                    <span className="block text-text-secondary leading-relaxed">
                      {shippingAddr.fullName}
                      <br />
                      {shippingAddr.street}
                      <br />
                      {shippingAddr.city}, {shippingAddr.state}{" "}
                      {shippingAddr.postalCode}
                      <br />
                      {shippingAddr.country}
                    </span>
                    {shippingAddr.phone && (
                      <span className="mt-1 block text-text-muted">
                        📞 {shippingAddr.phone}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {!customerEmail && !customerPhone && !shippingAddr && (
                <p className="text-[11px] text-text-muted italic">
                  No additional contact details recorded.
                </p>
              )}
            </div>
          </div>

          {/* Order Summary Card */}
          <div className="rounded-lg border border-bg-border bg-bg-panel p-5">
            <div className="flex items-center gap-2 border-b border-bg-border pb-4 font-[Space_Grotesk] font-semibold text-text-primary">
              <CreditCard size={18} className="text-accent" />
              Order Summary
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between text-text-secondary">
                <span>Items Subtotal</span>
                <span className="font-medium text-text-primary">
                  ${centsToDollars(order.totalCents)}
                </span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Shipping</span>
                <span className="font-medium text-success">Free</span>
              </div>

              <div className="mt-3 flex justify-between border-t border-bg-border pt-3 text-sm font-bold text-text-primary">
                <span>Total Amount</span>
                <span className="text-accent">
                  ${centsToDollars(order.totalCents)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
