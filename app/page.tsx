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

async function getData() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [subjects, dueCounts, totalCards, reviewedToday] = await Promise.all([
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
  ]);

  const dueBySubject = new Map(dueCounts.map((d) => [d.subjectId, d._count._all]));
  const totalDue = dueCounts.reduce((sum, d) => sum + d._count._all, 0);

  const byYear = new Map<number, typeof subjects>();
  for (const s of subjects) {
    const list = byYear.get(s.year) ?? [];
    list.push(s);
    byYear.set(s.year, list);
  }

  return { subjects, dueBySubject, totalDue, totalCards, reviewedToday, byYear };
}

export default async function DashboardPage() {
  const { dueBySubject, totalDue, totalCards, reviewedToday, byYear } =
    await getData();

  const years = [...byYear.keys()].sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-3 gap-3">
        <StatCard label="Para hoy" value={totalDue} />
        <StatCard label="Repasadas hoy" value={reviewedToday} />
        <StatCard label="Tarjetas totales" value={totalCards} />
      </section>

      <Link
        href="/study"
        className="block w-full rounded-xl bg-zinc-900 px-4 py-4 text-center text-base font-semibold text-white hover:bg-zinc-800"
      >
        {totalDue > 0 ? `Estudiar ahora (${totalDue})` : "No hay tarjetas pendientes"}
      </Link>

      <div className="space-y-6">
        {years.map((year) => (
          <div key={year}>
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              {year === 0 ? "Actividades Curriculares Acreditables" : `${year}° Año`}
            </h2>
            <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white overflow-hidden">
              {byYear.get(year)!.map((s) => {
                const due = dueBySubject.get(s.id) ?? 0;
                return (
                  <li key={s.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">
                        {s.name}
                      </p>
                      <p className="text-xs text-zinc-500">
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
                        className="text-xs text-zinc-500 hover:text-zinc-900"
                      >
                        Ver
                      </Link>
                      {due > 0 && (
                        <Link
                          href={`/study?subjectId=${s.id}`}
                          className="text-xs font-medium text-zinc-900 hover:underline"
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-4 text-center">
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
    </div>
  );
}
