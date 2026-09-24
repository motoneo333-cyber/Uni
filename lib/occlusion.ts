export type OcclusionRegion = { x: number; y: number; w: number; h: number; label: string };

function parsePct(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

export function parseOcclusions(value: unknown): OcclusionRegion[] | null {
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
