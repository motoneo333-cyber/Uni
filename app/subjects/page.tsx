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

export default async function SubjectsPage() {
  const subjects = await prisma.subject.findMany({
    orderBy: [{ year: "asc" }, { quarter: "asc" }, { order: "asc" }],
    include: { _count: { select: { cards: true } } },
  });

  const byYear = new Map<number, typeof subjects>();
  for (const s of subjects) {
    const list = byYear.get(s.year) ?? [];
    list.push(s);
    byYear.set(s.year, list);
  }
  const years = [...byYear.keys()].sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Materias</h1>
      {years.map((year) => (
        <div key={year}>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-2 dark:text-zinc-400">
            {year === 0 ? "Actividades Curriculares Acreditables" : `${year}° Año`}
          </h2>
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white overflow-hidden dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {byYear.get(year)!.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/subjects/${s.id}`}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate dark:text-zinc-100">
                      {s.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {CAMPO_LABEL[s.campo]}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500 shrink-0 dark:text-zinc-400">
                    {s._count.cards} tarjetas
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
