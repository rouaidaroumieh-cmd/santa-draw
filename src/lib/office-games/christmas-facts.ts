/**
 * “Who’s behind the Christmas fact?” — voting ballot (not a scored quiz).
 *
 * How to configure:
 * 1. Write the anonymous `fact` text.
 * 2. Optionally set `answer` to the real person (organiser reference only — not shown while voting).
 *
 * Everyone votes among the full Fun Lab roster (20 colleagues).
 * Roster names: `src/lib/fun-lab-roster.ts` (exact spelling).
 */

import { FUN_LAB_NAMES, FUN_LAB_ROSTER, type FunLabName, isFunLabName } from "@/lib/fun-lab-roster";
import type { MostLikelyBallot } from "@/lib/fun-lab-games";

export type ChristmasFact = {
  id: string;
  /** Fact shown anonymously */
  fact: string;
  /**
   * Real person behind the fact (organiser note only — not revealed in the vote UI).
   */
  answer: FunLabName;
};

/** Same ballot shape as Most Likely: picks + finish lock. */
export type FactsBallot = MostLikelyBallot;

export const CHRISTMAS_FACTS: ChristmasFact[] = [
  {
    id: "f1",
    fact: "I have watched Home Alone more than 20 times.",
    answer: "yann",
  },
  {
    id: "f2",
    fact: "I secretly listen to Christmas music in November.",
    answer: "sarah",
  },
  {
    id: "f3",
    fact: "I once bought all my Christmas presents on December 24.",
    answer: "joseph",
  },
  {
    id: "f4",
    fact: "I absolutely hate Christmas pudding.",
    answer: "pia",
  },
  {
    id: "f5",
    fact: "I have never watched The Grinch.",
    answer: "christina",
  },
  {
    id: "f6",
    fact: "I start decorating my Christmas tree in November.",
    answer: "eliane",
  },
  {
    id: "f7",
    fact: "I once pretended to like a Christmas gift.",
    answer: "samer",
  },
  {
    id: "f8",
    fact: "I could eat gingerbread cookies every single day.",
    answer: "rouaida",
  },
];

export const OFFICE_FACTS_COUNT = CHRISTMAS_FACTS.length;

export function colleagueName(name: string): string {
  return isFunLabName(name) ? name : name;
}

export function colleaguePhoto(name: string): string {
  return FUN_LAB_ROSTER.find((p) => p.name === name)?.photo ?? "/elfs/yann.jpeg";
}

export function isFactsBallotComplete(picks: Record<string, string> | undefined): boolean {
  if (!picks) return false;
  return CHRISTMAS_FACTS.every((q) => Boolean(picks[q.id]));
}

/** Validate picks — any roster name is allowed for each fact. */
export function sanitizeFactsPicks(picks: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const fact of CHRISTMAS_FACTS) {
    const chosen = picks[fact.id];
    if (chosen && isFunLabName(chosen) && (FUN_LAB_NAMES as readonly string[]).includes(chosen)) {
      out[fact.id] = chosen;
    }
  }
  return out;
}
