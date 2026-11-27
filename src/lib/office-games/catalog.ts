/** Hub catalog for Christmas Office Games. */

export type OfficeGameSlug =
  | "christmas-facts"
  | "horoscope"
  | "guess-movie"
  | "santa-sack"
  | "spin-wheel";

export type OfficeGameMeta = {
  slug: OfficeGameSlug;
  titleKey: string;
  blurbKey: string;
  questionsLabelKey: string;
  durationKey: string;
  accent: string;
};

export const OFFICE_GAMES: readonly OfficeGameMeta[] = [
  {
    slug: "christmas-facts",
    titleKey: "Who’s behind the Christmas fact?",
    blurbKey: "Guess which colleague matches a fun festive fact.",
    questionsLabelKey: "8 facts",
    durationKey: "~2 min",
    accent: "#7A1F2B",
  },
  {
    slug: "horoscope",
    titleKey: "Christmas horoscope",
    blurbKey: "Answer five questions and meet your Christmas personality.",
    questionsLabelKey: "5 questions",
    durationKey: "~2 min",
    accent: "#B08F4C",
  },
  {
    slug: "guess-movie",
    titleKey: "Guess the Christmas movie",
    blurbKey: "Decode emoji clues into classic Christmas films.",
    questionsLabelKey: "7 movies",
    durationKey: "~2 min",
    accent: "#245C46",
  },
  {
    slug: "santa-sack",
    titleKey: "Guess what's in Santa's sack",
    blurbKey: "Identify the hidden festive object — hints cost points.",
    questionsLabelKey: "7 objects",
    durationKey: "~2 min",
    accent: "#A33444",
  },
  {
    slug: "spin-wheel",
    titleKey: "Spin the Christmas wheel",
    blurbKey: "Land on a random office Christmas challenge.",
    questionsLabelKey: "Endless spins",
    durationKey: "~1 min",
    accent: "#173D32",
  },
] as const;

export function isOfficeGameSlug(value: string): value is OfficeGameSlug {
  return OFFICE_GAMES.some((g) => g.slug === value);
}

export function getOfficeGame(slug: string): OfficeGameMeta | undefined {
  return OFFICE_GAMES.find((g) => g.slug === slug);
}

/** Score-based celebration lines for quiz-style games. */
export function rankingMessage(score: number, total: number): string {
  if (total <= 0) return "🎄 Festive finish!";
  const pct = score / total;
  if (pct >= 1) return "🎅 Christmas Superstar!";
  if (pct >= 0.8) return "🎄 You’re officially the Christmas expert!";
  if (pct >= 0.5) return "🧝 Santa needs you on his team!";
  return "💚 The Grinch is proud of you!";
}
