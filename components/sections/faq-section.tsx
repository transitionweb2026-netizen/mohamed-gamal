import { MessageCircleQuestion } from "lucide-react";
import { whatsappLink } from "@/lib/cms/links";
import type { FaqView, HeadingView, SiteView } from "@/lib/cms/view";
import { WhatsAppIcon } from "@/components/ui/brand-icons";
import { RichText } from "@/components/ui/rich-text";
import { Accordion } from "./accordion";

export function FaqSection({ site, heading, items, className = "bg-snow" }: { site: SiteView; heading: HeadingView; items: FaqView[]; className?: string }) {
  const { ui, contact } = site;
  return (
    <section className={`section ${className}`}>
      <div className="container-x grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="lg:sticky lg:top-32 lg:self-start" data-reveal>
          {heading.eyebrow ? <span className="eyebrow">{heading.eyebrow}</span> : null}
          <h2 className="h-section mt-4">{heading.title}</h2>
          {heading.text ? <p className="lead mt-4">{heading.text}</p> : null}
          {contact.whatsappDigits ? (
            <div className="lg lg--ink mt-8 overflow-hidden p-6">
              <div className="orb" style={{ width: 220, height: 220, insetInlineEnd: -60, top: -80, opacity: 0.5 }} aria-hidden />
              <span className="icon-tile">
                <MessageCircleQuestion size={22} aria-hidden />
              </span>
              <p className="mt-4 font-display text-xl font-bold">{ui["common.questions"]}</p>
              <p className="mt-1 text-sm leading-7 text-white/70">{ui["faq.askText"]}</p>
              <a href={whatsappLink(contact.whatsappDigits, contact.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="btn btn--aqua btn--sm mt-5">
                <span className="btn__icon">
                  <WhatsAppIcon width={15} height={15} />
                </span>
                {site.global.cta?.whatsappLabel || "WhatsApp"}
              </a>
            </div>
          ) : null}
        </div>
        <Accordion items={items.map((f) => ({ q: f.q, a: <RichText text={f.a} /> }))} />
      </div>
    </section>
  );
}
