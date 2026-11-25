import { isAdminRequest } from "@/server/auth";
import { getPublicState } from "@/server/campaign";
import { handle, json } from "@/server/http";

export const dynamic = "force-dynamic";

/** The public campaign state, plus whether the caller is the logged-in organiser. */
export const GET = handle(async () => {
  const state = await getPublicState();
  return json({ ok: true, state, isAdmin: await isAdminRequest() });
});
