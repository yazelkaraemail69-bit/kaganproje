import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PaymentRequestForm } from "@/components/billing/PaymentRequestForm";

export const metadata: Metadata = {
  title: "Ödeme Talebi",
};

export default function OdemePage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHeader title="Ödeme Talebi" backHref="/fiyatlandirma" />
      <section className="container-app py-10 sm:py-14">
        <Suspense fallback={<p className="text-center text-slate-500">Yükleniyor...</p>}>
          <PaymentRequestForm />
        </Suspense>
      </section>
    </main>
  );
}
