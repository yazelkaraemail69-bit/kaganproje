"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import {
  CREDIT_PACKS,
  PLANS,
  formatTry,
  periodLabel,
  type BillingPeriod,
  type PaidPlanId,
} from "@/lib/billing/plans";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function PricingTable() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  const periodHint = useMemo(
    () =>
      period === "quarterly"
        ? "3 aylık peşin — küçük indirim"
        : "Aylık yenileme — İyzico Link ile ödeme",
    [period]
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          {(["monthly", "quarterly"] as BillingPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                period === p ? "bg-brand-600 text-white" : "text-slate-600 hover:text-slate-900"
              )}
            >
              {periodLabel(p)}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-500">{periodHint}</p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} planId={plan.id} period={period} />
        ))}
      </div>

      <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold text-slate-900">Kredi bitince</h2>
        <p className="mt-2 text-sm text-slate-500">
          Abonelik krediniz yetmezse ek paket alın veya bir üst plana geçin. Shorts video üretimi
          geliştirme aşamasında kapalıdır.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <Link
              key={pack.id}
              href={`/fiyatlandirma/odeme?kind=credits&pack=${pack.id}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
            >
              <p className="text-sm font-bold text-slate-900">{pack.label}</p>
              <p className="mt-1 text-lg font-black text-brand-700">{formatTry(pack.priceTry)}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function PlanCard({ planId, period }: { planId: PaidPlanId; period: BillingPeriod }) {
  const plan = PLANS.find((p) => p.id === planId)!;
  const price = plan.prices[period];

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm",
        plan.highlighted ? "border-brand-400 ring-2 ring-brand-200" : "border-slate-200"
      )}
    >
      {plan.highlighted ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          <Sparkles className="h-3 w-3" /> Önerilen
        </span>
      ) : null}
      <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
      <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>
      <p className="mt-5 text-3xl font-black text-slate-900">
        {formatTry(price)}
        <span className="text-sm font-semibold text-slate-500">
          {" "}
          / {period === "monthly" ? "ay" : "3 ay"}
        </span>
      </p>
      <p className="mt-1 text-xs font-semibold text-brand-700">
        Aylık {plan.monthlyCredits} AI kredi · {plan.maxProfiles} profil
      </p>
      <ul className="mt-5 flex flex-1 flex-col gap-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            {f}
          </li>
        ))}
      </ul>
      <Link href={`/fiyatlandirma/odeme?plan=${plan.id}&period=${period}`} className="mt-6 block">
        <Button className="w-full" variant={plan.highlighted ? "primary" : "secondary"}>
          Bu planı seç
        </Button>
      </Link>
    </div>
  );
}
