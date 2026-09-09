import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import {
  AlertTriangle,
  ArrowLeft,
  FolderTree,
  RefreshCw,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  deleteInactiveCategoryById,
  getInactiveCategories,
  purgeAllInactiveCategories,
  restoreInactiveCategoryById,
} from "../../services/categoryApi";
import ConfirmDialog from "../../components/ConfirmDialog";
import type { Category } from "../../types/category";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data;
    if (Array.isArray(data?.message)) return data.message.join(", ");
    return data?.message ?? fallback;
  }
  return fallback;
}

function InactiveCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeletingOne, setIsDeletingOne] = useState(false);
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCategories(await getInactiveCategories());
    } catch (err) {
      setError(extractErrorMessage(err, "Could not load inactive categories."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRestore = async (cat: Category) => {
    setRestoringId(cat.id);
    setError(null);
    try {
      await restoreInactiveCategoryById(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch (err) {
      setError(extractErrorMessage(err, "Could not restore category."));
    } finally {
      setRestoringId(null);
    }
  };

  const confirmDeleteOne = async () => {
    if (!deleteTarget) return;
    setIsDeletingOne(true);
    try {
      await deleteInactiveCategoryById(deleteTarget.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not delete category."));
    } finally {
      setIsDeletingOne(false);
    }
  };

  const confirmPurgeAll = async () => {
    setIsPurging(true);
    try {
      await purgeAllInactiveCategories();
      setCategories([]);
      setShowPurgeDialog(false);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not purge categories."));
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <Link to="/admin/categories" className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary">
        <ArrowLeft size={16} /> Back to Categories
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-[Space_Grotesk] text-2xl font-bold text-text-primary">
              Inactive Categories
            </h1>
            {!isLoading && (
              <span className="rounded-full border border-warning-border bg-warning-bg px-3 py-0.5 text-xs font-bold text-warning">
                {categories.length} archived
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Soft-deleted categories. Restore or permanently remove them.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="rounded-lg border border-bg-border px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover">
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowPurgeDialog(true)}
            disabled={isLoading || categories.length === 0}
            className="flex items-center gap-2 rounded-lg border border-danger-border bg-danger-bg px-4 py-2 text-sm font-semibold text-danger hover:bg-danger hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={15} /> Purge All
          </button>
        </div>
      </div>

      {!isLoading && categories.length > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-warning-border bg-warning-bg px-4 py-3 text-sm text-warning">
          <AlertTriangle size={15} />
          <span><strong>{categories.length} categories</strong> are archived. Purging is permanent and cannot be undone.</span>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {isLoading && (
        <div className="mt-12 flex flex-col items-center py-10 text-text-muted">
          <RefreshCw size={28} className="animate-spin text-accent" />
          <p className="mt-3 text-sm">Loading archived categories...</p>
        </div>
      )}

      {!isLoading && !error && categories.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-bg-border py-16 text-center">
          <FolderTree size={38} className="mx-auto text-text-muted opacity-50" />
          <p className="mt-3 text-sm font-medium text-text-primary">No inactive categories.</p>
          <p className="mt-1 text-xs text-text-secondary">Deleted categories will appear here for recovery.</p>
          <Link to="/admin/categories" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-bg-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-hover">
            <ArrowLeft size={13} /> Back to categories
          </Link>
        </div>
      )}

      {!isLoading && categories.length > 0 && (
        <>
          {/* Mobile cards */}
          <div className="mt-5 flex flex-col gap-3 sm:hidden">
            {categories.map((cat) => (
              <div key={cat.id} className="rounded-xl border border-bg-border bg-bg-panel p-4 opacity-75">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-text-primary">{cat.name}</p>
                    <p className="font-mono text-xs text-text-muted">{cat.slug}</p>
                    {cat.description && (
                      <p className="mt-1 line-clamp-1 text-xs text-text-secondary">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button onClick={() => handleRestore(cat)} disabled={restoringId === cat.id} className="rounded-lg p-2 text-text-secondary hover:bg-success-bg hover:text-success disabled:opacity-40">
                      <RotateCcw size={15} />
                    </button>
                    <button onClick={() => setDeleteTarget(cat)} className="rounded-lg p-2 text-text-secondary hover:bg-danger-bg hover:text-danger">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="mt-5 hidden overflow-hidden rounded-xl border border-bg-border sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-panel text-xs text-text-secondary">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Slug</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-t border-bg-border opacity-70 transition-opacity hover:opacity-100">
                    <td className="px-5 py-3.5 font-semibold text-text-primary">{cat.name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-text-muted">{cat.slug}</td>
                    <td className="px-5 py-3.5 text-xs text-text-secondary">{cat.description ?? "—"}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRestore(cat)}
                          disabled={restoringId === cat.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-success-border bg-success-bg px-3 py-1.5 text-xs font-semibold text-success hover:bg-success hover:text-white disabled:opacity-40"
                        >
                          {restoringId === cat.id ? <RefreshCw size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                          Restore
                        </button>
                        <button onClick={() => setDeleteTarget(cat)} className="rounded-lg border border-danger-border p-1.5 text-danger hover:bg-danger hover:text-white">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Permanently Delete Category"
        message={`Delete "${deleteTarget?.name}" forever? This cannot be undone.`}
        isLoading={isDeletingOne}
        confirmLabel="Delete Permanently"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteOne}
      />
      <ConfirmDialog
        isOpen={showPurgeDialog}
        title="Purge All Inactive Categories"
        message={`Permanently delete all ${categories.length} inactive categories? This cannot be undone.`}
        isLoading={isPurging}
        confirmLabel="Purge All"
        onCancel={() => setShowPurgeDialog(false)}
        onConfirm={confirmPurgeAll}
      />
    </div>
  );
}

export default InactiveCategories;