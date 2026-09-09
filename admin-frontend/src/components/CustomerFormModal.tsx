import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { Customer, CreateCustomerPayload, UpdateCustomerPayload } from "../types/customer";

interface CustomerFormModalProps {
  isOpen: boolean;
  customer?: Customer | null;
  isLoading: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (data: CreateCustomerPayload | UpdateCustomerPayload) => Promise<void>;
}

export default function CustomerFormModal({
  isOpen,
  customer,
  isLoading,
  error,
  onClose,
  onSubmit,
}: CustomerFormModalProps) {
  const isEditing = Boolean(customer);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (customer) {
      setName(customer.name ?? "");
      setEmail(customer.email ?? "");
      setPhone(customer.phone ?? "");
      setAddress(customer.address ?? "");
      setPassword("");
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setPassword("");
    }
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      onSubmit({ name, email, phone, address });
    } else {
      onSubmit({ name, email, phone, address, password });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 fade-in">
      <div className="w-full max-w-lg rounded-xl border border-bg-border bg-bg-panel p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-bg-border pb-4">
          <h2 className="font-[Space_Grotesk] text-lg font-bold text-text-primary">
            {isEditing ? "Edit Customer Profile" : "Add New Customer"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-danger-border bg-danger-bg px-3.5 py-2.5 text-xs text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="mt-1 w-full rounded-md border border-bg-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@example.com"
              className="mt-1 w-full rounded-md border border-bg-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>

          {!isEditing && (
            <div>
              <label className="block text-xs font-semibold text-text-secondary">
                Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set an initial password"
                className="mt-1 w-full rounded-md border border-bg-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-secondary">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +1 555 123 4567"
              className="mt-1 w-full rounded-md border border-bg-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary">
              Shipping / Home Address
            </label>
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main Street, Suite 400..."
              className="mt-1 w-full rounded-md border border-bg-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-bg-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-bg-border px-4 py-2 text-xs font-medium text-text-secondary hover:bg-bg-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              {isEditing ? "Save Changes" : "Create Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
