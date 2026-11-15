import type { Stat } from "@/content/types";
import { Icon } from "@/components/ui/icon";
import { RichText } from "@/components/ui/rich-text";

/**
 * Statistics band. "aqua" = electric-cyan surface with clear glass tiles;
 * "ink" = deep teal surface with teal glass tiles.
 * ⚠ Values are placeholders ([[XX]]) until real figures are provided.
 */
export function StatsBand({ eyebrow, title, stats, tone = "aqua" }: { eyebrow: string; title: string; stats: Stat[]; tone?: "aqua" | "ink" }) {
  const ink = tone === "ink";
  return (
    <section className={`section ${ink ? "bg-ink on-dark" : "bg-aqua"} !py-[clamp(4rem,7vw,6rem)]`}>
      <div className="orb float-slow" style={{ width: 380, height: 380, insetInlineStart: "-6%", top: "-30%", opacity: ink ? 0.4 : 0.7, background: ink ? undefined : "radial-gradient(circle, rgb(255 255 255 / 0.9), transparent 70%)" }} aria-hidden />
      <div className="container-x grid items-center gap-10 lg:grid-cols-[0.75fr_1.25fr]">
        <div data-reveal>
          <span className={`eyebrow ${ink ? "" : "!text-ink-900"}`}>{eyebrow}</span>
          <h2 className={`h-section mt-4 ${ink ? "text-white" : "text-ink-900"}`}>{title}</h2>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4">
          {stats.map((s, i) => (
            <li
              key={s.label}
              className={`lg ${ink ? "lg--deep" : "lg--clear"} lg-hover group p-5 sm:p-6`}
              data-reveal
              style={{ "--rd": `${i * 90}ms` } as React.CSSProperties}
            >
              <div className="flex items-center justify-between">
                <span className={`icon-tile icon-tile--sm ${ink ? "" : "icon-tile--ink"}`}>
                  <Icon name={s.icon} size={18} />
                </span>
                <span className={`h-px flex-1 ms-4 ${ink ? "bg-aqua-500/30" : "bg-ink-900/15"}`} aria-hidden />
              </div>
              <p className={`mt-5 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-none ${ink ? "text-aqua-gradient" : "text-ink-900"}`}>
                <span dir="ltr" className="inline-block">
                  <RichText text={s.value} />
                </span>
              </p>
              <p className={`mt-3 text-sm font-semibold ${ink ? "text-white/75" : "text-ink-900/75"}`}>{s.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
