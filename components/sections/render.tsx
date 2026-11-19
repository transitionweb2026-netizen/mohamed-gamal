import { Fragment, type ReactNode } from "react";
import type { PageView, SectionView } from "@/lib/cms/view";

// Each page maps its section keys to renderers; content shapes come from the registry.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SectionRenderers = Record<string, (content: any, section: SectionView) => ReactNode>;

/** A page's visible sections, in the order set in the dashboard. */
export function renderSections(page: PageView | undefined, renderers: SectionRenderers): ReactNode {
  if (!page) return null;
  return page.sections.map((section) => {
    const render = renderers[section.key];
    return render ? <Fragment key={section.id}>{render(section.content, section)}</Fragment> : null;
  });
}

/** The content of one section of a page (null when hidden or missing). */
export function sectionContent<T>(page: PageView | undefined, key: string): T | null {
  return (page?.sections.find((s) => s.key === key)?.content as T | undefined) ?? null;
}
