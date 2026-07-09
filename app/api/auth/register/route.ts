import { NextResponse } from "next/server";
import { z } from "zod";
import { createAccount } from "@/lib/account-store";
import { toPublicAccount } from "@/lib/domains/account/types";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80),
  password: z.string().min(6).max(100),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz kayıt bilgileri." }, { status: 400 });
  }

  try {
    const account = await createAccount(parsed.data);
    const token = createSessionToken(account.id, account.email);
    const response = NextResponse.json({ account: toPublicAccount(account) });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kayıt başarısız.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
