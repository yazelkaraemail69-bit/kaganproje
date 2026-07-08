import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { MenuWizard } from "@/components/menu/MenuWizard";

export const metadata: Metadata = {
  title: "Dijital Menü Oluştur",
};

export default function MenuPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHeader title="Dijital Menü Oluştur" />
      <MenuWizard />
    </main>
  );
}
