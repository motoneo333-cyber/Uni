"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ImagePicker from "./ImagePicker";
import OcclusionEditor from "./OcclusionEditor";
import ConfirmDialog from "./ConfirmDialog";
import { toast } from "@/lib/toast";
import { renderClozeSource, splitClozeFront } from "@/lib/cloze";

type Card = {
  id: string;
  front: string;
  back: string;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  occlusions: { x: number; y: number; w: number; h: number; label: string }[] | null;
  clozeAnswers: string[] | null;
  tags: string[];
  interval: number;
  repetitions: number;
  dueDate: string;
};

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

export default function CardManager({ subjectId }: { subjectId: string }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [frontImageUrl, setFrontImageUrl] = useState<string | null>(null);
  const [backImageUrl, setBackImageUrl] = useState<string | null>(null);
  const [tags, setTags] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [editFrontImageUrl, setEditFrontImageUrl] = useState<string | null>(null);
  const [editBackImageUrl, setEditBackImageUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"simple" | "cloze" | "occlusion">("simple");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description?: string;
    onConfirm: () => void;
  } | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/subjects/${subjectId}/cards`);
    const data = await res.json();
    setCards(data);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos desde la API
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  async function addCard(e: React.FormEvent) {
    e.preventDefault();
    if (!front.trim()) return;
    if (mode === "simple" && !back.trim()) return;
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const res = await fetch(`/api/subjects/${subjectId}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        front,
        back: back.trim() || undefined,
        frontImageUrl,
        backImageUrl,
        tags: tagList,
      }),
    });
    if (res.ok) {
      setFront("");
      setBack("");
      setFrontImageUrl(null);
      setBackImageUrl(null);
      setTags("");
      toast("Tarjeta agregada", "success");
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      toast(data.error ?? "No se pudo agregar la tarjeta", "error");
    }
  }

  async function submitBulk(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/cards/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, text: bulkText }),
    });
    const data = await res.json();
    if (res.ok) {
      toast(`Se agregaron ${data.created} tarjetas`, "success");
      setBulkText("");
      load();
    } else {
      toast(data.error ?? "Error al importar", "error");
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === cards.length ? new Set() : new Set(cards.map((c) => c.id))
    );
  }

  async function doDeleteSingle(id: string) {
    await fetch(`/api/cards/${id}`, { method: "DELETE" });
    setCards((prev) => prev.filter((c) => c.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    toast("Tarjeta eliminada", "success");
  }

  async function doDeleteSelected() {
    const ids = [...selectedIds];
    const res = await fetch("/api/cards/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      setCards((prev) => prev.filter((c) => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
      toast(`${ids.length} tarjeta${ids.length === 1 ? "" : "s"} eliminada${ids.length === 1 ? "" : "s"}`, "success");
    } else {
      toast("No se pudieron eliminar las tarjetas", "error");
    }
  }

  async function doDeleteAll() {
    const res = await fetch(`/api/subjects/${subjectId}/cards`, { method: "DELETE" });
    if (res.ok) {
      setCards([]);
      setSelectedIds(new Set());
      toast("Se eliminaron todas las tarjetas de la materia", "success");
    } else {
      toast("No se pudieron eliminar las tarjetas", "error");
    }
  }

  function askDeleteSingle(id: string) {
    setConfirmState({
      title: "¿Eliminar esta tarjeta?",
      description: "No se puede deshacer.",
      onConfirm: async () => {
        setConfirmState(null);
        await doDeleteSingle(id);
      },
    });
  }

  function askDeleteSelected() {
    const n = selectedIds.size;
    setConfirmState({
      title: `¿Eliminar ${n} tarjeta${n === 1 ? "" : "s"} seleccionada${n === 1 ? "" : "s"}?`,
      description: "No se puede deshacer.",
      onConfirm: async () => {
        setConfirmState(null);
        await doDeleteSelected();
      },
    });
  }

  function askDeleteAll() {
    setConfirmState({
      title: "¿Eliminar todas las tarjetas de esta materia?",
      description: `Se van a borrar las ${cards.length} tarjetas. La materia queda vacía, pero no se elimina.`,
      onConfirm: async () => {
        setConfirmState(null);
        await doDeleteAll();
      },
    });
  }

  function startEdit(card: Card) {
    setEditingId(card.id);
    setEditFront(
      card.clozeAnswers && card.clozeAnswers.length > 0
        ? renderClozeSource(card.front, card.clozeAnswers)
        : card.front
    );
    setEditBack(card.back);
    setEditFrontImageUrl(card.frontImageUrl);
    setEditBackImageUrl(card.backImageUrl);
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/cards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        front: editFront,
        back: editBack,
        frontImageUrl: editFrontImageUrl,
        backImageUrl: editBackImageUrl,
      }),
    });
    if (res.ok) {
      setEditingId(null);
      toast("Cambios guardados", "success");
      load();
    } else {
      toast("No se pudo guardar", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex gap-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("simple")}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              mode === "simple"
                ? "bg-indigo-600 text-white"
                : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            Tarjeta simple
          </button>
          <button
            type="button"
            onClick={() => setMode("cloze")}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              mode === "cloze"
                ? "bg-indigo-600 text-white"
                : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            Concepto con hueco
          </button>
          <button
            type="button"
            onClick={() => setMode("occlusion")}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              mode === "occlusion"
                ? "bg-indigo-600 text-white"
                : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            Oclusión de imagen
          </button>
        </div>

        {mode === "occlusion" ? (
          <OcclusionEditor subjectId={subjectId} onCreated={load} />
        ) : (
          <form onSubmit={addCard} className="space-y-2">
            {mode === "cloze" && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Escribí el concepto y encerrá entre doble corchete la(s) palabra(s) que
                querés ocultar. Ej: <code>La mitosis tiene [[4]] fases.</code> Podés dejar
                uno o varios huecos en el mismo texto.
              </p>
            )}
            <textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder={
                mode === "cloze"
                  ? "La mitosis tiene [[4]] fases y produce células [[genéticamente idénticas]]."
                  : "Pregunta / frente"
              }
              rows={mode === "cloze" ? 3 : 2}
              className={inputClass}
            />
            <ImagePicker
              label="Imagen del frente (opcional)"
              value={frontImageUrl}
              onChange={setFrontImageUrl}
            />
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder={mode === "cloze" ? "Respuesta manual (opcional)" : "Respuesta / dorso"}
              rows={2}
              className={inputClass}
            />
            <ImagePicker
              label="Imagen del dorso (opcional)"
              value={backImageUrl}
              onChange={setBackImageUrl}
            />
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (opcional, separados por coma)"
              className={inputClass}
            />
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Agregar
            </button>
          </form>
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <button
          onClick={() => setBulkOpen((v) => !v)}
          className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
        >
          {bulkOpen ? "▾" : "▸"} Importar varias de una vez
        </button>
        {bulkOpen && (
          <form onSubmit={submitBulk} className="mt-3 space-y-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Una tarjeta por línea, formato: <code>pregunta | respuesta</code> (opcional:{" "}
              <code>| tag1,tag2</code> al final)
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={6}
              placeholder={"¿Qué es X? | Es Y\n¿Otra pregunta? | Otra respuesta | tema1,tema2"}
              className={`${inputClass} font-mono`}
            />
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Importar
            </button>
          </form>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Tarjetas ({cards.length})
          </p>
          {cards.length > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {selectedIds.size === cards.length ? "Deseleccionar todas" : "Seleccionar todas"}
              </button>
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={askDeleteSelected}
                  className="font-medium text-red-500 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Eliminar seleccionadas ({selectedIds.size})
                </button>
              )}
              <button
                type="button"
                onClick={askDeleteAll}
                className="text-red-500 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Eliminar todas
              </button>
            </div>
          )}
        </div>
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800"
              />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Todavía no hay tarjetas. Agregá la primera arriba.
          </p>
        ) : (
          <ul className="space-y-2">
            {cards.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                {editingId === c.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editFront}
                      onChange={(e) => setEditFront(e.target.value)}
                      rows={2}
                      className={inputClass}
                    />
                    <ImagePicker
                      label="Imagen del frente"
                      value={editFrontImageUrl}
                      onChange={setEditFrontImageUrl}
                    />
                    <textarea
                      value={editBack}
                      onChange={(e) => setEditBack(e.target.value)}
                      rows={2}
                      className={inputClass}
                    />
                    <ImagePicker
                      label="Imagen del dorso"
                      value={editBackImageUrl}
                      onChange={setEditBackImageUrl}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(c.id)}
                        className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:text-zinc-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        className="mt-1.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
                        aria-label="Seleccionar tarjeta"
                      />
                      {(c.frontImageUrl || c.backImageUrl) && (
                        <div className="relative h-12 w-12 shrink-0 rounded-md border border-zinc-200 overflow-hidden dark:border-zinc-700">
                          <Image
                            src={(c.frontImageUrl ?? c.backImageUrl)!}
                            alt=""
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-zinc-900 dark:text-zinc-100">
                          {c.occlusions && c.occlusions.length > 0 && (
                            <span className="mr-1 rounded bg-emerald-100 px-1 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                              oclusión · {c.occlusions.length} zona
                              {c.occlusions.length === 1 ? "" : "s"}
                            </span>
                          )}
                          {c.clozeAnswers && c.clozeAnswers.length > 0 && (
                            <span className="mr-1 rounded bg-indigo-100 px-1 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400">
                              hueco · {c.clozeAnswers.length}
                            </span>
                          )}
                          {c.clozeAnswers && c.clozeAnswers.length > 0
                            ? splitClozeFront(c.front).join("_____")
                            : c.front}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{c.back}</p>
                        <p className="text-xs text-zinc-400 mt-1 dark:text-zinc-500">
                          {c.repetitions === 0
                            ? "Sin repasar"
                            : `${c.interval}d · vence ${new Date(c.dueDate).toLocaleDateString("es-AR")}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(c)}
                        className="text-xs text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => askDeleteSingle(c.id)}
                        className="text-xs text-red-500 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.title ?? ""}
        description={confirmState?.description}
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}
