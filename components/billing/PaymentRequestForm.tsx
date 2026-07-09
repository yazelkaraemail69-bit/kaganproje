"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  CREDIT_PACKS,
  PLANS,
  formatTry,
  periodLabel,
  type BillingPeriod,
  type PaidPlanId,
} from "@/lib/billing/plans";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

export function PaymentRequestForm() {
  const params = useSearchParams();
  const kind = params.get("kind") === "credits" ? "credits" : "plan";
  const planId = (params.get("plan") as PaidPlanId) || "business";
  const period = (params.get("period") as BillingPeriod) || "monthly";
  const packId = params.get("pack") || "credits_100";

  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[1];
  const pack = CREDIT_PACKS.find((p) => p.id === packId) ?? CREDIT_PACKS[0];

  const amountTry = kind === "credits" ? pack.priceTry : plan.prices[period];
  const summary = useMemo(() => {
    if (kind === "credits") return `${pack.label} ek paket`;
    return `${plan.name} · ${periodLabel(period)}`;
  }, [kind, pack.label, plan.name, period]);

  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ id: string; message: string } | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/billing/payment-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          planId: kind === "plan" ? plan.id : undefined,
          period: kind === "plan" ? period : undefined,
          creditPackId: kind === "credits" ? pack.id : undefined,
          phone: phone.trim() || undefined,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Talep oluşturulamadı.");
        return;
      }
      setDone({ id: data.request.id, message: data.message });
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
        <h1 className="text-xl font-black text-emerald-900">Ödeme talebiniz alındı</h1>
        <p className="mt-3 text-sm leading-6 text-emerald-800">{done.message}</p>
        <p className="mt-3 text-xs font-mono text-emerald-700">Talep no: {done.id}</p>
        <p className="mt-4 text-sm text-emerald-900">
          Kayıtlı e-posta adresinize İyzico ödeme linki gelecek (Gmail). Spam klasörünü de kontrol
          edin. Gelmezse WhatsApp: 05447610802
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/hesap" className="text-sm font-bold text-brand-700 hover:underline">
            Hesabıma git →
          </Link>
          <Link href="/fiyatlandirma" className="text-sm font-bold text-slate-600 hover:underline">
            Paketlere dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-black text-slate-900">Ödeme talebi</h1>
      <p className="mt-2 text-sm text-slate-500">
        Şirket kurulana kadar ödemeler <strong>İyzico Link</strong> veya manuel onay ile alınır.
        Talebinizi gönderin; size ödeme linki iletilecek, ödeme sonrası planınız açılacak.
      </p>

      <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-sm font-bold text-slate-900">{summary}</p>
        <p className="mt-1 text-2xl font-black text-brand-700">{formatTry(amountTry)}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
        <Input
          label="Telefon (WhatsApp için önerilir)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="05xx xxx xx xx"
        />
        <Input
          label="Not (opsiyonel)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="İşletme adı, fatura notu..."
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Ödeme talebi oluştur
        </Button>
      </form>

      <p className="mt-4 text-xs text-slate-500">
        Giriş yapmış olmanız gerekir. Hesabınız yoksa önce{" "}
        <Link href="/hesap" className="font-semibold text-brand-600">
          kayıt olun
        </Link>
        .
      </p>
    </div>
  );
}
