import { listFunLabPins } from "@/server/fun-lab-auth";
import { errorResponse, handle, json, requireAdmin } from "@/server/http";

export const dynamic = "force-dynamic";

/** Organiser only: list the stable name → PIN pairs to share privately. */
export const GET = handle(async () => {
  const denied = await requireAdmin();
  if (denied) return denied;
  const pins = listFunLabPins();
  if (!pins) return errorResponse("Fun Lab PIN auth is not configured.", 503);
  return json({ ok: true, pins });
});
