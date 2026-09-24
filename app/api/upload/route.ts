import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

// Vercel limita el body de las funciones serverless a 4.5MB; dejamos margen
// para el overhead de multipart/form-data.
const MAX_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer el archivo (¿es muy pesado?)" },
      { status: 400 }
    );
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato no soportado (usá PNG, JPG, WEBP o GIF)" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "La imagen no puede pesar más de 4MB" },
      { status: 400 }
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "El almacenamiento de imágenes no está configurado (falta conectar Vercel Blob al proyecto)",
      },
      { status: 500 }
    );
  }

  const ext = file.type.split("/")[1];
  const filename = `cards/${crypto.randomUUID()}.${ext}`;

  try {
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Error subiendo a Vercel Blob:", err);
    const detail =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return NextResponse.json(
      { error: `Falló la subida al storage. Detalle: ${detail}` },
      { status: 502 }
    );
  }
}
