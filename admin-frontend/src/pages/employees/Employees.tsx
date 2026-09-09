import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCog,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { createEmployee, deleteEmployee, getEmployees } from "../../services/employeeApi";
import type { Admin, AdminRole } from "../../types/auth";
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

type ViewState = 1 | 2;

function Employees() {
  const { admin: currentAdmin } = useAuthStore();
  const [viewState, setViewState] = useState<ViewState>(1);
  const [accounts, setAccounts] = useState<Admin[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("EMPLOYEE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);
  const [isDeletingOne, setIsDeletingOne] = useState(false);

  const loadAccounts = async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      setAccounts(await getEmployees());
    } catch (err) {
      setListError(extractErrorMessage(err, "Could not load accounts."));
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => { loadAccounts(); }, []);

  const resetForm = () => {
    setName(""); setEmail(""); setPassword(""); setRole("EMPLOYEE");
    setFormError(null); setSuccessMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null); setSuccessMessage(null); setIsSubmitting(true);
    try {
      const created = await createEmployee({ name, email, password, role });
      setSuccessMessage(`${created.name} was added as ${created.role === "ADMIN" ? "an Admin" : "an Employee"}.`);
      resetForm();
      await loadAccounts();
      setViewState(1);
    } catch (err) {
      setFormError(extractErrorMessage(err, "Could not create account."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeletingOne(true);
    try {
      await deleteEmployee(deleteTarget.id);
      setAccounts((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setListError(extractErrorMessage(err, "Could not delete account."));
    } finally {
      setIsDeletingOne(false);
    }
  };

  const filtered = accounts.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase()),
  );

  const adminCount = accounts.filter((a) => a.role === "ADMIN").length;
  const employeeCount = accounts.filter((a) => a.role === "EMPLOYEE").length;

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-[Space_Grotesk] text-2xl font-bold text-text-primary">
              Team
            </h1>
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-0.5 text-xs font-bold text-accent">
              {isLoadingList ? "..." : `${accounts.length} accounts`}
            </span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Manage admin and employee accounts for your store operations.
          </p>
        </div>

        {viewState === 1 && (
          <div className="flex gap-2">
            <button onClick={loadAccounts} className="rounded-lg border border-bg-border px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover">
              <RefreshCw size={15} className={isLoadingList ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setViewState(2)}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover active:scale-[0.98]"
            >
              <UserPlus size={15} />
              Add Member
            </button>
          </div>
        )}
      </div>

      {/* ── Stats strip ── */}
      {!isLoadingList && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-bg-border bg-bg-panel px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <Users size={17} className="text-accent" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-secondary">Total</p>
              <p className="font-[Space_Grotesk] text-xl font-bold text-text-primary">{accounts.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-bg-border bg-bg-panel px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
              <Shield size={17} className="text-warning" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-secondary">Admins</p>
              <p className="font-[Space_Grotesk] text-xl font-bold text-text-primary">{adminCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-bg-border bg-bg-panel px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
              <UserCog size={17} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-secondary">Employees</p>
              <p className="font-[Space_Grotesk] text-xl font-bold text-text-primary">{employeeCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Add-member form ── */}
      {viewState === 2 && (
        <div className="mt-6 w-full max-w-md rounded-2xl border border-bg-border bg-bg-panel p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-[Space_Grotesk] text-lg font-bold text-text-primary">Add Team Member</h2>
            <button onClick={() => { resetForm(); setViewState(1); }} className="rounded-lg p-1.5 text-text-muted hover:bg-bg-hover">
              <X size={18} />
            </button>
          </div>

          {formError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
              <AlertTriangle size={14} /> {formError}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-success-border bg-success-bg px-4 py-3 text-sm text-success">
              <CheckCircle2 size={14} /> {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Full Name", value: name, setter: setName, type: "text", placeholder: "Jane Smith", required: true },
              { label: "Email Address", value: email, setter: setEmail, type: "email", placeholder: "jane@vikestore.com", required: true },
            ].map((field) => (
              <div key={field.label}>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="w-full rounded-xl border border-bg-border bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            ))}

            {/* Password field */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-bg-border bg-bg px-4 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Role
              </label>
              <div className="flex gap-2">
                {(["EMPLOYEE", "ADMIN"] as AdminRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
                      role === r
                        ? r === "ADMIN"
                          ? "border-warning/40 bg-warning/10 text-warning"
                          : "border-accent/30 bg-accent/10 text-accent"
                        : "border-bg-border text-text-secondary hover:bg-bg-hover"
                    }`}
                  >
                    {r === "ADMIN" ? <Shield size={14} /> : <UserCog size={14} />}
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { resetForm(); setViewState(1); }}
                disabled={isSubmitting}
                className="rounded-xl border border-bg-border px-5 py-2.5 text-sm font-semibold text-text-secondary hover:bg-bg-hover disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><RefreshCw size={14} className="animate-spin" /> Adding...</>
                ) : (
                  <><UserPlus size={14} /> Create Account</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── List view ── */}
      {viewState === 1 && (
        <>
          <div className="mt-5 relative max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-lg border border-bg-border bg-bg-panel py-2 pl-10 pr-4 text-sm placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>

          {listError && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
              <AlertTriangle size={14} /> {listError}
            </div>
          )}

          {isLoadingList && (
            <div className="mt-10 flex flex-col items-center py-10 text-text-muted">
              <RefreshCw size={28} className="animate-spin text-accent" />
              <p className="mt-3 text-sm">Loading team members...</p>
            </div>
          )}

          {!isLoadingList && filtered.length === 0 && (
            <div className="mt-8 rounded-xl border border-dashed border-bg-border py-16 text-center">
              <Users size={36} className="mx-auto text-text-muted opacity-50" />
              <p className="mt-3 text-sm font-medium text-text-primary">
                {search ? "No team members match your search." : "No accounts yet."}
              </p>
            </div>
          )}

          {!isLoadingList && filtered.length > 0 && (
            <div className="mt-5 overflow-hidden rounded-xl border border-bg-border">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-bg-panel text-xs text-text-secondary">
                  <tr>
                    <th className="px-5 py-3 font-medium">Member</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Joined</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((account) => (
                    <tr
                      key={account.id}
                      className="border-t border-bg-border transition-colors hover:bg-bg-hover/30"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {/* Avatar initials */}
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${account.role === "ADMIN" ? "bg-warning/15 text-warning" : "bg-accent/10 text-accent"}`}>
                            {account.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate font-semibold text-text-primary">{account.name}</p>
                              {account.id === currentAdmin?.id && (
                                <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] font-bold text-accent">YOU</span>
                              )}
                            </div>
                            <p className="truncate text-xs text-text-secondary">{account.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          account.role === "ADMIN"
                            ? "border-warning/30 bg-warning/10 text-warning"
                            : "border-accent/20 bg-accent/8 text-accent"
                        }`}>
                          {account.role === "ADMIN" ? <Shield size={11} /> : <UserCog size={11} />}
                          {account.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          account.isActive === false
                            ? "border-danger-border bg-danger-bg text-danger"
                            : "border-success-border bg-success-bg text-success"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${account.isActive === false ? "bg-danger" : "bg-success"}`} />
                          {account.isActive === false ? "Inactive" : "Active"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-text-secondary">
                        {account.createdAt ? new Date(account.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setDeleteTarget(account)}
                          disabled={account.id === currentAdmin?.id}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-danger-bg hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
                          title={account.id === currentAdmin?.id ? "You cannot delete your own account" : "Remove account"}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Remove Team Member"
        message={`Remove ${deleteTarget?.name} (${deleteTarget?.email}) from the team? This action cannot be undone.`}
        isLoading={isDeletingOne}
        confirmLabel="Remove Member"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default Employees;