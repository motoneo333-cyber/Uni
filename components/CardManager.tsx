"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ImagePicker from "./ImagePicker";
import OcclusionEditor from "./OcclusionEditor";

type Card = {
  id: string;
  front: string;
  back: string;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  occW: number | null;
  tags: string[];
  interval: number;
  repetitions: number;
  dueDate: string;
};

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
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [editFrontImageUrl, setEditFrontImageUrl] = useState<string | null>(null);
  const [editBackImageUrl, setEditBackImageUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"simple" | "occlusion">("simple");

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
    if (!front.trim() || !back.trim()) return;
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const res = await fetch(`/api/subjects/${subjectId}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ front, back, frontImageUrl, backImageUrl, tags: tagList }),
    });
    if (res.ok) {
      setFront("");
      setBack("");
      setFrontImageUrl(null);
      setBackImageUrl(null);
      setTags("");
      load();
    }
  }

  async function submitBulk(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch("/api/cards/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, text: bulkText }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(`Se agregaron ${data.created} tarjetas.`);
      setBulkText("");
      load();
    } else {
      setMessage(data.error ?? "Error al importar");
    }
  }

  async function deleteCard(id: string) {
    if (!confirm("¿Eliminar esta tarjeta?")) return;
    await fetch(`/api/cards/${id}`, { method: "DELETE" });
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  function startEdit(card: Card) {
    setEditingId(card.id);
    setEditFront(card.front);
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
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
        <div className="flex gap-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("simple")}
            className={`rounded-md px-3 py-1.5 font-medium ${
              mode === "simple" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
            }`}
          >
            Tarjeta simple
          </button>
          <button
            type="button"
            onClick={() => setMode("occlusion")}
            className={`rounded-md px-3 py-1.5 font-medium ${
              mode === "occlusion" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
            }`}
          >
            Oclusión de imagen
          </button>
        </div>

        {mode === "simple" ? (
          <form onSubmit={addCard} className="space-y-2">
            <textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Pregunta / frente"
              rows={2}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
            <ImagePicker
              label="Imagen del frente (opcional)"
              value={frontImageUrl}
              onChange={setFrontImageUrl}
            />
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Respuesta / dorso"
              rows={2}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
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
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
            >
              Agregar
            </button>
          </form>
        ) : (
          <OcclusionEditor subjectId={subjectId} onCreated={load} />
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <button
          onClick={() => setBulkOpen((v) => !v)}
          className="text-sm font-medium text-zinc-900"
        >
          {bulkOpen ? "▾" : "▸"} Importar varias de una vez
        </button>
        {bulkOpen && (
          <form onSubmit={submitBulk} className="mt-3 space-y-2">
            <p className="text-xs text-zinc-500">
              Una tarjeta por línea, formato: <code>pregunta | respuesta</code> (opcional:{" "}
              <code>| tag1,tag2</code> al final)
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={6}
              placeholder={"¿Qué es X? | Es Y\n¿Otra pregunta? | Otra respuesta | tema1,tema2"}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-500"
            />
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
            >
              Importar
            </button>
            {message && <p className="text-xs text-zinc-600">{message}</p>}
          </form>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-900 mb-2">
          Tarjetas ({cards.length})
        </p>
        {loading ? (
          <p className="text-sm text-zinc-500">Cargando...</p>
        ) : cards.length === 0 ? (
          <p className="text-sm text-zinc-500">Todavía no hay tarjetas.</p>
        ) : (
          <ul className="space-y-2">
            {cards.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-zinc-200 bg-white p-3"
              >
                {editingId === c.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editFront}
                      onChange={(e) => setEditFront(e.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm"
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
                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm"
                    />
                    <ImagePicker
                      label="Imagen del dorso"
                      value={editBackImageUrl}
                      onChange={setEditBackImageUrl}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(c.id)}
                        className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex items-start gap-3">
                      {(c.frontImageUrl || c.backImageUrl) && (
                        <div className="relative h-12 w-12 shrink-0 rounded-md border border-zinc-200 overflow-hidden">
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
                        <p className="text-sm text-zinc-900">
                          {c.occW != null && (
                            <span className="mr-1 rounded bg-emerald-100 px-1 text-[10px] font-medium text-emerald-700">
                              oclusión
                            </span>
                          )}
                          {c.front}
                        </p>
                        <p className="text-sm text-zinc-500">{c.back}</p>
                        <p className="text-xs text-zinc-400 mt-1">
                          {c.repetitions === 0
                            ? "Sin repasar"
                            : `${c.interval}d · vence ${new Date(c.dueDate).toLocaleDateString("es-AR")}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(c)}
                        className="text-xs text-zinc-500 hover:text-zinc-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteCard(c.id)}
                        className="text-xs text-red-500 hover:text-red-700"
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
    </div>
  );
}
