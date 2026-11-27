/** Shared Fun Lab game definitions (demos + home widgets). */

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
};

export const POLL_OPTIONS = [
  { id: "chocolat", labelKey: "Hot chocolate" },
  { id: "vin", labelKey: "Mulled wine" },
  { id: "cookie", labelKey: "Christmas cookies" },
  { id: "orange", labelKey: "Clémentines" },
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
    id: "meeting",
    labelKey: "Who is most likely to fall asleep in a long meeting?",
  },
] as const;
