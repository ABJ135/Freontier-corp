import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  Archive,
  Eye,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from "../../services/customerApi";
import ConfirmDialog from "../../components/ConfirmDialog";
import CustomerFormModal from "../../components/CustomerFormModal";
import type {
  CreateCustomerPayload,
  Customer,
  UpdateCustomerPayload,
} from "../../types/customer";
import { getCustomerName, getCustomerPhone } from "../../types/customer";
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
  });
}

function Customers() {
  const navigate = useNavigate();
  const { admin } = useAuthStore();
  const isAdmin = admin?.role === "ADMIN";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete/Deactivate States
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCustomerList = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load customer list."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerList();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (
    payload: CreateCustomerPayload | UpdateCustomerPayload,
  ) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingCustomer) {
        const updated = await updateCustomer(
          editingCustomer.id,
          payload as UpdateCustomerPayload,
        );
        setCustomers((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c)),
        );
      } else {
        const created = await createCustomer(payload as CreateCustomerPayload);
        setCustomers((prev) => [created, ...prev]);
      }
      setIsFormOpen(false);
    } catch (err) {
      setFormError(
        extractErrorMessage(
          err,
          editingCustomer
            ? "Could not update customer."
            : "Could not create customer.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteCustomer(deleteTarget.id);
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to deactivate customer."));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const name = getCustomerName(c).toLowerCase();
    const email = (c.email ?? "").toLowerCase();
    const phone = getCustomerPhone(c) ?? "";
    const q = searchQuery.toLowerCase();
    return name.includes(q) || email.includes(q) || phone.includes(q);
  });

  return (
    <div className="px-4 py-6 sm:px-10 sm:py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-[Space_Grotesk] text-xl font-bold text-text-primary sm:text-2xl">
              Customers
            </h1>
            <span className="rounded-full bg-accent/15 px-3 py-0.5 text-xs font-bold text-accent border border-accent/30">
              {isLoading ? "..." : `${customers.length} total`}
            </span>
          </div>
          <p className="mt-1 text-sm text-text-secondary sm:text-[15px]">
            Manage customer accounts, view registered users, and profile details.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            to="/admin/customers/inactive"
            className="flex items-center justify-center gap-2 rounded-md border border-bg-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            <Archive size={16} strokeWidth={1.75} />
            View Deactivated
          </Link>

          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover active:scale-[0.98]"
            >
              <Plus size={16} strokeWidth={2} />
              Add customer
            </button>
          )}
        </div>
      </div>

      {/* Search Input Bar & Count Indicator */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name, email, or phone..."
            className="w-full rounded-lg border border-bg-border bg-bg-panel pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>
        {searchQuery && (
          <div className="text-xs font-medium text-text-secondary">
            Showing {filteredCustomers.length} of {customers.length} customers
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-6 rounded-md border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="mt-8 py-10 text-center text-sm text-text-muted">
          Loading customer accounts...
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredCustomers.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-bg-border px-6 py-14 text-center">
          <Users size={36} className="mx-auto text-text-muted opacity-60" />
          <p className="mt-3 text-sm font-medium text-text-primary">
            No customers found.
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {searchQuery
              ? "No customer matches your search criteria."
              : "Registered customer accounts will appear here."}
          </p>
        </div>
      )}

      {/* Customer List */}
      {!isLoading && !error && filteredCustomers.length > 0 && (
        <>
          {/* Mobile view: Stacked Cards */}
          <div className="mt-6 flex flex-col gap-3.5 sm:hidden">
            {filteredCustomers.map((customer) => {
              const name = getCustomerName(customer);
              const phone = getCustomerPhone(customer);

              return (
                <div
                  key={customer.id}
                  className="rounded-lg border border-bg-border bg-bg-panel p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary truncate">
                          {name}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-[10px] font-medium text-success border border-success-border">
                          <UserCheck size={10} /> Active
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary truncate">
                        <Mail size={12} className="text-text-muted shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                      {phone && (
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-text-secondary">
                          <Phone size={12} className="text-text-muted shrink-0" />
                          <span>{phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => navigate(`/admin/customers/${customer.id}`)}
                        className="rounded-md p-1.5 text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                        title="View Profile"
                      >
                        <Eye size={16} />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(customer)}
                            className="rounded-md p-1.5 text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                            title="Edit Customer"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(customer)}
                            className="rounded-md p-1.5 text-text-secondary hover:bg-bg-hover hover:text-danger"
                            title="Deactivate Customer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop view: Table */}
          <div className="mt-6 hidden overflow-hidden rounded-lg border border-bg-border sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-panel text-text-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Joined Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => {
                  const name = getCustomerName(customer);
                  const phone = getCustomerPhone(customer);

                  return (
                    <tr
                      key={customer.id}
                      className="border-t border-bg-border text-text-primary transition-colors hover:bg-bg-hover/40"
                    >
                      <td className="px-4 py-3.5 font-medium">
                        <Link
                          to={`/admin/customers/${customer.id}`}
                          className="text-text-primary hover:text-accent hover:underline"
                        >
                          {name}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-text-secondary">
                        {customer.email}
                      </td>
                      <td className="px-4 py-3.5 text-text-secondary">
                        {phone ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-text-secondary">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-success-border bg-success-bg px-2.5 py-0.5 text-xs font-medium text-success">
                          <UserCheck size={12} />
                          Active
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/admin/customers/${customer.id}`)}
                            className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
                            title="View Details & Orders"
                            aria-label={`View ${name}`}
                          >
                            <Eye size={16} strokeWidth={1.75} />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(customer)}
                                className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
                                title="Edit Customer"
                                aria-label={`Edit ${name}`}
                              >
                                <Pencil size={16} strokeWidth={1.75} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(customer)}
                                className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-danger"
                                title="Deactivate Customer"
                                aria-label={`Deactivate ${name}`}
                              >
                                <Trash2 size={16} strokeWidth={1.75} />
                              </button>
                            </>
                          )}
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

      {/* Customer Create/Edit Modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        customer={editingCustomer}
        isLoading={isSubmitting}
        error={formError}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Deactivation Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Deactivate Customer Account"
        message={`Are you sure you want to deactivate "${getCustomerName(deleteTarget)}"? The account will be moved to deactivated customers.`}
        isLoading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDeactivate}
      />
    </div>
  );
}

export default Customers;
