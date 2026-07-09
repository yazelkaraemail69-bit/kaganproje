import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { SessionPayload } from "@/lib/domains/account/types";
import { getAccountById } from "@/lib/account-store";
import { toPublicAccount, type PublicAccount } from "@/lib/domains/account/types";

export const SESSION_COOKIE = "kaganproje_session";
const SESSION_DAYS = 30;

function sessionSecret(): string {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "kaganproje-dev-secret-change-me";
}

function encodePayload(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function decodePayload(token: string): SessionPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as SessionPayload;
    if (!payload.accountId || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createSessionToken(accountId: string, email: string): string {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  return encodePayload({ accountId, email, exp });
}

export function sessionCookieOptions(maxAgeSeconds = SESSION_DAYS * 24 * 60 * 60) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export async function getSessionAccount(): Promise<PublicAccount | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = decodePayload(token);
  if (!payload) return null;
  const account = await getAccountById(payload.accountId);
  if (!account) return null;
  return toPublicAccount(account);
}

export async function requireSessionAccount(): Promise<PublicAccount> {
  const account = await getSessionAccount();
  if (!account) {
    throw new Error("UNAUTHORIZED");
  }
  return account;
}
