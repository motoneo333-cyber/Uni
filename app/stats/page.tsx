import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function getStats() {
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [subjects, dueCounts, reviews, totalCards, relearningCount] = await Promise.all([
    prisma.subject.findMany({
      orderBy: [{ year: "asc" }, { quarter: "asc" }, { order: "asc" }],
      include: { _count: { select: { cards: true } } },
    }),
    prisma.card.groupBy({
      by: ["subjectId"],
      where: { dueDate: { lte: now } },
      _count: { _all: true },
    }),
    prisma.review.findMany({
      where: { reviewedAt: { gte: since30 } },
      select: { grade: true, reviewedAt: true, card: { select: { subjectId: true } } },
    }),
    prisma.card.count(),
    prisma.card.count({ where: { learningStep: { gt: 0 } } }),
  ]);

  const dueBySubject = new Map(dueCounts.map((d) => [d.subjectId, d._count._all]));

  const bySubject = new Map<string, { total: number; correct: number }>();
  for (const r of reviews) {
    const id = r.card.subjectId;
    const entry = bySubject.get(id) ?? { total: 0, correct: 0 };
    entry.total += 1;
    if (r.grade >= 3) entry.correct += 1;
    bySubject.set(id, entry);
  }

  const subjectStats = subjects
    .map((s) => {
      const agg = bySubject.get(s.id);
      return {
        id: s.id,
        name: s.name,
        totalCards: s._count.cards,
        dueCards: dueBySubject.get(s.id) ?? 0,
        reviews30: agg?.total ?? 0,
        accuracy: agg && agg.total > 0 ? Math.round((agg.correct / agg.total) * 100) : null,
      };
    })
    .filter((s) => s.totalCards > 0)
    .sort((a, b) => (a.accuracy ?? 101) - (b.accuracy ?? 101));

  const days: { key: string; label: string; total: number; correct: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({
      key: dayKey(d),
      label: d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
      total: 0,
      correct: 0,
    });
  }
  const dayMap = new Map(days.map((d) => [d.key, d]));
  for (const r of reviews) {
    const entry = dayMap.get(dayKey(r.reviewedAt));
    if (!entry) continue;
    entry.total += 1;
    if (r.grade >= 3) entry.correct += 1;
  }

  const globalTotal = reviews.length;
  const globalCorrect = reviews.filter((r) => r.grade >= 3).length;
  const globalAccuracy = globalTotal > 0 ? Math.round((globalCorrect / globalTotal) * 100) : null;

  return { subjectStats, days, totalCards, relearningCount, globalAccuracy, globalTotal };
}

export default async function StatsPage() {
  const { subjectStats, days, totalCards, relearningCount, globalAccuracy, globalTotal } =
    await getStats();

  const maxDayTotal = Math.max(1, ...days.map((d) => d.total));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Estadísticas
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Últimos 30 días de repasos.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Precisión (30d)"
          value={globalAccuracy === null ? "—" : `${globalAccuracy}%`}
        />
        <StatCard label="Repasos (30d)" value={globalTotal} />
        <StatCard label="Tarjetas totales" value={totalCards} />
        <StatCard label="En reaprendizaje" value={relearningCount} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3 dark:text-zinc-400">
          Actividad (últimos 14 días)
        </h2>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-end justify-between gap-1 h-32">
            {days.map((d) => {
              const barHeight = (d.total / maxDayTotal) * 100;
              const correctHeight = d.total > 0 ? (d.correct / d.total) * 100 : 0;
              return (
                <div key={d.key} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div
                    className="w-full max-w-4 rounded-t-sm bg-zinc-200 relative overflow-hidden dark:bg-zinc-800"
                    style={{ height: `${Math.max(barHeight, d.total > 0 ? 4 : 0)}%` }}
                    title={`${d.label}: ${d.correct}/${d.total} correctas`}
                  >
                    <div
                      className="absolute bottom-0 w-full bg-indigo-600"
                      style={{ height: `${correctHeight}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-zinc-400 dark:text-zinc-500">
            <span>{days[0].label}</span>
            <span>{days[days.length - 1].label}</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3 dark:text-zinc-400">
          Por materia
        </h2>
        {subjectStats.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Todavía no hay tarjetas cargadas.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white overflow-hidden dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {subjectStats.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate dark:text-zinc-100">
                    {s.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {s.totalCards} tarjetas
                    {s.dueCards > 0 && ` · ${s.dueCards} para hoy`}
                    {s.reviews30 > 0 && ` · ${s.reviews30} repasos (30d)`}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold ${
                    s.accuracy === null
                      ? "text-zinc-400 dark:text-zinc-500"
                      : s.accuracy < 70
                        ? "text-red-500 dark:text-red-400"
                        : s.accuracy < 90
                          ? "text-orange-500 dark:text-orange-400"
                          : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {s.accuracy === null ? "sin datos" : `${s.accuracy}%`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-4 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
      <p className="text-xs text-zinc-500 mt-1 dark:text-zinc-400">{label}</p>
    </div>
  );
}
