import "dotenv/config";
import { PrismaClient, Campo } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type SubjectSeed = {
  name: string;
  year: number;
  quarter: number;
  campo: Campo;
  order: number;
};

// Plan de estudios 2025 - Licenciatura en Kinesiología y Fisiatría (UNAHUR).
const subjects: SubjectSeed[] = [
  // 1° año - 1er cuatrimestre
  { name: "Cultura y alfabetización digital en la universidad", year: 1, quarter: 1, campo: "CFC", order: 1 },
  { name: "Anátomo-Fisiología I", year: 1, quarter: 1, campo: "CFB", order: 2 },
  { name: "Introducción a la Salud Comunitaria", year: 1, quarter: 1, campo: "CFB", order: 3 },
  { name: "Fundamentos de la Kinesiología y Fisiatría", year: 1, quarter: 1, campo: "CFE", order: 4 },
  { name: "Desarrollo de las Capacidades Funcionales", year: 1, quarter: 1, campo: "CFE", order: 5 },
  // 1° año - 2do cuatrimestre
  { name: "Anátomo-Fisiología II", year: 1, quarter: 2, campo: "CFB", order: 6 },
  { name: "Salud Comunitaria I", year: 1, quarter: 2, campo: "CFB", order: 7 },
  { name: "Antropología", year: 1, quarter: 2, campo: "CFB", order: 8 },
  { name: "Valoración Funcional I", year: 1, quarter: 2, campo: "CFE", order: 9 },
  { name: "Comunicación en Salud", year: 1, quarter: 2, campo: "CFE", order: 10 },
  // 2° año - 1er cuatrimestre
  { name: "Salud Comunitaria II", year: 2, quarter: 1, campo: "CFB", order: 11 },
  { name: "Aptitud Física y Ejercicio Saludable", year: 2, quarter: 1, campo: "CFE", order: 12 },
  { name: "Valoración Funcional II", year: 2, quarter: 1, campo: "CFE", order: 13 },
  { name: "Bases y Fundamentos del Diagnóstico en Salud", year: 2, quarter: 1, campo: "CFE", order: 14 },
  { name: "Práctica Kinefisiátrica I", year: 2, quarter: 1, campo: "CIC", order: 15 },
  // 2° año - 2do cuatrimestre
  { name: "Introducción a la Nutrición", year: 2, quarter: 2, campo: "CFB", order: 16 },
  { name: "Salud Comunitaria III", year: 2, quarter: 2, campo: "CFB", order: 17 },
  { name: "Fisiopatología", year: 2, quarter: 2, campo: "CFE", order: 18 },
  { name: "Valoración Funcional III", year: 2, quarter: 2, campo: "CFE", order: 19 },
  { name: "Práctica Kinefisiátrica II", year: 2, quarter: 2, campo: "CIC", order: 20 },
  // 3° año - 1er cuatrimestre
  { name: "Salud Comunitaria IV", year: 3, quarter: 1, campo: "CFB", order: 21 },
  { name: "Ateneo Clínico I", year: 3, quarter: 1, campo: "CFE", order: 22 },
  { name: "Farmacología", year: 3, quarter: 1, campo: "CFB", order: 23 },
  { name: "Psicología", year: 3, quarter: 1, campo: "CFB", order: 24 },
  { name: "Historia Sociosanitaria de la Salud", year: 3, quarter: 1, campo: "CFB", order: 25 },
  // 3° año - 2do cuatrimestre
  { name: "Valoración Funcional IV", year: 3, quarter: 2, campo: "CFE", order: 26 },
  { name: "Kinefisiatría I", year: 3, quarter: 2, campo: "CFE", order: 27 },
  { name: "Ateneo Clínico II", year: 3, quarter: 2, campo: "CFE", order: 28 },
  { name: "Kinefisiatría II", year: 3, quarter: 2, campo: "CFE", order: 29 },
  { name: "Práctica Kinefisiátrica III", year: 3, quarter: 2, campo: "CIC", order: 30 },
  // 4° año - 1er cuatrimestre
  { name: "Salud Comunitaria V", year: 4, quarter: 1, campo: "CFB", order: 31 },
  { name: "Deontología y aspectos legales del ejercicio profesional de la Kinesiología y Fisiatría", year: 4, quarter: 1, campo: "CFE", order: 32 },
  { name: "Asignatura UNAHUR", year: 4, quarter: 1, campo: "CFC", order: 33 },
  { name: "Kinefisiatría III", year: 4, quarter: 1, campo: "CFE", order: 34 },
  { name: "Terapéutica Kinésica Cardio-Respiratoria", year: 4, quarter: 1, campo: "CFE", order: 35 },
  { name: "Práctica Kinefisiátrica IV", year: 4, quarter: 1, campo: "CIC", order: 36 },
  // 4° año - 2do cuatrimestre
  { name: "Ética y Desarrollo Profesional", year: 4, quarter: 2, campo: "CFB", order: 37 },
  { name: "Práctica Kinefisiátrica V", year: 4, quarter: 2, campo: "CIC", order: 38 },
  { name: "Kinefisiatría IV", year: 4, quarter: 2, campo: "CFE", order: 39 },
  { name: "Kinesiología y Fisiatría Laboral y Ergonomía", year: 4, quarter: 2, campo: "CFE", order: 40 },
  { name: "Práctica comunitaria en kinesiología", year: 4, quarter: 2, campo: "CIC", order: 41 },
  // Actividades Curriculares Acreditables (electivas / transversales)
  { name: "Actividades Curriculares Acreditables (ACA)", year: 0, quarter: 0, campo: "ACA", order: 42 },
];

// Tarjetas de ejemplo para arrancar 1er año - el resto se agrega desde la app.
const sampleCards: { subjectName: string; front: string; back: string; tags: string[] }[] = [
  {
    subjectName: "Anátomo-Fisiología I",
    front: "¿Cuáles son las capas del tejido conectivo que forman la estructura del músculo esquelético?",
    back: "Endomisio (rodea cada fibra), perimisio (rodea fascículos) y epimisio (rodea el músculo completo).",
    tags: ["aparato locomotor"],
  },
  {
    subjectName: "Anátomo-Fisiología I",
    front: "¿Qué función cumple el surfactante pulmonar?",
    back: "Reduce la tensión superficial en los alvéolos, evitando su colapso al final de la espiración.",
    tags: ["aparato respiratorio"],
  },
  {
    subjectName: "Fundamentos de la Kinesiología y Fisiatría",
    front: "¿Qué diferencia a la Kinefilaxia de la Kinesioterapia?",
    back: "La Kinefilaxia es preventiva (evita la aparición de disfunciones); la Kinesioterapia es terapéutica (trata disfunciones ya instaladas).",
    tags: ["fundamentos"],
  },
  {
    subjectName: "Introducción a la Salud Comunitaria",
    front: "¿Qué es la Atención Primaria de la Salud (APS)?",
    back: "Una estrategia de organización del sistema de salud centrada en el primer nivel de atención, accesible y con participación comunitaria.",
    tags: ["APS"],
  },
  {
    subjectName: "Valoración Funcional I",
    front: "¿Qué mide la goniometría?",
    back: "El rango de movimiento articular (amplitud de movilidad) en grados.",
    tags: ["evaluación"],
  },
];

async function main() {
  for (const s of subjects) {
    await prisma.subject.upsert({
      where: { name: s.name },
      update: { year: s.year, quarter: s.quarter, campo: s.campo, order: s.order },
      create: s,
    });
  }
  console.log(`Materias sembradas: ${subjects.length}`);

  for (const c of sampleCards) {
    const subject = await prisma.subject.findUnique({ where: { name: c.subjectName } });
    if (!subject) continue;
    const exists = await prisma.card.findFirst({
      where: { subjectId: subject.id, front: c.front },
    });
    if (exists) continue;
    await prisma.card.create({
      data: { subjectId: subject.id, front: c.front, back: c.back, tags: c.tags },
    });
  }
  console.log(`Tarjetas de ejemplo verificadas: ${sampleCards.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
