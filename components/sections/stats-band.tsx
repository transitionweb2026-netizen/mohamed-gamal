import Image from "next/image";
import { photos, type PhotoKey } from "@/content/media";
import type { Stat } from "@/content/types";
import type { Locale } from "@/i18n/config";
import { Icon } from "@/components/ui/icon";
import { StatValue } from "./stat-value";

/**
 * Statistics band: an image (with the section title laid over it) beside a
 * symmetric 2 × 2 grid of stat cards — both columns share the same height.
 * "aqua" = electric-cyan surface; "ink" = deep teal surface.
 * ⚠ Values are placeholders ([[XX]]) until real figures are provided.
 */
export function StatsBand({
  eyebrow,
  title,
  stats,
  photo,
  locale,
  tone = "aqua",
}: {
  eyebrow: string;
  title: string;
  stats: Stat[];
  photo: PhotoKey;
  locale: Locale;
  tone?: "aqua" | "ink";
}) {
  const ink = tone === "ink";
  const img = photos[photo];
  return (
    <section className={`section ${ink ? "bg-ink on-dark" : "bg-aqua"} !py-[clamp(4rem,7vw,6rem)]`}>
      <div
        className="orb float-slow"
        style={{ width: 380, height: 380, insetInlineStart: "-6%", top: "-30%", opacity: ink ? 0.4 : 0.7, background: ink ? undefined : "radial-gradient(circle, rgb(255 255 255 / 0.9), transparent 70%)" }}
        aria-hidden
      />
      <div className="container-x grid gap-4 sm:gap-5 lg:grid-cols-2">
        {/* Image with the section title on top of it */}
        <figure className={`lg ${ink ? "lg--deep" : "lg--clear"} relative min-h-[340px] overflow-hidden p-2.5`} data-reveal="start">
          <div className="img-frame parallax-img absolute inset-2.5 rounded-[22px]">
            <Image src={img.src} alt={img.alt[locale]} fill sizes="(min-width: 1024px) 620px, 100vw" className="object-cover" />
            <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgb(0 22 28 / 0.7), rgb(0 41 51 / 0.15) 55%, rgb(73 217 244 / 0.2))" }} aria-hidden />
          </div>
          <figcaption className="lg lg--deep relative z-[2] m-2 p-5 sm:m-3 sm:p-6">
            <span className="eyebrow eyebrow--light">{eyebrow}</span>
            <h2 className="mt-3 text-[clamp(1.6rem,3vw,2.4rem)] font-bold text-white">{title}</h2>
          </figcaption>
        </figure>

        {/* Symmetric 2 × 2 stat cards */}
        <ul className="grid auto-rows-fr grid-cols-2 gap-4 sm:gap-5">
          {stats.map((s, i) => (
            <li
              key={s.label}
              className={`lg ${ink ? "lg--deep" : "lg--clear"} lg-hover group flex flex-col items-center justify-center p-5 text-center sm:p-7`}
              data-reveal
              style={{ "--rd": `${i * 90}ms` } as React.CSSProperties}
            >
              <div className="flex w-full items-center gap-3">
                <span className={`h-px flex-1 ${ink ? "bg-gradient-to-l from-aqua-500/60" : "bg-gradient-to-l from-ink-900/30"} to-transparent rtl:bg-gradient-to-r`} aria-hidden />
                <span className={`icon-tile icon-tile--sm ${ink ? "" : "icon-tile--ink"}`}>
                  <Icon name={s.icon} size={18} />
                </span>
                <span className={`h-px flex-1 ${ink ? "bg-gradient-to-r from-aqua-500/60" : "bg-gradient-to-r from-ink-900/30"} to-transparent rtl:bg-gradient-to-l`} aria-hidden />
              </div>
              <p className={`mt-5 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-none ${ink ? "text-aqua-gradient" : "text-ink-900"}`}>
                <span dir="ltr" className="inline-block">
                  <StatValue value={s.value} />
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
