"use client";

import { useRef, useState } from "react";

type Region = { label: string; x: number; y: number; w: number; h: number };
type DragBox = { x0: number; y0: number; x1: number; y1: number };
type PendingBox = { x: number; y: number; w: number; h: number };

// Canvas de marcado de zonas sobre una imagen: arrastrás para dibujar un
// recuadro, le ponés nombre y se agrega a `regions`. Lo usan tanto el alta
// de una tarjeta de oclusión nueva (OcclusionEditor) como la edición de
// zonas de una ya existente (CardManager).
export default function OcclusionCanvas({
  imageUrl,
  regions,
  onChange,
}: {
  imageUrl: string;
  regions: Region[];
  onChange: (regions: Region[]) => void;
}) {
  const [drag, setDrag] = useState<DragBox | null>(null);
  const [pending, setPending] = useState<PendingBox | null>(null);
  const [label, setLabel] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  function pointFromEvent(e: React.MouseEvent) {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) };
  }

  function onMouseDown(e: React.MouseEvent) {
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
    onChange([...regions, { ...pending, label: label.trim() }]);
    setPending(null);
    setLabel("");
  }

  function removeRegion(index: number) {
    onChange(regions.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        className="relative w-full select-none cursor-crosshair border border-zinc-300 rounded-md overflow-hidden dark:border-zinc-700"
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
          className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50"
        >
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="¿Qué es esta zona?"
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!label.trim()}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              Agregar zona
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700 dark:text-zinc-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {regions.length > 0 && (
        <ul className="text-xs text-zinc-600 space-y-1 dark:text-zinc-300">
          {regions.map((r, i) => (
            <li key={i} className="flex items-center justify-between">
              <span>
                {i + 1}. {r.label}
              </span>
              <button
                type="button"
                onClick={() => removeRegion(i)}
                className="text-red-500 hover:text-red-700 dark:text-red-400"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
