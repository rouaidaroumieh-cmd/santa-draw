/**
 * The draw engine.
 *
 * MATHEMATICAL CONTRACT (non-negotiable):
 *   20 participants × 3 selections = 60 selections
 *   the working days of DRAW_PLAN, with their planned winners, add up to 60
 *   • each participant appears exactly 3 times, on 3 different dates
 *   • no participant appears twice on the same date
 *   • no weekend dates, ever
 *
 * The complete schedule is generated BEFORE the first draw, validated by
 * `validateSchedule()`, and stored. The reveal animation is purely cosmetic —
 * winners are always taken from the pre-generated, validated schedule.
 */
import { DRAW_PLAN, getEligibleDates, isEligibleDate, winnersOn } from "./dates";
import { randomInt, shuffle, weightedPick } from "./random";
import type { CampaignState, DaySchedule, ValidationResult } from "./types";

export const PARTICIPANT_COUNT = 20;
export const SELECTIONS_PER_PARTICIPANT = 3;
export const DRAW_DAY_COUNT = DRAW_PLAN.length; // 17 working days
export const TOTAL_SELECTIONS = PARTICIPANT_COUNT * SELECTIONS_PER_PARTICIPANT; // 60

/**
 * Organiser exceptions: the last date on which a participant may be drawn.
 * p01 is Yann — his three selections all fall before 17 December 2026.
 * Applied when a schedule is generated; it only makes the schedule stricter.
 */
export const PARTICIPANT_DEADLINES: Readonly<Record<string, string>> = {
  p01: "2026-12-16",
};

/* ------------------------------------------------------------------ */
/* Schedule generation                                                 */
/* ------------------------------------------------------------------ */

/**
 * Builds a complete, valid, randomised schedule.
 *
 * Strategy: weighted greedy dealing with a restart-on-dead-end loop.
 * For every working day we pick the planned number of distinct participants that still have
 * selections left, strongly preferring those who did NOT appear on the
 * previous day(s) — this reduces back-to-back appearances without ever
 * compromising mathematical validity (the constraint set is re-checked at
 * the end by `validateSchedule`).
 */
export function generateSchedule(participantIds: readonly string[]): DaySchedule[] {
  if (participantIds.length !== PARTICIPANT_COUNT) {
    throw new Error(`Schedule requires exactly ${PARTICIPANT_COUNT} participants.`);
  }
  const dates = getEligibleDates();
  if (dates.length !== DRAW_DAY_COUNT) {
    throw new Error(`Schedule requires exactly ${DRAW_DAY_COUNT} eligible dates.`);
  }

  for (let attempt = 0; attempt < 500; attempt++) {
    const schedule = tryBuildSchedule(participantIds, dates);
    if (schedule) {
      const check = validateSchedule(schedule, participantIds);
      if (check.ok && respectsDeadlines(schedule)) return schedule;
    }
  }
  throw new Error("Could not build a valid schedule after 500 attempts.");
}

function respectsDeadlines(schedule: DaySchedule[]): boolean {
  return schedule.every((day) =>
    day.participantIds.every((id) => {
      const deadline = PARTICIPANT_DEADLINES[id];
      return deadline === undefined || day.date <= deadline;
    }),
  );
}

function tryBuildSchedule(
  participantIds: readonly string[],
  dates: readonly string[],
): DaySchedule[] | null {
  const remaining = new Map<string, number>();
  for (const id of participantIds) remaining.set(id, SELECTIONS_PER_PARTICIPANT);

  const schedule: DaySchedule[] = [];
  const recent = new Set<string>(); // participants used on the previous day

  for (const date of dates) {
    const picked: string[] = [];
    const usedToday = new Set<string>();

    for (let slot = 0; slot < winnersOn(date); slot++) {
      const pool: string[] = [];
      const weights: number[] = [];
      for (const id of participantIds) {
        const left = remaining.get(id) ?? 0;
        if (left <= 0 || usedToday.has(id)) continue;
        const deadline = PARTICIPANT_DEADLINES[id];
        if (deadline !== undefined && date > deadline) continue;
        pool.push(id);
        // Prefer participants who are far from their next forced appearance:
        // more remaining selections = more scheduling freedom.
        let w = left * left;
        if (recent.has(id)) w *= 0.12; // discourage consecutive-day repeats
        weights.push(w);
      }
      if (pool.length === 0) return null; // dead end → restart

      const chosen = weightedPick(pool, weights);
      if (!chosen) return null;
      picked.push(chosen);
      usedToday.add(chosen);
      remaining.set(chosen, (remaining.get(chosen) ?? 0) - 1);
    }

    recent.clear();
    for (const id of picked) recent.add(id);
    schedule.push({ date, participantIds: picked });
  }

  // Every selection must be spent — otherwise the schedule is not balanced.
  for (const id of participantIds) {
    if ((remaining.get(id) ?? 0) !== 0) return null;
  }
  return schedule;
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

/** Full structural validation of a generated or imported schedule. */
export function validateSchedule(
  schedule: DaySchedule[],
  participantIds: readonly string[],
): ValidationResult {
  const errors: string[] = [];
  const validIds = new Set(participantIds);
  const expectedDates = getEligibleDates();

  if (participantIds.length !== PARTICIPANT_COUNT) {
    errors.push(`Expected ${PARTICIPANT_COUNT} participants, found ${participantIds.length}.`);
  }
  if (new Set(participantIds).size !== participantIds.length) {
    errors.push("Participant ids must be unique.");
  }
  if (schedule.length !== DRAW_DAY_COUNT) {
    errors.push(`Expected ${DRAW_DAY_COUNT} draw days, found ${schedule.length}.`);
  }

  const dates = schedule.map((d) => d.date);
  if (new Set(dates).size !== dates.length) errors.push("Duplicate dates in schedule.");
  for (const expected of expectedDates) {
    if (!dates.includes(expected)) errors.push(`Missing eligible date ${expected}.`);
  }
  for (const date of dates) {
    if (!isEligibleDate(date)) errors.push(`Date ${date} is not an eligible working day.`);
    if (!expectedDates.includes(date)) errors.push(`Date ${date} is outside the campaign window.`);
  }

  const counts = new Map<string, number>();
  for (const day of schedule) {
    const expectedWinners = winnersOn(day.date);
    if (day.participantIds.length !== expectedWinners) {
      errors.push(`${day.date}: expected ${expectedWinners} winners, found ${day.participantIds.length}.`);
      continue;
    }
    const seen = new Set<string>();
    for (const id of day.participantIds) {
      if (!validIds.has(id)) errors.push(`${day.date}: unknown participant "${id}".`);
      if (seen.has(id)) errors.push(`${day.date}: participant "${id}" selected twice on the same day.`);
      seen.add(id);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  for (const id of participantIds) {
    const c = counts.get(id) ?? 0;
    if (c !== SELECTIONS_PER_PARTICIPANT) {
      errors.push(`Participant "${id}" has ${c} selections, expected ${SELECTIONS_PER_PARTICIPANT}.`);
    }
  }

  const total = schedule.reduce((sum, d) => sum + d.participantIds.length, 0);
  if (total !== TOTAL_SELECTIONS) {
    errors.push(`Total selections ${total} does not equal ${TOTAL_SELECTIONS}.`);
  }

  return { ok: errors.length === 0, errors };
}

/** Validates a single reveal before it is written to storage. */
export function validateSelection(
  state: CampaignState,
  date: string,
  winnerIds: readonly string[],
): ValidationResult {
  const errors: string[] = [];

  if (!isEligibleDate(date)) errors.push(`${date} is not an eligible working day (weekends are excluded).`);
  if (state.results[date]) errors.push(`The draw for ${date} has already been completed and locked.`);
  const expectedWinners = winnersOn(date);
  if (winnerIds.length !== expectedWinners) {
    errors.push(`A draw on ${date} must reveal exactly ${expectedWinners} names.`);
  }

  const seen = new Set<string>();
  const known = new Set(state.participants.map((p) => p.id));
  for (const id of winnerIds) {
    if (seen.has(id)) errors.push("The same person cannot be drawn twice on the same day.");
    seen.add(id);
    if (!known.has(id)) errors.push(`Unknown participant "${id}".`);
  }

  const used = selectionCounts(state);
  for (const id of winnerIds) {
    if ((used.get(id) ?? 0) >= SELECTIONS_PER_PARTICIPANT) {
      errors.push(`Participant "${id}" has already used all ${SELECTIONS_PER_PARTICIPANT} selections.`);
    }
  }

  return { ok: errors.length === 0, errors };
}

/* ------------------------------------------------------------------ */
/* Derived statistics                                                  */
/* ------------------------------------------------------------------ */

/** How many completed selections each participant has already used. */
export function selectionCounts(state: CampaignState): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of state.participants) counts.set(p.id, 0);
  for (const result of Object.values(state.results)) {
    for (const id of result.participantIds) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return counts;
}

/** The dates on which a participant has already been revealed. */
export function selectionDates(state: CampaignState, participantId: string): string[] {
  return Object.values(state.results)
    .filter((r) => r.participantIds.includes(participantId))
    .map((r) => r.date)
    .sort();
}

export interface ParticipantStat {
  id: string;
  name: string;
  role: string;
  selected: number;
  remaining: number;
  dates: string[];
  completed: boolean;
}

export function participantStats(state: CampaignState): ParticipantStat[] {
  const counts = selectionCounts(state);
  return state.participants.map((p) => {
    const selected = counts.get(p.id) ?? 0;
    return {
      id: p.id,
      name: p.name,
      role: p.role,
      selected,
      remaining: SELECTIONS_PER_PARTICIPANT - selected,
      dates: selectionDates(state, p.id),
      completed: selected >= SELECTIONS_PER_PARTICIPANT,
    };
  });
}

export interface CampaignStats {
  totalParticipants: number;
  totalDrawDays: number;
  totalSelections: number;
  completedSelections: number;
  completedDays: number;
  remainingDays: number;
  completedParticipants: number;
  remainingEmployeeSelections: number;
  percent: number;
}

export function campaignStats(state: CampaignState): CampaignStats {
  const completedDays = Object.keys(state.results).length;
  const completedSelections = Object.values(state.results).reduce(
    (sum, r) => sum + r.participantIds.length,
    0,
  );
  const stats = participantStats(state);
  return {
    totalParticipants: state.participants.length,
    totalDrawDays: DRAW_DAY_COUNT,
    totalSelections: TOTAL_SELECTIONS,
    completedSelections,
    completedDays,
    remainingDays: DRAW_DAY_COUNT - completedDays,
    completedParticipants: stats.filter((s) => s.completed).length,
    remainingEmployeeSelections: TOTAL_SELECTIONS - completedSelections,
    percent: Math.round((completedSelections / TOTAL_SELECTIONS) * 100),
  };
}
