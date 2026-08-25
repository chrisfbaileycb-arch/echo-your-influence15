import { createServerFn } from "@tanstack/react-start";
import { requireCloudAuth } from "@/lib/cloud/auth-middleware";

/** Cosmetic gate state for the shell. Enforcement stays server-side per mutation. */
export const getCustomerZeroState = createServerFn({ method: "GET" })
  .middleware([requireCloudAuth])
  .handler(async ({ context }) => {
    const { customerZeroState } = await import("@/lib/customer-zero.server");
    return customerZeroState(context.userId);
  });
