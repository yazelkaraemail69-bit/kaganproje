import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi",
};

export default function MesafeliSatisPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHeader title="Mesafeli Satış" backHref="/fiyatlandirma" />
      <article className="container-app max-w-3xl py-10 prose-sm text-slate-600">
        <h1 className="text-2xl font-black text-slate-900">Mesafeli Satış Sözleşmesi</h1>
        <p className="mt-4 leading-7">
          Bu sözleşme, KaganProje dijital hizmetlerinin (QR kartvizit, dijital menü, el yazısı
          OCR/çeviri ve ilgili AI kredileri) internet üzerinden satışı için geçerlidir.
        </p>
        <h2 className="mt-8 text-lg font-bold text-slate-900">1. Hizmetin niteliği</h2>
        <p className="mt-2 leading-7">
          Satılan ürün dijital abonelik ve/veya AI kredi paketidir. Fiziksel teslimat yoktur.
          Hizmet, ödeme onayından sonra hesap paneli üzerinden anında veya kısa sürede
          etkinleştirilir.
        </p>
        <h2 className="mt-8 text-lg font-bold text-slate-900">2. Ödeme</h2>
        <p className="mt-2 leading-7">
          İlk dönemde ödemeler İyzico Link veya manuel onay ile alınır. Otomatik kart saklama /
          şirket Sanal POS entegrasyonu, abone eşiği aşıldığında planlanacaktır.
        </p>
        <h2 className="mt-8 text-lg font-bold text-slate-900">3. Cayma</h2>
        <p className="mt-2 leading-7">
          Dijital içeriğin anında ifası ve AI kredi tüketimi nedeniyle, hizmet kullanıma
          açıldıktan sonra cayma hakkı sınırlı olabilir. Detaylar İade sayfasındadır.
        </p>
        <h2 className="mt-8 text-lg font-bold text-slate-900">4. İletişim</h2>
        <p className="mt-2 leading-7">
          Destek ve fatura talepleri için hesap sayfasındaki iletişim kanalı veya ödeme talebi
          sırasında verdiğiniz telefon/e-posta kullanılır.
        </p>
      </article>
      <SiteFooter />
    </main>
  );
}
