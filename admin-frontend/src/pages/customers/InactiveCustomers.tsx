import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { ArrowLeft, RefreshCw, RotateCcw, UserX } from "lucide-react";
import { getInactiveCustomers, restoreCustomer } from "../../services/customerApi";
import type { Customer } from "../../types/customer";
import { getCustomerName, getCustomerPhone } from "../../types/customer";
import ConfirmDialog from "../../components/ConfirmDialog";
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

function InactiveCustomers() {
  const { admin } = useAuthStore();
  const isAdmin = admin?.role === "ADMIN";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [restoreTarget, setRestoreTarget] = useState<Customer | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const fetchInactive = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInactiveCustomers();
      setCustomers(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load inactive customers."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInactive();
  }, []);

  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;
    setIsRestoring(true);
    setError(null);
    try {
      await restoreCustomer(restoreTarget.id);
      setCustomers((prev) => prev.filter((c) => c.id !== restoreTarget.id));
      setRestoreTarget(null);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to restore customer."));
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-10 sm:py-10">
      <Link
        to="/admin/customers"
        className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={16} />
        Back to Active Customers
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="font-[Space_Grotesk] text-xl font-bold text-text-primary sm:text-2xl">
            Deactivated Customers Archive
          </h1>
          <p className="mt-1 text-sm text-text-secondary sm:text-[15px]">
            Review and restore previously deactivated customer accounts ({customers.length} total).
          </p>
        </div>

        <button
          onClick={fetchInactive}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-md border border-bg-border bg-bg-panel px-3.5 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-md border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mt-8 py-10 text-center text-sm text-text-muted">
          Loading deactivated customers...
        </div>
      )}

      {!isLoading && !error && customers.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-bg-border px-6 py-14 text-center">
          <UserX size={36} className="mx-auto text-text-muted opacity-60" />
          <p className="mt-3 text-sm font-medium text-text-primary">
            No deactivated customers.
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Deactivated customer accounts will be stored here.
          </p>
        </div>
      )}

      {!isLoading && !error && customers.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-lg border border-bg-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-panel text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Customer Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Joined Date</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const name = getCustomerName(customer);
                const phone = getCustomerPhone(customer);

                return (
                  <tr
                    key={customer.id}
                    className="border-t border-bg-border text-text-primary"
                  >
                    <td className="px-4 py-3.5 font-medium">{name}</td>
                    <td className="px-4 py-3.5 text-text-secondary">
                      {customer.email}
                    </td>
                    <td className="px-4 py-3.5 text-text-secondary">
                      {phone ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-text-secondary">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {isAdmin && (
                        <button
                          onClick={() => setRestoreTarget(customer)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-success-border bg-success-bg px-3 py-1.5 text-xs font-semibold text-success hover:bg-success-bg/80"
                        >
                          <RotateCcw size={14} />
                          Restore Account
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={restoreTarget !== null}
        title="Restore Customer Account"
        message={`Restore customer account for "${getCustomerName(restoreTarget)}"? They will regain access.`}
        isLoading={isRestoring}
        onCancel={() => setRestoreTarget(null)}
        onConfirm={handleConfirmRestore}
      />
    </div>
  );
}

export default InactiveCustomers;
