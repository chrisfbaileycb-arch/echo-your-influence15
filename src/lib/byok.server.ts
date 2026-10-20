import { getRequestHeader } from "@tanstack/react-start/server";

const providers = ["gemini", "openai", "firecrawl", "heygen", "minimax", "ayrshare", "apollo"] as const;
export type KeyProvider = (typeof providers)[number];

export function providerKey(provider: KeyProvider): string {
  const value = getRequestHeader(`x-echo-key-${provider}`)?.trim() || "";
  if (value.length > 500 || /[\r\n]/.test(value)) throw new Error("Invalid provider key.");
  return value;
}

export function requireProviderKey(provider: KeyProvider): string {
  const value = providerKey(provider);
  if (!value) throw new Error(`Connect your ${provider} key in Settings → Integrations for this browser session.`);
  return value;
}

export function textProvider(): "gemini" | "openai" {
  return providerKey("gemini") ? "gemini" : "openai";
}

export function textKey(): string {
  return requireProviderKey(textProvider());
}

export function textGateway(): string {
  return textProvider() === "gemini"
    ? "https://generativelanguage.googleapis.com/v1beta/openai"
    : "https://api.openai.com/v1";
}

export function textModel(): string {
  const model = getRequestHeader(`x-echo-model-${textProvider()}`)?.trim();
  if (model && /^[a-zA-Z0-9._:/-]{1,100}$/.test(model)) return model;
  return textProvider() === "gemini" ? "gemini-2.5-flash" : "gpt-4.1-mini";
}

export function geminiModel(): string {
  const model = getRequestHeader("x-echo-model-gemini")?.trim();
  return model && /^[a-zA-Z0-9._:/-]{1,100}$/.test(model) ? model : "gemini-2.5-flash";
}
