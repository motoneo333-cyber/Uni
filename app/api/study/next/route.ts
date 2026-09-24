import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subjectId") ?? undefined;
  const now = new Date();

  const where = {
    dueDate: { lte: now },
    ...(subjectId ? { subjectId } : {}),
  };

  const dueCount = await prisma.card.count({ where });

  if (dueCount === 0) {
    return NextResponse.json({ card: null, dueCount: 0 });
  }

  // Traemos un lote de las tarjetas más vencidas y elegimos una al azar
  // entre ellas para intercalar materias/temas en vez de ir en bloque.
  const pool = await prisma.card.findMany({
    where,
    orderBy: { dueDate: "asc" },
    take: 20,
    include: { subject: { select: { name: true } } },
  });

  const [card] = shuffle(pool);

  return NextResponse.json({
    card: {
      id: card.id,
      front: card.front,
      back: card.back,
      frontImageUrl: card.frontImageUrl,
      backImageUrl: card.backImageUrl,
      occlusions: card.occlusions,
      tags: card.tags,
      subjectId: card.subjectId,
      subjectName: card.subject.name,
    },
    dueCount,
  });
}
