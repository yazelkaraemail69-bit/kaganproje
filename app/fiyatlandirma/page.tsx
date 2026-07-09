import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { PricingTable } from "@/components/billing/PricingTable";
import { FoundingBanner } from "@/components/billing/FoundingBanner";
import { COMPANY_THRESHOLD_SUBSCRIBERS } from "@/lib/billing/plans";

export const metadata: Metadata = {
  title: "Fiyatlandırma",
  description: "QR kartvizit, menü ve çeviri için aylık / 3 aylık abonelik paketleri.",
};

export default function FiyatlandirmaPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHeader title="Fiyatlandırma" />
      <section className="border-b border-slate-200 bg-white">
        <div className="container-app py-10 text-center sm:py-12">
          <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">
            QR + çeviri için net paketler
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Aylık veya 3 aylık abonelik. Her planda AI kredisi vardır; bitince ek paket veya üst
            plan. Shorts video kapalı. {COMPANY_THRESHOLD_SUBSCRIBERS} aboneye kadar şirket
            kurmadan İyzico Link ile ilerliyoruz.
          </p>
          <p className="mt-3 text-xs text-slate-400">
            <Link href="/yasal/mesafeli-satis" className="underline hover:text-slate-600">
              Mesafeli satış
            </Link>
            {" · "}
            <Link href="/yasal/iade" className="underline hover:text-slate-600">
              İade
            </Link>
            {" · "}
            <Link href="/yasal/gizlilik" className="underline hover:text-slate-600">
              Gizlilik
            </Link>
          </p>
        </div>
      </section>
      <section className="container-app py-10 sm:py-14">
        <div className="mb-8">
          <FoundingBanner />
        </div>
        <PricingTable />
      </section>
    </main>
  );
}
