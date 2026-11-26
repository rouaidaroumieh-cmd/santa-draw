import { addWish, approvedWishes } from "@/server/wishes";
import { errorResponse, handle, json, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

/** The wish wall, newest first. */
export const GET = handle(async () => {
  return json({ ok: true, approved: await approvedWishes() });
});

/** A visitor leaves a wish; it appears on the wall straight away. */
export const POST = handle(async (request: Request) => {
  const body = await readJsonBody(request);
  if (!body) return errorResponse("Please send your wish as JSON.", 400);

  const result = await addWish(body.author, body.message);
  return result.ok ? json({ ok: true }) : errorResponse(result.error, result.status);
});
