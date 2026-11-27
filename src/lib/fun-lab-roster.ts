/** The 20 Fun Lab players — same roster as the campaign. */

export const FUN_LAB_ROSTER = [
  { name: "yann", photo: "/elfs/yann.jpeg" },
  { name: "samer", photo: "/elfs/samer.jpeg" },
  { name: "eliane", photo: "/elfs/eliane.jpeg" },
  { name: "maroun", photo: "/elfs/maroun.jpeg" },
  { name: "sarah", photo: "/elfs/sarah.jpeg" },
  { name: "marie-ange", photo: "/elfs/marie-ange.jpeg" },
  { name: "maria", photo: "/elfs/maria.jpeg" },
  { name: "rida", photo: "/elfs/rida.jpeg" },
  { name: "cynthia", photo: "/elfs/cynthia.jpeg" },
  { name: "joseph", photo: "/elfs/joseph.jpeg" },
  { name: "yara mezher", photo: "/elfs/yara-m.jpeg" },
  { name: "christina", photo: "/elfs/christina.jpeg" },
  { name: "yara kh", photo: "/elfs/yara-kh.jpeg" },
  { name: "georges", photo: "/elfs/georges.jpeg" },
  { name: "karen", photo: "/elfs/karen.jpeg" },
  { name: "elia", photo: "/elfs/elia.jpeg" },
  { name: "pia", photo: "/elfs/pia.jpeg" },
  { name: "carole", photo: "/elfs/carole.jpeg" },
  { name: "lara", photo: "/elfs/lara.jpeg" },
  { name: "rouaida", photo: "/elfs/rouaida.jpeg" },
] as const;

export type FunLabName = (typeof FUN_LAB_ROSTER)[number]["name"];

export const FUN_LAB_NAMES: readonly FunLabName[] = FUN_LAB_ROSTER.map((p) => p.name);

export function isFunLabName(value: string): value is FunLabName {
  return (FUN_LAB_NAMES as readonly string[]).includes(value);
}

export const FUN_LAB_GAMES = ["poll", "elf-vote", "most-likely"] as const;
export type FunLabGame = (typeof FUN_LAB_GAMES)[number];

export function isFunLabGame(value: string): value is FunLabGame {
  return (FUN_LAB_GAMES as readonly string[]).includes(value);
}
