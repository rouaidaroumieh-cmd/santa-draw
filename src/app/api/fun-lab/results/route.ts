import { handle, json } from "@/server/http";
import { loadFunLabPublicResults } from "@/server/fun-lab";

export const dynamic = "force-dynamic";

/** Public aggregates for home widgets — no PIN required. */
export const GET = handle(async () => {
  const results = await loadFunLabPublicResults();
  return json({ ok: true, results });
});
