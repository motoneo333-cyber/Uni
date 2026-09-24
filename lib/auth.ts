import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 días

function getSecret(): string {
  const secret = process.env.APP_SECRET;
  if (!secret) {
    throw new Error("Falta la variable de entorno APP_SECRET");
  }
  return secret;
}

function sign(expiry: string): string {
  return createHmac("sha256", getSecret()).update(expiry).digest("hex");
}

export function createSessionToken(): string {
  const expiry = (Date.now() + MAX_AGE_SECONDS * 1000).toString();
  const signature = sign(expiry);
  return `${expiry}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [expiry, signature] = token.split(".");
  if (!expiry || !signature) return false;
  if (Date.now() > Number(expiry)) return false;

  const expected = sign(expiry);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function checkPassword(password: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    throw new Error("Falta la variable de entorno APP_PASSWORD");
  }
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const SESSION_COOKIE = {
  name: COOKIE_NAME,
  maxAge: MAX_AGE_SECONDS,
};
