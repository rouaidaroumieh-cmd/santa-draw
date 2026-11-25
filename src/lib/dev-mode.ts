/**
 * Dev / test mode — enabled only with `NEXT_PUBLIC_DEV_MODE=true` (see `npm run dev:test`).
 *
 * It runs on a separate campaign ("dev") in the same database, and unlocks the
 * dev-only API actions (undo a draw, fill previous days). NEVER set it in production.
 */
export const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
