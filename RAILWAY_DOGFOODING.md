# Echo agency testing deployment

This is a single-owner workflow testing deployment, not a customer launch.

- Railway project: Menu-Flow, service: echo-your-influence15, branch: main.
- Public entry: `/welcome`; readiness endpoint: `/health`.
- Unlock the workspace with the existing Railway `OWNER_PASSWORD`. The server issues a signed, HttpOnly, Secure owner cookie valid for 12 hours. App demo identities are subordinate to that outer owner gate.
- In Settings → Integrations, enter provider keys. Keys live in the tab’s session storage, not environment variables or the server database. Requests relay them transiently over HTTPS. No unattended worker can use these keys after the browser session ends.
- Gemini powers Captain Echo and specialist skills. Text workflows prefer Gemini when present, otherwise OpenAI. Model IDs are editable. Images require an OpenAI key; Firecrawl, HeyGen, MiniMax, Apollo, and Ayrshare each require their own key for their respective workflows.
- Saving a key does not validate it or perform a paid request. Do not label a provider working until its actual workflow succeeds.
- Server-side outbound credential saving is disabled. The old Instantly integration has not been converted; use Apollo for browser-key testing.
- Workspace data uses `/data/.cloud_db_store.json` on a persistent Railway volume. This replaces the unusable Firestore dependency for this deployment. The file store is for a single process/replica; do not scale horizontally without migrating to a database.
- Logfire auto-instrumentation has been replaced by local message-only diagnostics to avoid capturing provider credentials.
- Legacy ADK scheduling and orchestration now fail explicitly instead of reporting fabricated execution. Social publishing and attribution still require real provider integration tests.

## Validation

`npm ci`, `npm run build`, and `npm run test:deployment`.

The tests cover owner cookie verification, unauthorized API access, write-origin checks, key forwarding boundaries, disconnecting keys, and persistent store reloads. Production-server smoke checks exercise owner login, dashboard, integrations, and the products API. The full TypeScript check still reports broader existing application type errors; a successful build does not mean every workflow has been verified. Paid provider workflows require the owner's own keys and a separate live test.
