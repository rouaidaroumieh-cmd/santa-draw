export type PersonalityId = "grinch" | "elf" | "santa" | "rudolph" | "star";

export type HoroscopeOption = {
  id: string;
  label: string;
  weights: Partial<Record<PersonalityId, number>>;
};

export type HoroscopeQuestion = {
  id: string;
  prompt: string;
  options: HoroscopeOption[];
};

export type PersonalityResult = {
  id: PersonalityId;
  title: string;
  description: string;
  glyph: string;
};

export const PERSONALITIES: Record<PersonalityId, PersonalityResult> = {
  grinch: {
    id: "grinch",
    title: "The Christmas Grinch",
    description:
      "You pretend you don’t care about Christmas, but secretly enjoy all the festive chaos.",
    glyph: "G",
  },
  elf: {
    id: "elf",
    title: "The Christmas Elf",
    description: "Always energetic, helpful and ready to spread Christmas cheer.",
    glyph: "E",
  },
  santa: {
    id: "santa",
    title: "Santa Claus",
    description: "The generous one who makes sure everyone has a present.",
    glyph: "S",
  },
  rudolph: {
    id: "rudolph",
    title: "Rudolph",
    description: "The life of the party. You bring the energy wherever you go.",
    glyph: "R",
  },
  star: {
    id: "star",
    title: "The Christmas Star",
    description: "You love the spotlight, the decorations and all the attention.",
    glyph: "★",
  },
};

export const HOROSCOPE_QUESTIONS: HoroscopeQuestion[] = [
  {
    id: "q1",
    prompt: "What’s your ideal Christmas morning?",
    options: [
      {
        id: "q1a",
        label: "Quiet coffee, no rush, maybe one movie later.",
        weights: { grinch: 2, santa: 1 },
      },
      {
        id: "q1b",
        label: "Presents everywhere — I’m first to the tree!",
        weights: { star: 2, rudolph: 1 },
      },
      {
        id: "q1c",
        label: "Helping cook, wrap, and keep everyone happy.",
        weights: { elf: 2, santa: 1 },
      },
      {
        id: "q1d",
        label: "A big festive breakfast with loud music.",
        weights: { rudolph: 2, star: 1 },
      },
    ],
  },
  {
    id: "q2",
    prompt: "What’s your role at the office Christmas party?",
    options: [
      {
        id: "q2a",
        label: "Standing near the snacks, observing the chaos.",
        weights: { grinch: 2 },
      },
      {
        id: "q2b",
        label: "Making sure shy colleagues join in.",
        weights: { elf: 2, santa: 1 },
      },
      {
        id: "q2c",
        label: "On the dance floor / karaoke mic.",
        weights: { rudolph: 2, star: 1 },
      },
      {
        id: "q2d",
        label: "Organising gifts, photos, and the playlist.",
        weights: { santa: 2, elf: 1 },
      },
    ],
  },
  {
    id: "q3",
    prompt: "What would you do if Santa forgot your present?",
    options: [
      {
        id: "q3a",
        label: "Shrug — I expected it somehow.",
        weights: { grinch: 2 },
      },
      {
        id: "q3b",
        label: "Write a polite letter… with glitter.",
        weights: { elf: 2 },
      },
      {
        id: "q3c",
        label: "Buy myself something nicer anyway.",
        weights: { star: 2 },
      },
      {
        id: "q3d",
        label: "Throw an even bigger party for everyone else.",
        weights: { rudolph: 1, santa: 2 },
      },
    ],
  },
  {
    id: "q4",
    prompt: "Choose your favorite Christmas treat.",
    options: [
      {
        id: "q4a",
        label: "Dark chocolate — keep it simple.",
        weights: { grinch: 2 },
      },
      {
        id: "q4b",
        label: "Homemade cookies to share.",
        weights: { elf: 2, santa: 1 },
      },
      {
        id: "q4c",
        label: "Anything glittery and photogenic.",
        weights: { star: 2 },
      },
      {
        id: "q4d",
        label: "Mulled wine and a loud toast.",
        weights: { rudolph: 2 },
      },
    ],
  },
  {
    id: "q5",
    prompt: "How do you react when Christmas music starts playing?",
    options: [
      {
        id: "q5a",
        label: "Mild sigh… then I hum along later.",
        weights: { grinch: 2 },
      },
      {
        id: "q5b",
        label: "Instant dance break.",
        weights: { rudolph: 2, star: 1 },
      },
      {
        id: "q5c",
        label: "Turn it up so the whole open space hears it.",
        weights: { elf: 1, rudolph: 2 },
      },
      {
        id: "q5d",
        label: "Cue a playlist for the team.",
        weights: { santa: 2, elf: 1 },
      },
    ],
  },
];

export function resolvePersonality(selectedOptionIds: string[]): PersonalityResult {
  const scores: Record<PersonalityId, number> = {
    grinch: 0,
    elf: 0,
    santa: 0,
    rudolph: 0,
    star: 0,
  };

  for (const q of HOROSCOPE_QUESTIONS) {
    const opt = q.options.find((o) => selectedOptionIds.includes(o.id));
    if (!opt) continue;
    for (const [key, weight] of Object.entries(opt.weights) as [PersonalityId, number][]) {
      scores[key] += weight;
    }
  }

  const winner = (Object.keys(scores) as PersonalityId[]).sort(
    (a, b) => scores[b] - scores[a],
  )[0]!;
  return PERSONALITIES[winner];
}
