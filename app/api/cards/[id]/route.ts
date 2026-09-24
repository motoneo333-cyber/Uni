import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const data: { front?: string; back?: string; tags?: string[] } = {};

  if (typeof body.front === "string") data.front = body.front.trim();
  if (typeof body.back === "string") data.back = body.back.trim();
  if (Array.isArray(body.tags)) {
    data.tags = body.tags.map((t: unknown) => String(t).trim()).filter(Boolean);
  }

  const card = await prisma.card.update({ where: { id }, data });
  return NextResponse.json(card);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.card.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
