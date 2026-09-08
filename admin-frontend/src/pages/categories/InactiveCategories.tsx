import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Undo2, Trash2 } from "lucide-react";
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
            const data = await getInactiveCategories();
            setCategories(data);
        } catch (err) {
            setError(extractErrorMessage(err, "Could not load inactive categories."));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleRestore = async (category: Category) => {
        setRestoringId(category.id);
        setError(null);

        try {
            await restoreInactiveCategoryById(category.id);
            setCategories((prev) => prev.filter((c) => c.id !== category.id));
        } catch (err) {
            setError(extractErrorMessage(err, "Could not restore category."));
        } finally {
            setRestoringId(null);
        }
    };

    const confirmDeleteOne = async () => {
        if (!deleteTarget) return;
        setIsDeletingOne(true);
        setError(null);

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
        setError(null);

        try {
            await purgeAllInactiveCategories();
            setCategories([]);
            setShowPurgeDialog(false);
        } catch (err) {
            setError(extractErrorMessage(err, "Could not delete all categories."));
        } finally {
            setIsPurging(false);
        }
    };

    return (
        <div className="px-4 py-6 sm:px-10 sm:py-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-[Space_Grotesk] text-xl font-bold text-text-primary sm:text-2xl">
                        Inactive Categories
                    </h1>
                    <p className="mt-1 text-sm text-text-secondary sm:text-[15px]">
                        Categories that have been soft-deleted.
                    </p>
                </div>

                <button
                    onClick={() => setShowPurgeDialog(true)}
                    disabled={isLoading || categories.length === 0}
                    className="flex items-center justify-center gap-2 rounded-md border border-danger-border bg-danger-bg px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-bg-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <Trash2 size={16} strokeWidth={1.75} />
                    Delete all
                </button>
            </div>

            {error && (
                <div className="mt-6 rounded-md border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
                    {error}
                </div>
            )}

            {isLoading && (
                <div className="mt-8 py-10 text-center text-sm text-text-muted">
                    Loading inactive categories...
                </div>
            )}

            {!isLoading && !error && categories.length === 0 && (
                <div className="mt-8 rounded-lg border border-dashed border-bg-border px-6 py-14 text-center">
                    <p className="text-sm text-text-muted">No inactive categories.</p>
                </div>
            )}

            {!isLoading && categories.length > 0 && (
                <>
                    {/* Mobile: stacked cards */}
                    <div className="mt-6 flex flex-col gap-3 sm:hidden">
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className="rounded-lg border border-bg-border bg-bg-panel p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-text-primary">
                                            {category.name}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-text-secondary">
                                            {category.slug}
                                        </p>
                                        {category.description && (
                                            <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                                                {category.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1">
                                        <button
                                            onClick={() => handleRestore(category)}
                                            disabled={restoringId === category.id}
                                            className="rounded-md p-2 text-text-secondary hover:bg-bg-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                                            aria-label={`Restore ${category.name}`}
                                        >
                                            <Undo2 size={16} strokeWidth={1.75} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(category)}
                                            className="rounded-md p-2 text-text-secondary hover:bg-bg-hover hover:text-danger"
                                            aria-label={`Delete ${category.name}`}
                                        >
                                            <Trash2 size={16} strokeWidth={1.75} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop / tablet: table */}
                    <div className="mt-6 hidden overflow-hidden rounded-lg border border-bg-border sm:block">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-bg-panel text-text-secondary">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Name</th>
                                    <th className="px-4 py-3 font-medium">Slug</th>
                                    <th className="px-4 py-3 font-medium">Description</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((category) => (
                                    <tr
                                        key={category.id}
                                        className="border-t border-bg-border text-text-primary"
                                    >
                                        <td className="px-4 py-3">{category.name}</td>
                                        <td className="px-4 py-3 text-text-secondary">{category.slug}</td>
                                        <td className="px-4 py-3 text-text-secondary">
                                            {category.description ?? "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleRestore(category)}
                                                    disabled={restoringId === category.id}
                                                    className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                                                    aria-label={`Restore ${category.name}`}
                                                >
                                                    <Undo2 size={16} strokeWidth={1.75} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(category)}
                                                    className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-danger"
                                                    aria-label={`Delete ${category.name}`}
                                                >
                                                    <Trash2 size={16} strokeWidth={1.75} />
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
                title="Delete category"
                message={`Delete "${deleteTarget?.name}" permanently? This can't be undone.`}
                isLoading={isDeletingOne}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={confirmDeleteOne}
            />

            <ConfirmDialog
                isOpen={showPurgeDialog}
                title="Delete all inactive categories"
                message={`Permanently delete all ${categories.length} inactive categories? This can't be undone.`}
                isLoading={isPurging}
                onCancel={() => setShowPurgeDialog(false)}
                onConfirm={confirmPurgeAll}
            />
        </div>
    );
}

export default InactiveCategories;