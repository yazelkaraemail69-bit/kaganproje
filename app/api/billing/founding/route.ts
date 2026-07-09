import { NextResponse } from "next/server";
import { getFoundingStatus } from "@/lib/billing/founding";

/** GET /api/billing/founding — kampanya sayacı (auth gerekmez) */
export async function GET() {
  const status = await getFoundingStatus();
  return NextResponse.json({
    ...status,
    headline: status.open
      ? `İlk ${status.limit} kullanıcıya Başlangıç planı ${status.freeDays} gün ücretsiz`
      : "Kurucu üye kontenjanı doldu",
    subline: status.open
      ? `1 arkadaşını davet edersen süre ${status.referralTotalDays} güne çıkar (tek sefer).`
      : undefined,
    cta: status.open ? "Hemen kayıt ol — koltuk kap" : "Paketleri incele",
  });
}
