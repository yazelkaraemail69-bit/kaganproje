"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { StepPersonal } from "@/components/kartvizit/StepPersonal";
import { StepContact } from "@/components/kartvizit/StepContact";
import { StepSocial } from "@/components/kartvizit/StepSocial";
import { StepTheme } from "@/components/kartvizit/StepTheme";
import { CardPreview } from "@/components/kartvizit/CardPreview";
import { createEmptyBusinessCard, type BusinessCardData, type SocialLinks } from "@/lib/types";
import { clearStoredProfileSlug } from "@/lib/profile-slug-storage";

const STEP_LABELS = ["Kişisel Bilgiler", "İletişim", "Sosyal Medya", "Tema"];
const TOTAL_STEPS = STEP_LABELS.length;

export function KartvizitWizard() {
  const [step, setStep] = useState(1);
  const [view, setView] = useState<"form" | "preview">("form");
  const [data, setData] = useState<BusinessCardData>(createEmptyBusinessCard);
  const [error, setError] = useState("");

  function updateData(patch: Partial<BusinessCardData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  function updateSocial(patch: Partial<SocialLinks>) {
    setData((prev) => ({ ...prev, social: { ...prev.social, ...patch } }));
  }

  function validateStep(): boolean {
    if (step === 1 && (!data.fullName.trim() || !data.title.trim())) {
      setError("Lütfen ad soyad ve ünvan alanlarını doldurun.");
      return false;
    }
    if (step === 2 && (!data.phone.trim() || !data.email.trim())) {
      setError("Lütfen telefon ve e-posta alanlarını doldurun.");
      return false;
    }
    setError("");
    return true;
  }

  function goNext() {
    if (!validateStep()) return;
    if (step < TOTAL_STEPS) {
      setStep((current) => current + 1);
    } else {
      setView("preview");
    }
  }

  function goBack() {
    setError("");
    setStep((current) => Math.max(1, current - 1));
  }

  function handleReset() {
    clearStoredProfileSlug("card");
    setData(createEmptyBusinessCard());
    setStep(1);
    setError("");
    setView("form");
  }

  if (view === "preview") {
    return (
      <div className="container-app py-10 sm:py-14">
        <CardPreview data={data} onEdit={() => setView("form")} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="container-app max-w-2xl py-10 sm:py-14">
      <div className="mb-8">
        <Stepper steps={STEP_LABELS} currentStep={step} />
      </div>

      <div className="card-shadow rounded-3xl border border-slate-100 bg-white p-6 sm:p-8">
        <h2 className="mb-6 text-lg font-bold text-slate-900">
          Adım {step}: {STEP_LABELS[step - 1]}
        </h2>

        {step === 1 ? <StepPersonal data={data} onChange={updateData} /> : null}
        {step === 2 ? <StepContact data={data} onChange={updateData} /> : null}
        {step === 3 ? <StepSocial data={data} onChange={updateSocial} /> : null}
        {step === 4 ? <StepTheme data={data} onChange={updateData} /> : null}

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{error}</p>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="secondary" onClick={goBack} disabled={step === 1}>
            <ChevronLeft className="h-4 w-4" /> Geri
          </Button>
          <Button onClick={goNext}>
            {step === TOTAL_STEPS ? (
              <>
                <Sparkles className="h-4 w-4" /> Oluştur
              </>
            ) : (
              <>
                İleri <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
