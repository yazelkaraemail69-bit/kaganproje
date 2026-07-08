import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { ShortsWizard } from "@/components/shorts/ShortsWizard";

export const metadata: Metadata = {
  title: "Shorts Senaryosu Oluştur",
};

export default function ShortsPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHeader title="Shorts Senaryosu Oluştur" />
      <ShortsWizard />
    </main>
  );
}
