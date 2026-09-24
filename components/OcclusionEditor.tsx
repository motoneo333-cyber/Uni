"use client";

import { useRef, useState } from "react";

type Region = { label: string; x: number; y: number; w: number; h: number };
type DragBox = { x0: number; y0: number; x1: number; y1: number };
type PendingBox = { x: number; y: number; w: number; h: number };

export default function OcclusionEditor({
  subjectId,
  onCreated,
}: {
  subjectId: string;
  onCreated: () => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [drag, setDrag] = useState<DragBox | null>(null);
  const [pending, setPending] = useState<PendingBox | null>(null);
  const [question, setQuestion] = useState("¿Qué estructura es cada zona marcada?");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      let data: { url?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        // respuesta no-JSON, data.error queda undefined y se usa el fallback
      }
      if (!res.ok || !data.url) {
        setUploadError(data.error ?? `No se pudo subir la imagen (error ${res.status})`);
        return;
      }
      setImageUrl(data.url);
      setRegions([]);
    } catch {
      setUploadError("No se pudo conectar con el servidor.");
    } finally {
      setUploading(false);
    }
  }

  function pointFromEvent(e: React.MouseEvent) {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) };
  }

  function onMouseDown(e: React.MouseEvent) {
    if (!imageUrl) return;
    const p = pointFromEvent(e);
    setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
    setPending(null);
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!drag) return;
    const p = pointFromEvent(e);
    setDrag((d) => (d ? { ...d, x1: p.x, y1: p.y } : d));
  }

  function onMouseUp() {
    if (!drag) return;
    const x = Math.min(drag.x0, drag.x1);
    const y = Math.min(drag.y0, drag.y1);
    const w = Math.abs(drag.x1 - drag.x0);
    const h = Math.abs(drag.y1 - drag.y0);
    setDrag(null);
    if (w < 2 || h < 2) return; // ignora clicks/arrastres accidentales
    setPending({ x, y, w, h });
    setLabel("");
  }

  function addRegion(e: React.FormEvent) {
    e.preventDefault();
    if (!pending || !label.trim()) return;
    setRegions((r) => [...r, { ...pending, label: label.trim() }]);
    setPending(null);
    setLabel("");
  }

  function removeRegion(index: number) {
    setRegions((r) => r.filter((_, i) => i !== index));
  }

  async function saveCard() {
    if (!imageUrl || regions.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/subjects/${subjectId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          front: question.trim() || "¿Qué estructura es cada zona marcada?",
          frontImageUrl: imageUrl,
          occlusions: regions,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.error ?? "No se pudo guardar la tarjeta");
        return;
      }
      setImageUrl(null);
      setRegions([]);
      setQuestion("¿Qué estructura es cada zona marcada?");
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  if (!imageUrl) {
    return (
      <div>
        <p className="text-xs text-zinc-500 mb-2">
          Subí una imagen (ej. un diagrama anatómico) para empezar a marcar zonas. Todas
          las zonas que marques van a quedar juntas en una sola tarjeta.
        </p>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => handleUpload(e.target.files?.[0])}
          disabled={uploading}
          className="text-xs text-zinc-600"
        />
        {uploading && <p className="text-xs text-zinc-400 mt-1">Subiendo...</p>}
        {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">
        Marcá con el mouse (click y arrastrá) cada zona que querés tapar, escribí qué es
        y agregala. Cuando termines todas las zonas de esta imagen, guardá la tarjeta.
      </p>

      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        className="relative w-full select-none cursor-crosshair border border-zinc-300 rounded-md overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- necesita tamaño natural para que el % del recuadro coincida con el mouse */}
        <img
          src={imageUrl}
          alt=""
          className="w-full h-auto block pointer-events-none"
          draggable={false}
        />
        {regions.map((r, i) => (
          <div
            key={i}
            className="absolute border-2 border-emerald-500 bg-emerald-500/20 flex items-center justify-center overflow-hidden"
            style={{ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }}
          >
            <span className="text-[10px] text-emerald-900 font-medium px-0.5 truncate">
              {r.label}
            </span>
          </div>
        ))}
        {drag && (
          <div
            className="absolute border-2 border-dashed border-zinc-500 bg-zinc-500/20"
            style={{
              left: `${Math.min(drag.x0, drag.x1)}%`,
              top: `${Math.min(drag.y0, drag.y1)}%`,
              width: `${Math.abs(drag.x1 - drag.x0)}%`,
              height: `${Math.abs(drag.y1 - drag.y0)}%`,
            }}
          />
        )}
        {pending && (
          <div
            className="absolute border-2 border-orange-500 bg-orange-500/20"
            style={{
              left: `${pending.x}%`,
              top: `${pending.y}%`,
              width: `${pending.w}%`,
              height: `${pending.h}%`,
            }}
          />
        )}
      </div>

      {pending && (
        <form
          onSubmit={addRegion}
          className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3"
        >
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="¿Qué es esta zona?"
            className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!label.trim()}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              Agregar zona
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {regions.length > 0 && (
        <ul className="text-xs text-zinc-600 space-y-1">
          {regions.map((r, i) => (
            <li key={i} className="flex items-center justify-between">
              <span>
                {i + 1}. {r.label}
              </span>
              <button
                type="button"
                onClick={() => removeRegion(i)}
                className="text-red-500 hover:text-red-700"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Pregunta de la tarjeta"
          className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={saveCard}
            disabled={saving || regions.length === 0}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {saving ? "Guardando..." : `Guardar tarjeta (${regions.length} zona${regions.length === 1 ? "" : "s"})`}
          </button>
          <button
            type="button"
            onClick={() => {
              setImageUrl(null);
              setRegions([]);
              setPending(null);
            }}
            className="text-xs text-zinc-500 hover:text-zinc-900"
          >
            Usar otra imagen
          </button>
        </div>
        {saveError && <p className="text-xs text-red-600">{saveError}</p>}
      </div>
    </div>
  );
}
