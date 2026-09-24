import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import CardManager from "@/components/CardManager";

export const dynamic = "force-dynamic";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subject = await prisma.subject.findUnique({ where: { id } });
  if (!subject) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link href="/subjects" className="text-xs text-zinc-500 hover:underline">
          ← Materias
        </Link>
        <h1 className="text-lg font-semibold text-zinc-900 mt-1">{subject.name}</h1>
      </div>
      <CardManager subjectId={subject.id} />
    </div>
  );
}
