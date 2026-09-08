import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { Trash2, UserPlus, Shield, UserCog } from "lucide-react";
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
} from "../../services/employeeApi";
import type { Admin, AdminRole } from "../../types/auth";
import ConfirmDialog from "../../components/ConfirmDialog";

function Employees() {
  // 1 = list view, 2 = create-employee form
  const [viewState, setViewState] = useState(1);

  const [accounts, setAccounts] = useState<Admin[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

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
      const data = await getEmployees();
      setAccounts(data);
    } catch (err) {
      const message = isAxiosError(err)
        ? err.response?.data?.message ?? "Could not load accounts."
        : "Could not load accounts.";
      setListError(message);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("EMPLOYEE");
    setFormError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const created = await createEmployee({ name, email, password, role });
      setSuccessMessage(
        `${created.name} was added as ${created.role === "ADMIN" ? "an admin" : "an employee"}.`,
      );
      resetForm();
      await loadAccounts();
      setViewState(1);
    } catch (err) {
      const message = isAxiosError(err)
        ? err.response?.data?.message ?? "Could not create account."
        : "Could not create account.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setViewState(1);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeletingOne(true);
    setListError(null);
    try {
      await deleteEmployee(deleteTarget.id);
      setAccounts((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      const message = isAxiosError(err)
        ? err.response?.data?.message ?? "Could not delete account."
        : "Could not delete account.";
      setListError(message);
    } finally {
      setIsDeletingOne(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[Space_Grotesk] text-xl font-bold text-text-primary sm:text-2xl">
            Employees
          </h1>
          <p className="mt-1 text-sm text-text-secondary sm:text-[15px]">
            Manage admin and employee accounts for your team.
          </p>
        </div>

        {viewState === 1 && (
          <button
            onClick={() => setViewState(2)}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 font-medium text-white transition-transform active:scale-[0.98] sm:w-auto"
          >
            <UserPlus size={16} strokeWidth={1.75} />
            New employee
          </button>
        )}
      </div>

      {/* View 1: accounts table */}
      {viewState === 1 && (
        <>
          {listError && (
            <div className="mt-6 rounded-md border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger sm:mt-8">
              {listError}
            </div>
          )}

          <div className="mt-6 overflow-x-auto rounded-lg border border-bg-border sm:mt-8">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-bg-panel text-text-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {isLoadingList && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-text-muted">
                      Loading accounts…
                    </td>
                  </tr>
                )}

                {!isLoadingList && listError && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-danger">
                      {listError}
                    </td>
                  </tr>
                )}

                {!isLoadingList && !listError && accounts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-text-muted">
                      No accounts yet.
                    </td>
                  </tr>
                )}

                {!isLoadingList &&
                  !listError &&
                  accounts.map((account) => (
                    <tr
                      key={account.id}
                      className="border-t border-bg-border text-text-primary"
                    >
                      <td className="px-4 py-3 font-medium">{account.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{account.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                            account.role === "ADMIN"
                              ? "bg-accent/15 text-accent"
                              : "bg-bg-hover text-text-secondary"
                          }`}
                        >
                          {account.role === "ADMIN" ? (
                            <Shield size={11} strokeWidth={1.75} />
                          ) : (
                            <UserCog size={11} strokeWidth={1.75} />
                          )}
                          {account.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {account.isActive === false ? "Inactive" : "Active"}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {account.createdAt
                          ? new Date(account.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setDeleteTarget(account)}
                          className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-danger"
                          aria-label={`Delete ${account.name}`}
                        >
                          <Trash2 size={16} strokeWidth={1.75} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* View 2: add account form */}
      {viewState === 2 && (
        <div className="mt-6 w-full max-w-md rounded-lg border border-bg-border bg-bg-panel p-4 sm:mt-8 sm:p-6">
          <h2 className="font-[Space_Grotesk] text-lg font-bold text-text-primary">
            Add account
          </h2>

          {formError && (
            <div className="mt-4 rounded-md border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
              {formError}
            </div>
          )}

          {successMessage && (
            <div className="mt-4 rounded-md border border-success-border bg-success-bg px-4 py-3 text-sm text-success">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Full name"
                required
                className="mt-2 w-full border-0 border-b border-bg-border bg-transparent px-0 py-2 text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="account@vikestore.com"
                required
                className="mt-2 w-full border-0 border-b border-bg-border bg-transparent px-0 py-2 text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                className="mt-2 w-full border-0 border-b border-bg-border bg-transparent px-0 py-2 text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary">
                Role
              </label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as AdminRole)}
                className="mt-2 w-full border-0 border-b border-bg-border bg-transparent px-0 py-2 text-text-primary outline-none transition-colors focus:border-accent [&>option]:bg-bg-panel"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="w-full rounded-md border border-bg-border px-4 py-3 font-medium text-text-secondary transition-colors hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-3 font-medium text-white transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {!isSubmitting && <UserPlus size={15} strokeWidth={1.75} />}
                {isSubmitting ? "Adding…" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete account"
        message={`Delete ${deleteTarget?.name} (${deleteTarget?.email})? This can't be undone.`}
        isLoading={isDeletingOne}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default Employees;