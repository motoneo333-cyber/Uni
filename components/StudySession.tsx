"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type StudyCard = {
  id: string;
  front: string;
  back: string;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  occX: number | null;
  occY: number | null;
  occW: number | null;
  occH: number | null;
  tags: string[];
  subjectId: string;
  subjectName: string;
};

const GRADES: { grade: number; label: string; className: string }[] = [
  { grade: 1, label: "De nuevo", className: "bg-red-500 hover:bg-red-600" },
  { grade: 3, label: "Difícil", className: "bg-orange-500 hover:bg-orange-600" },
  { grade: 4, label: "Bien", className: "bg-green-600 hover:bg-green-700" },
  { grade: 5, label: "Fácil", className: "bg-blue-600 hover:bg-blue-700" },
];

export default function StudySession() {
  const searchParams = useSearchParams();
  const subjectId = searchParams.get("subjectId") ?? undefined;

  const [card, setCard] = useState<StudyCard | null>(null);
  const [dueCount, setDueCount] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewedInSession, setReviewedInSession] = useState(0);

  const loadNext = useCallback(async () => {
    setLoading(true);
    setRevealed(false);
    const qs = subjectId ? `?subjectId=${subjectId}` : "";
    const res = await fetch(`/api/study/next${qs}`);
    const data = await res.json();
    setCard(data.card);
    setDueCount(data.dueCount);
    setLoading(false);
  }, [subjectId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de la próxima tarjeta
    loadNext();
  }, [loadNext]);

  async function grade(g: number) {
    if (!card) return;
    await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: card.id, grade: g }),
    });
    setReviewedInSession((n) => n + 1);
    loadNext();
  }

  if (loading && !card) {
    return <p className="text-sm text-zinc-500">Cargando...</p>;
  }

  if (!card) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-lg font-medium text-zinc-900">
          {reviewedInSession > 0
            ? `¡Listo! Repasaste ${reviewedInSession} tarjeta${reviewedInSession === 1 ? "" : "s"}.`
            : "No hay tarjetas pendientes por ahora."}
        </p>
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const isOcclusion = card.occW != null && card.occH != null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{card.subjectName}</span>
        <span>Quedan {dueCount}</span>
      </div>

      <div className="min-h-[220px] rounded-xl border border-zinc-200 bg-white p-6 flex items-center justify-center text-center">
        <div className="w-full">
          {isOcclusion && card.frontImageUrl ? (
            <div className="relative mx-auto mb-3 w-full">
              {/* eslint-disable-next-line @next/next/no-img-element -- necesita tamaño natural sin letterboxing para que el recuadro coincida en % */}
              <img src={card.frontImageUrl} alt="" className="w-full h-auto block rounded-md" />
              <div
                className={`absolute ${revealed ? "border-2 border-emerald-500 bg-transparent" : "bg-zinc-800"}`}
                style={{
                  left: `${card.occX}%`,
                  top: `${card.occY}%`,
                  width: `${card.occW}%`,
                  height: `${card.occH}%`,
                }}
              />
            </div>
          ) : (
            card.frontImageUrl && (
              <div className="relative mx-auto mb-3 h-48 w-full">
                <Image
                  src={card.frontImageUrl}
                  alt=""
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
            )
          )}
          <p className="text-base text-zinc-900 whitespace-pre-wrap">{card.front}</p>
          {revealed && (
            <>
              <hr className="my-4 border-zinc-200" />
              {!isOcclusion && card.backImageUrl && (
                <div className="relative mx-auto mb-3 h-48 w-full">
                  <Image
                    src={card.backImageUrl}
                    alt=""
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              )}
              <p className="text-base text-zinc-700 whitespace-pre-wrap">{card.back}</p>
            </>
          )}
        </div>
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Mostrar respuesta
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {GRADES.map((g) => (
            <button
              key={g.grade}
              onClick={() => grade(g.grade)}
              className={`rounded-xl px-2 py-3 text-xs font-semibold text-white ${g.className}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
