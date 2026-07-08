import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

interface PageHeaderProps {
  title: string;
  backHref?: string;
}

export function PageHeader({ title, backHref = "/" }: PageHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="container-app flex h-16 items-center gap-3">
        <Link
          href={backHref}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          aria-label="Panele dön"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <h1 className="text-base font-bold text-slate-900 sm:text-lg">{title}</h1>
        </div>
      </div>
    </header>
  );
}
