import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { wishes } from "@/db/schema";
import { ROW_ID, type Outcome } from "./campaign";

const MAX_AUTHOR = 40;
const MAX_MESSAGE = 200;
const MAX_LIST = 200;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface Wish {
  id: string;
  author: string;
  message: string;
  createdAt: string;
}

type WishRow = typeof wishes.$inferSelect;

function toWish(row: WishRow): Wish {
  return { id: row.id, author: row.author, message: row.message, createdAt: row.createdAt.toISOString() };
}

function fail(error: string, status = 400): { ok: false; error: string; status: number } {
  return { ok: false, error, status };
}

export async function approvedWishes(): Promise<Wish[]> {
  const rows = await getDb()
    .select()
    .from(wishes)
    .where(and(eq(wishes.campaignId, ROW_ID), eq(wishes.approved, true)))
    .orderBy(desc(wishes.createdAt))
    .limit(MAX_LIST);
  return rows.map(toWish);
}

export async function pendingWishes(): Promise<Wish[]> {
  const rows = await getDb()
    .select()
    .from(wishes)
    .where(and(eq(wishes.campaignId, ROW_ID), eq(wishes.approved, false)))
    .orderBy(desc(wishes.createdAt))
    .limit(MAX_LIST);
  return rows.map(toWish);
}

export async function addWish(author: unknown, message: unknown): Promise<Outcome> {
  if (typeof author !== "string" || typeof message !== "string") return fail("Please write your name and a message.");
  const name = author.trim();
  const text = message.trim();
  if (!name) return fail("Please enter your name.");
  if (name.length > MAX_AUTHOR) return fail(`Keep your name under ${MAX_AUTHOR} characters.`);
  if (!text) return fail("Please write a short message.");
  if (text.length > MAX_MESSAGE) return fail(`Keep your message under ${MAX_MESSAGE} characters.`);

  await getDb().insert(wishes).values({ campaignId: ROW_ID, author: name, message: text });
  return { ok: true };
}

export async function approveWish(id: unknown): Promise<Outcome> {
  if (typeof id !== "string" || !UUID.test(id)) return fail("Unknown wish.", 404);
  const rows = await getDb()
    .update(wishes)
    .set({ approved: true })
    .where(and(eq(wishes.id, id), eq(wishes.campaignId, ROW_ID)))
    .returning({ id: wishes.id });
  return rows.length > 0 ? { ok: true } : fail("Unknown wish.", 404);
}

export async function deleteWish(id: unknown): Promise<Outcome> {
  if (typeof id !== "string" || !UUID.test(id)) return fail("Unknown wish.", 404);
  const rows = await getDb()
    .delete(wishes)
    .where(and(eq(wishes.id, id), eq(wishes.campaignId, ROW_ID)))
    .returning({ id: wishes.id });
  return rows.length > 0 ? { ok: true } : fail("Unknown wish.", 404);
}
