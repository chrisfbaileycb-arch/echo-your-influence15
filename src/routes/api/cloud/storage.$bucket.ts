import { createFileRoute } from "@tanstack/react-router";
import { cloudStore } from "@/lib/cloud/store.server";

export const Route = createFileRoute("/api/cloud/storage/$bucket")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        try {
          const bucket = params.bucket;
          const url = new URL(request.url);
          const path = url.searchParams.get("path") || "";
          const file = cloudStore.getStorage(bucket, path);

          if (!file) {
            return new Response("File not found in cloud storage", { status: 404 });
          }

          if (file.dataUrl.startsWith("data:")) {
            const base64Part = file.dataUrl.split(",")[1];
            const buffer = Buffer.from(base64Part, "base64");
            return new Response(buffer, {
              headers: {
                "Content-Type": file.contentType,
                "Cache-Control": "public, max-age=86400",
              },
            });
          }

          return Response.redirect(file.dataUrl, 302);
        } catch (err) {
          return new Response((err as Error).message, { status: 500 });
        }
      },
      POST: async ({ params, request }) => {
        try {
          const bucket = params.bucket;
          const body = (await request.json()) as {
            path: string;
            dataUrl: string;
            contentType?: string;
          };

          cloudStore.putStorage(bucket, body.path, {
            name: body.path.split("/").pop() || "file",
            bucket,
            storagePath: body.path,
            dataUrl: body.dataUrl,
            contentType: body.contentType || "application/octet-stream",
            size: body.dataUrl.length,
            created_at: new Date().toISOString(),
          });

          return new Response(
            JSON.stringify({
              data: {
                path: `${bucket}/${body.path}`,
                url: `/api/cloud/storage/${bucket}?path=${encodeURIComponent(body.path)}`,
              },
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
        }
      },
    },
  },
});
