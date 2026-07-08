import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface FieldWrapperProps {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FieldWrapper({ label, hint, required, className, children }: FieldWrapperProps) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-baseline gap-1 text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-accent-600">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

const baseFieldClasses =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-100";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  required?: boolean;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, required, wrapperClassName, className, ...props }, ref) => (
    <FieldWrapper label={label} hint={hint} required={required} className={wrapperClassName}>
      <input ref={ref} className={cn(baseFieldClasses, className)} {...props} />
    </FieldWrapper>
  )
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  required?: boolean;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, required, wrapperClassName, className, rows = 3, ...props }, ref) => (
    <FieldWrapper label={label} hint={hint} required={required} className={wrapperClassName}>
      <textarea ref={ref} rows={rows} className={cn(baseFieldClasses, "resize-none", className)} {...props} />
    </FieldWrapper>
  )
);
Textarea.displayName = "Textarea";
