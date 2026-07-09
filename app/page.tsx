import { Clapperboard, CreditCard, PenLine, UserRound, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { FeatureCard } from "@/components/dashboard/FeatureCard";

export default function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="border-b border-slate-200 bg-white">
        <div className="container-app py-14 text-center sm:py-20">
          <div className="mb-4 flex justify-end">
            <Link
              href="/hesap"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:border-brand-300 hover:text-brand-700"
            >
              <UserRound className="h-3.5 w-3.5" /> Hesabım
            </Link>
          </div>
          <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
            Dijital Vitrin Stüdyosu
          </span>
          <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-black text-slate-900 sm:text-4xl lg:text-5xl">
            İşletmeniz için saniyeler içinde profesyonel dijital içerik oluşturun
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-500">
            Aşağıdaki kartlardan birini seçin, birkaç adımda bilgilerinizi girin ve
            anında paylaşılabilir, şık bir önizleme elde edin.
          </p>
        </div>
      </section>

      <section className="flex-1 py-12 sm:py-16">
        <div className="container-app grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <FeatureCard
            href="/kartvizit"
            icon={CreditCard}
            title="Dijital Kartvizit Oluştur"
            description="Executive, minimal ve bold düzenler; AI portre üretimi ile 2025 profesyonel kartvizit tasarımı."
            accentClassName="bg-gradient-to-br from-brand-500 to-brand-700"
          />
          <FeatureCard
            href="/menu"
            icon={UtensilsCrossed}
            title="Dijital Menü Oluştur"
            description="Bistro, galeri ve minimal menü şablonları; AI logo ve yemek fotoğrafı ile QR menü oluşturun."
            accentClassName="bg-gradient-to-br from-accent-500 to-accent-600"
          />
          <FeatureCard
            href="/shorts"
            icon={Clapperboard}
            title="Shorts Senaryosu Oluştur"
            description="Niş, kitle, ton ve süreyi seçin; yapay zeka hook, ipuçları, CTA, görsel promptlar ve seslendirme metniyle tam bir Shorts senaryosu üretsin."
            accentClassName="bg-gradient-to-br from-slate-700 to-slate-900"
          />
          <FeatureCard
            href="/elyazisi"
            icon={PenLine}
            title="El Yazısı Okuyucu ve Çevirici"
            description="El yazısı fotoğraflarını metne çevirin, düzenleyin, başka dile çevirin ve TXT, PDF veya DOCX olarak kaydedin."
            accentClassName="bg-gradient-to-br from-violet-500 to-indigo-700"
          />
        </div>
      </section>
    </main>
  );
}
