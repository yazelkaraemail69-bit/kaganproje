"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { StepRestaurantInfo } from "@/components/menu/StepRestaurantInfo";
import { StepMenuItems } from "@/components/menu/StepMenuItems";
import { StepTheme } from "@/components/menu/StepTheme";
import { MenuPreview } from "@/components/menu/MenuPreview";
import { createEmptyMenu, type MenuData } from "@/lib/types";

const STEP_LABELS = ["Restoran Bilgisi", "Ürünler", "Tema"];
const TOTAL_STEPS = STEP_LABELS.length;

export function MenuWizard() {
  const [step, setStep] = useState(1);
  const [view, setView] = useState<"form" | "preview">("form");
  const [data, setData] = useState<MenuData>(createEmptyMenu);
  const [error, setError] = useState("");

  function updateData(patch: Partial<MenuData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  function validateStep(): boolean {
    if (step === 1 && !data.restaurantName.trim()) {
      setError("Lütfen restoran adını girin.");
      return false;
    }
    if (step === 2) {
      const hasAtLeastOneItem = data.categories.some((category) =>
        category.items.some((item) => item.name.trim())
      );
      if (!hasAtLeastOneItem) {
        setError("Lütfen en az bir ürün ekleyin.");
        return false;
      }
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
    setData(createEmptyMenu());
    setStep(1);
    setError("");
    setView("form");
  }

  if (view === "preview") {
    return (
      <div className="container-app py-10 sm:py-14">
        <MenuPreview data={data} onEdit={() => setView("form")} onReset={handleReset} />
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

        {step === 1 ? <StepRestaurantInfo data={data} onChange={updateData} /> : null}
        {step === 2 ? <StepMenuItems data={data} onChange={updateData} /> : null}
        {step === 3 ? <StepTheme data={data} onChange={updateData} /> : null}

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
