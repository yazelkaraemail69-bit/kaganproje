import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  accentClassName: string;
}

export function FeatureCard({ href, icon: Icon, title, description, accentClassName }: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="card-shadow group relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-xl sm:p-8"
    >
      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl text-white transition-transform group-hover:scale-105",
          accentClassName
        )}
      >
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      <span className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-brand-600">
        Başlayalım
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
