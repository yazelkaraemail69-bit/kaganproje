import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccountById, updateAccount } from "@/lib/account-store";
import { getSessionAccount } from "@/lib/auth/session";
import { getPlanLimits } from "@/lib/domains/account/plan";
import { toPublicAccount } from "@/lib/domains/account/types";

const schema = z.object({
  crmWebhookUrl: z.string().url().or(z.literal("")).optional(),
  crmEvents: z.array(z.enum(["view", "publish", "contact_save"])).optional(),
});

export async function PUT(request: Request) {
  const session = await getSessionAccount();
  if (!session) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  const limits = getPlanLimits(session.plan);
  if (!limits.crmWebhook) {
    return NextResponse.json(
      { error: "CRM webhook Pro plana özeldir. Lütfen yükseltin." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz CRM ayarları." }, { status: 400 });
  }

  const account = await updateAccount(session.id, {
    crmWebhookUrl: parsed.data.crmWebhookUrl?.trim() || undefined,
    crmEvents: parsed.data.crmEvents,
  });

  if (!account) {
    return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ account: toPublicAccount(account) });
}

export async function GET() {
  const session = await getSessionAccount();
  if (!session) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }
  const account = await getAccountById(session.id);
  if (!account) {
    return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });
  }
  return NextResponse.json({
    crmWebhookUrl: account.crmWebhookUrl ?? "",
    crmEvents: account.crmEvents ?? ["view", "publish", "contact_save"],
    enabled: getPlanLimits(account.plan).crmWebhook,
  });
}
