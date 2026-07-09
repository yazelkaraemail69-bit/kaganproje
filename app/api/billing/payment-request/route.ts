import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionAccount } from "@/lib/auth/session";
import { PLANS, CREDIT_PACKS, type BillingPeriod, type PaidPlanId } from "@/lib/billing/plans";
import { createPaymentRequest, savePaymentRequest } from "@/lib/billing/payment-requests";
import { updateAccount } from "@/lib/account-store";
import { resolveIyzicoLinkForRequest } from "@/lib/billing/iyzico-links";
import {
  isSmtpConfigured,
  notifyOwnerNewRequest,
  sendPaymentLinkEmail,
} from "@/lib/billing/mail";

const schema = z.object({
  kind: z.enum(["plan", "credits"]),
  planId: z.enum(["starter", "business", "pro"]).optional(),
  period: z.enum(["monthly", "quarterly"]).optional(),
  creditPackId: z.string().optional(),
  phone: z.string().max(40).optional(),
  note: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const session = await getSessionAccount();
  if (!session) {
    return NextResponse.json(
      { error: "Ödeme talebi için giriş yapmalısınız. /hesap sayfasından kayıt olun." },
      { status: 401 }
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
    return NextResponse.json({ error: "Geçersiz talep." }, { status: 400 });
  }

  const { kind, phone, note } = parsed.data;
  let amountTry = 0;
  let planId: PaidPlanId | undefined;
  let period: BillingPeriod | undefined;
  let creditPackId: string | undefined;
  let credits: number | undefined;

  if (kind === "plan") {
    planId = parsed.data.planId ?? "business";
    period = parsed.data.period ?? "monthly";
    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: "Plan bulunamadı." }, { status: 400 });
    }
    amountTry = plan.prices[period];
  } else {
    creditPackId = parsed.data.creditPackId ?? "credits_100";
    const pack = CREDIT_PACKS.find((p) => p.id === creditPackId);
    if (!pack) {
      return NextResponse.json({ error: "Kredi paketi bulunamadı." }, { status: 400 });
    }
    amountTry = pack.priceTry;
    credits = pack.credits;
  }

  let paymentRequest = await createPaymentRequest({
    kind,
    accountId: session.id,
    email: session.email,
    name: session.name,
    phone,
    note,
    planId,
    period,
    creditPackId,
    amountTry,
    credits,
  });

  await updateAccount(session.id, { subscriptionStatus: "pending_payment" });

  const iyzicoLink = resolveIyzicoLinkForRequest(paymentRequest);
  let emailSent = false;
  let emailNote = "";

  if (iyzicoLink) {
    paymentRequest.iyzicoLink = iyzicoLink;
    if (isSmtpConfigured()) {
      const sent = await sendPaymentLinkEmail(paymentRequest, iyzicoLink);
      if (sent.ok) {
        emailSent = true;
        paymentRequest.emailSentAt = new Date().toISOString();
        emailNote = `Ödeme linki ${session.email} adresine gönderildi.`;
      } else {
        paymentRequest.emailError = sent.error;
        emailNote = `Link hazır ama e-posta gönderilemedi: ${sent.error}`;
      }
    } else {
      emailNote =
        "İyzico linki tanımlı; Gmail SMTP (SMTP_USER / SMTP_PASS) eklenince otomatik mail açılır. Şimdilik WhatsApp ile iletilecek.";
    }
    paymentRequest.updatedAt = new Date().toISOString();
    await savePaymentRequest(paymentRequest);
  } else {
    emailNote =
      "Talebiniz kaydedildi. İyzico linki eklendiğinde e-postanıza otomatik gönderilecek (veya WhatsApp: 05447610802).";
  }

  try {
    await notifyOwnerNewRequest(paymentRequest, iyzicoLink);
  } catch (error) {
    console.error("Owner notify failed:", error);
  }

  const contact = process.env.BILLING_CONTACT_WHATSAPP?.trim() || "05447610802";

  return NextResponse.json({
    request: {
      id: paymentRequest.id,
      kind: paymentRequest.kind,
      amountTry: paymentRequest.amountTry,
      status: paymentRequest.status,
      emailSent,
    },
    emailSent,
    message: emailSent
      ? emailNote
      : `${emailNote} Destek: WhatsApp ${contact}`,
  });
}
