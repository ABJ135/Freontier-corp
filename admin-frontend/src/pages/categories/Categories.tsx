import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import {
  FolderPlus,
  FolderTree,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  X,
  Check,
  Archive,
  AlertTriangle,
} from "lucide-react";
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

function extractErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data;
    if (Array.isArray(data?.message)) return data.message.join(", ");
    return data?.message ?? fallback;
  }
  return fallback;
}

// 1 = list, 2 = create form
type ViewState = 1 | 2;

function Categories() {
  const { admin } = useAuthStore();
  const isAdmin = admin?.role === "ADMIN";
  const navigate = useNavigate();

  const [viewState, setViewState] = useState<ViewState>(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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
      setCategories(await getCategories());
    } catch (err) {
      setListError(extractErrorMessage(err, "Could not load categories."));
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const resetForm = () => { setName(""); setDescription(""); setFormError(null); };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await createCategory({ name, description: description || undefined });
      resetForm();
      await loadCategories();
      setViewState(1);
    } catch (err) {
      setFormError(extractErrorMessage(err, "Could not create category."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description ?? "");
  };

  const cancelEdit = () => { setEditingId(null); setEditName(""); setEditDescription(""); };

  const saveEdit = async (id: string) => {
    setIsSavingEdit(true);
    setListError(null);
    try {
      const updated = await updateCategory(id, { name: editName, description: editDescription || undefined });
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      cancelEdit();
    } catch (err) {
      setListError(extractErrorMessage(err, "Could not update category."));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeletingOne(true);
    try {
      await deleteCategory(deleteTarget.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setListError(extractErrorMessage(err, "Could not delete category."));
    } finally {
      setIsDeletingOne(false);
    }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-[Space_Grotesk] text-2xl font-bold text-text-primary">
              Categories
            </h1>
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-0.5 text-xs font-bold text-accent">
              {isLoadingList ? "..." : `${categories.length} total`}
            </span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Organize products into browsable collections.
            {!isAdmin && (
              <span className="ml-1 text-text-muted">(Admins can delete categories.)</span>
            )}
          </p>
        </div>

        {viewState === 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("inactive")}
              className="flex items-center gap-2 rounded-lg border border-bg-border px-3.5 py-2 text-sm font-medium text-text-secondary hover:bg-bg-hover"
            >
              <Archive size={15} />
              Inactive
            </button>
            <button
              onClick={loadCategories}
              className="flex items-center gap-2 rounded-lg border border-bg-border px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover"
            >
              <RefreshCw size={15} className={isLoadingList ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setViewState(2)}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover active:scale-[0.98]"
            >
              <FolderPlus size={15} />
              New Category
            </button>
          </div>
        )}
      </div>

      {/* ── Create form ── */}
      {viewState === 2 && (
        <div className="mt-6 w-full max-w-lg rounded-2xl border border-bg-border bg-bg-panel p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-[Space_Grotesk] text-lg font-bold text-text-primary">
              New Category
            </h2>
            <button
              onClick={() => { resetForm(); setViewState(1); }}
              className="rounded-lg p-1.5 text-text-muted hover:bg-bg-hover hover:text-text-primary"
            >
              <X size={18} />
            </button>
          </div>

          {formError && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
              <AlertTriangle size={15} />
              {formError}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Category Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Electronics"
                required
                className="w-full rounded-xl border border-bg-border bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Description <span className="text-text-muted font-normal normal-case">(optional)</span>
              </label>
              <div className="rounded-xl border border-bg-border bg-bg overflow-hidden">
                <RichTextEditor value={description} onChange={setDescription} placeholder="Short description" />
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
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
                className="flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><RefreshCw size={14} className="animate-spin" /> Creating...</>
                ) : (
                  <><FolderPlus size={14} /> Create Category</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── List view ── */}
      {viewState === 1 && (
        <>
          {/* Search */}
          <div className="mt-5 relative max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full rounded-lg border border-bg-border bg-bg-panel py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>

          {listError && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
              <AlertTriangle size={15} /> {listError}
            </div>
          )}

          {isLoadingList && (
            <div className="mt-10 flex flex-col items-center py-10 text-text-muted">
              <RefreshCw size={28} className="animate-spin text-accent" />
              <p className="mt-3 text-sm">Loading categories...</p>
            </div>
          )}

          {!isLoadingList && !listError && filtered.length === 0 && (
            <div className="mt-8 rounded-xl border border-dashed border-bg-border px-6 py-16 text-center">
              <FolderTree size={38} className="mx-auto text-text-muted opacity-50" />
              <p className="mt-3 text-sm font-medium text-text-primary">
                {search ? "No categories match your search." : "No categories yet."}
              </p>
            </div>
          )}

          {!isLoadingList && !listError && filtered.length > 0 && (
            <>
              {/* Mobile cards */}
              <div className="mt-5 flex flex-col gap-3 lg:hidden">
                {filtered.map((cat) => {
                  const isEditing = editingId === cat.id;
                  return (
                    <div key={cat.id} className="rounded-xl border border-bg-border bg-bg-panel p-4 transition-all hover:border-accent/20">
                      {isEditing ? (
                        <div className="flex flex-col gap-3">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full rounded-lg border border-accent bg-bg px-3 py-2 text-sm text-text-primary focus:outline-none"
                          />
                          <div className="rounded-lg border border-bg-border bg-bg overflow-hidden">
                            <RichTextEditor value={editDescription} onChange={setEditDescription} placeholder="Description" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => saveEdit(cat.id)} disabled={isSavingEdit} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                              {isSavingEdit ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                              {isSavingEdit ? "Saving..." : "Save"}
                            </button>
                            <button onClick={cancelEdit} className="rounded-lg border border-bg-border px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover">
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-semibold text-text-primary">{cat.name}</p>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cat.isActive ? "bg-success-bg text-success" : "bg-bg-hover text-text-muted"}`}>
                                {cat.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <p className="mt-0.5 font-mono text-xs text-text-muted">{cat.slug}</p>
                            <p className="mt-1 line-clamp-1 text-xs text-text-secondary">{descriptionPreview(cat.description)}</p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button onClick={() => startEdit(cat)} className="rounded-lg p-2 text-text-secondary hover:bg-accent/10 hover:text-accent">
                              <Pencil size={15} />
                            </button>
                            {isAdmin && (
                              <button onClick={() => setDeleteTarget(cat)} className="rounded-lg p-2 text-text-secondary hover:bg-danger-bg hover:text-danger">
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="mt-5 hidden overflow-hidden rounded-xl border border-bg-border lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg-panel text-xs text-text-secondary">
                    <tr>
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Slug</th>
                      <th className="px-5 py-3 font-medium">Description</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((cat) => {
                      const isEditing = editingId === cat.id;
                      return (
                        <tr key={cat.id} className="border-t border-bg-border align-top transition-colors hover:bg-bg-hover/30">
                          <td className="px-5 py-3.5">
                            {isEditing ? (
                              <input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full rounded-lg border border-accent bg-bg px-3 py-1.5 text-sm text-text-primary focus:outline-none"
                              />
                            ) : (
                              <span className="font-semibold text-text-primary">{cat.name}</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-xs text-text-muted">{cat.slug}</span>
                          </td>
                          <td className="px-5 py-3.5 text-text-secondary">
                            {isEditing ? (
                              <div className="min-w-[280px] rounded-lg border border-bg-border bg-bg overflow-hidden">
                                <RichTextEditor value={editDescription} onChange={setEditDescription} placeholder="Description" />
                              </div>
                            ) : (
                              <span className="line-clamp-2 text-xs">{descriptionPreview(cat.description)}</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${cat.isActive ? "border-success-border bg-success-bg text-success" : "border-bg-border bg-bg-hover text-text-muted"}`}>
                              {cat.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-1">
                              {isEditing ? (
                                <>
                                  <button onClick={() => saveEdit(cat.id)} disabled={isSavingEdit} className="inline-flex items-center gap-1 rounded-lg border border-success-border bg-success-bg px-3 py-1.5 text-xs font-semibold text-success hover:bg-success hover:text-white disabled:opacity-50">
                                    {isSavingEdit ? <RefreshCw size={11} className="animate-spin" /> : <Check size={11} />}
                                    {isSavingEdit ? "Saving..." : "Save"}
                                  </button>
                                  <button onClick={cancelEdit} className="rounded-lg p-1.5 text-text-secondary hover:bg-bg-hover">
                                    <X size={16} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEdit(cat)} className="rounded-lg p-1.5 text-text-secondary hover:bg-accent/10 hover:text-accent">
                                    <Pencil size={15} />
                                  </button>
                                  {isAdmin && (
                                    <button onClick={() => setDeleteTarget(cat)} className="rounded-lg p-1.5 text-text-secondary hover:bg-danger-bg hover:text-danger">
                                      <Trash2 size={15} />
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

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? This will move it to inactive categories.`}
        isLoading={isDeletingOne}
        confirmLabel="Delete Category"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default Categories;