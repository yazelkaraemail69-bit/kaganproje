import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="container-app flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-700">KaganProje</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
          <Link href="/fiyatlandirma" className="hover:text-brand-700">
            Fiyatlandırma
          </Link>
          <Link href="/hesap" className="hover:text-brand-700">
            Hesabım
          </Link>
          <Link href="/yasal/mesafeli-satis" className="hover:text-brand-700">
            Mesafeli satış
          </Link>
          <Link href="/yasal/iade" className="hover:text-brand-700">
            İade
          </Link>
          <Link href="/yasal/gizlilik" className="hover:text-brand-700">
            Gizlilik
          </Link>
        </nav>
      </div>
    </footer>
  );
}
