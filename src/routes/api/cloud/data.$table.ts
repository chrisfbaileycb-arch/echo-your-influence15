import { createFileRoute } from "@tanstack/react-router";
import { cloudAdmin } from "@/lib/cloud/client.server";
import type { TableName } from "@/lib/cloud/types";

export const Route = createFileRoute("/api/cloud/data/$table")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        try {
          const table = params.table as TableName;
          const url = new URL(request.url);
          const limitParam = url.searchParams.get("limit");
          const orderParam = url.searchParams.get("order");
          const singleParam = url.searchParams.get("single");

          let query = cloudAdmin.from(table).select("*");

          // Extract query filters from URL search params
          for (const [key, val] of url.searchParams.entries()) {
            if (["limit", "order", "single"].includes(key)) continue;
            query = query.eq(key, val);
          }

          if (orderParam) {
            query = query.order(orderParam, { ascending: true });
          }
          if (limitParam) {
            query = query.limit(parseInt(limitParam, 10));
          }

          if (singleParam === "true") {
            const { data, error } = await query.maybeSingle();
            if (error)
              return new Response(JSON.stringify({ error: error.message }), { status: 400 });
            return new Response(JSON.stringify({ data }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          const { data, error } = await query;
          if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

          return new Response(JSON.stringify({ data }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
        }
      },
      POST: async ({ params, request }) => {
        try {
          const table = params.table as TableName;
          const body = (await request.json()) as {
            action?: "insert" | "update" | "delete" | "upsert";
            payload?: unknown;
            filters?: Array<{ field: string; operator: string; value: unknown }>;
          };

          const action = body.action || "insert";

          if (action === "insert") {
            const { data, error } = await cloudAdmin.from(table).insert(body.payload);
            if (error)
              return new Response(JSON.stringify({ error: error.message }), { status: 400 });
            return new Response(JSON.stringify({ data }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          if (action === "update") {
            let query = cloudAdmin.from(table).update(body.payload);
            if (body.filters) {
              for (const f of body.filters) {
                if (f.operator === "eq") query = query.eq(f.field, f.value);
              }
            }
            const { data, error } = await query;
            if (error)
              return new Response(JSON.stringify({ error: error.message }), { status: 400 });
            return new Response(JSON.stringify({ data }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          if (action === "delete") {
            let query = cloudAdmin.from(table).delete();
            if (body.filters) {
              for (const f of body.filters) {
                if (f.operator === "eq") query = query.eq(f.field, f.value);
              }
            }
            const { data, error } = await query;
            if (error)
              return new Response(JSON.stringify({ error: error.message }), { status: 400 });
            return new Response(JSON.stringify({ data }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          if (action === "upsert") {
            const { data, error } = await cloudAdmin.from(table).upsert(body.payload);
            if (error)
              return new Response(JSON.stringify({ error: error.message }), { status: 400 });
            return new Response(JSON.stringify({ data }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
        } catch (err) {
          return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
        }
      },
    },
  },
});
