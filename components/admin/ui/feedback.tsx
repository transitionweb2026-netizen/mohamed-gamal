"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Dialog } from "./dialog";

/* ---- Toasts --------------------------------------------------------------------- */

type ToastTone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastApi {
  success(message: string): void;
  error(message: string): void;
  info(message: string): void;
}

/* ---- Confirmation dialog ------------------------------------------------------------ */

export interface ConfirmOptions {
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
}

const FeedbackContext = createContext<{ toast: ToastApi; confirm: (options: ConfirmOptions) => Promise<boolean> } | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const next = useRef(1);
  const [pending, setPending] = useState<(ConfirmOptions & { resolve: (value: boolean) => void }) | null>(null);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (tone: ToastTone, message: string) => {
      const id = next.current++;
      setToasts((list) => [...list.slice(-3), { id, tone, message }]);
      setTimeout(() => dismiss(id), tone === "error" ? 9000 : 4500);
    },
    [dismiss],
  );

  const toast = useMemo<ToastApi>(() => ({ success: (m) => push("success", m), error: (m) => push("error", m), info: (m) => push("info", m) }), [push]);
  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })), []);
  const close = (value: boolean) => {
    pending?.resolve(value);
    setPending(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex flex-col items-center gap-2 px-4 sm:items-end sm:pe-6" aria-live="polite" role="status">
        {toasts.map((t) => (
          <div key={t.id} className="ad-toast pointer-events-auto">
            {t.tone === "success" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-aqua-400" /> : t.tone === "error" ? <XCircle size={18} className="mt-0.5 shrink-0 text-[#ff9aa8]" /> : <Info size={18} className="mt-0.5 shrink-0 text-aqua-400" />}
            <p className="min-w-0 flex-1">{t.message}</p>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="-me-1 rounded-md p-0.5 text-white/60 hover:text-white">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <Dialog
        open={!!pending}
        onClose={() => close(false)}
        title={
          <span className="flex items-center gap-2">
            {pending?.tone === "danger" ? <AlertTriangle size={20} className="text-[var(--danger)]" /> : null}
            {pending?.title}
          </span>
        }
        footer={
          <>
            <button type="button" className="ad-btn ad-btn-ghost" onClick={() => close(false)}>
              {pending?.cancelLabel ?? "Cancel"}
            </button>
            <button type="button" data-autofocus className={`ad-btn ${pending?.tone === "danger" ? "ad-btn-danger" : "ad-btn-primary"}`} onClick={() => close(true)}>
              {pending?.confirmLabel ?? "Confirm"}
            </button>
          </>
        }
      >
        {pending?.body ? <div className="ad-muted text-sm">{pending.body}</div> : null}
      </Dialog>
    </FeedbackContext.Provider>
  );
}

function useFeedback() {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error("FeedbackProvider is missing.");
  return value;
}

export const useToast = () => useFeedback().toast;
export const useConfirm = () => useFeedback().confirm;
