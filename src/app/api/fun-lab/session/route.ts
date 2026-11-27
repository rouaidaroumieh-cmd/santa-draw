import { isFunLabName } from "@/lib/fun-lab-roster";
import {
  endFunLabSession,
  getFunLabSessionName,
  isFunLabAuthConfigured,
  startFunLabSession,
  verifyFunLabPin,
} from "@/server/fun-lab-auth";
import { errorResponse, handle, isSecureRequest, json, readJsonBody } from "@/server/http";
import { loadFunLabState } from "@/server/fun-lab";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  if (!isFunLabAuthConfigured()) {
    return errorResponse("Fun Lab PIN auth is not configured (set ADMIN_PASSWORD or FUN_LAB_PIN_SECRET).", 503);
  }
  const name = await getFunLabSessionName();
  const state = await loadFunLabState(name);
  return json({ ok: true, name, state });
});

export const POST = handle(async (request: Request) => {
  if (!isFunLabAuthConfigured()) {
    return errorResponse("Fun Lab PIN auth is not configured (set ADMIN_PASSWORD or FUN_LAB_PIN_SECRET).", 503);
  }
  const body = await readJsonBody(request);
  if (!body) return errorResponse("Please send your login as JSON.", 400);

  const name = typeof body.name === "string" ? body.name.trim().toLowerCase() : "";
  const pin = typeof body.pin === "string" ? body.pin.trim() : "";
  if (!isFunLabName(name)) return errorResponse("Unknown participant name.", 400);
  if (!/^\d{4}$/.test(pin)) return errorResponse("PIN must be 4 digits.", 400);
  if (!verifyFunLabPin(name, pin)) return errorResponse("Wrong PIN for this name.", 401);

  const started = await startFunLabSession(name, isSecureRequest(request));
  if (!started) return errorResponse("Could not start the Fun Lab session.", 500);

  const state = await loadFunLabState(name);
  return json({ ok: true, name, state });
});

export const DELETE = handle(async () => {
  await endFunLabSession();
  return json({ ok: true });
});
