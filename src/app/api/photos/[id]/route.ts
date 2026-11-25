import { getPhotoDataUrl } from "@/server/campaign";
import { handle } from "@/server/http";

export const dynamic = "force-dynamic";

const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/;

/** Serves a participant photo. The `?v=` in the URL changes whenever the photo does. */
export const GET = handle(async (_request: Request, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const match = DATA_URL.exec((await getPhotoDataUrl(id)) ?? "");
  if (!match) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(Buffer.from(match[2], "base64")), {
    headers: {
      "Content-Type": match[1],
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
