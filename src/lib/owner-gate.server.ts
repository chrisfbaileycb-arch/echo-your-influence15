import { createHmac, timingSafeEqual } from "node:crypto";

function equal(a: string, b: string) {
  const left = Buffer.from(a); const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function signature(value: string, password: string) {
  return createHmac("sha256", password).update(`echo-owner:${value}`).digest("hex");
}

const page = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Echo — Agency Workspace</title><style>body{margin:0;background:#101421;color:#edf0fc;font:17px system-ui;display:grid;min-height:100vh;place-items:center}main{width:min(440px,85vw);padding:36px;background:#1b2236;border:1px solid #39415b;border-radius:22px}h1{font-size:34px}p{line-height:1.6;color:#bdc7df}input,button{box-sizing:border-box;width:100%;font:inherit;padding:14px;border-radius:10px;margin-top:12px}button{background:#a8b4ff;border:0;color:#101421;cursor:pointer}label{display:block;margin-top:24px}a{color:#b8c3ff}</style><main><p>CHRIS’S AGENCY WORKSPACE</p><h1>Echo Your Influence</h1><p>Your private marketing workflow testing platform. Connect your own provider keys inside Settings → Integrations after unlocking.</p><form action="/owner-login" method="post"><label for="password">Workspace owner password</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="500"><button>Open workspace</button></form><p>No AI provider key is included in this deployment.</p></main></html>`;

export async function ownerGate(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const headers = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
  if (url.pathname === "/health") return new Response("ok", { headers: { "Content-Type": "text/plain" } });
  if (url.pathname === "/welcome") return new Response(page, { headers });
  const password = process.env.OWNER_PASSWORD;
  if (!password) return new Response("Workspace owner password must be configured before access is enabled.", { status: 503, headers });
  if (url.pathname === "/owner-login" && request.method === "POST") {
    if (request.headers.get("origin") !== url.origin) return new Response("Forbidden", { status: 403 });
    const form = new URLSearchParams(await request.text());
    if (!equal(form.get("password") || "", password)) return new Response(page.replace("Workspace owner password", "Incorrect password. Try again."), { status: 401, headers });
    const expires = String(Date.now() + 12 * 60 * 60 * 1000);
    return new Response(null, { status: 303, headers: { Location: "/dashboard", "Cache-Control": "no-store", "Set-Cookie": `echo_owner=${expires}.${signature(expires, password)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200` } });
  }
  const cookie = request.headers.get("cookie")?.split(";").map(value => value.trim()).find(value => value.startsWith("echo_owner="))?.slice(11) || "";
  const [expires, sig = ""] = cookie.split(".");
  if (Number(expires) > Date.now() && equal(sig, signature(expires, password))) {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && request.headers.get("origin") !== url.origin) return new Response("Forbidden", { status: 403 });
    return null;
  }
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_server/")) return new Response(JSON.stringify({ error: "Unlock the owner workspace first." }), { status: 401, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  return new Response(page, { headers });
}
