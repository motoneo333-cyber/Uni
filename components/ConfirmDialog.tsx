"use client";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Eliminar",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
