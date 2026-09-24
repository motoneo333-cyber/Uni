"use client";

import { useRef, useState } from "react";
import Image from "next/image";

export default function ImagePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (file.size > 4 * 1024 * 1024) {
      setError("La imagen no puede pesar más de 4MB");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });

      let data: { url?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        // El servidor devolvió algo que no es JSON (p. ej. una página de
        // error de la plataforma); igual mostramos un mensaje concreto.
      }

      if (!res.ok || !data.url) {
        setError(data.error ?? `No se pudo subir la imagen (error ${res.status})`);
        return;
      }
      onChange(data.url);
    } catch {
      setError("No se pudo conectar con el servidor. Probá de nuevo.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      {value ? (
        <div className="flex items-center gap-2">
          <div className="relative h-16 w-16 shrink-0 rounded-md border border-zinc-200 overflow-hidden dark:border-zinc-700">
            <Image src={value} alt="" fill unoptimized className="object-cover" />
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400"
          >
            Quitar imagen
          </button>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => handleFile(e.target.files?.[0])}
          disabled={uploading}
          className="text-xs text-zinc-600 dark:text-zinc-300"
        />
      )}
      {uploading && <p className="text-xs text-zinc-400 dark:text-zinc-500">Subiendo...</p>}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
