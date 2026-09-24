import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const CAMPO_LABEL: Record<string, string> = {
  CFC: "Formación Común",
  CFB: "Formación Básica",
  CFE: "Formación Específica",
  CIC: "Integración Curricular",
  ACA: "Actividades Acreditables",
};

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function getStreak(): Promise<number> {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 120);
  const reviews = await prisma.review.findMany({
    where: { reviewedAt: { gte: since } },
    select: { reviewedAt: true },
  });
  const days = new Set(reviews.map((r) => dateKey(r.reviewedAt)));

  const cursor = new Date();
  if (!days.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (days.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

async function getData() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [subjects, dueCounts, totalCards, reviewedToday, streak] = await Promise.all([
    prisma.subject.findMany({
      orderBy: [{ year: "asc" }, { quarter: "asc" }, { order: "asc" }],
      include: { _count: { select: { cards: true } } },
    }),
    prisma.card.groupBy({
      by: ["subjectId"],
      where: { dueDate: { lte: now } },
      _count: { _all: true },
    }),
    prisma.card.count(),
    prisma.review.count({ where: { reviewedAt: { gte: startOfDay } } }),
    getStreak(),
  ]);

  const dueBySubject = new Map(dueCounts.map((d) => [d.subjectId, d._count._all]));
  const totalDue = dueCounts.reduce((sum, d) => sum + d._count._all, 0);

  const byYear = new Map<number, typeof subjects>();
  for (const s of subjects) {
    const list = byYear.get(s.year) ?? [];
    list.push(s);
    byYear.set(s.year, list);
  }

  return { subjects, dueBySubject, totalDue, totalCards, reviewedToday, streak, byYear };
}

export default async function DashboardPage() {
  const { dueBySubject, totalDue, totalCards, reviewedToday, streak, byYear } =
    await getData();

  const years = [...byYear.keys()].sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Racha" value={streak} suffix={streak > 0 ? " 🔥" : ""} />
        <StatCard label="Para hoy" value={totalDue} />
        <StatCard label="Repasadas hoy" value={reviewedToday} />
        <StatCard label="Tarjetas totales" value={totalCards} />
      </section>

      <Link
        href="/study"
        className="block w-full rounded-xl bg-indigo-600 px-4 py-4 text-center text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
      >
        {totalDue > 0 ? `Estudiar ahora (${totalDue})` : "No hay tarjetas pendientes"}
      </Link>

      <div className="space-y-6">
        {years.map((year) => (
          <div key={year}>
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-2 dark:text-zinc-400">
              {year === 0 ? "Actividades Curriculares Acreditables" : `${year}° Año`}
            </h2>
            <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white overflow-hidden dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
              {byYear.get(year)!.map((s) => {
                const due = dueBySubject.get(s.id) ?? 0;
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate dark:text-zinc-100">
                        {s.name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {CAMPO_LABEL[s.campo]} · {s._count.cards} tarjetas
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {due > 0 && (
                        <span className="text-xs font-semibold text-white bg-orange-500 rounded-full px-2 py-0.5">
                          {due}
                        </span>
                      )}
                      <Link
                        href={`/subjects/${s.id}`}
                        className="text-xs text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      >
                        Ver
                      </Link>
                      {due > 0 && (
                        <Link
                          href={`/study?subjectId=${s.id}`}
                          className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          Estudiar
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-4 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        {value}
        {suffix}
      </p>
      <p className="text-xs text-zinc-500 mt-1 dark:text-zinc-400">{label}</p>
    </div>
  );
}
