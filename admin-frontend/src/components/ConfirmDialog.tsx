import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  isLoading?: boolean;
  confirmLabel?: string;
  variant?: "danger" | "warning";
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  isLoading = false,
  confirmLabel,
  variant = "danger",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === "danger";
  const label = confirmLabel ?? (isDanger ? "Yes, delete" : "Confirm");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={!isLoading ? onCancel : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm animate-[slideUp_0.18s_ease-out] rounded-2xl border border-bg-border bg-bg-panel shadow-2xl"
        style={{ animationName: "fadeScaleIn" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-bg-border px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isDanger ? "bg-danger-bg" : "bg-warning-bg"
              }`}
            >
              <AlertTriangle
                size={18}
                className={isDanger ? "text-danger" : "text-warning"}
                strokeWidth={2}
              />
            </div>
            <h2 className="font-[Space_Grotesk] text-base font-bold text-text-primary">
              {title}
            </h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="shrink-0 rounded-lg p-1.5 text-text-muted hover:bg-bg-hover hover:text-text-primary disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-sm leading-relaxed text-text-secondary">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-bg-border px-6 py-4 sm:flex-row sm:justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl border border-bg-border px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-hover disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${
              isDanger
                ? "bg-danger hover:bg-danger/90"
                : "bg-warning hover:bg-warning/90"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Processing...
              </span>
            ) : (
              label
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;