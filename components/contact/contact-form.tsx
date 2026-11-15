"use client";

import { useState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { whatsappHref } from "@/config/site";
import { WhatsAppIcon } from "@/components/ui/brand-icons";

export interface ContactFormLabels {
  name: string;
  phone: string;
  reason: string;
  reasons: string[];
  message: string;
  submit: string;
  sent: string;
  required: string;
  privacy: string;
  greeting: string;
}

/**
 * (suppressHydrationWarning on the controls: form-filler browser extensions
 * inject attributes such as `fdprocessedid` before React hydrates.)
 *
 * No backend: on submit the form composes a WhatsApp message from the
 * visitor's details and opens it, so nothing is stored on the website.
 */
export function ContactForm({ labels }: { labels: ContactFormLabels }) {
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const reason = String(data.get("reason") ?? "");
    const message = String(data.get("message") ?? "").trim();
    const next = { name: !name, phone: !phone };
    setErrors(next);
    if (next.name || next.phone) {
      e.currentTarget.querySelector<HTMLElement>('[aria-invalid="true"], #cf-name')?.focus();
      return;
    }
    const text = [labels.greeting, `${labels.name}: ${name}`, `${labels.phone}: ${phone}`, `${labels.reason}: ${reason}`, message].filter(Boolean).join("\n");
    window.open(whatsappHref(text), "_blank", "noopener,noreferrer");
    setSent(true);
  };

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field id="cf-name" label={labels.name} error={errors.name ? labels.required : undefined}>
        <input suppressHydrationWarning id="cf-name" name="name" autoComplete="name" className="field" aria-invalid={errors.name || undefined} aria-describedby={errors.name ? "cf-name-err" : undefined} />
      </Field>
      <Field id="cf-phone" label={labels.phone} error={errors.phone ? labels.required : undefined}>
        <input
          suppressHydrationWarning
          id="cf-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          className="field text-start"
          aria-invalid={errors.phone || undefined}
          aria-describedby={errors.phone ? "cf-phone-err" : undefined}
        />
      </Field>
      <Field id="cf-reason" label={labels.reason} className="sm:col-span-2">
        <select suppressHydrationWarning id="cf-reason" name="reason" className="field">
          {labels.reasons.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </Field>
      <Field id="cf-message" label={labels.message} className="sm:col-span-2">
        <textarea suppressHydrationWarning id="cf-message" name="message" rows={5} className="field resize-y" />
      </Field>
      <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs text-ink-900/60">
          <Lock size={14} className="flex-none text-aqua-700" aria-hidden />
          {labels.privacy}
        </p>
        <button type="submit" className="btn btn--ink" suppressHydrationWarning>
          <span className="btn__icon">
            <WhatsAppIcon width={17} height={17} />
          </span>
          {labels.submit}
        </button>
      </div>
      <p role="status" className={`sm:col-span-2 ${sent ? "flex" : "hidden"} items-center gap-2 rounded-xl bg-aqua-100 px-4 py-3 text-sm font-semibold text-ink-900 shadow-[inset_0_0_0_1px_rgb(73_217_244/0.7)]`}>
        <CheckCircle2 size={18} className="text-aqua-700" aria-hidden />
        {sent ? labels.sent : ""}
      </p>
    </form>
  );
}

function Field({ id, label, error, className = "", children }: { id: string; label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block font-display text-sm font-semibold">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-xs font-semibold text-[#c23a50]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
