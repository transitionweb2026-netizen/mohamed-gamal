import { Fragment, type ReactNode } from "react";
import { isSafeLink, sanitizeRichDoc, youtubeIdOf, type RichDoc, type RichMark, type RichNode } from "@/lib/cms/richtext";

/**
 * Renders an article body (structured rich text) as React elements. The
 * document is sanitized again here, and no HTML string is ever injected,
 * so stored content can never run as code.
 */
export function RichDocView({ doc, className = "" }: { doc: RichDoc; className?: string }) {
  const clean = sanitizeRichDoc(doc);
  return <div className={`prose-brand ${className}`}>{clean.content.map((node, i) => renderNode(node, i))}</div>;
}

function withMarks(text: string, marks: RichMark[] | undefined, key: number): ReactNode {
  let out: ReactNode = text;
  for (const mark of marks ?? []) {
    if (mark.type === "bold") out = <strong>{out}</strong>;
    else if (mark.type === "italic") out = <em>{out}</em>;
    else if (mark.type === "underline") out = <u>{out}</u>;
    else if (mark.type === "strike") out = <s>{out}</s>;
    else if (mark.type === "link" && isSafeLink(mark.attrs?.href)) {
      const external = /^https?:/i.test(mark.attrs!.href);
      out = (
        <a href={mark.attrs!.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="font-semibold text-aqua-700 underline decoration-aqua-500/60 underline-offset-4 hover:text-ink-900">
          {out}
        </a>
      );
    }
  }
  return <Fragment key={key}>{out}</Fragment>;
}

function children(node: RichNode): ReactNode[] {
  return (node.content ?? []).map((child, i) => renderNode(child, i));
}

function renderNode(node: RichNode, key: number): ReactNode {
  switch (node.type) {
    case "text":
      return withMarks(node.text ?? "", node.marks, key);
    case "hardBreak":
      return <br key={key} />;
    case "paragraph":
      return node.content?.length ? <p key={key}>{children(node)}</p> : null;
    case "heading":
      return node.attrs?.level === 3 ? <h3 key={key}>{children(node)}</h3> : <h2 key={key}>{children(node)}</h2>;
    case "bulletList":
      return <ul key={key}>{children(node)}</ul>;
    case "orderedList":
      return (
        <ol key={key} start={Number(node.attrs?.start) || 1}>
          {children(node)}
        </ol>
      );
    case "listItem":
      return <li key={key}>{(node.content ?? []).flatMap((child) => child.content ?? []).map((c, i) => renderNode(c, i))}</li>;
    case "blockquote":
      return (
        <blockquote key={key} className="rounded-2xl border-s-4 border-aqua-500 bg-aqua-50 px-5 py-4 font-display text-lg font-semibold text-ink-900">
          {(node.content ?? []).flatMap((child) => child.content ?? []).map((c, i) => renderNode(c, i))}
        </blockquote>
      );
    case "horizontalRule":
      return <hr key={key} className="border-aqua-500/30" />;
    case "image":
      return (
        <figure key={key} className="overflow-hidden rounded-2xl shadow-[0_0_0_1px_rgb(73_217_244/0.4)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- media library file, sanitized src */}
          <img src={String(node.attrs?.src)} alt={String(node.attrs?.alt ?? "")} loading="lazy" className="h-auto w-full" />
        </figure>
      );
    case "youtube": {
      const id = youtubeIdOf(node.attrs?.src);
      return id ? (
        <div key={key} className="relative aspect-video overflow-hidden rounded-2xl bg-ink-950">
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
            title="YouTube video"
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null;
    }
    default:
      return null;
  }
}
