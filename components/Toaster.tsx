"use client";

import { useEffect, useState } from "react";
import type { ToastVariant } from "@/lib/toast";

type ToastItem = { id: number; message: string; variant: ToastVariant };

let counter = 0;

const VARIANT_CLASS: Record<ToastVariant, string> = {
  success: "bg-emerald-600",
  error: "bg-red-600",
  info: "bg-zinc-900 dark:bg-zinc-700",
};

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<{ message: string; variant: ToastVariant }>).detail;
      const id = ++counter;
      setToasts((t) => [...t, { id, ...detail }]);
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, 3000);
    }
    window.addEventListener("app:toast", handler);
    return () => window.removeEventListener("app:toast", handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-item rounded-lg px-4 py-2.5 text-center text-sm font-medium text-white shadow-lg ${VARIANT_CLASS[t.variant]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
