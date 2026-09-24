import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [totalCards, dueNow, reviewedToday, totalSubjects] = await Promise.all([
    prisma.card.count(),
    prisma.card.count({ where: { dueDate: { lte: now } } }),
    prisma.review.count({ where: { reviewedAt: { gte: startOfDay } } }),
    prisma.subject.count(),
  ]);

  return NextResponse.json({ totalCards, dueNow, reviewedToday, totalSubjects });
}
