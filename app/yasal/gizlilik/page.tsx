import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
};

export default function GizlilikPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHeader title="Gizlilik" backHref="/fiyatlandirma" />
      <article className="container-app max-w-3xl py-10 text-slate-600">
        <h1 className="text-2xl font-black text-slate-900">Gizlilik Politikası</h1>
        <p className="mt-4 text-sm leading-7">
          Hesap e-postası, ad, ödeme talebi notları ve yayınladığınız profil içerikleri hizmeti
          sunmak için işlenir. AI işlemleri (OCR, çeviri, görsel) üçüncü taraf model
          sağlayıcılarına (ör. OpenRouter) iletilebilir; kart bilgileriniz sitemizde saklanmaz —
          İyzico Link ödemelerinde kart verisi İyzico altyapısındadır.
        </p>
        <p className="mt-4 text-sm leading-7">
          Verilerinizi silme veya düzeltme talebi için hesap e-postanız üzerinden bize ulaşın.
        </p>
      </article>
      <SiteFooter />
    </main>
  );
}
