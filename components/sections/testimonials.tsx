import { Quote, UserRound } from "lucide-react";
import type { Testimonial } from "@/content/types";
import { RichText } from "@/components/ui/rich-text";

/** ⚠ Testimonial content is placeholder until real, consented reviews are supplied. */
export function TestimonialCards({ items }: { items: Testimonial[] }) {
  return (
    <ul className="mt-12 grid gap-5 md:grid-cols-3">
      {items.map((item, i) => {
        const ink = i === 1;
        return (
          <li
            key={i}
            className={`lg ${ink ? "lg--ink md:-translate-y-6" : ""} lg-hover group flex flex-col p-7`}
            data-reveal
            style={{ "--rd": `${i * 110}ms` } as React.CSSProperties}
          >
            <span className={`icon-tile ${ink ? "" : "icon-tile--ink"}`}>
              <Quote size={22} aria-hidden className="rtl:-scale-x-100" />
            </span>
            <blockquote className={`mt-6 flex-1 text-[1.02rem] leading-8 ${ink ? "text-white/85" : "text-ink-900/80"}`}>
              <RichText text={item.quote} />
            </blockquote>
            <div className={`mt-7 flex items-center gap-3 border-t pt-5 ${ink ? "border-aqua-500/25" : "border-ink-900/10"}`}>
              <span className={`grid h-11 w-11 place-items-center rounded-full ${ink ? "bg-aqua-500/20 text-aqua-300" : "bg-aqua-100 text-aqua-700"} shadow-[inset_0_0_0_1px_rgb(73_217_244/0.6)]`}>
                <UserRound size={20} aria-hidden />
              </span>
              <span className="text-sm">
                <span className="block font-display font-bold">
                  <RichText text={item.name} />
                </span>
                <span className={`mt-1 block ${ink ? "text-aqua-300" : "text-ink-900/60"}`}>
                  <RichText text={item.meta} />
                </span>
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
