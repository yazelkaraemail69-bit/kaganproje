import type { BillingPeriod, PaidPlanId } from "@/lib/billing/plans";
import type { PaymentRequest } from "@/lib/billing/payment-requests";

/**
 * İyzico Link URL çözümleme.
 * Öncelik: talebe özel link > paket env > IYZICO_LINK_DEFAULT
 */
export function resolveIyzicoLink(input: {
  kind: "plan" | "credits";
  planId?: PaidPlanId;
  period?: BillingPeriod;
  creditPackId?: string;
  override?: string;
}): string | null {
  const override = input.override?.trim();
  if (override) return override;

  if (input.kind === "plan" && input.planId && input.period) {
    const key = `IYZICO_LINK_${input.planId.toUpperCase()}_${input.period.toUpperCase()}`;
    const fromEnv = process.env[key]?.trim();
    if (fromEnv) return fromEnv;
  }

  if (input.kind === "credits" && input.creditPackId) {
    const suffix = input.creditPackId.replace("credits_", "").toUpperCase();
    const key = `IYZICO_LINK_CREDITS_${suffix}`;
    const fromEnv = process.env[key]?.trim();
    if (fromEnv) return fromEnv;
  }

  return process.env.IYZICO_LINK_DEFAULT?.trim() || null;
}

export function resolveIyzicoLinkForRequest(
  req: PaymentRequest,
  override?: string
): string | null {
  return resolveIyzicoLink({
    kind: req.kind,
    planId: req.planId,
    period: req.period,
    creditPackId: req.creditPackId,
    override: override || req.iyzicoLink,
  });
}
