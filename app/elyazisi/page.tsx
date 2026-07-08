import type { Metadata } from "next";
import { ElyazisiEmbed } from "@/components/elyazisi/ElyazisiEmbed";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "El Yazısı Okuyucu ve Çevirici",
  description:
    "El yazısı fotoğraflarını dijital metne çevirin, düzenleyin, başka dile çevirin ve dışa aktarın.",
};

export default function ElyazisiPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col">
      <PageHeader title="El Yazısı Okuyucu ve Çevirici" />
      <ElyazisiEmbed />
    </main>
  );
}
