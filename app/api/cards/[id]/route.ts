import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";

async function safeDelBlob(url: string | null | undefined) {
  if (!url) return;
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
  } = {};

  if (typeof body.front === "string") data.front = body.front.trim();
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
      await safeDelBlob(previous.frontImageUrl);
    }
    if ("backImageUrl" in data && previous.backImageUrl !== data.backImageUrl) {
      await safeDelBlob(previous.backImageUrl);
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
  await Promise.all([safeDelBlob(card.frontImageUrl), safeDelBlob(card.backImageUrl)]);
  return NextResponse.json({ ok: true });
}
