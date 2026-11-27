/** Rotating daily missions for Fun Lab “Challenge of the day”. */
export const FUN_LAB_CHALLENGES = [
  {
    id: "playlist",
    labelKey: "Bring a Christmas playlist track to share with the team.",
    howKey: "Join the mission, then mark it done when you have shared your track.",
  },
  {
    id: "accessory",
    labelKey: "Wear a Christmas accessory all day (hat, jumper, earrings…).",
    howKey: "Join the mission, then mark it done once you have worn it for the day.",
  },
  {
    id: "coffee",
    labelKey: "Surprise a colleague with a coffee or tea.",
    howKey: "Join the mission, then mark it done when you have offered the drink.",
  },
  {
    id: "elf-photo",
    labelKey: "Switch your profile photo to an elf version for 24 hours.",
    howKey: "Join the mission, then mark it done when your elf photo is live.",
  },
  {
    id: "snack",
    labelKey: "Bring a snack or chocolate to share with the team.",
    howKey: "Join the mission, then mark it done when the treat is on the table.",
  },
  {
    id: "compliment",
    labelKey: "Give a Christmas compliment to three colleagues.",
    howKey: "Join the mission, then mark it done after your three compliments.",
  },
] as const;

export type FunLabChallengeId = (typeof FUN_LAB_CHALLENGES)[number]["id"];

export const FUN_LAB_CHALLENGE_IDS: readonly FunLabChallengeId[] = FUN_LAB_CHALLENGES.map(
  (c) => c.id,
);

export function isFunLabChallengeId(value: unknown): value is FunLabChallengeId {
  return typeof value === "string" && (FUN_LAB_CHALLENGE_IDS as readonly string[]).includes(value);
}

/** Stable day-of-year rotation so everyone sees the same mission. */
export function challengeOfTheDay(now = new Date()): FunLabChallengeId {
  const start = Date.UTC(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start) / 86_400_000);
  return FUN_LAB_CHALLENGE_IDS[dayOfYear % FUN_LAB_CHALLENGE_IDS.length]!;
}

export function resolveChallenge(id: string | undefined) {
  return FUN_LAB_CHALLENGES.find((c) => c.id === id) ?? FUN_LAB_CHALLENGES[0]!;
}
