export type MovieQuestion = {
  id: string;
  emojis: string;
  options: string[];
  /** Index in options */
  answer: number;
};

export const GUESS_MOVIE_QUESTIONS: MovieQuestion[] = [
  {
    id: "m1",
    emojis: "🏠👦🎄",
    options: ["Home Alone", "Elf", "The Grinch"],
    answer: 0,
  },
  {
    id: "m2",
    emojis: "🚂❄️🎅",
    options: ["Frozen", "The Polar Express", "Klaus"],
    answer: 1,
  },
  {
    id: "m3",
    emojis: "💚😡🎄",
    options: ["The Grinch", "Elf", "A Christmas Carol"],
    answer: 0,
  },
  {
    id: "m4",
    emojis: "🧝‍♂️🎅🏙️",
    options: ["Home Alone", "The Santa Clause", "Elf"],
    answer: 2,
  },
  {
    id: "m5",
    emojis: "🎄👻⏳",
    options: ["A Christmas Carol", "The Polar Express", "Miracle on 34th Street"],
    answer: 0,
  },
  {
    id: "m6",
    emojis: "🎅🎁🏬",
    options: ["The Santa Clause", "Love Actually", "Arthur Christmas"],
    answer: 0,
  },
  {
    id: "m7",
    emojis: "👦🎄🎁🚂",
    options: ["The Polar Express", "Home Alone", "The Grinch"],
    answer: 0,
  },
];
