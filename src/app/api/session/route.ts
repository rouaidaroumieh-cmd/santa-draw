import { endAdminSession, isAuthConfigured, startAdminSession, verifyPassword } from "@/server/auth";
import { errorResponse, handle, isSecureRequest, json, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

/** Organiser login. */
export const POST = handle(async (request: Request) => {
  if (!isAuthConfigured()) {
    return errorResponse("ADMIN_PASSWORD is not configured on the server.", 503);
  }
  const body = await readJsonBody(request);
  if (!body || typeof body.password !== "string") return errorResponse("A password is required.", 400);

  if (!verifyPassword(body.password)) {
    await new Promise((resolve) => setTimeout(resolve, 600)); // slow down guessing
    return errorResponse("Wrong password.", 401);
  }
  await startAdminSession(isSecureRequest(request));
  return json({ ok: true });
});

/** Organiser logout. */
export const DELETE = handle(async () => {
  await endAdminSession();
  return json({ ok: true });
});
