import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { localizeHref, type Locale } from "@/i18n/config";
import type { ServiceView } from "@/lib/cms/view";
import { Arrow } from "@/components/ui/brand";
import { Icon } from "@/components/ui/icon";

/** Standard glass service card: icon, title, summary, key points. */
export function ServiceCard({ service, index, delay = 0 }: { service: ServiceView; index: number; delay?: number }) {
  return (
    <article
      id={service.slug}
      className="lg lg-hover group flex h-full scroll-mt-32 flex-col p-6 sm:p-7"
      data-reveal
      style={{ "--rd": `${delay}ms` } as React.CSSProperties}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="icon-tile icon-tile--lg">
          <Icon name={service.icon} size={26} />
        </span>
        <span className="num-outline text-5xl opacity-80">{String(index).padStart(2, "0")}</span>
      </div>
      <h3 className="mt-6 text-xl font-bold">{service.title}</h3>
      <p className="mt-3 text-[0.95rem] leading-7 text-ink-900/70">{service.summary}</p>
      <ul className="mt-5 space-y-2 border-t border-aqua-500/25 pt-5 text-sm">
        {service.points.map((p) => (
          <li key={p} className="flex items-center gap-2.5">
            <span className="grid h-5 w-5 flex-none place-items-center rounded-md bg-aqua-100 text-aqua-700 shadow-[inset_0_0_0_1px_rgb(73_217_244/0.6)]">
              <Check size={12} strokeWidth={3} aria-hidden />
            </span>
            {p}
          </li>
        ))}
      </ul>
    </article>
  );
}

/** Large image-led teal-ink glass card for flagship services. */
export function ServiceFeatureCard({ service, delay = 0 }: { service: ServiceView; delay?: number }) {
  const img = service.image;
  return (
    <article
      id={service.slug}
      className="lg lg--ink lg-hover group flex h-full scroll-mt-32 flex-col overflow-hidden p-2.5"
      data-reveal
      style={{ "--rd": `${delay}ms` } as React.CSSProperties}
    >
      <div className="img-frame img-zoom img-tint relative aspect-[4/3] rounded-[20px]">
        {img ? <Image src={img.src} alt={img.alt} fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="object-cover" style={img.position ? { objectPosition: img.position } : undefined} /> : null}
      </div>
      <div className="relative flex flex-1 flex-col px-4 pb-5 pt-0 sm:px-5">
        <span className="icon-tile icon-tile--lg -mt-8 ring-4 ring-ink-900">
          <Icon name={service.icon} size={26} />
        </span>
        <h3 className="mt-5 text-2xl font-bold">{service.title}</h3>
        <p className="mt-3 leading-7 text-white/75">{service.summary}</p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {service.points.map((p) => (
            <li key={p} className="chip chip--dark">
              {p}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/** Compact bento tile used on the home page. */
export function ServiceMiniCard({ service, locale, cta, delay = 0 }: { service: ServiceView; locale: Locale; cta: string; delay?: number }) {
  return (
    <Link
      href={localizeHref(`/services#${service.slug}`, locale)}
      className="lg lg-hover group flex h-full flex-col p-6"
      data-reveal
      style={{ "--rd": `${delay}ms` } as React.CSSProperties}
    >
      <span className="icon-tile">
        <Icon name={service.icon} size={22} />
      </span>
      <h3 className="mt-5 text-lg font-bold">{service.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-7 text-ink-900/70">{service.summary}</p>
      <span className="link-arrow mt-auto pt-5">
        {cta}
        <Arrow size={16} />
      </span>
    </Link>
  );
}
