import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

  if (!front || !back) {
    return NextResponse.json(
      { error: "front y back son obligatorios" },
      { status: 400 }
    );
  }

  const card = await prisma.card.create({
    data: { subjectId: id, front, back, frontImageUrl, backImageUrl, tags },
  });
  return NextResponse.json(card, { status: 201 });
}
