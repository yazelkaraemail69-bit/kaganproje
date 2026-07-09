"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CreditCard,
  Loader2,
  LogOut,
  Plus,
  Sparkles,
  Webhook,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { FoundingBanner } from "@/components/billing/FoundingBanner";
import type { PublicAccount, TeamRecord } from "@/lib/domains/account/types";
import type { PlanLimits } from "@/lib/domains/account/plan";

interface ProfileRow {
  slug: string;
  type: "card" | "catalog";
  displayName: string;
  viewCount: number;
  updatedAt: string;
  teamId?: string;
  branchLabel?: string;
}

interface MeResponse {
  account: PublicAccount | null;
  limits?: PlanLimits;
  teams?: TeamRecord[];
  profiles?: ProfileRow[];
  billing?: {
    mode: string;
    inviteBonusCredits: number;
    planDisplayName: string;
    activeSubscribers: number;
    companyThreshold: number;
    shortsVideoEnabled: boolean;
    founding?: {
      open: boolean;
      remaining: number;
      claimed: number;
      limit: number;
      freeDays: number;
      referralTotalDays: number;
    };
  };
}

export function AccountDashboard() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeResponse>({ account: null });
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [teamName, setTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [branchLabel, setBranchLabel] = useState("");
  const [branchSlug, setBranchSlug] = useState("");
  const [crmUrl, setCrmUrl] = useState("");
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    const data = (await res.json()) as MeResponse;
    setMe(data);
    setCrmUrl(data.account?.crmWebhookUrl ?? "");
    if (data.teams?.length && !selectedTeamId) {
      setSelectedTeamId(data.teams[0].id);
    }
    setLoading(false);
  }, [selectedTeamId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      setMode("register");
      setInviteCodeInput(ref);
    }
  }, []);

  async function handleAuth(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : {
              email,
              password,
              name: name || email.split("@")[0],
              inviteCode: inviteCodeInput.trim() || undefined,
            };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "İşlem başarısız.");
        return;
      }
      if (mode === "register" && data.founding?.message) {
        setMessage(data.founding.message);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe({ account: null });
  }

  function handleUpgrade() {
    window.location.href = "/fiyatlandirma";
  }

  async function copyInviteLink() {
    if (!me.account?.inviteCode) return;
    const url = `${window.location.origin}/hesap?ref=${me.account.inviteCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Davet linki kopyalandı. Arkadaşınız kayıt olurken kodu girebilir.");
    } catch {
      setMessage(`Davet kodunuz: ${me.account.inviteCode}`);
    }
  }

  async function handleCreateTeam() {
    if (!teamName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Takım oluşturulamadı.");
        return;
      }
      setTeamName("");
      setMessage("Takım oluşturuldu.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleInvite() {
    if (!selectedTeamId || !inviteEmail.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "invite",
          teamId: selectedTeamId,
          email: inviteEmail.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Davet başarısız.");
        return;
      }
      setInviteEmail("");
      setMessage("Üye eklendi.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleBranch() {
    if (!selectedTeamId || !branchLabel.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert_branch",
          teamId: selectedTeamId,
          label: branchLabel.trim(),
          profileSlug: branchSlug.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Şube kaydedilemedi.");
        return;
      }
      setBranchLabel("");
      setBranchSlug("");
      setMessage("Şube kaydedildi.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveCrm() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/crm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crmWebhookUrl: crmUrl.trim(),
          crmEvents: ["view", "publish", "contact_save"],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "CRM kaydedilemedi.");
        return;
      }
      setMessage("CRM webhook kaydedildi.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Yükleniyor...
      </div>
    );
  }

  if (!me.account) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="mb-4">
          <FoundingBanner compact />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black text-slate-900">Hesabım</h1>
          <p className="mt-2 text-sm text-slate-500">
            İlk 30 kayıt Başlangıç planını 7 gün ücretsiz alır. 1 arkadaş davet ederseniz süre 10
            güne çıkar.
          </p>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${
                mode === "login" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Giriş
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${
                mode === "register" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Kayıt Ol
            </button>
          </div>

          <form onSubmit={handleAuth} className="mt-5 flex flex-col gap-3">
            {mode === "register" ? (
              <Input label="Ad" value={name} onChange={(e) => setName(e.target.value)} placeholder="Adınız" />
            ) : null}
            <Input
              label="E-posta"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@firma.com"
            />
            <Input
              label="Şifre"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 6 karakter"
            />
            {mode === "register" ? (
              <Input
                label="Davet kodu (opsiyonel)"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value)}
                placeholder="KGxxxxxxxx"
              />
            ) : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === "login" ? "Giriş Yap" : "Hesap Oluştur"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const account = me.account;
  const limits = me.limits!;
  const isPaid = account.plan !== "free";
  const planName = me.billing?.planDisplayName ?? (isPaid ? account.plan : "Ücretsiz");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-600">Hesabım</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">{account.name}</h1>
          <p className="text-sm text-slate-500">{account.email}</p>
          <p className="mt-2 inline-flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              <Sparkles className="h-3.5 w-3.5" />
              {planName} · {account.profileSlugs.length}/{limits.maxProfiles} profil
            </span>
            <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
              {account.credits ?? 0} AI kredi
            </span>
            {account.foundingMember ? (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                Kurucu #{account.foundingSeat}
                {account.foundingReferralExtended ? " · 10 gün" : " · 7 gün"}
              </span>
            ) : null}
          </p>
        </div>
        <Button variant="ghost" onClick={handleLogout}>
          <LogOut className="h-4 w-4" /> Çıkış
        </Button>
      </div>

      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-bold text-slate-900">Plan, kredi & ödeme</h2>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Ödemeler İyzico Link ile alınır (şirket yok, {me.billing?.companyThreshold ?? 15} aboneye
          kadar). Kredi bitince ek paket veya üst plan seçin.
        </p>
        {account.foundingMember && !account.foundingReferralExtended ? (
          <p className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800">
            Kurucu ücretsiz süreniz {me.billing?.founding?.freeDays ?? 7} gün. 1 arkadaşınız davet
            kodunuzla kayıt olursa süre tek seferde{" "}
            {me.billing?.founding?.referralTotalDays ?? 10} güne çıkar.
          </p>
        ) : null}
        {account.planExpiresAt ? (
          <p className="mt-2 text-xs text-slate-500">
            Plan bitiş: {new Date(account.planExpiresAt).toLocaleDateString("tr-TR")}
            {account.foundingReferralExtended ? " (davet uzatması uygulandı)" : ""}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={handleUpgrade}>
            <Sparkles className="h-4 w-4" />
            {isPaid ? "Planı değiştir / yenile" : "Paket seç"}
          </Button>
          <Link href="/fiyatlandirma/odeme?kind=credits&pack=credits_100">
            <Button variant="secondary">Ek kredi al</Button>
          </Link>
        </div>
        {account.subscriptionStatus === "pending_payment" ? (
          <p className="mt-3 text-sm font-semibold text-amber-700">
            Ödeme talebiniz bekleniyor — link gelince ödeyin, ardından plan açılır.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Arkadaşını davet et</h2>
        <p className="mt-2 text-sm text-slate-500">
          Arkadaşınız kayıt olunca (kurucu üyeyseniz) süreniz 7→10 güne uzar. İlk ödemede ikiniz de +
          {me.billing?.inviteBonusCredits ?? 50} kredi kazanırsınız. Kodunuz:{" "}
          <span className="font-mono font-bold text-slate-800">{account.inviteCode || "—"}</span>
        </p>
        <Button className="mt-4" variant="secondary" onClick={copyInviteLink}>
          Davet linkini kopyala
        </Button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Profillerim</h2>
        {me.profiles?.length ? (
          <ul className="mt-3 flex flex-col gap-2">
            {me.profiles.map((profile) => (
              <li
                key={profile.slug}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{profile.displayName}</p>
                  <p className="text-xs text-slate-500">
                    {profile.type === "card" ? "Kartvizit" : "Katalog"} · {profile.viewCount} görüntülenme
                    {profile.branchLabel ? ` · ${profile.branchLabel}` : ""}
                  </p>
                </div>
                <Link
                  href={profile.type === "card" ? `/kartvizit/c/${profile.slug}` : `/menu/m/${profile.slug}`}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  Aç →
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            Henüz bağlı profil yok. Menü veya kartvizit yayınladığınızda burada listelenir.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Webhook className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-bold text-slate-900">CRM Webhook</h2>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          HubSpot / Pipedrive / Zapier uyumlu JSON webhook. Görüntülenme ve yayın olayları gönderilir.
        </p>
        {limits.crmWebhook ? (
          <div className="mt-4 flex flex-col gap-3">
            <Input
              label="Webhook URL"
              value={crmUrl}
              onChange={(e) => setCrmUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/..."
            />
            <Button variant="secondary" onClick={handleSaveCrm} disabled={busy}>
              Kaydet
            </Button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-amber-700">Pro planda CRM webhook açılır.</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-bold text-slate-900">Takım & Çok Şube</h2>
        </div>
        {!limits.teams ? (
          <p className="mt-3 text-sm text-amber-700">Takım yönetimi Pro plana özeldir.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                label="Yeni takım adı"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Lezzet Zinciri"
                wrapperClassName="flex-1"
              />
              <Button className="sm:mt-6" onClick={handleCreateTeam} disabled={busy}>
                <Plus className="h-4 w-4" /> Oluştur
              </Button>
            </div>

            {me.teams?.length ? (
              <>
                <label className="text-xs font-semibold text-slate-600">
                  Aktif takım
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                  >
                    {me.teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} ({team.memberIds.length} üye · {team.branches.length} şube)
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    label="Üye davet (e-posta)"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="calisan@firma.com"
                    wrapperClassName="flex-1"
                  />
                  <Button className="sm:mt-6" variant="secondary" onClick={handleInvite} disabled={busy}>
                    Davet Et
                  </Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    label="Şube adı"
                    value={branchLabel}
                    onChange={(e) => setBranchLabel(e.target.value)}
                    placeholder="Kadıköy"
                  />
                  <Input
                    label="Profil slug (opsiyonel)"
                    value={branchSlug}
                    onChange={(e) => setBranchSlug(e.target.value)}
                    placeholder="lezzet-kadikoy"
                  />
                </div>
                <Button variant="secondary" onClick={handleBranch} disabled={busy}>
                  Şube Kaydet
                </Button>

                {me.teams
                  .find((t) => t.id === selectedTeamId)
                  ?.branches.map((branch) => (
                    <p key={branch.id} className="text-xs text-slate-500">
                      • {branch.label}
                      {branch.profileSlug ? ` → /menu/m/${branch.profileSlug}` : ""}
                    </p>
                  ))}
              </>
            ) : (
              <p className="text-sm text-slate-500">Henüz takım yok. Yukarıdan oluşturun.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
