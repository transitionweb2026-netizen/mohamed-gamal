"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Modal dialog: focus moves inside, Escape and the backdrop close it, focus returns afterwards. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "sm",
  dismissable = true,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  dismissable?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const focusable = () => [...(node?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [])].filter((el) => !el.hasAttribute("disabled"));
    (node?.querySelector<HTMLElement>("[data-autofocus]") ?? focusable()[0] ?? node)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissable) {
        event.stopPropagation();
        onCloseRef.current();
      }
      if (event.key === "Tab") {
        const items = focusable();
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey, true);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, dismissable]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="ad-overlay" onMouseDown={(e) => e.target === e.currentTarget && dismissable && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={`ad-dialog ${size === "lg" ? "ad-dialog-lg" : size === "md" ? "ad-dialog-md" : ""}`}>
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
          <div className="min-w-0">
            <h2 id={titleId} className="ad-h2">
              {title}
            </h2>
            {description ? <p className="ad-muted mt-1 text-sm">{description}</p> : null}
          </div>
          {dismissable ? (
            <button type="button" className="ad-btn ad-btn-quiet ad-btn-sm ad-btn-icon -me-2" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          ) : null}
        </div>
        {children ? <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5">{children}</div> : null}
        {footer ? <div className="ad-divider flex flex-wrap items-center justify-end gap-2 px-6 py-4">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
