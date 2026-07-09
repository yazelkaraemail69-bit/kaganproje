import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { ShortsWizard } from "@/components/shorts/ShortsWizard";

export const metadata: Metadata = {
  title: "Shorts Senaryosu Oluştur",
  description:
    "Shorts senaryosu üretin. Video üretimi geliştirme aşamasında kapalıdır.",
};

export default function ShortsPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHeader title="Shorts Senaryosu Oluştur" />
      <div className="border-b border-amber-200 bg-amber-50">
        <p className="container-app py-3 text-center text-sm font-medium text-amber-900">
          Video üretimi (~3$/video) geliştirme aşamasında kapalıdır. Senaryo metni açıktır.
        </p>
      </div>
      <ShortsWizard />
    </main>
  );
}
