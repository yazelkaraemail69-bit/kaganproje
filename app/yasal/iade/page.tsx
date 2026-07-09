import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "İade ve İptal",
};

export default function IadePage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHeader title="İade ve İptal" backHref="/fiyatlandirma" />
      <article className="container-app max-w-3xl py-10 text-slate-600">
        <h1 className="text-2xl font-black text-slate-900">İade ve İptal Politikası</h1>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-7">
          <li>
            Ödeme linki oluşturulup henüz ödenmemiş talepler ücretsiz iptal edilebilir.
          </li>
          <li>
            Ödeme alındıktan sonra plan açılmış ancak AI kredisi / yayın hiç kullanılmamışsa, 7
            gün içinde yazılı talep ile iade değerlendirilir.
          </li>
          <li>
            Kredi harcanmış veya yayın linki aktif kullanılmış aboneliklerde iade yapılmaz;
            kalan süre için hesap erişimi devam eder.
          </li>
          <li>Ek kredi paketleri, kullanıldıktan sonra iade edilmez.</li>
        </ul>
      </article>
      <SiteFooter />
    </main>
  );
}
