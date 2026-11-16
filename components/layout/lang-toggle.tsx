"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LOCALE_COOKIE, switchLocalePath, type Locale } from "@/i18n/config";

/**
 * AR / EN switch. A cyan liquid thumb slides (with a squash-and-stretch)
 * to the chosen language, then the page navigates to the same URL in that
 * language. Always laid out AR | EN, whatever the page direction.
 */
export function LangToggle({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [target, setTarget] = useState<Locale | null>(null);
  const active = target ?? locale;

  const go = (next: Locale) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    if (next === locale || target) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    const href = switchLocalePath(pathname, next);
    router.prefetch(href);
    setTarget(next);
    window.setTimeout(() => router.push(href), 380);
  };

  return (
    <div className="lang-toggle" dir="ltr" role="group" aria-label={label} data-active={active} data-switching={target ? "" : undefined}>
      <span className="lang-toggle__thumb" aria-hidden />
      {(["ar", "en"] as const).map((l) => (
        <Link
          key={l}
          href={switchLocalePath(pathname, l)}
          hrefLang={l}
          lang={l}
          onClick={go(l)}
          aria-current={l === locale ? "true" : undefined}
          className="lang-toggle__opt"
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
