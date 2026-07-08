"use client";

import Link from "next/link";
import { useMemo } from "react";

const ELYAZISI_PORT = 4000;

export function ElyazisiEmbed() {
  const appUrl = useMemo(() => {
    if (typeof window === "undefined") return `http://localhost:${ELYAZISI_PORT}`;
    const host = window.location.hostname || "localhost";
    return `http://${host}:${ELYAZISI_PORT}`;
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <div className="container-app border-b border-slate-200 bg-slate-50 py-4">
        <p className="text-sm leading-6 text-slate-600">
          El yazısı fotoğraflarını metne çevirin, düzenleyin, çevirin ve TXT / PDF / DOCX olarak
          kaydedin. En fazla 10 fotoğraf desteklenir.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Modül çalışmıyorsa önce{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-xs">modules/el-yazisi-cevirmen/BASLAT-ELYAZISI.bat</code>{" "}
          dosyasını çalıştırın (port {ELYAZISI_PORT}).
        </p>
        <Link
          href={appUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          Yeni sekmede aç →
        </Link>
      </div>
      <iframe
        src={appUrl}
        title="El Yazısı Okuyucu ve Çevirici"
        className="min-h-[75vh] w-full flex-1 border-0 bg-white"
        loading="lazy"
      />
    </div>
  );
}
