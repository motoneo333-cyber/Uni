import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { parseCloze } from "@/lib/cloze";

// Varias tarjetas de oclusión pueden compartir la misma imagen (la misma
// frontImageUrl con distintos recuadros), así que antes de borrar un blob
// hay que confirmar que ninguna otra tarjeta lo siga usando.
async function safeDelBlobIfOrphaned(url: string | null | undefined, excludeCardId: string) {
  if (!url) return;
  const stillUsed = await prisma.card.count({
    where: {
      id: { not: excludeCardId },
      OR: [{ frontImageUrl: url }, { backImageUrl: url }],
    },
  });
  if (stillUsed > 0) return;
  try {
    await del(url);
  } catch {
    // La imagen puede no existir más o el storage no estar configurado
    // (p. ej. en desarrollo local); no bloquea la operación principal.
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const data: {
    front?: string;
    back?: string;
    tags?: string[];
    frontImageUrl?: string | null;
    backImageUrl?: string | null;
    clozeAnswers?: string[];
  } = {};

  if (typeof body.front === "string") {
    const cloze = parseCloze(body.front.trim());
    data.front = cloze ? cloze.front : body.front.trim();
    if (cloze) data.clozeAnswers = cloze.answers;
  }
  if (typeof body.back === "string") data.back = body.back.trim();
  if (Array.isArray(body.tags)) {
    data.tags = body.tags.map((t: unknown) => String(t).trim()).filter(Boolean);
  }
  if ("frontImageUrl" in body) data.frontImageUrl = body.frontImageUrl || null;
  if ("backImageUrl" in body) data.backImageUrl = body.backImageUrl || null;

  const previous =
    "frontImageUrl" in data || "backImageUrl" in data
      ? await prisma.card.findUnique({
          where: { id },
          select: { frontImageUrl: true, backImageUrl: true },
        })
      : null;

  const card = await prisma.card.update({ where: { id }, data });

  if (previous) {
    if ("frontImageUrl" in data && previous.frontImageUrl !== data.frontImageUrl) {
      await safeDelBlobIfOrphaned(previous.frontImageUrl, id);
    }
    if ("backImageUrl" in data && previous.backImageUrl !== data.backImageUrl) {
      await safeDelBlobIfOrphaned(previous.backImageUrl, id);
    }
  }

  return NextResponse.json(card);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const card = await prisma.card.delete({ where: { id } });
  await Promise.all([
    safeDelBlobIfOrphaned(card.frontImageUrl, id),
    safeDelBlobIfOrphaned(card.backImageUrl, id),
  ]);
  return NextResponse.json({ ok: true });
}
