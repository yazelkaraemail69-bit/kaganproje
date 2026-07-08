import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { KartvizitWizard } from "@/components/kartvizit/KartvizitWizard";

export const metadata: Metadata = {
  title: "Dijital Kartvizit Oluştur",
};

export default function KartvizitPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHeader title="Dijital Kartvizit Oluştur" />
      <KartvizitWizard />
    </main>
  );
}
