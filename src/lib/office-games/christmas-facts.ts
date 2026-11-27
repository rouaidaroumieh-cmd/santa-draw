/**
 * “Who’s behind the Christmas fact?” — voting ballot (not a scored quiz).
 *
 * How to configure:
 * 1. Write the anonymous `fact` text.
 * 2. Set `options` to 4 roster names players can vote for.
 * 3. Optionally set `answer` to the real person (organiser reference only — not shown while voting).
 *
 * Roster names: `src/lib/fun-lab-roster.ts` (exact spelling).
 */

import { FUN_LAB_ROSTER, type FunLabName, isFunLabName } from "@/lib/fun-lab-roster";
import type { MostLikelyBallot } from "@/lib/fun-lab-games";

export type ChristmasFact = {
  id: string;
  /** Fact shown anonymously */
  fact: string;
  /**
   * Real person behind the fact (organiser note only — not revealed in the vote UI).
   * Keep aligned with one of `options`.
   */
  answer: FunLabName;
  /** Names shown as vote choices (include the real person). Prefer 4. */
  options: FunLabName[];
};

/** Same ballot shape as Most Likely: picks + finish lock. */
export type FactsBallot = MostLikelyBallot;

export const FACT_COLLEAGUES = FUN_LAB_ROSTER.map((p) => ({
  id: p.name,
  name: p.name,
  photo: p.photo,
}));

export const CHRISTMAS_FACTS: ChristmasFact[] = [
  {
    id: "f1",
    fact: "I have watched Home Alone more than 20 times.",
    answer: "yann",
    options: ["yann", "samer", "eliane", "maroun"],
  },
  {
    id: "f2",
    fact: "I secretly listen to Christmas music in November.",
    answer: "sarah",
    options: ["sarah", "maria", "cynthia", "karen"],
  },
  {
    id: "f3",
    fact: "I once bought all my Christmas presents on December 24.",
    answer: "joseph",
    options: ["joseph", "georges", "elia", "rida"],
  },
  {
    id: "f4",
    fact: "I absolutely hate Christmas pudding.",
    answer: "pia",
    options: ["pia", "carole", "lara", "rouaida"],
  },
  {
    id: "f5",
    fact: "I have never watched The Grinch.",
    answer: "christina",
    options: ["christina", "yara mezher", "yara kh", "marie-ange"],
  },
  {
    id: "f6",
    fact: "I start decorating my Christmas tree in November.",
    answer: "eliane",
    options: ["eliane", "maria", "karen", "lara"],
  },
  {
    id: "f7",
    fact: "I once pretended to like a Christmas gift.",
    answer: "samer",
    options: ["samer", "maroun", "georges", "joseph"],
  },
  {
    id: "f8",
    fact: "I could eat gingerbread cookies every single day.",
    answer: "rouaida",
    options: ["rouaida", "cynthia", "pia", "sarah"],
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

/** Validate picks against each fact’s option list. */
export function sanitizeFactsPicks(picks: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const fact of CHRISTMAS_FACTS) {
    const chosen = picks[fact.id];
    if (chosen && fact.options.includes(chosen as FunLabName) && isFunLabName(chosen)) {
      out[fact.id] = chosen;
    }
  }
  return out;
}
