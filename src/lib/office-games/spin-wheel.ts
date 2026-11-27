export type WheelCategory = "sing" | "office" | "knowledge" | "santa" | "lucky";

export type WheelChallenge = {
  id: string;
  category: WheelCategory;
  categoryLabel: string;
  text: string;
  color: string;
};

/** Flat list — each entry is a wheel segment (equal weight). */
export const WHEEL_CHALLENGES: WheelChallenge[] = [
  {
    id: "w1",
    category: "sing",
    categoryLabel: "Sing it",
    text: "Sing 5 seconds of a Christmas song.",
    color: "#7A1F2B",
  },
  {
    id: "w2",
    category: "sing",
    categoryLabel: "Sing it",
    text: "Hum a Christmas song and let colleagues guess it.",
    color: "#A33444",
  },
  {
    id: "w3",
    category: "office",
    categoryLabel: "Office fun",
    text: "Name the colleague most likely to be Santa’s favorite.",
    color: "#245C46",
  },
  {
    id: "w4",
    category: "office",
    categoryLabel: "Office fun",
    text: "Give someone in the office a Christmas nickname.",
    color: "#173D32",
  },
  {
    id: "w5",
    category: "office",
    categoryLabel: "Office fun",
    text: "Share your funniest office moment of the year.",
    color: "#0F2B23",
  },
  {
    id: "w6",
    category: "knowledge",
    categoryLabel: "Christmas knowledge",
    text: "Name 3 Christmas movies in 10 seconds.",
    color: "#B08F4C",
  },
  {
    id: "w7",
    category: "knowledge",
    categoryLabel: "Christmas knowledge",
    text: "Name 3 of Santa’s reindeer.",
    color: "#D6B56D",
  },
  {
    id: "w8",
    category: "knowledge",
    categoryLabel: "Christmas knowledge",
    text: "Name 3 Christmas songs.",
    color: "#8A7340",
  },
  {
    id: "w9",
    category: "santa",
    categoryLabel: "Santa challenge",
    text: "Do your best Santa laugh.",
    color: "#7A1F2B",
  },
  {
    id: "w10",
    category: "santa",
    categoryLabel: "Santa challenge",
    text: "Imitate an elf for 10 seconds.",
    color: "#A33444",
  },
  {
    id: "w11",
    category: "santa",
    categoryLabel: "Santa challenge",
    text: "Give an imaginary Christmas gift to a colleague.",
    color: "#245C46",
  },
  {
    id: "w12",
    category: "lucky",
    categoryLabel: "Lucky gift",
    text: "You get a virtual Christmas gift!",
    color: "#B08F4C",
  },
  {
    id: "w13",
    category: "lucky",
    categoryLabel: "Lucky gift",
    text: "You win a bonus point.",
    color: "#D6B56D",
  },
  {
    id: "w14",
    category: "lucky",
    categoryLabel: "Lucky gift",
    text: "You can skip your next challenge.",
    color: "#173D32",
  },
];
