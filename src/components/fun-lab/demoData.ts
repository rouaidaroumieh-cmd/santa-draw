/** Shared demo roster for Fun Lab prototypes — same 20 as the campaign. */

export const DEMO_PARTICIPANTS = [
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

export type DemoName = (typeof DEMO_PARTICIPANTS)[number]["name"];

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}
