import type { AccountRecord } from "@/lib/domains/account/types";
import { getPlanLimits } from "@/lib/domains/account/plan";

export type CrmEventType = "view" | "publish" | "contact_save";

export interface CrmWebhookPayload {
  event: CrmEventType;
  occurredAt: string;
  profile: {
    slug: string;
    type: "card" | "catalog";
    displayName: string;
  };
  meta?: Record<string, unknown>;
}

export async function dispatchCrmWebhook(
  account: Pick<AccountRecord, "plan" | "crmWebhookUrl" | "crmEvents"> | null | undefined,
  payload: CrmWebhookPayload
): Promise<{ ok: boolean; skipped?: string; status?: number }> {
  if (!account) return { ok: false, skipped: "no_account" };

  const limits = getPlanLimits(account.plan);
  if (!limits.crmWebhook) return { ok: false, skipped: "plan" };

  const url = account.crmWebhookUrl?.trim();
  if (!url) return { ok: false, skipped: "no_url" };

  const allowed = account.crmEvents?.length ? account.crmEvents : ["view", "publish", "contact_save"];
  if (!allowed.includes(payload.event)) return { ok: false, skipped: "event_filtered" };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Kaganproje-CRM-Webhook/1.0",
        "X-Kaganproje-Event": payload.event,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false, skipped: "network_error" };
  }
}
