/** Shared Fun Lab game definitions (demos + home widgets). */

export type LeaderboardEntry = {
  name: string;
  photo: string;
  value: number;
};

export type FunLabScore = {
  /** Memory match: fewer moves is better. Guess elf: higher score is better. */
  best: number;
};

export type FunLabPublicResults = {
  poll: {
    total: number;
    options: { id: string; labelKey: string; count: number; pct: number }[];
  };
  elfVote: {
    total: number;
    podium: { name: string; photo: string; count: number }[];
  };
  mostLikely: {
    questions: {
      id: string;
      labelKey: string;
      total: number;
      leader: { name: string; photo: string; count: number } | null;
    }[];
  };
  memoryMatch: { total: number; leaders: LeaderboardEntry[] };
  guessElf: { total: number; max: number; leaders: LeaderboardEntry[] };
};

export const GUESS_ELF_ROUNDS = 10;
export const MEMORY_MATCH_PAIRS = 8;

export const POLL_OPTIONS = [
  { id: "chocolat", labelKey: "Hot chocolate" },
  { id: "vin", labelKey: "Mulled wine" },
  { id: "cookie", labelKey: "Christmas cookies" },
  { id: "proteine", labelKey: "Protein bar" },
] as const;

export const MOST_LIKELY_QUESTIONS = [
  {
    id: "playlist",
    labelKey: "Who is most likely to blast Christmas music at 8am?",
  },
  {
    id: "chocolate",
    labelKey: "Who is most likely to eat the last Advent chocolate?",
  },
  {
    id: "costume",
    labelKey: "Who is most likely to keep the elf hat on all day?",
  },
  {
    id: "decorations",
    labelKey: "Who is most likely to over-decorate their desk?",
  },
  {
    id: "secret-santa",
    labelKey: "Who is most likely to spoil the Secret Santa surprise?",
  },
  {
    id: "cookies",
    labelKey: "Who is most likely to bake (or buy) treats for everyone?",
  },
  {
    id: "karaoke",
    labelKey: "Who is most likely to start a Christmas karaoke?",
  },
  {
    id: "grinch",
    labelKey: "Who is most likely to be a secret Grinch?",
  },
  {
    id: "gift-wrap",
    labelKey: "Who is most likely to wrap a gift with too much tape?",
  },
  {
    id: "meeting",
    labelKey: "Who is most likely to fall asleep in a long meeting?",
  },
] as const;

export type MostLikelyBallot = {
  picks: Record<string, string>;
  finished: boolean;
};

export function isMostLikelyComplete(picks: Record<string, string> | undefined): boolean {
  if (!picks) return false;
  return MOST_LIKELY_QUESTIONS.every((q) => Boolean(picks[q.id]));
}
