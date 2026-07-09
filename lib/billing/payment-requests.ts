import { promises as fs } from "fs";
import path from "path";
import { createHash, randomBytes } from "crypto";
import type { BillingPeriod, PaidPlanId } from "@/lib/billing/plans";
import { CREDIT_PACKS } from "@/lib/billing/plans";

export type PaymentRequestKind = "plan" | "credits";
export type PaymentRequestStatus = "pending" | "paid" | "canceled";

export interface PaymentRequest {
  id: string;
  kind: PaymentRequestKind;
  status: PaymentRequestStatus;
  accountId: string;
  email: string;
  name: string;
  phone?: string;
  note?: string;
  /** plan */
  planId?: PaidPlanId;
  period?: BillingPeriod;
  /** credits */
  creditPackId?: string;
  credits?: number;
  amountTry: number;
  /** Müşteriye gönderilen / gönderilecek İyzico Link */
  iyzicoLink?: string;
  emailSentAt?: string;
  emailError?: string;
  createdAt: string;
  updatedAt: string;
  activatedAt?: string;
}

const DATA_DIR = path.join(process.cwd(), ".data", "payment-requests");

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function filePath(id: string): string {
  const safe = id.replace(/[^a-z0-9_-]/gi, "");
  return path.join(DATA_DIR, `${safe}.json`);
}

function createRequestId(): string {
  const stamp = Date.now().toString(36);
  const digest = createHash("sha256")
    .update(`${stamp}:${randomBytes(6).toString("hex")}`)
    .digest("hex")
    .slice(0, 10);
  return `pay_${digest}`;
}

export async function savePaymentRequest(req: PaymentRequest): Promise<void> {
  await ensureDir();
  await fs.writeFile(filePath(req.id), JSON.stringify(req, null, 2), "utf-8");
}

export async function getPaymentRequest(id: string): Promise<PaymentRequest | null> {
  try {
    const raw = await fs.readFile(filePath(id), "utf-8");
    return JSON.parse(raw) as PaymentRequest;
  } catch {
    return null;
  }
}

export async function listPaymentRequests(): Promise<PaymentRequest[]> {
  await ensureDir();
  const files = await fs.readdir(DATA_DIR);
  const rows: PaymentRequest[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
      rows.push(JSON.parse(raw) as PaymentRequest);
    } catch {
      /* skip */
    }
  }
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createPaymentRequest(input: {
  kind: PaymentRequestKind;
  accountId: string;
  email: string;
  name: string;
  phone?: string;
  note?: string;
  planId?: PaidPlanId;
  period?: BillingPeriod;
  creditPackId?: string;
  amountTry: number;
  credits?: number;
}): Promise<PaymentRequest> {
  const now = new Date().toISOString();
  const req: PaymentRequest = {
    id: createRequestId(),
    kind: input.kind,
    status: "pending",
    accountId: input.accountId,
    email: input.email,
    name: input.name,
    phone: input.phone,
    note: input.note,
    planId: input.planId,
    period: input.period,
    creditPackId: input.creditPackId,
    credits: input.credits,
    amountTry: input.amountTry,
    createdAt: now,
    updatedAt: now,
  };
  await savePaymentRequest(req);
  return req;
}

export function resolveCreditPack(packId: string) {
  return CREDIT_PACKS.find((p) => p.id === packId) ?? null;
}
