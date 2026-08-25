import { createServerFn } from "@tanstack/react-start";
import { requireCloudAuth } from "@/lib/cloud/auth-middleware";

export const getMyReferralStats = createServerFn({ method: "GET" })
  .middleware([requireCloudAuth])
  .handler(async ({ context }) => {
    const { cloud, userId } = context;
    const [profileRes, convsRes] = await Promise.all([
      cloud.from("profiles").select("referral_code").eq("id", userId).maybeSingle(),
      cloud
        .from("referral_conversions")
        .select("credited_cents, currency, credited_at, created_at")
        .eq("referrer_id", userId),
    ]);
    const conversions = convsRes.data ?? [];
    const totalCents = conversions.reduce((sum, c) => sum + (c.credited_cents ?? 0), 0);
    const pendingCount = conversions.filter((c) => !c.credited_at).length;
    return {
      referralCode: profileRes.data?.referral_code ?? null,
      conversionCount: conversions.length,
      pendingCount,
      totalCreditedCents: totalCents,
      currency: conversions[0]?.currency ?? "usd",
    };
  });
