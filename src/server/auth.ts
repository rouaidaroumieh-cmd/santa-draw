import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "santa_admin";
const SESSION_SECONDS = 60 * 60 * 12;

/** The organiser password. The same value signs the session cookie. */
function adminPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD;
  return value ? value : null;
}

export function isAuthConfigured(): boolean {
  return adminPassword() !== null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("hex");
}

export function verifyPassword(input: string): boolean {
  const expected = adminPassword();
  if (!expected) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function createSessionToken(now = Date.now()): string {
  const key = adminPassword() ?? "";
  const expires = String(now + SESSION_SECONDS * 1000);
  return `${expires}.${sign(expires, key)}`;
}

function isValidSessionToken(token: string | undefined, now = Date.now()): boolean {
  const key = adminPassword();
  if (!key || !token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || !(Number(expires) > now)) return false;
  const given = Buffer.from(signature);
  const expected = Buffer.from(sign(expires, key));
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies();
  return isValidSessionToken(store.get(COOKIE_NAME)?.value);
}

export async function startAdminSession(secure: boolean): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure,
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function endAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}
