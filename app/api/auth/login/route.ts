import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateAccount } from "@/lib/account-store";
import { toPublicAccount } from "@/lib/domains/account/types";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz giriş bilgileri." }, { status: 400 });
  }

  const account = await authenticateAccount(parsed.data.email, parsed.data.password);
  if (!account) {
    return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
  }

  const token = createSessionToken(account.id, account.email);
  const response = NextResponse.json({ account: toPublicAccount(account) });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
