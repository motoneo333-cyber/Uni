import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseCloze } from "@/lib/cloze";

// Formato esperado, una tarjeta por línea:
//   pregunta | respuesta
//   pregunta | respuesta | tag1,tag2
//   concepto con [[hueco]] | | tag1,tag2   (respuesta opcional, se arma sola)
export async function POST(request: Request) {
  const body = await request.json();
  const subjectId = String(body.subjectId ?? "");
  const text = String(body.text ?? "");

  if (!subjectId || !text.trim()) {
    return NextResponse.json(
      { error: "subjectId y text son obligatorios" },
      { status: 400 }
    );
  }

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) {
    return NextResponse.json({ error: "Materia no encontrada" }, { status: 404 });
  }

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows = lines
    .map((line) => {
      const parts = line.split("|").map((p) => p.trim());
      const [frontRaw, backRaw, tagsRaw] = parts;
      if (!frontRaw) return null;
      const cloze = parseCloze(frontRaw);
      const front = cloze ? cloze.front : frontRaw;
      const back = cloze ? backRaw || cloze.answers.join(", ") : backRaw;
      if (!front || !back) return null;
      const tags = tagsRaw
        ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
      return {
        subjectId,
        front,
        back,
        tags,
        ...(cloze ? { clozeAnswers: cloze.answers } : {}),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No se encontraron líneas válidas (formato: pregunta | respuesta)" },
      { status: 400 }
    );
  }

  await prisma.card.createMany({ data: rows });
  return NextResponse.json({ created: rows.length }, { status: 201 });
}
