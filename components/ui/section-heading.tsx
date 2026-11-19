import type { ReactNode } from "react";
import { RichText } from "./rich-text";

interface Props {
  eyebrow: string;
  title: string;
  text?: string;
  align?: "start" | "center";
  /** Extra element shown beside the heading on wide screens (e.g. a "view all" link). */
  aside?: ReactNode;
  className?: string;
  as?: "h1" | "h2";
}

export function SectionHeading({ eyebrow, title, text, align = "start", aside, className = "", as: Tag = "h2" }: Props) {
  const centered = align === "center";
  return (
    <div className={`flex flex-col gap-6 md:flex-row md:items-end md:justify-between ${centered ? "md:flex-col md:items-center" : ""} ${className}`}>
      <div className={`max-w-2xl ${centered ? "mx-auto text-center" : ""}`} data-reveal>
        {eyebrow ? <span className={`eyebrow ${centered ? "justify-center" : ""}`}>{eyebrow}</span> : null}
        <Tag className={`h-section ${eyebrow ? "mt-4" : ""}`}>
          <RichText text={title} />
        </Tag>
        {text ? (
          <p className="lead mt-4">
            <RichText text={text} />
          </p>
        ) : null}
      </div>
      {aside ? (
        <div className="shrink-0" data-reveal style={{ "--rd": "120ms" } as React.CSSProperties}>
          {aside}
        </div>
      ) : null}
    </div>
  );
}
