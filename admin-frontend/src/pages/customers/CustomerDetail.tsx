import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  Calendar,
  Eye,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  RefreshCw,
  ShoppingBag,
  User,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  getCustomer,
  getCustomerOrders,
  updateCustomer,
} from "../../services/customerApi";
import type { Customer, UpdateCustomerPayload } from "../../types/customer";
import { getCustomerName, getCustomerPhone } from "../../types/customer";
import type { Order } from "../../types/order";
import { StatusBadge } from "../orders/Orders";
import CustomerFormModal from "../../components/CustomerFormModal";
import { useAuthStore } from "../../store/authStore";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data;
    if (Array.isArray(data?.message)) return data.message.join(", ");
    return data?.message ?? fallback;
  }
  return fallback;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function centsToDollars(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "0.00";
  return (cents / 100).toFixed(2);
}

function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { admin } = useAuthStore();
  const isAdmin = admin?.role === "ADMIN";

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCustomerData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCustomer(id);
      setCustomer(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load customer profile."));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerOrderHistory = async () => {
    if (!id) return;
    setIsLoadingOrders(true);
    try {
      const orderList = await getCustomerOrders(id);
      setOrders(orderList);
    } catch {
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
    fetchCustomerOrderHistory();
  }, [id]);

  const handleEditSubmit = async (payload: UpdateCustomerPayload) => {
    if (!customer) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      const updated = await updateCustomer(customer.id, payload);
      setCustomer(updated);
      setIsFormOpen(false);
    } catch (err) {
      setFormError(extractErrorMessage(err, "Failed to update profile."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-sm text-text-muted">
        <RefreshCw size={28} className="mb-3 animate-spin text-accent" />
        Loading customer profile...
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="px-4 py-8 sm:px-10">
        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={16} />
          Back to Customers
        </Link>
        <div className="mt-6 rounded-md border border-danger-border bg-danger-bg px-4 py-4 text-sm text-danger">
          {error ?? "Customer profile not found."}
        </div>
      </div>
    );
  }

  const customerName = getCustomerName(customer);
  const customerPhone = getCustomerPhone(customer);

  return (
    <div className="px-4 py-6 sm:px-10 sm:py-10">
      {/* Back Navigation */}
      <Link
        to="/admin/customers"
        className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={16} />
        Back to Customers
      </Link>

      {/* Profile Header */}
      <div className="mt-4 flex flex-col gap-4 border-b border-bg-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-[Space_Grotesk] text-2xl font-bold text-text-primary sm:text-3xl">
              {customerName}
            </h1>
            {customer.isActive ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-success-border bg-success-bg px-2.5 py-0.5 text-xs font-medium text-success">
                <UserCheck size={12} /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-danger-border bg-danger-bg px-2.5 py-0.5 text-xs font-medium text-danger">
                <UserX size={12} /> Deactivated
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-text-secondary">
            <Calendar size={14} />
            <span>Member since {formatDate(customer.createdAt)}</span>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setFormError(null);
              setIsFormOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-md border border-bg-border bg-bg-panel px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            <Pencil size={15} />
            Edit Profile
          </button>
        )}
      </div>

      {/* Grid Layout */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-bg-border bg-bg-panel p-5">
            <div className="flex items-center gap-2 border-b border-bg-border pb-4 font-[Space_Grotesk] font-semibold text-text-primary">
              <User size={18} className="text-accent" />
              Customer Details
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-text-secondary">
              <div>
                <span className="block font-medium text-text-muted">Full Name</span>
                <span className="mt-0.5 block text-sm font-semibold text-text-primary">
                  {customerName}
                </span>
              </div>

              <div className="flex items-center gap-2.5 pt-2 border-t border-bg-border/60">
                <Mail size={15} className="text-text-muted shrink-0" />
                <span className="truncate text-text-primary">{customer.email}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone size={15} className="text-text-muted shrink-0" />
                <span className="text-text-primary">{customerPhone ?? "Not provided"}</span>
              </div>

              <div className="flex items-start gap-2.5 pt-2 border-t border-bg-border/60">
                <MapPin size={15} className="mt-0.5 text-text-muted shrink-0" />
                <div>
                  <span className="block font-medium text-text-muted">
                    Saved Shipping Address
                  </span>
                  <span className="mt-0.5 block text-text-primary whitespace-pre-line">
                    {customer.address ?? "No address registered."}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order History */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-bg-border bg-bg-panel p-5">
            <div className="flex items-center justify-between border-b border-bg-border pb-4">
              <div className="flex items-center gap-2 font-[Space_Grotesk] font-semibold text-text-primary">
                <ShoppingBag size={18} className="text-accent" />
                Order History ({orders.length})
              </div>
              <button
                onClick={fetchCustomerOrderHistory}
                className="text-xs text-text-secondary hover:text-text-primary"
              >
                <RefreshCw size={14} className={isLoadingOrders ? "animate-spin" : ""} />
              </button>
            </div>

            {isLoadingOrders ? (
              <div className="py-10 text-center text-xs text-text-muted">
                Loading order history...
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center">
                <Package size={32} className="mx-auto text-text-muted opacity-60" />
                <p className="mt-2 text-xs font-medium text-text-secondary">
                  No order history found for this customer.
                </p>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-bg-border/60">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="font-mono text-xs font-semibold text-accent hover:underline"
                      >
                        #{order.orderNumber ?? order.id.slice(0, 8)}
                      </Link>
                      <div className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
                        <span>{formatDate(order.createdAt)}</span>
                        <span>•</span>
                        <span>{order.items?.length ?? 0} item(s)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <div className="text-right">
                        <span className="block font-semibold text-text-primary text-sm">
                          ${centsToDollars(order.totalCents)}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>

                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="rounded-md border border-bg-border p-2 text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                        title="View Order Details"
                      >
                        <Eye size={16} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Customer Profile Modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        customer={customer}
        isLoading={isSubmitting}
        error={formError}
        onClose={() => setIsFormOpen(false)}
        onSubmit={(data) => handleEditSubmit(data as UpdateCustomerPayload)}
      />
    </div>
  );
}

export default CustomerDetail;
