import Image from "next/image";
import type { SiteView } from "@/lib/cms/view";

/**
 * The doctor's portrait (Doctor profile → portrait). Until a real photo is
 * set, a branded monogram panel stands in — no stock model is ever presented
 * as Dr. Mohamed Gamal.
 */
export function DoctorVisual({ site, className = "" }: { site: SiteView; className?: string }) {
  const { portrait, doctorName, doctorRole, monogram } = site.identity;
  return (
    <div className={`lg lg--ink relative overflow-hidden p-2.5 ${className}`}>
      <div className="img-frame relative aspect-[4/5] rounded-[22px] !bg-ink-800">
        {portrait ? (
          <Image src={portrait.src} alt={portrait.alt || doctorName} fill sizes="(min-width: 1024px) 480px, 100vw" className="object-cover" style={{ objectPosition: portrait.position || "50% 20%" }} />
        ) : (
          <div className="absolute inset-0 grid place-items-center overflow-hidden">
            <div className="orb" style={{ width: "90%", height: "90%", top: "-10%", opacity: 0.55 }} aria-hidden />
            <div className="deco-rings spin-slow" style={{ width: "58%", opacity: 0.8 }} aria-hidden />
            <span className="num-outline relative select-none text-[clamp(6rem,16vw,10rem)]" style={{ WebkitTextStroke: "2px rgb(73 217 244 / 0.85)" }} aria-hidden>
              {monogram}
            </span>
            <span className="ph absolute top-5 text-xs text-white/80" style={{ insetInlineStart: "1.25rem" }}>
              {site.ui["common.portraitNote"]}
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 z-[2] p-4">
          <div className="lg lg--deep lg--sm px-5 py-4">
            <p className="font-display text-lg font-bold">{doctorName}</p>
            <p className="text-sm text-aqua-300">{doctorRole}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
