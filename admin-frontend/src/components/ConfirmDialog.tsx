interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  isLoading = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-lg border border-bg-border bg-bg-panel p-6"
      >
        <h2 className="font-[Space_Grotesk] text-lg font-bold text-text-primary">
          {title}
        </h2>
        <p className="mt-2 text-sm text-text-secondary">{message}</p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-md border border-bg-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-md bg-danger px-4 py-2.5 text-sm font-medium text-white transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Deleting..." : "Yes, delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;