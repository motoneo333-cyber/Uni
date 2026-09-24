"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { splitClozeFront } from "@/lib/cloze";

type OcclusionRegion = { x: number; y: number; w: number; h: number; label: string };

type StudyCard = {
  id: string;
  front: string;
  back: string;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  occlusions: OcclusionRegion[] | null;
  clozeAnswers: string[] | null;
  tags: string[];
  subjectId: string;
  subjectName: string;
};

const GRADES: { grade: number; label: string; className: string; key: string }[] = [
  { grade: 1, label: "De nuevo", className: "bg-red-500 hover:bg-red-600", key: "1" },
  { grade: 3, label: "Difícil", className: "bg-orange-500 hover:bg-orange-600", key: "2" },
  { grade: 4, label: "Bien", className: "bg-green-600 hover:bg-green-700", key: "3" },
  { grade: 5, label: "Fácil", className: "bg-blue-600 hover:bg-blue-700", key: "4" },
];

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || (el as HTMLElement).isContentEditable;
}

export default function StudySession() {
  const searchParams = useSearchParams();
  const subjectId = searchParams.get("subjectId") ?? undefined;

  const [card, setCard] = useState<StudyCard | null>(null);
  const [dueCount, setDueCount] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewedInSession, setReviewedInSession] = useState(0);
  const [guesses, setGuesses] = useState<string[]>([]);

  const loadNext = useCallback(async () => {
    setLoading(true);
    setRevealed(false);
    const qs = subjectId ? `?subjectId=${subjectId}` : "";
    const res = await fetch(`/api/study/next${qs}`);
    const data = await res.json();
    setCard(data.card);
    setDueCount(data.dueCount);
    const blankCount = Array.isArray(data.card?.occlusions)
      ? data.card.occlusions.length
      : Array.isArray(data.card?.clozeAnswers)
        ? data.card.clozeAnswers.length
        : 0;
    setGuesses(Array.from({ length: blankCount }, () => ""));
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

  const isOcclusion = Array.isArray(card?.occlusions) && card.occlusions.length > 0;
  const isCloze = Array.isArray(card?.clozeAnswers) && card.clozeAnswers.length > 0;
  const hasTypedBlanks = isOcclusion || isCloze;

  // Atajos de teclado: espacio para revelar (tarjetas simples), 1-4 para calificar.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(document.activeElement)) return;
      if (!card) return;

      if (!revealed) {
        if (!hasTypedBlanks && (e.key === " " || e.key === "Enter")) {
          e.preventDefault();
          setRevealed(true);
        }
        return;
      }

      const match = GRADES.find((g) => g.key === e.key);
      if (match) {
        e.preventDefault();
        grade(match.grade);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, revealed, hasTypedBlanks]);

  if (loading && !card) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-[220px] animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800" />
        <div className="h-12 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          {reviewedInSession > 0
            ? `¡Listo! Repasaste ${reviewedInSession} tarjeta${reviewedInSession === 1 ? "" : "s"}.`
            : "No hay tarjetas pendientes por ahora."}
        </p>
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  const sessionTotal = reviewedInSession + (dueCount ?? 0);
  const progressPct = sessionTotal > 0 ? (reviewedInSession / sessionTotal) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>{card.subjectName}</span>
          <span>Quedan {dueCount}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="min-h-[220px] rounded-xl border border-zinc-200 bg-white p-6 flex items-center justify-center text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="w-full">
          {isOcclusion && card.frontImageUrl ? (
            <div className="relative mx-auto mb-3 w-full">
              {/* eslint-disable-next-line @next/next/no-img-element -- necesita tamaño natural sin letterboxing para que los recuadros coincidan en % */}
              <img src={card.frontImageUrl} alt="" className="w-full h-auto block rounded-md" />
              {card.occlusions!.map((r, i) => {
                const correct = revealed && normalize(guesses[i] ?? "") === normalize(r.label);
                return (
                  <div
                    key={i}
                    className={`absolute flex items-center justify-center overflow-hidden ${
                      revealed
                        ? `border-2 bg-transparent ${correct ? "border-emerald-500" : "border-red-500"}`
                        : "bg-zinc-800"
                    }`}
                    style={{
                      left: `${r.x}%`,
                      top: `${r.y}%`,
                      width: `${r.w}%`,
                      height: `${r.h}%`,
                    }}
                  >
                    {revealed ? (
                      <span
                        className={`text-[10px] font-medium bg-white/80 px-0.5 truncate ${correct ? "text-emerald-900" : "text-red-700"}`}
                      >
                        {i + 1}. {r.label}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-white">{i + 1}</span>
                    )}
                  </div>
                );
              })}
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
          {isCloze ? (
            <p className="text-base text-zinc-900 whitespace-pre-wrap leading-loose dark:text-zinc-100">
              {splitClozeFront(card.front).map((segment, i, arr) => (
                <span key={i}>
                  {segment}
                  {i < arr.length - 1 &&
                    (revealed ? (
                      <span
                        className={`mx-1 rounded px-1.5 py-0.5 font-medium ${
                          normalize(guesses[i] ?? "") === normalize(card.clozeAnswers![i])
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400"
                        }`}
                      >
                        {card.clozeAnswers![i]}
                      </span>
                    ) : (
                      <input
                        value={guesses[i] ?? ""}
                        onChange={(e) =>
                          setGuesses((g) => {
                            const next = [...g];
                            next[i] = e.target.value;
                            return next;
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          const nextInput = document.getElementById(`cloze-guess-${i + 1}`);
                          if (nextInput) nextInput.focus();
                          else setRevealed(true);
                        }}
                        id={`cloze-guess-${i}`}
                        autoFocus={i === 0}
                        size={Math.max(4, (card.clozeAnswers![i] ?? "").length)}
                        className="mx-1 rounded border-b-2 border-indigo-400 bg-transparent px-1 text-center align-baseline text-base outline-none focus:border-indigo-600 dark:text-zinc-100"
                      />
                    ))}
                </span>
              ))}
            </p>
          ) : (
            <p className="text-base text-zinc-900 whitespace-pre-wrap dark:text-zinc-100">
              {card.front}
            </p>
          )}

          {isCloze && revealed && (
            <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {
                card.clozeAnswers!.filter(
                  (a, i) => normalize(guesses[i] ?? "") === normalize(a)
                ).length
              }{" "}
              / {card.clozeAnswers!.length} correctas
            </p>
          )}

          {isOcclusion && !revealed && (
            <div className="mt-4 space-y-2 text-left">
              {card.occlusions!.map((_, i) => (
                <input
                  key={i}
                  value={guesses[i] ?? ""}
                  onChange={(e) =>
                    setGuesses((g) => {
                      const next = [...g];
                      next[i] = e.target.value;
                      return next;
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    const nextInput = document.getElementById(`occ-guess-${i + 1}`);
                    if (nextInput) nextInput.focus();
                    else setRevealed(true);
                  }}
                  id={`occ-guess-${i}`}
                  autoFocus={i === 0}
                  placeholder={`Zona ${i + 1}`}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              ))}
            </div>
          )}

          {isOcclusion && revealed && (
            <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {card.occlusions!.filter(
                (r, i) => normalize(guesses[i] ?? "") === normalize(r.label)
              ).length}{" "}
              / {card.occlusions!.length} correctas
            </p>
          )}

          {revealed && !isOcclusion && !isCloze && (
            <>
              <hr className="my-4 border-zinc-200 dark:border-zinc-800" />
              {card.backImageUrl && (
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
              <p className="text-base text-zinc-700 whitespace-pre-wrap dark:text-zinc-300">
                {card.back}
              </p>
            </>
          )}
        </div>
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          {hasTypedBlanks ? "Corregir" : "Mostrar respuesta"}
          <span className="ml-2 hidden text-indigo-200 sm:inline">
            {hasTypedBlanks ? "" : "(espacio)"}
          </span>
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {GRADES.map((g) => (
            <button
              key={g.grade}
              onClick={() => grade(g.grade)}
              className={`rounded-xl px-2 py-3 text-xs font-semibold text-white transition-colors ${g.className}`}
            >
              {g.label}
              <span className="ml-1 hidden opacity-70 sm:inline">({g.key})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
