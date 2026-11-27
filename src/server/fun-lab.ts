import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { funLabEntries } from "@/db/schema";
import {
  challengeOfTheDay,
  isFunLabChallengeId,
  type FunLabChallengeId,
} from "@/lib/fun-lab-challenges";
import {
  GUESS_ELF_ROUNDS,
  MOST_LIKELY_QUESTIONS,
  POLL_OPTIONS,
  type FunLabPublicResults,
  type FunLabScore,
  type MostLikelyBallot,
} from "@/lib/fun-lab-games";
import { OFFICE_MOVIE_MAX } from "@/lib/office-games/catalog";
import {
  CHRISTMAS_FACTS,
  isFactsBallotComplete,
  sanitizeFactsPicks,
} from "@/lib/office-games/christmas-facts";
import { PERSONALITIES, type PersonalityId } from "@/lib/office-games/horoscope";
import { maxSackScore } from "@/lib/office-games/santa-sack";
import {
  FUN_LAB_ROSTER,
  isFunLabGame,
  isFunLabName,
  type FunLabGame,
  type FunLabName,
} from "@/lib/fun-lab-roster";

const HIGHER_SCORE_GAMES = [
  "guess-elf",
  "og-movie",
  "og-sack",
  "og-wheel",
] as const;

type HigherScoreGame = (typeof HIGHER_SCORE_GAMES)[number];

function isHigherScoreGame(game: string): game is HigherScoreGame {
  return (HIGHER_SCORE_GAMES as readonly string[]).includes(game);
}

export type HoroscopeBallot = { personality: PersonalityId };

export type FunLabPublicState = {
  poll: Record<string, string>;
  elfVote: Record<string, string>;
  mostLikely: Record<string, MostLikelyBallot>;
  memoryMatch: Record<string, FunLabScore>;
  guessElf: Record<string, FunLabScore>;
  officeFacts: Record<string, MostLikelyBallot>;
  officeMovie: Record<string, FunLabScore>;
  officeSack: Record<string, FunLabScore>;
  officeWheel: Record<string, FunLabScore>;
  officeHoroscope: Record<string, HoroscopeBallot>;
  challenge: { id: FunLabChallengeId; joined: string[]; done: string[] };
  mine: {
    poll?: string;
    elfVote?: string;
    mostLikely?: MostLikelyBallot;
    memoryMatch?: FunLabScore;
    guessElf?: FunLabScore;
    officeFacts?: MostLikelyBallot;
    officeMovie?: FunLabScore;
    officeSack?: FunLabScore;
    officeWheel?: FunLabScore;
    officeHoroscope?: HoroscopeBallot;
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

function isFinishedFlag(value: unknown): boolean {
  return value === true || value === 1 || value === "true" || value === "1";
}

/** Accepts `{ picks, finished }` or legacy flat name maps. */
function asMostLikelyBallot(value: unknown): MostLikelyBallot {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { picks: {}, finished: false };
  }
  const obj = value as Record<string, unknown>;
  if (obj.picks && typeof obj.picks === "object" && !Array.isArray(obj.picks)) {
    return { picks: asStringRecord(obj.picks), finished: isFinishedFlag(obj.finished) };
  }
  return { picks: asStringRecord(value), finished: isFinishedFlag(obj.finished) };
}

function asScore(value: unknown): FunLabScore | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const best = (value as { best?: unknown }).best;
  if (typeof best !== "number" || !Number.isFinite(best) || best < 0) return null;
  return { best: Math.floor(best) };
}

function asHoroscopeBallot(value: unknown): HoroscopeBallot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const personality = (value as { personality?: unknown }).personality;
  if (typeof personality !== "string" || !(personality in PERSONALITIES)) return null;
  return { personality: personality as PersonalityId };
}

function leadersFromScores(
  scores: Record<string, FunLabScore>,
  higherIsBetter: boolean,
): { name: string; photo: string; value: number }[] {
  return Object.entries(scores)
    .map(([name, score]) => ({
      name,
      photo: rosterPhoto(name),
      value: score.best,
    }))
    .sort((a, b) => (higherIsBetter ? b.value - a.value : a.value - b.value));
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

function rosterPhoto(name: string): string {
  return FUN_LAB_ROSTER.find((p) => p.name === name)?.photo ?? "";
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
  const mostLikely: Record<string, MostLikelyBallot> = {};
  const memoryMatch: Record<string, FunLabScore> = {};
  const guessElf: Record<string, FunLabScore> = {};
  const officeFacts: Record<string, MostLikelyBallot> = {};
  const officeMovie: Record<string, FunLabScore> = {};
  const officeSack: Record<string, FunLabScore> = {};
  const officeWheel: Record<string, FunLabScore> = {};
  const officeHoroscope: Record<string, HoroscopeBallot> = {};
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
      mostLikely[row.voterName] = asMostLikelyBallot(row.value);
    } else if (row.game === "memory-match") {
      const score = asScore(row.value);
      if (score) memoryMatch[row.voterName] = score;
    } else if (row.game === "guess-elf") {
      const score = asScore(row.value);
      if (score) guessElf[row.voterName] = score;
    } else if (row.game === "og-facts") {
      // Ignore legacy score payloads — ballot votes only.
      const raw = row.value;
      if (raw && typeof raw === "object" && !Array.isArray(raw) && "best" in (raw as object)) {
        continue;
      }
      officeFacts[row.voterName] = asMostLikelyBallot(raw);
    } else if (row.game === "og-movie") {
      const score = asScore(row.value);
      if (score) officeMovie[row.voterName] = score;
    } else if (row.game === "og-sack") {
      const score = asScore(row.value);
      if (score) officeSack[row.voterName] = score;
    } else if (row.game === "og-wheel") {
      const score = asScore(row.value);
      if (score) officeWheel[row.voterName] = score;
    } else if (row.game === "og-horoscope") {
      const ballot = asHoroscopeBallot(row.value);
      if (ballot) officeHoroscope[row.voterName] = ballot;
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
    mine.mostLikely = mostLikely[voter] ?? { picks: {}, finished: false };
    if (memoryMatch[voter]) mine.memoryMatch = memoryMatch[voter];
    if (guessElf[voter]) mine.guessElf = guessElf[voter];
    mine.officeFacts = officeFacts[voter] ?? { picks: {}, finished: false };
    if (officeMovie[voter]) mine.officeMovie = officeMovie[voter];
    if (officeSack[voter]) mine.officeSack = officeSack[voter];
    if (officeWheel[voter]) mine.officeWheel = officeWheel[voter];
    if (officeHoroscope[voter]) mine.officeHoroscope = officeHoroscope[voter];
    if (mineChallenge) mine.challenge = mineChallenge;
  }

  return {
    poll,
    elfVote,
    mostLikely,
    memoryMatch,
    guessElf,
    officeFacts,
    officeMovie,
    officeSack,
    officeWheel,
    officeHoroscope,
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

  try {
    const db = getDb();
    const existing = await db
      .select({ value: funLabEntries.value })
      .from(funLabEntries)
      .where(and(eq(funLabEntries.game, game), eq(funLabEntries.voterName, voter)))
      .limit(1);

    // Poll + elf costume: one-shot. Most likely: locked after Finish.
    if (game === "poll" && existing.length > 0) {
      return { ok: false, error: "Your poll vote is locked and cannot be changed.", status: 409 };
    }
    if (game === "elf-vote" && existing.length > 0) {
      return { ok: false, error: "Your elf vote is locked and cannot be changed.", status: 409 };
    }
    if (game === "og-horoscope" && existing.length > 0) {
      return {
        ok: false,
        error: "Your Christmas character is locked — one reveal only.",
        status: 409,
      };
    }
    if (game === "most-likely" && existing.length > 0) {
      const prior = asMostLikelyBallot(existing[0].value);
      if (prior.finished) {
        return {
          ok: false,
          error: "Your “most likely” answers are locked and cannot be changed.",
          status: 409,
        };
      }
    }
    if (game === "og-facts" && existing.length > 0) {
      const prior = asMostLikelyBallot(existing[0].value);
      if (prior.finished) {
        return {
          ok: false,
          error: "Your Christmas fact votes are locked and cannot be changed.",
          status: 409,
        };
      }
    }

    // Scores: keep personal best only (memory = fewer moves; others = higher score).
    let toStore = normalized.value;
    if (game === "memory-match" || isHigherScoreGame(game)) {
      const incoming = asScore(normalized.value);
      if (!incoming) return { ok: false, error: "Please send a valid score.", status: 400 };
      const prior = existing.length > 0 ? asScore(existing[0].value) : null;
      if (game === "memory-match" && prior && prior.best <= incoming.best) {
        return { ok: true };
      }
      if (isHigherScoreGame(game) && prior && prior.best >= incoming.best) {
        return { ok: true };
      }
      toStore = incoming;
    }
    // Horoscope: first reveal only (lock enforced above).
    if (game === "og-horoscope") {
      const ballot = asHoroscopeBallot(normalized.value);
      if (!ballot) return { ok: false, error: "Please send a valid personality.", status: 400 };
      toStore = ballot;
    }

    await db
      .insert(funLabEntries)
      .values({
        game,
        voterName: voter,
        value: toStore,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [funLabEntries.game, funLabEntries.voterName],
        set: { value: toStore, updatedAt: new Date() },
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
  if (game === "poll") {
    const v = asString(value);
    if (!v || !POLL_OPTIONS.some((o) => o.id === v)) {
      return { ok: false, error: "Please send a valid choice.", status: 400 };
    }
    return { ok: true, value: v };
  }

  if (game === "elf-vote") {
    const v = asString(value);
    if (!v || !isFunLabName(v)) {
      return { ok: false, error: "Please send a valid choice.", status: 400 };
    }
    return { ok: true, value: v };
  }

  if (game === "most-likely") {
    const ballot = asMostLikelyBallot(value);
    if (Object.keys(ballot.picks).length === 0) {
      return { ok: false, error: "Please pick a colleague for at least one question.", status: 400 };
    }
    // Once finished, never accept another payload for this voter (lock is enforced above too).
    if (ballot.finished) {
      const complete = MOST_LIKELY_QUESTIONS.every((q) => Boolean(ballot.picks[q.id]));
      if (!complete) {
        return {
          ok: false,
          error: "Answer every question before finishing.",
          status: 400,
        };
      }
      // Normalize to a strict locked ballot.
      return {
        ok: true,
        value: { picks: ballot.picks, finished: true as const },
      };
    }
    return { ok: true, value: { picks: ballot.picks, finished: false as const } };
  }

  if (game === "memory-match") {
    const score = asScore(value);
    if (!score || score.best < 1) {
      return { ok: false, error: "Please send a valid score.", status: 400 };
    }
    return { ok: true, value: score };
  }

  if (game === "guess-elf") {
    const score = asScore(value);
    if (!score || score.best > GUESS_ELF_ROUNDS) {
      return { ok: false, error: "Please send a valid score.", status: 400 };
    }
    return { ok: true, value: score };
  }

  if (game === "og-facts") {
    const ballot = asMostLikelyBallot(value);
    const picks = sanitizeFactsPicks(ballot.picks);
    if (Object.keys(picks).length === 0) {
      return { ok: false, error: "Please vote on at least one fact.", status: 400 };
    }
    if (ballot.finished) {
      if (!isFactsBallotComplete(picks)) {
        return {
          ok: false,
          error: "Vote on every fact before finishing.",
          status: 400,
        };
      }
      return { ok: true, value: { picks, finished: true as const } };
    }
    return { ok: true, value: { picks, finished: false as const } };
  }

  if (game === "og-movie") {
    const score = asScore(value);
    if (!score || score.best > OFFICE_MOVIE_MAX) {
      return { ok: false, error: "Please send a valid score.", status: 400 };
    }
    return { ok: true, value: score };
  }

  if (game === "og-sack") {
    const score = asScore(value);
    if (!score || score.best > maxSackScore()) {
      return { ok: false, error: "Please send a valid score.", status: 400 };
    }
    return { ok: true, value: score };
  }

  if (game === "og-wheel") {
    const score = asScore(value);
    if (!score || score.best < 1) {
      return { ok: false, error: "Please send a valid score.", status: 400 };
    }
    return { ok: true, value: score };
  }

  if (game === "og-horoscope") {
    const ballot = asHoroscopeBallot(value);
    if (!ballot) return { ok: false, error: "Please send a valid personality.", status: 400 };
    return { ok: true, value: ballot };
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
  const elfRanked = [...FUN_LAB_ROSTER]
    .map((p) => ({ name: p.name, photo: p.photo, count: elfCounts[p.name] }))
    .sort((a, b) => b.count - a.count)
    .filter((p) => p.count > 0);

  const mostLikely = MOST_LIKELY_QUESTIONS.map((q) => {
    const counts = Object.fromEntries(FUN_LAB_ROSTER.map((p) => [p.name, 0])) as Record<string, number>;
    for (const ballot of Object.values(state.mostLikely)) {
      if (!ballot.finished) continue;
      const chosen = ballot.picks[q.id];
      if (chosen && chosen in counts) counts[chosen] += 1;
    }
    const ranked = [...FUN_LAB_ROSTER]
      .map((p) => ({ name: p.name, photo: p.photo, count: counts[p.name] }))
      .sort((a, b) => b.count - a.count)
      .filter((p) => p.count > 0);
    const total = ranked.reduce((sum, row) => sum + row.count, 0);
    return { id: q.id, labelKey: q.labelKey, total, ranked };
  });

  const memoryLeaders = leadersFromScores(state.memoryMatch, false);
  const guessLeaders = leadersFromScores(state.guessElf, true);
  const factsFinished = Object.values(state.officeFacts).filter((b) => b.finished).length;
  const officeFacts = CHRISTMAS_FACTS.map((fact) => {
    const counts = Object.fromEntries(FUN_LAB_ROSTER.map((p) => [p.name, 0])) as Record<
      string,
      number
    >;
    for (const ballot of Object.values(state.officeFacts)) {
      if (!ballot.finished) continue;
      const chosen = ballot.picks[fact.id];
      if (chosen && chosen in counts) counts[chosen] += 1;
    }
    const ranked = [...FUN_LAB_ROSTER]
      .map((p) => ({
        name: p.name,
        photo: p.photo,
        count: counts[p.name] ?? 0,
      }))
      .sort((a, b) => b.count - a.count)
      .filter((p) => p.count > 0);
    const total = ranked.reduce((sum, row) => sum + row.count, 0);
    return { id: fact.id, fact: fact.fact, total, ranked };
  });
  const movieLeaders = leadersFromScores(state.officeMovie, true);
  const sackLeaders = leadersFromScores(state.officeSack, true);
  const wheelLeaders = leadersFromScores(state.officeWheel, true);

  const horoscopeCounts = Object.fromEntries(
    Object.keys(PERSONALITIES).map((id) => [id, 0]),
  ) as Record<PersonalityId, number>;
  for (const ballot of Object.values(state.officeHoroscope)) {
    horoscopeCounts[ballot.personality] += 1;
  }
  const horoscopePersonalities = (Object.keys(PERSONALITIES) as PersonalityId[])
    .map((id) => ({
      id,
      titleKey: PERSONALITIES[id].title,
      count: horoscopeCounts[id],
    }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);

  const horoscopeRoster = Object.entries(state.officeHoroscope)
    .map(([name, ballot]) => ({
      name,
      photo: rosterPhoto(name),
      personalityId: ballot.personality,
      titleKey: PERSONALITIES[ballot.personality].title,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

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
    elfVote: { total: elfTotal, ranked: elfRanked },
    mostLikely: { questions: mostLikely },
    memoryMatch: { total: Object.keys(state.memoryMatch).length, leaders: memoryLeaders },
    guessElf: {
      total: Object.keys(state.guessElf).length,
      max: GUESS_ELF_ROUNDS,
      leaders: guessLeaders,
    },
    officeFacts: {
      total: factsFinished,
      facts: officeFacts,
    },
    officeMovie: {
      total: Object.keys(state.officeMovie).length,
      max: OFFICE_MOVIE_MAX,
      leaders: movieLeaders,
    },
    officeSack: {
      total: Object.keys(state.officeSack).length,
      max: maxSackScore(),
      leaders: sackLeaders,
    },
    officeWheel: {
      total: Object.keys(state.officeWheel).length,
      leaders: wheelLeaders,
    },
    officeHoroscope: {
      total: Object.keys(state.officeHoroscope).length,
      personalities: horoscopePersonalities,
      roster: horoscopeRoster,
    },
  };
}

/**
 * Clear one voter's Fun Lab / Games rows.
 * Pass `game` to wipe a single activity; omit it to wipe everything for that person.
 */
export async function clearFunLabVoter(
  voter: FunLabName,
  game?: FunLabGame,
): Promise<{ ok: true; deleted: number }> {
  const db = getDb();
  const removed = game
    ? await db
        .delete(funLabEntries)
        .where(and(eq(funLabEntries.voterName, voter), eq(funLabEntries.game, game)))
        .returning({ game: funLabEntries.game })
    : await db
        .delete(funLabEntries)
        .where(eq(funLabEntries.voterName, voter))
        .returning({ game: funLabEntries.game });
  return { ok: true, deleted: removed.length };
}

/**
 * Wipe every Fun Lab vote and Games score:
 * poll, elf-vote, most-likely, christmas facts, memory, guess-elf,
 * og-movie / sack / wheel / horoscope, challenge progress.
 */
export async function clearAllFunLabEntries(): Promise<{ ok: true; deleted: number }> {
  const db = getDb();
  const removed = await db.delete(funLabEntries).returning({
    game: funLabEntries.game,
    voterName: funLabEntries.voterName,
  });
  return { ok: true, deleted: removed.length };
}
