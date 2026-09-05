import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { Pencil, Trash2, X } from "lucide-react";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../../services/categoryApi";
import { useAuthStore } from "../../store/authStore";
import type { Category } from "../../types/category";

function Categories() {
  const { admin } = useAuthStore();
  const isAdmin = admin?.role === "ADMIN";

  // 1 = show list view, 2 = show create-category form
  const [state, setstate] = useState(1);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCategories = async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      const message = isAxiosError(err)
        ? err.response?.data?.message ?? "Could not load categories."
        : "Could not load categories.";
      setListError(message);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const resetForm = () => {
    setName("");
    setDescription("");
    setFormError(null);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await createCategory({
        name,
        description: description || undefined,
      });
      resetForm();
      await loadCategories();
      setstate(1); // back to list view after successful create
    } catch (err) {
      const message = isAxiosError(err)
        ? err.response?.data?.message ?? "Could not create category."
        : "Could not create category.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setstate(1);
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDescription(category.description ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  const saveEdit = async (id: string) => {
    setIsSavingEdit(true);
    setListError(null);

    try {
      const updated = await updateCategory(id, {
        name: editName,
        description: editDescription || undefined,
      });
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? updated : c)),
      );
      cancelEdit();
    } catch (err) {
      const message = isAxiosError(err)
        ? err.response?.data?.message ?? "Could not update category."
        : "Could not update category.";
      setListError(message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (category: Category) => {
    const confirmed = window.confirm(`Delete category "${category.name}"?`);
    if (!confirmed) return;

    setDeletingId(category.id);
    setListError(null);

    try {
      await deleteCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    } catch (err) {
      const message = isAxiosError(err)
        ? err.response?.data?.message ?? "Could not delete category."
        : "Could not delete category.";
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
            Categories
          </h1>
          <p className="mt-1 text-sm text-[#9A99A6] sm:text-[15px]">
            Organize your products into categories.
            {!isAdmin && " Only admins can delete a category."}
          </p>
        </div>

        {state === 1 && (
          <button
            onClick={() => setstate(2)}
            className="w-full rounded-md bg-[#3A5CFF] px-4 py-2 font-medium text-[#F4F3F1] transition-transform active:scale-[0.98] sm:w-auto"
          >
            New category
          </button>
        )}
      </div>

      {/* View 1: existing categories table */}
      {state === 1 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[#22222C] sm:mt-8">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#1A1A22] text-[#9A99A6]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoadingList && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[#5C5B66]">
                    Loading categories...
                  </td>
                </tr>
              )}

              {!isLoadingList && listError && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[#FF8A8A]">
                    {listError}
                  </td>
                </tr>
              )}

              {!isLoadingList && !listError && categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[#5C5B66]">
                    No categories yet.
                  </td>
                </tr>
              )}

              {!isLoadingList &&
                !listError &&
                categories.map((category) => {
                  const isEditing = editingId === category.id;

                  return (
                    <tr
                      key={category.id}
                      className="border-t border-[#22222C] text-[#F4F3F1]"
                    >
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full border-0 border-b border-[#2A2A34] bg-transparent px-0 py-1 text-[#F4F3F1] outline-none focus:border-[#3A5CFF]"
                          />
                        ) : (
                          category.name
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#9A99A6]">{category.slug}</td>
                      <td className="px-4 py-3 text-[#9A99A6]">
                        {isEditing ? (
                          <input
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Description"
                            className="w-full border-0 border-b border-[#2A2A34] bg-transparent px-0 py-1 text-[#F4F3F1] outline-none placeholder:text-[#5C5B66] focus:border-[#3A5CFF]"
                          />
                        ) : (
                          category.description ?? "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#9A99A6]">
                        {category.isActive ? "Active" : "Inactive"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEdit(category.id)}
                                disabled={isSavingEdit}
                                className="rounded-md px-2 py-1 text-xs font-medium text-[#3A5CFF] hover:bg-[#22222C] disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="rounded-md p-1.5 text-[#9A99A6] hover:bg-[#22222C]"
                                aria-label="Cancel edit"
                              >
                                <X size={16} strokeWidth={1.75} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(category)}
                                className="rounded-md p-1.5 text-[#9A99A6] transition-colors hover:bg-[#22222C] hover:text-[#F4F3F1]"
                                aria-label={`Edit ${category.name}`}
                              >
                                <Pencil size={16} strokeWidth={1.75} />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDelete(category)}
                                  disabled={deletingId === category.id}
                                  className="rounded-md p-1.5 text-[#9A99A6] transition-colors hover:bg-[#22222C] hover:text-[#FF8A8A] disabled:opacity-50"
                                  aria-label={`Delete ${category.name}`}
                                >
                                  <Trash2 size={16} strokeWidth={1.75} />
                                </button>
                              )}
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
      )}

      {/* View 2: add category form */}
      {state === 2 && (
        <div className="mt-6 w-full max-w-md rounded-lg border border-[#22222C] bg-[#1A1A22] p-4 sm:mt-8 sm:p-6">
          <h2 className="font-[Space_Grotesk] text-lg font-bold text-[#F4F3F1]">
            Add category
          </h2>

          {formError && (
            <div className="mt-4 rounded-md border border-[#3A2226] bg-[#241417] px-4 py-3 text-sm text-[#FF8A8A]">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreate} className="mt-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#9A99A6]">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Electronics"
                required
                className="mt-2 w-full border-0 border-b border-[#2A2A34] bg-transparent px-0 py-2 text-[#F4F3F1] outline-none transition-colors placeholder:text-[#5C5B66] focus:border-[#3A5CFF]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9A99A6]">
                Description <span className="text-[#5C5B66]">(optional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Short description"
                className="mt-2 w-full border-0 border-b border-[#2A2A34] bg-transparent px-0 py-2 text-[#F4F3F1] outline-none transition-colors placeholder:text-[#5C5B66] focus:border-[#3A5CFF]"
              />
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

export default Categories;