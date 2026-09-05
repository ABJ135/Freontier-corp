import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { Trash2 } from "lucide-react";
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
} from "../../services/employeeApi";
import type { Admin, AdminRole } from "../../types/auth";

function Employees() {
  // 1 = show list view, 2 = show create-employee form
  const [state, setstate] = useState(1);

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

  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      setstate(1); // back to list view after successful create
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
    setstate(1);
  };

  const handleDelete = async (account: Admin) => {
    const confirmed = window.confirm(
      `Delete ${account.name} (${account.email})? This can't be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(account.id);
    setListError(null);

    try {
      await deleteEmployee(account.id);
      setAccounts((prev) => prev.filter((a) => a.id !== account.id));
    } catch (err) {
      const message = isAxiosError(err)
        ? err.response?.data?.message ?? "Could not delete account."
        : "Could not delete account.";
      setListError(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[Space_Grotesk] text-xl font-bold text-[#F4F3F1] sm:text-2xl">
            Employees
          </h1>
          <p className="mt-1 text-sm text-[#9A99A6] sm:text-[15px]">
            Manage admin and employee accounts for your team.
          </p>
        </div>

        {state === 1 && (
          <button
            onClick={() => setstate(2)}
            className="w-full rounded-md bg-[#3A5CFF] px-4 py-2 font-medium text-[#F4F3F1] transition-transform active:scale-[0.98] sm:w-auto"
          >
            New employee
          </button>
        )}
      </div>

      {/* View 1: existing accounts table */}
      {state === 1 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[#22222C] sm:mt-8">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#1A1A22] text-[#9A99A6]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoadingList && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[#5C5B66]">
                    Loading accounts...
                  </td>
                </tr>
              )}

              {!isLoadingList && listError && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[#FF8A8A]">
                    {listError}
                  </td>
                </tr>
              )}

              {!isLoadingList && !listError && accounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[#5C5B66]">
                    No accounts yet.
                  </td>
                </tr>
              )}

              {!isLoadingList &&
                !listError &&
                accounts.map((account) => (
                  <tr
                    key={account.id}
                    className="border-t border-[#22222C] text-[#F4F3F1]"
                  >
                    <td className="px-4 py-3">{account.name}</td>
                    <td className="px-4 py-3 text-[#9A99A6]">{account.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          account.role === "ADMIN"
                            ? "bg-[#3A5CFF]/15 text-[#8AA5FF]"
                            : "bg-[#22222C] text-[#9A99A6]"
                        }`}
                      >
                        {account.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#9A99A6]">
                      {account.isActive === false ? "Inactive" : "Active"}
                    </td>
                    <td className="px-4 py-3 text-[#9A99A6]">
                      {account.createdAt
                        ? new Date(account.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(account)}
                        disabled={deletingId === account.id}
                        className="rounded-md p-1.5 text-[#9A99A6] transition-colors hover:bg-[#22222C] hover:text-[#FF8A8A] disabled:opacity-50"
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
      )}

      {/* View 2: add account form */}
      {state === 2 && (
        <div className="mt-6 w-full max-w-md rounded-lg border border-[#22222C] bg-[#1A1A22] p-4 sm:mt-8 sm:p-6">
          <h2 className="font-[Space_Grotesk] text-lg font-bold text-[#F4F3F1]">
            Add account
          </h2>

          {formError && (
            <div className="mt-4 rounded-md border border-[#3A2226] bg-[#241417] px-4 py-3 text-sm text-[#FF8A8A]">
              {formError}
            </div>
          )}

          {successMessage && (
            <div className="mt-4 rounded-md border border-[#1F3A2A] bg-[#132018] px-4 py-3 text-sm text-[#8AFFB0]">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#9A99A6]">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Full name"
                required
                className="mt-2 w-full border-0 border-b border-[#2A2A34] bg-transparent px-0 py-2 text-[#F4F3F1] outline-none transition-colors placeholder:text-[#5C5B66] focus:border-[#3A5CFF]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9A99A6]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="account@vikestore.com"
                required
                className="mt-2 w-full border-0 border-b border-[#2A2A34] bg-transparent px-0 py-2 text-[#F4F3F1] outline-none transition-colors placeholder:text-[#5C5B66] focus:border-[#3A5CFF]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9A99A6]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                className="mt-2 w-full border-0 border-b border-[#2A2A34] bg-transparent px-0 py-2 text-[#F4F3F1] outline-none transition-colors placeholder:text-[#5C5B66] focus:border-[#3A5CFF]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9A99A6]">
                Role
              </label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as AdminRole)}
                className="mt-2 w-full border-0 border-b border-[#2A2A34] bg-transparent px-0 py-2 text-[#F4F3F1] outline-none transition-colors focus:border-[#3A5CFF] [&>option]:bg-[#1A1A22]"
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
                className="w-full rounded-md border border-[#2A2A34] px-4 py-3 font-medium text-[#F4F3F1] transition-colors hover:bg-[#22222C] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-[#3A5CFF] px-4 py-3 font-medium text-[#F4F3F1] transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Adding..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Employees;