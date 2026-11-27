import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { FUN_LAB_NAMES, isFunLabName, type FunLabName } from "@/lib/fun-lab-roster";

const COOKIE_NAME = "santa_funlab";
const SESSION_SECONDS = 60 * 60 * 24 * 30; // whole campaign window

function pinSecret(): string | null {
  return process.env.FUN_LAB_PIN_SECRET || process.env.ADMIN_PASSWORD || null;
}

/** Stable 4-digit PIN per person for the whole campaign. */
export function pinForName(name: string): string | null {
  const secret = pinSecret();
  if (!secret) return null;
  const digest = createHmac("sha256", secret).update(name.trim().toLowerCase()).digest("hex");
  const n = Number.parseInt(digest.slice(0, 8), 16) % 10000;
  return String(n).padStart(4, "0");
}

export function listFunLabPins(): { name: FunLabName; pin: string }[] | null {
  if (!pinSecret()) return null;
  return FUN_LAB_NAMES.map((name) => ({ name, pin: pinForName(name)! }));
}

export function verifyFunLabPin(name: string, pin: string): boolean {
  if (!isFunLabName(name)) return false;
  const expected = pinForName(name);
  if (!expected) return false;
  const a = Buffer.from(String(pin).trim().padStart(4, "0"));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("hex");
}

function createSessionToken(name: FunLabName, now = Date.now()): string | null {
  const key = pinSecret();
  if (!key) return null;
  const expires = String(now + SESSION_SECONDS * 1000);
  const body = `${name}|${expires}`;
  return `${body}.${sign(body, key)}`;
}

function readSessionToken(token: string | undefined, now = Date.now()): FunLabName | null {
  const key = pinSecret();
  if (!key || !token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const [name, expires] = body.split("|");
  if (!name || !expires || !isFunLabName(name) || !(Number(expires) > now)) return null;
  const given = Buffer.from(signature);
  const expected = Buffer.from(sign(body, key));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return name;
}

export async function getFunLabSessionName(): Promise<FunLabName | null> {
  const store = await cookies();
  return readSessionToken(store.get(COOKIE_NAME)?.value);
}

export async function startFunLabSession(name: FunLabName, secure: boolean): Promise<boolean> {
  const token = createSessionToken(name);
  if (!token) return false;
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  return true;
}

export async function endFunLabSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export function isFunLabAuthConfigured(): boolean {
  return pinSecret() !== null;
}
