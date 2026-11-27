/**
 * Print stable Fun Lab name → PIN pairs.
 * Usage: node --env-file=.env.local scripts/print-fun-lab-pins.mjs
 */
import { createHmac } from "node:crypto";

const NAMES = [
  "yann",
  "samer",
  "eliane",
  "maroun",
  "sarah",
  "marie-ange",
  "maria",
  "rida",
  "cynthia",
  "joseph",
  "yara mezher",
  "christina",
  "yara kh",
  "georges",
  "karen",
  "elia",
  "pia",
  "carole",
  "lara",
  "rouaida",
];

const secret = process.env.FUN_LAB_PIN_SECRET || process.env.ADMIN_PASSWORD;
if (!secret) {
  console.error("Set ADMIN_PASSWORD or FUN_LAB_PIN_SECRET first.");
  process.exit(1);
}

function pinFor(name) {
  const digest = createHmac("sha256", secret).update(name.toLowerCase()).digest("hex");
  return String(Number.parseInt(digest.slice(0, 8), 16) % 10000).padStart(4, "0");
}

console.log("Fun Lab PINs (keep private — one per person):\n");
for (const name of NAMES) {
  console.log(`${name.padEnd(14)} ${pinFor(name)}`);
}
