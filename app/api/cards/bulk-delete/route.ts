import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cleanupOrphanedBlobs } from "@/lib/blobCleanup";

export async function POST(request: Request) {
  const body = await request.json();
  const ids = Array.isArray(body.ids)
    ? body.ids.map((id: unknown) => String(id)).filter(Boolean)
    : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "ids es obligatorio" }, { status: 400 });
  }

  const cards = await prisma.card.findMany({
    where: { id: { in: ids } },
    select: { frontImageUrl: true, backImageUrl: true },
  });
  const { count } = await prisma.card.deleteMany({ where: { id: { in: ids } } });
  await cleanupOrphanedBlobs(cards.flatMap((c) => [c.frontImageUrl, c.backImageUrl]));

  return NextResponse.json({ deleted: count });
}
