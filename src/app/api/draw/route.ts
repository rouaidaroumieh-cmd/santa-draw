import { performDraw } from "@/server/campaign";
import { errorResponse, handle, json, readJsonBody, requireAdmin } from "@/server/http";

export const dynamic = "force-dynamic";

/** Reveals and locks one day's winners. Organiser only. */
export const POST = handle(async (request: Request) => {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJsonBody(request);
  if (!body || typeof body.date !== "string") return errorResponse("A date is required.", 400);

  const result = await performDraw(body.date);
  return result.ok ? json(result) : errorResponse(result.error, result.status);
});
