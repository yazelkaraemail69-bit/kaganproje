import { Suspense } from "react";
import type { Metadata } from "next";
import { MenuViewClient } from "@/components/menu/MenuViewClient";

export const metadata: Metadata = {
  title: "Dijital Menü",
};

export default function MenuViewPage() {
  return (
    <Suspense fallback={null}>
      <MenuViewClient />
    </Suspense>
  );
}
