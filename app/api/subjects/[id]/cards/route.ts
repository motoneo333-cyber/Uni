import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function parsePct(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, n));
}

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
  const front = String(body.front ?? "").trim();
  const back = String(body.back ?? "").trim();
  const frontImageUrl = body.frontImageUrl ? String(body.frontImageUrl) : null;
  const backImageUrl = body.backImageUrl ? String(body.backImageUrl) : null;
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
    : [];

  const hasOcclusion =
    body.occX != null && body.occY != null && body.occW != null && body.occH != null;
  const occX = hasOcclusion ? parsePct(body.occX) : null;
  const occY = hasOcclusion ? parsePct(body.occY) : null;
  const occW = hasOcclusion ? parsePct(body.occW) : null;
  const occH = hasOcclusion ? parsePct(body.occH) : null;

  if (!front || !back) {
    return NextResponse.json(
      { error: "front y back son obligatorios" },
      { status: 400 }
    );
  }
  if (hasOcclusion && !frontImageUrl) {
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
      occX,
      occY,
      occW,
      occH,
      tags,
    },
  });
  return NextResponse.json(card, { status: 201 });
}
