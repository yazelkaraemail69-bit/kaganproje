import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <ol className="flex w-full items-start">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <li key={label} className={cn("flex items-center", !isLast && "flex-1")}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors sm:h-9 sm:w-9",
                  isCompleted && "border-brand-600 bg-brand-600 text-white",
                  isActive && "border-brand-600 bg-white text-brand-600",
                  !isCompleted && !isActive && "border-slate-200 bg-white text-slate-400"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
              </div>
              <span
                className={cn(
                  "hidden text-center text-[11px] font-semibold sm:block",
                  isActive || isCompleted ? "text-slate-700" : "text-slate-400"
                )}
              >
                {label}
              </span>
            </div>
            {!isLast ? (
              <div
                className={cn(
                  "mx-1.5 mt-4 h-0.5 flex-1 rounded-full transition-colors sm:mt-[18px]",
                  isCompleted ? "bg-brand-600" : "bg-slate-200"
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
