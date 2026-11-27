/** Hub catalog for Christmas Office Games. */

export type OfficeGameSlug =
  | "horoscope"
  | "guess-movie"
  | "santa-sack"
  | "spin-wheel";

/** Fun Lab server game ids for personal-best / personality storage. */
export type OfficeGameScoreId =
  | "og-movie"
  | "og-sack"
  | "og-wheel"
  | "og-horoscope";

export type OfficeGameMeta = {
  slug: OfficeGameSlug;
  scoreGame: OfficeGameScoreId;
  titleKey: string;
  blurbKey: string;
  questionsLabelKey: string;
  durationKey: string;
  accent: string;
};

export const OFFICE_GAMES: readonly OfficeGameMeta[] = [
  {
    slug: "horoscope",
    scoreGame: "og-horoscope",
    titleKey: "Christmas horoscope",
    blurbKey: "Answer five questions and meet your Christmas personality.",
    questionsLabelKey: "One reveal only",
    durationKey: "~2 min",
    accent: "#B08F4C",
  },
  {
    slug: "guess-movie",
    scoreGame: "og-movie",
    titleKey: "Guess the Christmas movie",
    blurbKey: "Decode emoji clues into classic Christmas films.",
    questionsLabelKey: "7 movies",
    durationKey: "~2 min",
    accent: "#245C46",
  },
  {
    slug: "santa-sack",
    scoreGame: "og-sack",
    titleKey: "Guess what's in Santa's sack",
    blurbKey: "Identify the hidden festive object — hints cost points.",
    questionsLabelKey: "7 random objects",
    durationKey: "~2 min",
    accent: "#A33444",
  },
  {
    slug: "spin-wheel",
    scoreGame: "og-wheel",
    titleKey: "Spin the Christmas wheel",
    blurbKey: "Land on a random office Christmas challenge.",
    questionsLabelKey: "Endless spins",
    durationKey: "~1 min",
    accent: "#173D32",
  },
] as const;

export const OFFICE_MOVIE_MAX = 7;

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
