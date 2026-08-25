/**
 * Same-origin media proxy for the Share Sheet Hand-Off Engine.
 *
 * Rendering providers serve videos from origins that do not send CORS headers,
 * so the browser cannot read those bytes into a File for navigator.share().
 * This route re-serves the asset same-origin after verifying the caller owns it.
 */
import { createFileRoute } from "@tanstack/react-router";
import { cloudAdmin } from "@/lib/cloud/client.server";

export const Route = createFileRoute("/api/media/$variantId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const url = new URL(request.url);
        const token =
          request.headers.get("authorization")?.replace("Bearer ", "") ??
          url.searchParams.get("token") ??
          "";
        if (!token) return new Response("Unauthorized", { status: 401 });

        const { data, error } = await cloudAdmin.auth.getClaims(token);
        const userId = data?.claims?.sub;
        if (error || !userId) return new Response("Unauthorized", { status: 401 });

        const { resolveVariantMedia } = await import("@/lib/social/handoff.server");
        const mediaUrl = await resolveVariantMedia(userId, params.variantId);
        if (!mediaUrl) return new Response("Not found", { status: 404 });

        const upstream = await fetch(mediaUrl);
        if (!upstream.ok || !upstream.body) {
          return new Response("Upstream media unavailable", { status: 502 });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": upstream.headers.get("content-type") ?? "video/mp4",
            "Cache-Control": "private, max-age=300",
            "Content-Disposition": `attachment; filename="influencer-echo-${params.variantId}.mp4"`,
          },
        });
      },
    },
  },
});
