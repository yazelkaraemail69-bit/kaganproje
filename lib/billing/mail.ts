import nodemailer from "nodemailer";
import { formatTry, getPlan, periodLabel } from "@/lib/billing/plans";
import type { PaymentRequest } from "@/lib/billing/payment-requests";
import { CREDIT_PACKS } from "@/lib/billing/plans";

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}

function getTransporter() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user, pass },
  });
}

function productLabel(req: PaymentRequest): string {
  if (req.kind === "credits") {
    const pack = CREDIT_PACKS.find((p) => p.id === req.creditPackId);
    return pack?.label ?? "Ek kredi paketi";
  }
  const plan = req.planId ? getPlan(req.planId) : null;
  const period = req.period ? periodLabel(req.period) : "";
  return `${plan?.name ?? "Abonelik"}${period ? ` · ${period}` : ""}`;
}

export function buildPaymentEmail(req: PaymentRequest, iyzicoLink: string) {
  const whatsapp = process.env.BILLING_CONTACT_WHATSAPP?.trim() || "05447610802";
  const product = productLabel(req);
  const amount = formatTry(req.amountTry);
  const subject = `KaganProje ödeme linkiniz — ${product}`;

  const text = [
    `Merhaba ${req.name},`,
    ``,
    `KaganProje ödeme talebiniz hazır.`,
    `Ürün: ${product}`,
    `Tutar: ${amount}`,
    `Talep no: ${req.id}`,
    ``,
    `Güvenli ödeme (İyzico):`,
    iyzicoLink,
    ``,
    `Ödeme sonrası planınız / krediniz kısa sürede açılır.`,
    `Sorun olursa WhatsApp: ${whatsapp}`,
    ``,
    `— KaganProje`,
  ].join("\n");

  const html = `
  <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
    <h2 style="margin:0 0 12px">Ödeme linkiniz hazır</h2>
    <p>Merhaba <strong>${escapeHtml(req.name)}</strong>,</p>
    <p>KaganProje talebiniz için İyzico ödeme linki aşağıdadır.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
      <tr><td style="padding:8px;border:1px solid #e2e8f0">Ürün</td><td style="padding:8px;border:1px solid #e2e8f0"><strong>${escapeHtml(product)}</strong></td></tr>
      <tr><td style="padding:8px;border:1px solid #e2e8f0">Tutar</td><td style="padding:8px;border:1px solid #e2e8f0"><strong>${escapeHtml(amount)}</strong></td></tr>
      <tr><td style="padding:8px;border:1px solid #e2e8f0">Talep no</td><td style="padding:8px;border:1px solid #e2e8f0;font-family:monospace">${escapeHtml(req.id)}</td></tr>
    </table>
    <p style="margin:24px 0">
      <a href="${escapeAttr(iyzicoLink)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700">
        İyzico ile güvenli öde
      </a>
    </p>
    <p style="font-size:13px;color:#64748b">Link çalışmazsa: <a href="${escapeAttr(iyzicoLink)}">${escapeHtml(iyzicoLink)}</a></p>
    <p style="font-size:13px;color:#64748b">Destek WhatsApp: ${escapeHtml(whatsapp)}</p>
  </div>`;

  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

export async function sendPaymentLinkEmail(
  req: PaymentRequest,
  iyzicoLink: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const transporter = getTransporter();
  if (!transporter) {
    return {
      ok: false,
      error:
        "SMTP yapılandırılmadı. .env.local içine SMTP_USER (Gmail) ve SMTP_PASS (uygulama şifresi) ekleyin.",
    };
  }

  const from =
    process.env.SMTP_FROM?.trim() ||
    `KaganProje <${process.env.SMTP_USER!.trim()}>`;
  const { subject, text, html } = buildPaymentEmail(req, iyzicoLink);

  try {
    await transporter.sendMail({
      from,
      to: req.email,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "E-posta gönderilemedi.";
    console.error("Payment email error:", message);
    return { ok: false, error: message };
  }
}

/** İşletme sahibine yeni talep bildirimi (opsiyonel) */
export async function notifyOwnerNewRequest(
  req: PaymentRequest,
  iyzicoLink: string | null
): Promise<void> {
  const owner =
    process.env.BILLING_OWNER_EMAIL?.trim() || process.env.SMTP_USER?.trim();
  if (!owner || !isSmtpConfigured()) return;

  const transporter = getTransporter();
  if (!transporter) return;

  const from =
    process.env.SMTP_FROM?.trim() ||
    `KaganProje <${process.env.SMTP_USER!.trim()}>`;

  await transporter.sendMail({
    from,
    to: owner,
    subject: `[KaganProje] Yeni ödeme talebi ${req.id}`,
    text: [
      `Müşteri: ${req.name} <${req.email}>`,
      `Telefon: ${req.phone || "-"}`,
      `Tutar: ${formatTry(req.amountTry)}`,
      `Ürün: ${productLabel(req)}`,
      `İyzico link: ${iyzicoLink || "(henüz yok — admin API ile gönderin)"}`,
      `Aktive et: POST /api/billing/activate { requestId: "${req.id}" }`,
    ].join("\n"),
  });
}
