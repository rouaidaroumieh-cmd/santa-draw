/** Shared demo roster for Fun Lab prototypes (local-only, no server). */

export const DEMO_PARTICIPANTS = [
  { name: "yann", photo: "/elfs/yann.jpeg" },
  { name: "eliane", photo: "/elfs/eliane.jpeg" },
  { name: "maroun", photo: "/elfs/maroun.jpeg" },
  { name: "sarah", photo: "/elfs/sarah.jpeg" },
  { name: "joseph", photo: "/elfs/joseph.jpeg" },
  { name: "yara mezher", photo: "/elfs/yara-m.jpeg" },
  { name: "christina", photo: "/elfs/christina.jpeg" },
  { name: "georges", photo: "/elfs/georges.jpeg" },
  { name: "karen", photo: "/elfs/karen.jpeg" },
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
