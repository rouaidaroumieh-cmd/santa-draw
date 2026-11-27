import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { funLabEntries } from "@/db/schema";
import {
  challengeOfTheDay,
  isFunLabChallengeId,
  type FunLabChallengeId,
} from "@/lib/fun-lab-challenges";
import {
  MOST_LIKELY_QUESTIONS,
  POLL_OPTIONS,
  type FunLabPublicResults,
} from "@/lib/fun-lab-games";
import {
  FUN_LAB_ROSTER,
  isFunLabGame,
  isFunLabName,
  type FunLabGame,
  type FunLabName,
} from "@/lib/fun-lab-roster";

export type FunLabPublicState = {
  poll: Record<string, string>;
  elfVote: Record<string, string>;
  mostLikely: Record<string, Record<string, string>>;
  challenge: { id: FunLabChallengeId; joined: string[]; done: string[] };
  mine: {
    poll?: string;
    elfVote?: string;
    mostLikely?: Record<string, string>;
    challenge?: { id: FunLabChallengeId; joined: boolean; done: boolean };
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

function asChallengeProgress(
  value: unknown,
): { id: FunLabChallengeId; joined: boolean; done: boolean } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const obj = value as Record<string, unknown>;
  if (!isFunLabChallengeId(obj.id)) return null;
  const joined = Boolean(obj.joined);
  const done = Boolean(obj.done);
  return { id: obj.id, joined: joined || done, done };
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

  const todayId = challengeOfTheDay();
  const poll: Record<string, string> = {};
  const elfVote: Record<string, string> = {};
  const mostLikely: Record<string, Record<string, string>> = {};
  const joined: string[] = [];
  const done: string[] = [];
  let mineChallenge: FunLabPublicState["mine"]["challenge"];

  for (const row of rows) {
    if (row.game === "poll") {
      const v = asString(row.value);
      if (v) poll[row.voterName] = v;
    } else if (row.game === "elf-vote") {
      const v = asString(row.value);
      if (v) elfVote[row.voterName] = v;
    } else if (row.game === "most-likely") {
      mostLikely[row.voterName] = asStringRecord(row.value);
    } else if (row.game === "challenge") {
      const progress = asChallengeProgress(row.value);
      if (!progress) continue;
      if (row.voterName === voter) mineChallenge = progress;
      if (progress.id !== todayId) continue;
      if (progress.joined) joined.push(row.voterName);
      if (progress.done) done.push(row.voterName);
    }
  }

  const mine: FunLabPublicState["mine"] = {};
  if (voter) {
    if (poll[voter]) mine.poll = poll[voter];
    if (elfVote[voter]) mine.elfVote = elfVote[voter];
    mine.mostLikely = mostLikely[voter] ?? {};
    if (mineChallenge) mine.challenge = mineChallenge;
  }

  return {
    poll,
    elfVote,
    mostLikely,
    challenge: { id: todayId, joined, done },
    mine,
  };
}

export async function saveFunLabVote(
  voter: FunLabName,
  game: string,
  value: unknown,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (!isFunLabGame(game)) return { ok: false, error: "Unknown Fun Lab game.", status: 400 };

  const normalized = normalizeValue(game, value);
  if (!normalized.ok) return normalized;

  // Elf costume vote is one-shot: once cast, it stays locked.
  if (game === "elf-vote") {
    try {
      const db = getDb();
      const existing = await db
        .select({ value: funLabEntries.value })
        .from(funLabEntries)
        .where(and(eq(funLabEntries.game, game), eq(funLabEntries.voterName, voter)))
        .limit(1);
      if (existing.length > 0) {
        return { ok: false, error: "Your elf vote is locked and cannot be changed.", status: 409 };
      }
    } catch (error) {
      console.error("Fun Lab vote lock check failed:", error);
      throw new Error(
        "Fun Lab database is unavailable. Start Postgres (`docker-compose up -d db`) then run `npm run db:push`.",
      );
    }
  }

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

  if (game === "challenge") {
    const progress = asChallengeProgress(value);
    if (!progress) {
      return { ok: false, error: "Please send challenge progress as JSON.", status: 400 };
    }
    if (progress.id !== challengeOfTheDay()) {
      return { ok: false, error: "This challenge is not active today.", status: 400 };
    }
    return { ok: true, value: progress };
  }

  return { ok: false, error: "Unknown Fun Lab game.", status: 400 };
}

/** Aggregated Fun Lab results for the public home widgets (no voter identities). */
export async function loadFunLabPublicResults(): Promise<FunLabPublicResults> {
  const state = await loadFunLabState(null);

  const pollCounts = Object.fromEntries(POLL_OPTIONS.map((o) => [o.id, 0])) as Record<string, number>;
  for (const optionId of Object.values(state.poll)) {
    if (optionId in pollCounts) pollCounts[optionId] += 1;
  }
  const pollTotal = Object.values(pollCounts).reduce((a, b) => a + b, 0);

  const elfCounts = Object.fromEntries(FUN_LAB_ROSTER.map((p) => [p.name, 0])) as Record<string, number>;
  for (const name of Object.values(state.elfVote)) {
    if (name in elfCounts) elfCounts[name] += 1;
  }
  const elfTotal = Object.keys(state.elfVote).length;
  const podium = [...FUN_LAB_ROSTER]
    .map((p) => ({ name: p.name, photo: p.photo, count: elfCounts[p.name] }))
    .sort((a, b) => b.count - a.count)
    .filter((p) => p.count > 0)
    .slice(0, 3);

  const mostLikely = MOST_LIKELY_QUESTIONS.map((q) => {
    const counts = Object.fromEntries(FUN_LAB_ROSTER.map((p) => [p.name, 0])) as Record<string, number>;
    for (const picks of Object.values(state.mostLikely)) {
      const chosen = picks[q.id];
      if (chosen && chosen in counts) counts[chosen] += 1;
    }
    const ranked = [...FUN_LAB_ROSTER]
      .map((p) => ({ name: p.name, photo: p.photo, count: counts[p.name] }))
      .sort((a, b) => b.count - a.count);
    const total = ranked.reduce((sum, row) => sum + row.count, 0);
    const leader = ranked[0] && ranked[0].count > 0 ? ranked[0] : null;
    return { id: q.id, labelKey: q.labelKey, total, leader };
  });

  return {
    poll: {
      total: pollTotal,
      options: POLL_OPTIONS.map((o) => ({
        id: o.id,
        labelKey: o.labelKey,
        count: pollCounts[o.id],
        pct: pollTotal === 0 ? 0 : Math.round((pollCounts[o.id] / pollTotal) * 100),
      })),
    },
    elfVote: { total: elfTotal, podium },
    mostLikely: { questions: mostLikely },
  };
}

/** Dev helper — clear one voter's rows (unused in UI for now). */
export async function clearFunLabVoter(voter: FunLabName): Promise<void> {
  const db = getDb();
  await db.delete(funLabEntries).where(eq(funLabEntries.voterName, voter));
}
