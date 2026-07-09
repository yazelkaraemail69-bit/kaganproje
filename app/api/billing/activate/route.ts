import { NextResponse } from "next/server";
import { z } from "zod";
import { addCredits, updateAccount } from "@/lib/account-store";
import { applyInviteBonusOnFirstPayment } from "@/lib/billing/invite";
import { getPlan } from "@/lib/billing/plans";
import {
  getPaymentRequest,
  listPaymentRequests,
  savePaymentRequest,
} from "@/lib/billing/payment-requests";

function adminSecretOk(request: Request): boolean {
  const secret = process.env.BILLING_ADMIN_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("x-admin-secret")?.trim();
  return Boolean(header && header === secret);
}

/** GET: bekleyen ödeme talepleri (admin) */
export async function GET(request: Request) {
  if (!adminSecretOk(request)) {
    return NextResponse.json(
      {
        error:
          "Yetkisiz. .env.local içine BILLING_ADMIN_SECRET ekleyin ve x-admin-secret başlığı gönderin.",
      },
      { status: 401 }
    );
  }
  const rows = await listPaymentRequests();
  return NextResponse.json({ requests: rows });
}

const activateSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(["activate", "cancel"]).default("activate"),
});

/**
 * POST: İyzico Link ödemesi alındıktan sonra manuel aktivasyon.
 * Header: x-admin-secret: <BILLING_ADMIN_SECRET>
 * Body: { requestId, action?: "activate" | "cancel" }
 */
export async function POST(request: Request) {
  if (!adminSecretOk(request)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const parsed = activateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const req = await getPaymentRequest(parsed.data.requestId);
  if (!req) {
    return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
  }

  if (parsed.data.action === "cancel") {
    req.status = "canceled";
    req.updatedAt = new Date().toISOString();
    await savePaymentRequest(req);
    return NextResponse.json({ ok: true, request: req });
  }

  if (req.status === "paid") {
    return NextResponse.json({ ok: true, request: req, message: "Zaten aktif." });
  }

  const now = new Date();
  if (req.kind === "plan" && req.planId && req.period) {
    const plan = getPlan(req.planId);
    if (!plan) {
      return NextResponse.json({ error: "Plan tanımsız." }, { status: 400 });
    }
    const days = req.period === "monthly" ? 30 : 90;
    const expires = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    await updateAccount(req.accountId, {
      plan: req.planId,
      billingPeriod: req.period,
      subscriptionStatus: "active",
      planExpiresAt: expires.toISOString(),
      paymentMethod: "iyzico_link",
      credits: plan.monthlyCredits,
    });
    await applyInviteBonusOnFirstPayment(req.accountId);
  } else if (req.kind === "credits" && req.credits) {
    await addCredits(req.accountId, req.credits);
  } else {
    return NextResponse.json({ error: "Talep eksik alan içeriyor." }, { status: 400 });
  }

  req.status = "paid";
  req.activatedAt = now.toISOString();
  req.updatedAt = now.toISOString();
  await savePaymentRequest(req);

  return NextResponse.json({
    ok: true,
    request: req,
    message: "Ödeme onaylandı; hesap güncellendi.",
  });
}
