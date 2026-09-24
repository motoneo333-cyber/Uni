import { NextResponse } from "next/server";
import { checkPassword, createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  let password: string;
  try {
    const body = await request.json();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const token = createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE.name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE.maxAge,
  });
  return response;
}
