import { useEffect, useState, useRef } from "react";
import {
  Truck,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  X,
  Search,
  Loader2,
  Link,
  Phone,
  Mail,
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  getAllShippingPartners,
  createShippingPartner,
  updateShippingPartner,
  deleteShippingPartner,
  restoreShippingPartner,
} from "../../services/shippingPartnerApi";
import type {
  ShippingPartner,
  CreateShippingPartnerPayload,
} from "../../types/shippingPartner";

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalMode = "create" | "edit";

const EMPTY_FORM: CreateShippingPartnerPayload = {
  name: "",
  code: "",
  trackingUrlTemplate: "",
  contactPhone: "",
  contactEmail: "",
  website: "",
  isActive: true,
};

// ─── Component ────────────────────────────────────────────────────────────────

function ShippingPartners() {
  const [partners, setPartners] = useState<ShippingPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ShippingPartner | null>(null);
  const [form, setForm] = useState<CreateShippingPartnerPayload>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  // Delete/restore state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const firstInputRef = useRef<HTMLInputElement>(null);

  // ── Load ───────────────────────────────────────────────────────────────────

  const loadPartners = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllShippingPartners();
      setPartners(data);
    } catch {
      setError("Failed to load shipping partners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  useEffect(() => {
    if (modalOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [modalOpen]);

  // ── Derived list ────────────────────────────────────────────────────────────

  const filtered = partners.filter((p) => {
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && p.isActive) ||
      (filterStatus === "inactive" && !p.isActive);
    return matchSearch && matchStatus;
  });

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setModalMode("create");
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (partner: ShippingPartner) => {
    setModalMode("edit");
    setEditTarget(partner);
    setForm({
      name: partner.name,
      code: partner.code,
      trackingUrlTemplate: partner.trackingUrlTemplate ?? "",
      contactPhone: partner.contactPhone ?? "",
      contactEmail: partner.contactEmail ?? "",
      website: partner.website ?? "",
      isActive: partner.isActive,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (formSaving) return;
    setModalOpen(false);
    setEditTarget(null);
    setFormError(null);
  };

  // ── Form submit ────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      setFormError("Name and Code are required.");
      return;
    }

    setFormSaving(true);
    setFormError(null);

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      trackingUrlTemplate: form.trackingUrlTemplate?.trim() || undefined,
      contactPhone: form.contactPhone?.trim() || undefined,
      contactEmail: form.contactEmail?.trim() || undefined,
      website: form.website?.trim() || undefined,
      isActive: form.isActive,
    };

    try {
      if (modalMode === "create") {
        const created = await createShippingPartner(payload);
        setPartners((prev) => [...prev, created]);
      } else if (editTarget) {
        const updated = await updateShippingPartner(editTarget.id, payload);
        setPartners((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p)),
        );
      }
      closeModal();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Something went wrong. Please try again.";
      setFormError(typeof msg === "string" ? msg : "An error occurred.");
    } finally {
      setFormSaving(false);
    }
  };

  // ── Delete / restore ───────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await deleteShippingPartner(id);
      setPartners((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: false } : p)),
      );
    } catch {
      // Could show a toast here
    } finally {
      setActionLoading(null);
      setConfirmDeleteId(null);
    }
  };

  const handleRestore = async (id: string) => {
    setActionLoading(id);
    try {
      const restored = await restoreShippingPartner(id);
      setPartners((prev) => prev.map((p) => (p.id === id ? restored : p)));
    } catch {
      // Could show a toast here
    } finally {
      setActionLoading(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[Space_Grotesk] text-2xl font-bold text-text-primary">
            Shipping Partners
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage courier and logistics partners for your store.
          </p>
        </div>
        <button
          id="add-shipping-partner-btn"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          Add Partner
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            placeholder="Search by name or code…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-bg-border bg-bg-panel py-2.5 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                filterStatus === s
                  ? "border-accent/30 bg-accent/10 text-accent"
                  : "border-bg-border bg-bg-panel text-text-secondary hover:bg-bg-hover"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-text-muted">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Loading shipping partners…</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <AlertTriangle size={32} className="text-danger" />
          <p className="text-sm text-text-secondary">{error}</p>
          <button
            onClick={loadPartners}
            className="rounded-lg border border-bg-border bg-bg-panel px-4 py-2 text-xs font-medium text-text-primary hover:bg-bg-hover"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <Truck size={36} className="text-text-muted" />
          <p className="text-sm font-medium text-text-primary">
            {searchQuery || filterStatus !== "all"
              ? "No partners match your filters."
              : "No shipping partners yet."}
          </p>
          {!searchQuery && filterStatus === "all" && (
            <button
              onClick={openCreate}
              className="mt-1 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Add your first partner
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-panel shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border bg-bg-hover/50">
                <th className="px-5 py-3 text-left font-medium text-text-muted">
                  Partner
                </th>
                <th className="hidden px-5 py-3 text-left font-medium text-text-muted sm:table-cell">
                  Code
                </th>
                <th className="hidden px-5 py-3 text-left font-medium text-text-muted md:table-cell">
                  Contact
                </th>
                <th className="px-5 py-3 text-center font-medium text-text-muted">
                  Status
                </th>
                <th className="px-5 py-3 text-right font-medium text-text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border/60">
              {filtered.map((partner) => (
                <PartnerRow
                  key={partner.id}
                  partner={partner}
                  actionLoading={actionLoading}
                  confirmDeleteId={confirmDeleteId}
                  onEdit={() => openEdit(partner)}
                  onDeleteRequest={() => setConfirmDeleteId(partner.id)}
                  onDeleteCancel={() => setConfirmDeleteId(null)}
                  onDeleteConfirm={() => handleDelete(partner.id)}
                  onRestore={() => handleRestore(partner.id)}
                />
              ))}
            </tbody>
          </table>
          <div className="border-t border-bg-border px-5 py-3">
            <p className="text-xs text-text-muted">
              {filtered.length} of {partners.length} partners
            </p>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <PartnerModal
          mode={modalMode}
          form={form}
          setForm={setForm}
          formError={formError}
          formSaving={formSaving}
          firstInputRef={firstInputRef}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

// ─── PartnerRow ───────────────────────────────────────────────────────────────

function PartnerRow({
  partner,
  actionLoading,
  confirmDeleteId,
  onEdit,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
  onRestore,
}: {
  partner: ShippingPartner;
  actionLoading: string | null;
  confirmDeleteId: string | null;
  onEdit: () => void;
  onDeleteRequest: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
  onRestore: () => void;
}) {
  const isLoading = actionLoading === partner.id;
  const isConfirming = confirmDeleteId === partner.id;

  return (
    <tr className="transition-colors hover:bg-bg-hover/40">
      {/* Name */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            <Truck size={16} className="text-accent" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-text-primary">{partner.name}</p>
            {partner.website && (
              <a
                href={partner.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 truncate text-xs text-text-muted hover:text-accent"
              >
                <Globe size={10} />
                {partner.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>
      </td>

      {/* Code */}
      <td className="hidden px-5 py-4 sm:table-cell">
        <span className="rounded-md border border-bg-border bg-bg px-2 py-0.5 font-mono text-xs font-semibold text-text-secondary">
          {partner.code}
        </span>
      </td>

      {/* Contact */}
      <td className="hidden px-5 py-4 md:table-cell">
        <div className="space-y-0.5">
          {partner.contactEmail && (
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Mail size={11} />
              <span>{partner.contactEmail}</span>
            </div>
          )}
          {partner.contactPhone && (
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Phone size={11} />
              <span>{partner.contactPhone}</span>
            </div>
          )}
          {partner.trackingUrlTemplate && (
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Link size={11} />
              <span className="truncate">Tracking URL set</span>
            </div>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="px-5 py-4 text-center">
        {partner.isActive ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-success-border bg-success-bg px-2.5 py-0.5 text-xs font-semibold text-success">
            <CheckCircle size={10} />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-bg-border bg-bg px-2.5 py-0.5 text-xs font-semibold text-text-muted">
            <XCircle size={10} />
            Inactive
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="px-5 py-4 text-right">
        {isLoading ? (
          <Loader2 size={16} className="ml-auto animate-spin text-text-muted" />
        ) : isConfirming ? (
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-text-muted">Deactivate?</span>
            <button
              onClick={onDeleteConfirm}
              className="rounded-lg bg-danger px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90"
            >
              Yes
            </button>
            <button
              onClick={onDeleteCancel}
              className="rounded-lg border border-bg-border px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-bg-hover"
            >
              No
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={onEdit}
              title="Edit"
              className="rounded-lg border border-transparent p-1.5 text-text-muted transition-colors hover:border-bg-border hover:bg-bg-hover hover:text-text-primary"
            >
              <Pencil size={14} />
            </button>
            {partner.isActive ? (
              <button
                onClick={onDeleteRequest}
                title="Deactivate"
                className="rounded-lg border border-transparent p-1.5 text-text-muted transition-colors hover:border-danger-border hover:bg-danger-bg hover:text-danger"
              >
                <Trash2 size={14} />
              </button>
            ) : (
              <button
                onClick={onRestore}
                title="Restore"
                className="rounded-lg border border-transparent p-1.5 text-text-muted transition-colors hover:border-success-border hover:bg-success-bg hover:text-success"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── PartnerModal ─────────────────────────────────────────────────────────────

function PartnerModal({
  mode,
  form,
  setForm,
  formError,
  formSaving,
  firstInputRef,
  onClose,
  onSubmit,
}: {
  mode: ModalMode;
  form: CreateShippingPartnerPayload;
  setForm: React.Dispatch<React.SetStateAction<CreateShippingPartnerPayload>>;
  formError: string | null;
  formSaving: boolean;
  firstInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === "create" ? "Add Shipping Partner" : "Edit Shipping Partner"}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-bg-border bg-bg-panel shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-bg-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Truck size={18} className="text-accent" />
            <h2 className="font-[Space_Grotesk] text-base font-semibold text-text-primary">
              {mode === "create" ? "Add Shipping Partner" : "Edit Shipping Partner"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={formSaving}
            className="rounded-lg p-1.5 text-text-muted hover:bg-bg-hover hover:text-text-primary disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4 px-6 py-5">
          {/* Name + Code */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="partner-name"
                className="mb-1 block text-xs font-medium text-text-secondary"
              >
                Name <span className="text-danger">*</span>
              </label>
              <input
                id="partner-name"
                ref={firstInputRef}
                type="text"
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="DHL Express"
                className="w-full rounded-lg border border-bg-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label
                htmlFor="partner-code"
                className="mb-1 block text-xs font-medium text-text-secondary"
              >
                Code <span className="text-danger">*</span>
              </label>
              <input
                id="partner-code"
                type="text"
                required
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="DHL"
                className="w-full rounded-lg border border-bg-border bg-bg px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Tracking URL */}
          <div>
            <label
              htmlFor="partner-tracking"
              className="mb-1 block text-xs font-medium text-text-secondary"
            >
              Tracking URL Template
            </label>
            <div className="relative">
              <Link
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                id="partner-tracking"
                type="text"
                value={form.trackingUrlTemplate ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    trackingUrlTemplate: e.target.value,
                  }))
                }
                placeholder="https://track.dhl.com/?id={trackingId}"
                className="w-full rounded-lg border border-bg-border bg-bg py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <p className="mt-1 text-xs text-text-muted">
              Use <code className="rounded bg-bg px-1">{"{trackingId}"}</code> as the placeholder.
            </p>
          </div>

          {/* Contact Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="partner-email"
                className="mb-1 block text-xs font-medium text-text-secondary"
              >
                Contact Email
              </label>
              <div className="relative">
                <Mail
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  id="partner-email"
                  type="email"
                  value={form.contactEmail ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contactEmail: e.target.value }))
                  }
                  placeholder="support@dhl.com"
                  className="w-full rounded-lg border border-bg-border bg-bg py-2 pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="partner-phone"
                className="mb-1 block text-xs font-medium text-text-secondary"
              >
                Contact Phone
              </label>
              <div className="relative">
                <Phone
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  id="partner-phone"
                  type="tel"
                  value={form.contactPhone ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contactPhone: e.target.value }))
                  }
                  placeholder="+1 800 000 0000"
                  className="w-full rounded-lg border border-bg-border bg-bg py-2 pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          </div>

          {/* Website */}
          <div>
            <label
              htmlFor="partner-website"
              className="mb-1 block text-xs font-medium text-text-secondary"
            >
              Website
            </label>
            <div className="relative">
              <Globe
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                id="partner-website"
                type="url"
                value={form.website ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, website: e.target.value }))
                }
                placeholder="https://www.dhl.com"
                className="w-full rounded-lg border border-bg-border bg-bg py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-xl border border-bg-border bg-bg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-text-primary">Active</p>
              <p className="text-xs text-text-muted">
                Inactive partners are hidden from the storefront
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
              role="switch"
              aria-checked={form.isActive}
              aria-label="Toggle active status"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                form.isActive ? "bg-accent" : "bg-bg-border"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ${
                  form.isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {formError && (
            <p className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-xs font-medium text-danger">
              {formError}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-bg-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={formSaving}
              className="rounded-xl border border-bg-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSaving}
              className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {formSaving && <Loader2 size={14} className="animate-spin" />}
              {formSaving
                ? "Saving…"
                : mode === "create"
                  ? "Add Partner"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ShippingPartners;
