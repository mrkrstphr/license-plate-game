import { useEffect } from "react";

// ── Alert / error banner ──────────────────────────────────────────────────────
interface AlertProps {
  message: string;
}

export function Alert({ message }: AlertProps) {
  if (!message) return null;
  return (
    <div
      className="rounded-xl px-4 py-2.5 text-sm font-semibold"
      style={{ background: "var(--danger-bg)", color: "var(--danger-text)" }}
    >
      {message}
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "var(--danger-bg)" }}
    >
      <p className="font-black text-sm mb-1" style={{ color: "var(--danger-text)" }}>{title}</p>
      <p className="text-sm mb-4" style={{ color: "var(--danger-text)", opacity: 0.8 }}>{message}</p>
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onCancel}
          className="font-bold rounded-xl py-2.5 text-sm"
          style={{ background: "var(--bg-muted)", color: "var(--text-primary)" }}
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className="font-bold rounded-xl py-2.5 text-sm text-white"
          style={{ background: "var(--danger)" }}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
