import { createFileRoute } from "@tanstack/react-router";
import crypto from "node:crypto";
import { cloudAdmin } from "@/lib/cloud/client.server";

export const Route = createFileRoute("/api/cloud/auth")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as {
            action?: "signin" | "signup" | "signout" | "session";
            email?: string;
            password?: string;
            token?: string;
          };

          const action = body.action || "session";

          if (action === "signin" || action === "signup") {
            const email = body.email || "demo@echoyourinfluence.com";
            const userId = `user_${crypto.randomBytes(6).toString("hex")}`;
            const token = `cloud_token_${crypto.randomBytes(16).toString("hex")}`;

            // Ensure profile and personal workspace
            await cloudAdmin.rpc("provision_personal_org", {
              _user_id: userId,
              _name: `${email.split("@")[0]}'s workspace`,
            });

            return new Response(
              JSON.stringify({
                data: {
                  session: {
                    access_token: token,
                    refresh_token: `cloud_refresh_${crypto.randomBytes(16).toString("hex")}`,
                    expires_in: 86400 * 30,
                    token_type: "bearer",
                    user: {
                      id: userId,
                      email,
                      user_metadata: { name: email.split("@")[0] },
                      created_at: new Date().toISOString(),
                    },
                  },
                },
              }),
              { headers: { "Content-Type": "application/json" } },
            );
          }

          return new Response(JSON.stringify({ data: { ok: true } }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
        }
      },
    },
  },
});
