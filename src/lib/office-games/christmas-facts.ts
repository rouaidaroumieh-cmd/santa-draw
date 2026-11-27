/**
 * Editable Christmas facts quiz.
 * Replace SAMPLE_* colleague names and facts with real office data later.
 * Do not invent real employee names here.
 */

export type ChristmasFact = {
  id: string;
  /** Fact shown anonymously */
  fact: string;
  /** Correct colleague id from COLLEAGUE_SAMPLES */
  answerId: string;
  /** 3–4 option ids including the answer */
  optionIds: string[];
};

/** Placeholder colleagues — rename / replace when you have real data. */
export const COLLEAGUE_SAMPLES = [
  { id: "sample-a", name: "SAMPLE Colleague A" },
  { id: "sample-b", name: "SAMPLE Colleague B" },
  { id: "sample-c", name: "SAMPLE Colleague C" },
  { id: "sample-d", name: "SAMPLE Colleague D" },
  { id: "sample-e", name: "SAMPLE Colleague E" },
  { id: "sample-f", name: "SAMPLE Colleague F" },
] as const;

export const CHRISTMAS_FACTS: ChristmasFact[] = [
  {
    id: "f1",
    fact: "I have watched Home Alone more than 20 times.",
    answerId: "sample-a",
    optionIds: ["sample-a", "sample-b", "sample-c", "sample-d"],
  },
  {
    id: "f2",
    fact: "I secretly listen to Christmas music in November.",
    answerId: "sample-b",
    optionIds: ["sample-a", "sample-b", "sample-e", "sample-f"],
  },
  {
    id: "f3",
    fact: "I once bought all my Christmas presents on December 24.",
    answerId: "sample-c",
    optionIds: ["sample-b", "sample-c", "sample-d", "sample-e"],
  },
  {
    id: "f4",
    fact: "I absolutely hate Christmas pudding.",
    answerId: "sample-d",
    optionIds: ["sample-a", "sample-c", "sample-d", "sample-f"],
  },
  {
    id: "f5",
    fact: "I have never watched The Grinch.",
    answerId: "sample-e",
    optionIds: ["sample-b", "sample-d", "sample-e", "sample-f"],
  },
  {
    id: "f6",
    fact: "I start decorating my Christmas tree in November.",
    answerId: "sample-f",
    optionIds: ["sample-a", "sample-c", "sample-e", "sample-f"],
  },
  {
    id: "f7",
    fact: "I once pretended to like a Christmas gift.",
    answerId: "sample-a",
    optionIds: ["sample-a", "sample-b", "sample-d", "sample-e"],
  },
  {
    id: "f8",
    fact: "I could eat gingerbread cookies every single day.",
    answerId: "sample-c",
    optionIds: ["sample-b", "sample-c", "sample-d", "sample-f"],
  },
];

export function colleagueName(id: string): string {
  return COLLEAGUE_SAMPLES.find((c) => c.id === id)?.name ?? id;
}
