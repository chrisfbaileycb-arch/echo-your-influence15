export const KEY_PROVIDERS = ["gemini", "openai", "firecrawl", "heygen", "minimax", "ayrshare", "apollo"] as const;
const STORAGE_KEY = "echo-byok-session-v1";
export type BrowserKeys = Partial<Record<string, string>>;

export function readBrowserKeys(): BrowserKeys {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}

export function saveBrowserKeys(keys: BrowserKeys) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function browserKeyHeaders(): Record<string, string> {
  const keys = readBrowserKeys();
  const headers: Record<string, string> = {};
  for (const provider of KEY_PROVIDERS) {
    if (keys[provider]) headers[`x-echo-key-${provider}`] = keys[provider];
    const model = keys[`model-${provider}`];
    if (model) headers[`x-echo-model-${provider}`] = model;
  }
  return headers;
}

let installed = false;
export function installBrowserKeys() {
  if (typeof window === "undefined" || installed) return;
  installed = true;
  const original = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input), window.location.href);
    if (url.origin !== window.location.origin || !["/api/", "/_server/"].some(prefix => url.pathname.startsWith(prefix))) {
      return original(input, init);
    }
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    for (const [name, value] of Object.entries(browserKeyHeaders())) headers.set(name, value);
    // Never forward these headers across an HTTP redirect.
    return original(input, { ...init, headers, redirect: "error" });
  };
}
