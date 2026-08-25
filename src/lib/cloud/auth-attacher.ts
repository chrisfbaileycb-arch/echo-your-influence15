import { createMiddleware } from "@tanstack/react-start";
import { cloudAuth } from "./client";

export const attachCloudAuth = createMiddleware().client(async ({ next }) => {
  const { data } = await cloudAuth.getSession();
  const token = data.session?.access_token;
  return next({
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
});

// Backward-compatible alias
export const attachSupabaseAuth = attachCloudAuth;
