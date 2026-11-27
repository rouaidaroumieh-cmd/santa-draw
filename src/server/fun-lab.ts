import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { funLabEntries } from "@/db/schema";
import {
  isFunLabGame,
  isFunLabName,
  type FunLabGame,
  type FunLabName,
} from "@/lib/fun-lab-roster";

export type FunLabPublicState = {
  poll: Record<string, string>;
  elfVote: Record<string, string>;
  mostLikely: Record<string, Record<string, string>>;
  mine: {
    poll?: string;
    elfVote?: string;
    mostLikely?: Record<string, string>;
  };
};

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === "string" && isFunLabName(raw)) out[key] = raw;
  }
  return out;
}

export async function loadFunLabState(voter: FunLabName | null): Promise<FunLabPublicState> {
  let rows: (typeof funLabEntries.$inferSelect)[];
  try {
    const db = getDb();
    rows = await db.select().from(funLabEntries);
  } catch (error) {
    console.error("Fun Lab state load failed:", error);
    throw new Error(
      "Fun Lab database is unavailable. Start Postgres (`docker-compose up -d db`) then run `npm run db:push`.",
    );
  }

  const poll: Record<string, string> = {};
  const elfVote: Record<string, string> = {};
  const mostLikely: Record<string, Record<string, string>> = {};

  for (const row of rows) {
    if (row.game === "poll") {
      const v = asString(row.value);
      if (v) poll[row.voterName] = v;
    } else if (row.game === "elf-vote") {
      const v = asString(row.value);
      if (v) elfVote[row.voterName] = v;
    } else if (row.game === "most-likely") {
      mostLikely[row.voterName] = asStringRecord(row.value);
    }
  }

  const mine: FunLabPublicState["mine"] = {};
  if (voter) {
    if (poll[voter]) mine.poll = poll[voter];
    if (elfVote[voter]) mine.elfVote = elfVote[voter];
    mine.mostLikely = mostLikely[voter] ?? {};
  }

  return { poll, elfVote, mostLikely, mine };
}

export async function saveFunLabVote(
  voter: FunLabName,
  game: string,
  value: unknown,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (!isFunLabGame(game)) return { ok: false, error: "Unknown Fun Lab game.", status: 400 };

  const normalized = normalizeValue(game, value);
  if (!normalized.ok) return normalized;

  try {
    const db = getDb();
    await db
      .insert(funLabEntries)
      .values({
        game,
        voterName: voter,
        value: normalized.value,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [funLabEntries.game, funLabEntries.voterName],
        set: { value: normalized.value, updatedAt: new Date() },
      });
  } catch (error) {
    console.error("Fun Lab vote save failed:", error);
    throw new Error(
      "Fun Lab database is unavailable. Start Postgres (`docker-compose up -d db`) then run `npm run db:push`.",
    );
  }

  return { ok: true };
}

function normalizeValue(
  game: FunLabGame,
  value: unknown,
): { ok: true; value: unknown } | { ok: false; error: string; status: number } {
  if (game === "poll" || game === "elf-vote") {
    const v = asString(value);
    if (!v) return { ok: false, error: "Please send a valid choice.", status: 400 };
    return { ok: true, value: v };
  }

  if (game === "most-likely") {
    const record = asStringRecord(value);
    if (Object.keys(record).length === 0) {
      return { ok: false, error: "Please pick a colleague for at least one question.", status: 400 };
    }
    return { ok: true, value: record };
  }

  return { ok: false, error: "Unknown Fun Lab game.", status: 400 };
}

/** Dev helper — clear one voter's rows (unused in UI for now). */
export async function clearFunLabVoter(voter: FunLabName): Promise<void> {
  const db = getDb();
  await db.delete(funLabEntries).where(eq(funLabEntries.voterName, voter));
}
