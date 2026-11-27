export type SackDifficulty = "easy" | "medium" | "hard";

export type SackQuestion = {
  id: string;
  objectLabel: string;
  /** Large emoji “silhouette” stand-in until real art is added */
  emoji: string;
  options: string[];
  answer: number;
  difficulty: SackDifficulty;
  hint: string;
  /** Points without / with hint */
  pointsFull: number;
  pointsHint: number;
};

export const SANTA_SACK_QUESTIONS: SackQuestion[] = [
  {
    id: "s1",
    objectLabel: "Candy Cane",
    emoji: "🍭",
    options: ["Candy Cane", "Lollipop", "Candy Corn"],
    answer: 0,
    difficulty: "easy",
    hint: "Striped and minty.",
    pointsFull: 2,
    pointsHint: 1,
  },
  {
    id: "s2",
    objectLabel: "Christmas Bell",
    emoji: "🔔",
    options: ["Christmas Bell", "Cowbell", "Door knocker"],
    answer: 0,
    difficulty: "easy",
    hint: "It jingles when you shake it.",
    pointsFull: 2,
    pointsHint: 1,
  },
  {
    id: "s3",
    objectLabel: "Christmas Tree Ornament",
    emoji: "🎄",
    options: ["Wreath", "Christmas Tree Ornament", "Pine cone"],
    answer: 1,
    difficulty: "easy",
    hint: "It hangs on a branch.",
    pointsFull: 2,
    pointsHint: 1,
  },
  {
    id: "s4",
    objectLabel: "Gingerbread Cookie",
    emoji: "🍪",
    options: ["Shortbread", "Gingerbread Cookie", "Macaron"],
    answer: 1,
    difficulty: "medium",
    hint: "Spiced biscuit, often shaped like a person.",
    pointsFull: 3,
    pointsHint: 1,
  },
  {
    id: "s5",
    objectLabel: "Christmas Star",
    emoji: "⭐",
    options: ["Snowflake", "Christmas Star", "Sun"],
    answer: 1,
    difficulty: "medium",
    hint: "Usually sits on top of the tree.",
    pointsFull: 3,
    pointsHint: 1,
  },
  {
    id: "s6",
    objectLabel: "Christmas Stocking",
    emoji: "🧦",
    options: ["Christmas Stocking", "Mittens", "Scarf"],
    answer: 0,
    difficulty: "hard",
    hint: "Hung by the chimney with care.",
    pointsFull: 4,
    pointsHint: 2,
  },
  {
    id: "s7",
    objectLabel: "Reindeer Plush Toy",
    emoji: "🦌",
    options: ["Teddy bear", "Reindeer Plush Toy", "Penguin plush"],
    answer: 1,
    difficulty: "hard",
    hint: "Antlers optional, cuteness mandatory.",
    pointsFull: 4,
    pointsHint: 2,
  },
];

export function maxSackScore(): number {
  return SANTA_SACK_QUESTIONS.reduce((sum, q) => sum + q.pointsFull, 0);
}
