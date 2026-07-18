import { Clapperboard, CreditCard, PenLine, Tag, UserRound, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { FeatureCard } from "@/components/dashboard/FeatureCard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { FoundingBanner } from "@/components/billing/FoundingBanner";

export default function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col relative overflow-hidden bg-slate-50/50">
      {/* Background decorative gradients */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 right-[-10%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-brand-200/30 to-violet-300/0 blur-3xl" />
        <div className="absolute top-[20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-200/20 to-purple-200/0 blur-3xl" />
      </div>

      <section className="relative border-b border-slate-200/80 bg-white/40 backdrop-blur-sm">
        <div className="container-app py-16 text-center sm:py-24">
          <div className="mb-6 flex flex-wrap items-center justify-end gap-2.5">
            <Link
              href="/fiyatlandirma"
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50/80 px-4 py-2 text-xs font-bold text-brand-700 shadow-sm transition-all hover:border-brand-300 hover:bg-brand-100 hover:scale-[1.02]"
            >
              <Tag className="h-3.5 w-3.5" /> Fiyatlar
            </Link>
            <Link
              href="/hesap"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-brand-200 hover:text-brand-700 hover:scale-[1.02]"
            >
              <UserRound className="h-3.5 w-3.5" /> Hesabım
            </Link>
          </div>

          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-500/10 to-indigo-500/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-brand-700 border border-brand-500/20">
            Dijital Vitrin Stüdyosu
          </span>
          
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.15]">
            İşletmeniz için saniyeler içinde <br />
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              profesyonel dijital içerik
            </span> oluşturun
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-500 font-medium">
            QR kartvizit, dijital menü ve el yazısı çeviri. Abonelik ve yapay zeka kredisi ile işinizi büyütün;
            Shorts video stüdyosu geliştirme aşamasındadır.
          </p>

          <div className="mx-auto mt-8 max-w-xl text-left">
            <FoundingBanner />
          </div>
        </div>
      </section>

      <section className="flex-1 py-16 sm:py-20">
        <div className="container-app">
          <h2 className="mb-10 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
            Kullanabileceğiniz Modüller
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
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
              description="Senaryo metni açık. Video üretimi (~3$/video) geliştirme aşamasında kapalıdır."
              accentClassName="bg-gradient-to-br from-slate-700 to-slate-900"
              badge="Video kapalı"
              badgeTone="slate"
            />
            <FeatureCard
              href="/elyazisi"
              icon={PenLine}
              title="El Yazısı Okuyucu"
              description="El yazısı fotoğraflarını metne çevirin, düzenleyin, başka dile çevirin ve TXT, PDF veya DOCX olarak kaydedin."
              accentClassName="bg-gradient-to-br from-violet-500 to-indigo-700"
            />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
