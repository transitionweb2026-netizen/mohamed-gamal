import { Fragment } from "react";

const PLACEHOLDER = /\[\[(.+?)\]\]/g;

/**
 * Renders content text, highlighting [[placeholders]] with the `.ph`
 * style so information still to be supplied is obvious on the page.
 */
export function RichText({ text }: { text: string }) {
  if (!text.includes("[[")) return <>{text}</>;
  const parts = text.split(PLACEHOLDER);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="ph" title="Placeholder — replace with real content">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/** Plain text with the placeholder brackets removed (for alt text / metadata). */
export function plainText(text: string): string {
  return text.replace(PLACEHOLDER, "$1");
}
