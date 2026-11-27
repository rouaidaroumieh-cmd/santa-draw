import { isAdminRequest } from "./auth";

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function errorResponse(error: string, status: number): Response {
  return json({ ok: false, error }, status);
}

/** Wraps a route handler so unexpected failures return a clean JSON 500. */
export function handle<Args extends unknown[]>(fn: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error && error.message.startsWith("Fun Lab database")
          ? error.message
          : "Something went wrong on the server.";
      return errorResponse(message, 500);
    }
  };
}

/**
 * Reads a JSON body. Requiring the JSON content type means a cross-site HTML
 * form cannot forge a request (it would need a CORS preflight first).
 */
export async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  if (!request.headers.get("content-type")?.includes("application/json")) return null;
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Returns a 401 response when the caller is not the organiser, otherwise null. */
export async function requireAdmin(): Promise<Response | null> {
  return (await isAdminRequest()) ? null : errorResponse("Organiser login required.", 401);
}

export function isSecureRequest(request: Request): boolean {
  return request.headers.get("x-forwarded-proto") === "https" || new URL(request.url).protocol === "https:";
}
