import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseCloze } from "@/lib/cloze";
import { cleanupOrphanedBlobs } from "@/lib/blobCleanup";
import { parseOcclusions } from "@/lib/occlusion";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cards = await prisma.card.findMany({
    where: { subjectId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(cards);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const rawFront = String(body.front ?? "").trim();
  const frontImageUrl = body.frontImageUrl ? String(body.frontImageUrl) : null;
  const backImageUrl = body.backImageUrl ? String(body.backImageUrl) : null;
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
    : [];
  const occlusions = parseOcclusions(body.occlusions);
  const cloze = occlusions ? null : parseCloze(rawFront);
  const front = cloze ? cloze.front : rawFront;

  // Una tarjeta de oclusión o de concepto con hueco no necesita "back"
  // escrito a mano: se arma solo con las etiquetas/respuestas ocultas.
  const backRaw = typeof body.back === "string" ? body.back.trim() : "";
  const back = occlusions
    ? backRaw || occlusions.map((r) => r.label).join(", ")
    : cloze
      ? backRaw || cloze.answers.join(", ")
      : backRaw;

  if (!front || !back) {
    return NextResponse.json(
      { error: "front y back son obligatorios" },
      { status: 400 }
    );
  }
  if (occlusions && !frontImageUrl) {
    return NextResponse.json(
      { error: "Una tarjeta de oclusión necesita frontImageUrl" },
      { status: 400 }
    );
  }

  const card = await prisma.card.create({
    data: {
      subjectId: id,
      front,
      back,
      frontImageUrl,
      backImageUrl,
      ...(occlusions ? { occlusions } : {}),
      ...(cloze ? { clozeAnswers: cloze.answers } : {}),
      tags,
    },
  });
  return NextResponse.json(card, { status: 201 });
}

// Borra todas las tarjetas de la materia, sin borrar la materia en sí.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cards = await prisma.card.findMany({
    where: { subjectId: id },
    select: { frontImageUrl: true, backImageUrl: true },
  });
  const { count } = await prisma.card.deleteMany({ where: { subjectId: id } });
  await cleanupOrphanedBlobs(cards.flatMap((c) => [c.frontImageUrl, c.backImageUrl]));

  return NextResponse.json({ deleted: count });
}
