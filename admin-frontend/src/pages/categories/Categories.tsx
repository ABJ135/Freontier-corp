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
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import RichTextEditor from "../../components/RichTextEditor";

function descriptionPreview(html: string | null | undefined): string {
  if (!html) return "—";
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text || "—";
}

function Categories() {
  const { admin } = useAuthStore();
  const isAdmin = admin?.role === "ADMIN";
  const navigate = useNavigate();

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

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeletingOne, setIsDeletingOne] = useState(false);

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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeletingOne(true);
    setListError(null);

    try {
      await deleteCategory(deleteTarget.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      const message = isAxiosError(err)
        ? err.response?.data?.message ?? "Could not delete category."
        : "Could not delete category.";
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
            Categories
          </h1>
          <p className="mt-1 text-sm text-text-secondary sm:text-[15px]">
            Organize your products into categories.
            {!isAdmin && " Only admins can delete a category."}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => navigate("inactive")}
            className="w-full rounded-md border border-bg-border px-4 py-2 font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary sm:w-auto"
          >
            Inactive categories
          </button>

          {state === 1 && (
            <button
              onClick={() => setstate(2)}
              className="w-full rounded-md bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent-hover active:scale-[0.98] sm:w-auto"
            >
              New category
            </button>
          )}
        </div>
      </div>

      {/* View 1: existing categories */}
      {state === 1 && (
        <>
          {listError && (
            <div className="mt-6 rounded-md border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger sm:mt-8">
              {listError}
            </div>
          )}

          {isLoadingList && (
            <div className="mt-6 py-10 text-center text-sm text-text-muted sm:mt-8">
              Loading categories...
            </div>
          )}

          {!isLoadingList && !listError && categories.length === 0 && (
            <div className="mt-6 rounded-lg border border-dashed border-bg-border px-6 py-14 text-center sm:mt-8">
              <p className="text-sm text-text-muted">No categories yet.</p>
            </div>
          )}

          {!isLoadingList && !listError && categories.length > 0 && (
            <>
              {/* Mobile: stacked cards */}
              <div className="mt-6 flex flex-col gap-3 lg:hidden">
                {categories.map((category) => {
                  const isEditing = editingId === category.id;

                  return (
                    <div
                      key={category.id}
                      className="rounded-lg border border-bg-border bg-bg-panel p-4"
                    >
                      {isEditing ? (
                        <div className="flex flex-col gap-3">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full border-0 border-b border-bg-border bg-transparent px-0 py-1 text-text-primary outline-none focus:border-accent"
                          />
                          <RichTextEditor
                            value={editDescription}
                            onChange={setEditDescription}
                            placeholder="Description"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(category.id)}
                              disabled={isSavingEdit}
                              className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                            >
                              {isSavingEdit ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="rounded-md p-2 text-text-secondary hover:bg-bg-hover"
                              aria-label="Cancel edit"
                            >
                              <X size={16} strokeWidth={1.75} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-text-primary">
                              {category.name}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-text-secondary">
                              {category.slug}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs text-text-secondary">
                              {descriptionPreview(category.description)}
                            </p>
                            <p className="mt-1 text-xs text-text-muted">
                              {category.isActive ? "Active" : "Inactive"}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              onClick={() => startEdit(category)}
                              className="rounded-md p-2 text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                              aria-label={`Edit ${category.name}`}
                            >
                              <Pencil size={16} strokeWidth={1.75} />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => setDeleteTarget(category)}
                                className="rounded-md p-2 text-text-secondary hover:bg-bg-hover hover:text-danger"
                                aria-label={`Delete ${category.name}`}
                              >
                                <Trash2 size={16} strokeWidth={1.75} />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop / tablet: table */}
              <div className="mt-8 hidden overflow-hidden rounded-lg border border-bg-border lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg-panel text-text-secondary">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Slug</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => {
                      const isEditing = editingId === category.id;

                      return (
                        <tr
                          key={category.id}
                          className="border-t border-bg-border align-top text-text-primary"
                        >
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full border-0 border-b border-bg-border bg-transparent px-0 py-1 text-text-primary outline-none focus:border-accent"
                              />
                            ) : (
                              category.name
                            )}
                          </td>
                          <td className="px-4 py-3 text-text-secondary">
                            {category.slug}
                          </td>
                          <td className="px-4 py-3 text-text-secondary">
                            {isEditing ? (
                              <div className="min-w-[280px]">
                                <RichTextEditor
                                  value={editDescription}
                                  onChange={setEditDescription}
                                  placeholder="Description"
                                />
                              </div>
                            ) : (
                              <span className="line-clamp-2">
                                {descriptionPreview(category.description)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-text-secondary">
                            {category.isActive ? "Active" : "Inactive"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => saveEdit(category.id)}
                                    disabled={isSavingEdit}
                                    className="rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-bg-hover disabled:opacity-50"
                                  >
                                    {isSavingEdit ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="rounded-md p-1.5 text-text-secondary hover:bg-bg-hover"
                                    aria-label="Cancel edit"
                                  >
                                    <X size={16} strokeWidth={1.75} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEdit(category)}
                                    className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
                                    aria-label={`Edit ${category.name}`}
                                  >
                                    <Pencil size={16} strokeWidth={1.75} />
                                  </button>
                                  {isAdmin && (
                                    <button
                                      onClick={() => setDeleteTarget(category)}
                                      className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-danger"
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
            </>
          )}
        </>
      )}

      {/* View 2: add category form */}
      {state === 2 && (
        <div className="mt-6 w-full max-w-lg rounded-lg border border-bg-border bg-bg-panel p-4 sm:mt-8 sm:p-6">
          <h2 className="font-[Space_Grotesk] text-lg font-bold text-text-primary">
            Add category
          </h2>

          {formError && (
            <div className="mt-4 rounded-md border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreate} className="mt-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Electronics"
                required
                className="mt-2 w-full border-0 border-b border-bg-border bg-transparent px-0 py-2 text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary">
                Description <span className="text-text-muted">(optional)</span>
              </label>
              <div className="mt-2">
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Short description"
                />
              </div>
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
                className="w-full rounded-md bg-accent px-4 py-3 font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {isSubmitting ? "Adding..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete category"
        message={`Delete category "${deleteTarget?.name}"?`}
        isLoading={isDeletingOne}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default Categories;