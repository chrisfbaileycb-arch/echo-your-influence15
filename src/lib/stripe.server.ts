import Stripe from "stripe";

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

export type StripeEnv = "sandbox" | "live";

const GATEWAY_STRIPE_BASE = process.env.STRIPE_GATEWAY_URL || "";

export function getConnectionApiKey(env: StripeEnv): string {
  return env === "sandbox" ? getEnv("STRIPE_SANDBOX_API_KEY") : getEnv("STRIPE_LIVE_API_KEY");
}

export function createStripeClient(env: StripeEnv): Stripe {
  const secretKey =
    process.env.STRIPE_SECRET_KEY ||
    process.env[env === "sandbox" ? "STRIPE_SANDBOX_API_KEY" : "STRIPE_LIVE_API_KEY"];
  if (!secretKey) throw new Error("Stripe secret key not configured");

  const gatewayBase = process.env.STRIPE_GATEWAY_URL;
  if (!gatewayBase) {
    return new Stripe(secretKey);
  }

  const apiKey = process.env.GATEWAY_API_KEY || "default_key";
  return new Stripe(secretKey, {
    httpClient: Stripe.createFetchHttpClient((input, init) => {
      const stripeUrl = input instanceof Request ? input.url : input.toString();
      const gatewayUrl = stripeUrl.replace("https://api.stripe.com", gatewayBase);
      const headers = new Headers(
        init?.headers ?? (input instanceof Request ? input.headers : undefined),
      );
      headers.set("X-Connection-Api-Key", secretKey);
      headers.set("Gateway-API-Key", apiKey);
      return fetch(gatewayUrl, {
        ...init,
        headers,
      });
    }),
  });
}

export function getStripeErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as {
      message?: string;
      raw?: { message?: string; code?: string; type?: string };
    };
    const message = e.raw?.message ?? e.message;
    if (message) return message;
  }
  return "Stripe request failed";
}

export function getWebhookSecret(env: StripeEnv): string {
  return env === "sandbox"
    ? getEnv("PAYMENTS_SANDBOX_WEBHOOK_SECRET")
    : getEnv("PAYMENTS_LIVE_WEBHOOK_SECRET");
}
