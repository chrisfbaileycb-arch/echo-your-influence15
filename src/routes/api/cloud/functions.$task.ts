import { createFileRoute } from "@tanstack/react-router";
import { cloudAdmin } from "@/lib/cloud/client.server";
import { cloudADK } from "@/lib/cloud/adk.server";
import type { ADKTaskPayload } from "@/lib/cloud/types";

export const Route = createFileRoute("/api/cloud/functions/$task")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        try {
          const taskName = params.task;
          const body = (await request.json().catch(() => ({}))) as any;

          // Special RPC routing
          if (taskName === "rpc") {
            const { rpc, args } = body;
            const result = await cloudAdmin.rpc(rpc, args);
            return new Response(JSON.stringify(result), {
              headers: { "Content-Type": "application/json" },
            });
          }

          // Autonomous agent ADK execution
          const adkPayload: ADKTaskPayload = {
            task: (taskName as any) || "adk_execute",
            userId: body.userId,
            orgId: body.orgId,
            parameters: body.parameters || body,
          };

          const result = await cloudADK.executeTask(adkPayload);

          return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
        }
      },
    },
  },
});
