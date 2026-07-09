import { NextResponse } from "next/server";

/**
 * Eski Stripe checkout — A modelinde kullanılmıyor.
 * Kullanıcıyı fiyatlandırma / ödeme talebi akışına yönlendirir.
 */
export async function POST() {
  return NextResponse.json({
    mode: "iyzico_link_manual",
    url: "/fiyatlandirma",
    message:
      "Otomatik kart çekimi kapalı. Paket seçip İyzico Link ödeme talebi oluşturun: /fiyatlandirma",
  });
}
