import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applySm2 } from "@/lib/sm2";

export async function POST(request: Request) {
  const body = await request.json();
  const cardId = String(body.cardId ?? "");
  const grade = Number(body.grade);

  if (!cardId || Number.isNaN(grade) || grade < 0 || grade > 5) {
    return NextResponse.json(
      { error: "cardId y grade (0-5) son obligatorios" },
      { status: 400 }
    );
  }

  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card) {
    return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 });
  }

  const result = applySm2(
    {
      easeFactor: card.easeFactor,
      interval: card.interval,
      repetitions: card.repetitions,
    },
    grade
  );

  const [updated] = await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: {
        easeFactor: result.easeFactor,
        interval: result.interval,
        repetitions: result.repetitions,
        dueDate: result.dueDate,
        lastGrade: grade,
      },
    }),
    prisma.review.create({
      data: {
        cardId,
        grade,
        intervalAfter: result.interval,
        easeFactorAfter: result.easeFactor,
      },
    }),
  ]);

  return NextResponse.json(updated);
}
