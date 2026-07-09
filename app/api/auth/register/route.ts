import { NextResponse } from "next/server";
import { z } from "zod";
import { createAccount } from "@/lib/account-store";
import { toPublicAccount } from "@/lib/domains/account/types";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";
import {
  FOUNDING_FREE_DAYS,
  FOUNDING_MEMBER_LIMIT,
  FOUNDING_REFERRAL_TOTAL_DAYS,
} from "@/lib/billing/plans";

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80),
  password: z.string().min(6).max(100),
  inviteCode: z.string().max(32).optional(),
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
    const { account, founding } = await createAccount({
      email: parsed.data.email,
      name: parsed.data.name,
      password: parsed.data.password,
      inviteCode: parsed.data.inviteCode,
    });
    const token = createSessionToken(account.id, account.email);

    const foundingMessage = founding.granted
      ? `Kurucu üye #${founding.seat}/${FOUNDING_MEMBER_LIMIT}: Başlangıç planı ${FOUNDING_FREE_DAYS} gün ücretsiz. 1 arkadaş davet ederseniz süre ${FOUNDING_REFERRAL_TOTAL_DAYS} güne çıkar.`
      : "Kurucu üye kontenjanı doldu. Ücretsiz taslak hesabınız hazır; paketleri /fiyatlandirma sayfasından seçebilirsiniz.";

    const response = NextResponse.json({
      account: toPublicAccount(account),
      founding: {
        granted: founding.granted,
        seat: founding.seat,
        remaining: founding.remaining,
        limit: founding.limit,
        freeDays: founding.freeDays,
        referralTotalDays: founding.referralTotalDays,
        message: foundingMessage,
      },
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kayıt başarısız.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
