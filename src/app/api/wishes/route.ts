import { isAdminRequest } from "@/server/auth";
import { addWish, approvedWishes, pendingWishes } from "@/server/wishes";
import { errorResponse, handle, json, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

/** Approved wishes for everyone; the organiser also receives the pending ones. */
export const GET = handle(async () => {
  const admin = await isAdminRequest();
  const [approved, pending] = await Promise.all([approvedWishes(), admin ? pendingWishes() : Promise.resolve([])]);
  return json({ ok: true, approved, pending });
});

/** A visitor leaves a wish. It stays hidden until the organiser approves it. */
export const POST = handle(async (request: Request) => {
  const body = await readJsonBody(request);
  if (!body) return errorResponse("Please send your wish as JSON.", 400);

  const result = await addWish(body.author, body.message);
  return result.ok ? json({ ok: true }) : errorResponse(result.error, result.status);
});
