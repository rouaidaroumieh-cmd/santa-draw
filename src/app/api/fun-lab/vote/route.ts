import { getFunLabSessionName } from "@/server/fun-lab-auth";
import { loadFunLabState, saveFunLabVote } from "@/server/fun-lab";
import { errorResponse, handle, json, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

export const POST = handle(async (request: Request) => {
  const name = await getFunLabSessionName();
  if (!name) return errorResponse("Please unlock Fun Lab with your name and PIN first.", 401);

  const body = await readJsonBody(request);
  if (!body) return errorResponse("Please send your vote as JSON.", 400);

  const game = typeof body.game === "string" ? body.game : "";
  const result = await saveFunLabVote(name, game, body.value);
  if (!result.ok) return errorResponse(result.error, result.status);

  const state = await loadFunLabState(name);
  return json({ ok: true, name, state });
});
