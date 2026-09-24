import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const subjects = await prisma.subject.findMany({
    orderBy: [{ year: "asc" }, { quarter: "asc" }, { order: "asc" }],
    include: {
      _count: { select: { cards: true } },
    },
  });

  const now = new Date();
  const dueCounts = await prisma.card.groupBy({
    by: ["subjectId"],
    where: { dueDate: { lte: now } },
    _count: { _all: true },
  });
  const dueBySubject = new Map(dueCounts.map((d) => [d.subjectId, d._count._all]));

  const result = subjects.map((s) => ({
    id: s.id,
    name: s.name,
    year: s.year,
    quarter: s.quarter,
    campo: s.campo,
    totalCards: s._count.cards,
    dueCards: dueBySubject.get(s.id) ?? 0,
  }));

  return NextResponse.json(result);
}
