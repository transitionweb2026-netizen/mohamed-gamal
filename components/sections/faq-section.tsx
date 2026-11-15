import { MessageCircleQuestion } from "lucide-react";
import { whatsappHref } from "@/config/site";
import type { Dictionary, Faq } from "@/content/types";
import { WhatsAppIcon } from "@/components/ui/brand-icons";
import { RichText } from "@/components/ui/rich-text";
import { Accordion } from "./accordion";

export function FaqSection({ t, eyebrow, title, text, items, className = "bg-snow" }: { t: Dictionary; eyebrow: string; title: string; text?: string; items: Faq[]; className?: string }) {
  return (
    <section className={`section ${className}`}>
      <div className="container-x grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="lg:sticky lg:top-32 lg:self-start" data-reveal>
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="h-section mt-4">{title}</h2>
          {text ? <p className="lead mt-4">{text}</p> : null}
          <div className="lg lg--ink mt-8 overflow-hidden p-6">
            <div className="orb" style={{ width: 220, height: 220, insetInlineEnd: -60, top: -80, opacity: 0.5 }} aria-hidden />
            <span className="icon-tile">
              <MessageCircleQuestion size={22} aria-hidden />
            </span>
            <p className="mt-4 font-display text-xl font-bold">{t.common.questions}</p>
            <p className="mt-1 text-sm leading-7 text-white/70">{t.home.faq.text}</p>
            <a href={whatsappHref(t.cta.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="btn btn--aqua btn--sm mt-5">
              <span className="btn__icon">
                <WhatsAppIcon width={15} height={15} />
              </span>
              {t.cta.whatsapp}
            </a>
          </div>
        </div>
        <Accordion items={items.map((f) => ({ q: f.q, a: <RichText text={f.a} /> }))} />
      </div>
    </section>
  );
}
