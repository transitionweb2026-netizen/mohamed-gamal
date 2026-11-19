import type { StepView as Step } from "@/lib/cms/view";
import { Icon } from "@/components/ui/icon";

/** Home "treatment journey": four glass steps joined by a flowing cyan line. */
export function ProcessRow({ steps }: { steps: Step[] }) {
  return (
    <div className="relative mt-14">
      <svg className="pointer-events-none absolute inset-x-0 top-[3.25rem] hidden h-16 w-full lg:block rtl:-scale-x-100" viewBox="0 0 1200 60" preserveAspectRatio="none" fill="none" aria-hidden>
        <path d="M60 30 C 200 -10, 300 70, 450 30 S 700 -10, 800 30 S 1050 70, 1140 30" stroke="#49D9F4" strokeWidth="2" strokeDasharray="6 8" opacity="0.8" />
      </svg>
      <ol className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.tag} className={`lg ${i === 1 || i === 3 ? "lg--aqua" : ""} lg-hover group flex flex-col p-6 lg:mt-[calc(var(--o)*1rem)]`} data-reveal style={{ "--rd": `${i * 110}ms`, "--o": i % 2 } as React.CSSProperties}>
            <div className="flex items-center justify-between">
              <span className="icon-tile icon-tile--ink icon-tile--lg">
                <Icon name={s.icon} size={26} />
              </span>
              <span className="num-outline text-5xl" dir="ltr">
                {s.tag}
              </span>
            </div>
            <h3 className="mt-6 text-xl font-bold">{s.title}</h3>
            <p className="mt-2 text-[0.95rem] leading-7 text-ink-900/72">{s.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Services "treatment process": vertical zig-zag timeline on deep teal. */
export function ProcessTimeline({ steps }: { steps: Step[] }) {
  return (
    <ol className="relative mx-auto mt-14 max-w-5xl">
      <span className="absolute inset-y-4 w-[2px] bg-gradient-to-b from-aqua-500 via-aqua-500/50 to-transparent max-md:start-7 md:left-1/2 md:-translate-x-1/2" aria-hidden />
      {steps.map((s, i) => {
        const flip = i % 2 === 1;
        return (
          <li key={s.tag} className="relative grid items-center gap-4 pb-8 last:pb-0 md:grid-cols-2 md:gap-16">
            <span
              className="absolute top-6 z-[1] grid h-14 w-14 place-items-center rounded-2xl bg-ink-900 font-display text-sm font-bold text-aqua-400 shadow-[0_0_0_1px_rgb(73_217_244/0.6),0_0_30px_-4px_rgb(73_217_244/0.8)] max-md:start-0 md:left-1/2 md:-translate-x-1/2"
              dir="ltr"
              aria-hidden
            >
              {s.tag}
            </span>
            <div
              className={`lg lg--deep lg-hover group p-6 max-md:ms-20 ${flip ? "md:col-start-2" : "md:col-start-1 md:text-end"}`}
              data-reveal={flip ? "end" : "start"}
              style={{ "--rd": `${i * 80}ms` } as React.CSSProperties}
            >
              <div className={`flex items-center gap-4 ${flip ? "" : "md:flex-row-reverse"}`}>
                <span className="icon-tile icon-tile--glass">
                  <Icon name={s.icon} size={22} />
                </span>
                <h3 className="text-xl font-bold">{s.title}</h3>
              </div>
              <p className="mt-3 leading-7 text-white/72">{s.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
