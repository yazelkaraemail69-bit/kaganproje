import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getPaymentRequest,
  savePaymentRequest,
} from "@/lib/billing/payment-requests";
import { resolveIyzicoLinkForRequest } from "@/lib/billing/iyzico-links";
import { isSmtpConfigured, sendPaymentLinkEmail } from "@/lib/billing/mail";

function adminSecretOk(request: Request): boolean {
  const secret = process.env.BILLING_ADMIN_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("x-admin-secret")?.trim();
  return Boolean(header && header === secret);
}

const schema = z.object({
  requestId: z.string().min(1),
  /** İyzico Link URL — yoksa env'deki paket linki kullanılır */
  iyzicoLink: z.string().url().optional(),
});

/**
 * POST /api/billing/send-link
 * Header: x-admin-secret
 * Body: { requestId, iyzicoLink? }
 *
 * Müşterinin kayıt e-postasına (Gmail) İyzico ödeme linkini gönderir.
 * Linki henüz env'ye koymadıysanız body.iyzicoLink ile tek seferlik gönderin.
 */
export async function POST(request: Request) {
  if (!adminSecretOk(request)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  if (!isSmtpConfigured()) {
    return NextResponse.json(
      {
        error:
          "SMTP yok. Gmail uygulama şifresi ile .env.local içine SMTP_USER ve SMTP_PASS ekleyin.",
      },
      { status: 503 }
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
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const req = await getPaymentRequest(parsed.data.requestId);
  if (!req) {
    return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
  }
  if (req.status !== "pending") {
    return NextResponse.json(
      { error: `Talep durumu gönderime uygun değil: ${req.status}` },
      { status: 400 }
    );
  }

  const link = resolveIyzicoLinkForRequest(req, parsed.data.iyzicoLink);
  if (!link) {
    return NextResponse.json(
      {
        error:
          "İyzico linki yok. Body'ye iyzicoLink ekleyin veya .env.local'de IYZICO_LINK_* tanımlayın.",
      },
      { status: 400 }
    );
  }

  const sent = await sendPaymentLinkEmail(req, link);
  if (!sent.ok) {
    req.emailError = sent.error;
    req.updatedAt = new Date().toISOString();
    await savePaymentRequest(req);
    return NextResponse.json({ error: sent.error }, { status: 502 });
  }

  req.iyzicoLink = link;
  req.emailSentAt = new Date().toISOString();
  req.emailError = undefined;
  req.updatedAt = new Date().toISOString();
  await savePaymentRequest(req);

  return NextResponse.json({
    ok: true,
    to: req.email,
    requestId: req.id,
    message: `Ödeme linki ${req.email} adresine gönderildi.`,
  });
}
