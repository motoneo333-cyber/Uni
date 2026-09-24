import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type OcclusionRegion = { x: number; y: number; w: number; h: number; label: string };

function parsePct(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function parseOcclusions(value: unknown): OcclusionRegion[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const regions = value
    .map((r): OcclusionRegion | null => {
      if (!r || typeof r !== "object") return null;
      const label = String((r as Record<string, unknown>).label ?? "").trim();
      if (!label) return null;
      return {
        x: parsePct((r as Record<string, unknown>).x),
        y: parsePct((r as Record<string, unknown>).y),
        w: parsePct((r as Record<string, unknown>).w),
        h: parsePct((r as Record<string, unknown>).h),
        label,
      };
    })
    .filter((r): r is OcclusionRegion => r !== null);
  return regions.length > 0 ? regions : null;
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
  const frontImageUrl = body.frontImageUrl ? String(body.frontImageUrl) : null;
  const backImageUrl = body.backImageUrl ? String(body.backImageUrl) : null;
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
    : [];
  const occlusions = parseOcclusions(body.occlusions);

  // Una tarjeta de oclusión no necesita "back" escrito a mano: se arma solo
  // con las etiquetas de las zonas marcadas.
  const back = occlusions
    ? String(body.back ?? occlusions.map((r) => r.label).join(", ")).trim()
    : String(body.back ?? "").trim();

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
      tags,
    },
  });
  return NextResponse.json(card, { status: 201 });
}
