/**
 * Unbiased randomness for the draw engine.
 *
 * Primary source : Web Crypto API (`crypto.getRandomValues`) — available in every
 *                  modern browser and in Node 18+ (globalThis.crypto).
 * Fallback       : `Math.random()`, used only when Web Crypto is unavailable
 *                  (very old browsers, or a hardened file:// context). The
 *                  fallback is documented in the README.
 *
 * Both paths use rejection sampling so the modulo bias never skews the result.
 */

function cryptoAvailable(): boolean {
  return (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.getRandomValues === "function"
  );
}

export function usingSecureRandom(): boolean {
  return cryptoAvailable();
}

/** Uniform integer in [0, max). Rejection-sampled, unbiased. */
export function randomInt(max: number): number {
  if (max <= 0) return 0;
  if (max === 1) return 0;

  if (cryptoAvailable()) {
    // Rejection sampling over 32-bit values to avoid modulo bias.
    const limit = Math.floor(0xffffffff / max) * max;
    const buf = new Uint32Array(1);
    let value = 0;
    for (let guard = 0; guard < 64; guard++) {
      globalThis.crypto.getRandomValues(buf);
      value = buf[0];
      if (value < limit) return value % max;
    }
    return value % max;
  }

  // Documented fallback: Math.random with the same rejection sampling.
  const limit = Math.floor(0xffffffff / max) * max;
  for (let guard = 0; guard < 64; guard++) {
    const value = Math.floor(Math.random() * 0x100000000);
    if (value < limit) return value % max;
  }
  return Math.floor(Math.random() * max);
}

export function randomFloat(): number {
  if (cryptoAvailable()) {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0] / 0x100000000;
  }
  return Math.random();
}

/** Fisher–Yates shuffle returning a new array (unbiased). */
export function shuffle<T>(items: readonly T[]): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/** Picks one element from a weighted pool: `weights[i]` is the relative weight of `items[i]`. */
export function weightedPick<T>(items: readonly T[], weights: readonly number[]): T | null {
  if (items.length === 0) return null;
  let total = 0;
  for (const w of weights) total += Math.max(0, w);
  if (total <= 0) return items[randomInt(items.length)];

  let r = randomFloat() * total;
  for (let i = 0; i < items.length; i++) {
    r -= Math.max(0, weights[i]);
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
