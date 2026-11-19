/**
 * Article bodies are rich text stored as a structured document (the TipTap /
 * ProseMirror JSON format), never as HTML. Only the node types, marks and
 * attributes listed here are kept — on save (server) and again when
 * rendering — so nothing an editor pastes can run as code on the website.
 */

export interface RichMark {
  type: "bold" | "italic" | "underline" | "strike" | "link";
  attrs?: { href: string; target?: "_blank" | null };
}

export interface RichNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  marks?: RichMark[];
  text?: string;
}

export interface RichDoc {
  type: "doc";
  content: RichNode[];
}

export const emptyRichDoc = (): RichDoc => ({ type: "doc", content: [] });

const BLOCKS = new Set(["paragraph", "heading", "bulletList", "orderedList", "listItem", "blockquote", "horizontalRule", "image", "youtube"]);
const INLINE = new Set(["text", "hardBreak"]);
const MARKS = new Set(["bold", "italic", "underline", "strike", "link"]);

/** Same rules as public.is_safe_href in the database. */
export function isSafeLink(value: unknown): value is string {
  if (typeof value !== "string" || !value || value.length > 2048) return false;
  if (/[\s\u0000-\u001f\u007f]/.test(value)) return false;
  return (
    (value.startsWith("/") && !value.startsWith("//")) ||
    /^#[A-Za-z0-9_-]*$/.test(value) ||
    /^https?:\/\/[^/\s]+/i.test(value) ||
    /^tel:\+?[0-9]{4,20}$/i.test(value) ||
    /^mailto:[^@\s]+@[^@\s]+$/i.test(value)
  );
}

/** Images inside articles: a file from the media library (site path or https storage URL). */
function isSafeImageSrc(value: unknown): value is string {
  return typeof value === "string" && value.length <= 2048 && (/^\/(images|uploads)\/[A-Za-z0-9/_.-]+$/.test(value) || /^https:\/\/[a-z0-9.-]+\/storage\/v1\/object\/public\/[A-Za-z0-9/_.%-]+$/i.test(value));
}

/** The 11-character id of a YouTube video URL, or null. */
export function youtubeIdOf(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = value.match(/^https:\/\/(?:www\.|m\.)?(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function cleanMarks(marks: unknown): RichMark[] | undefined {
  if (!Array.isArray(marks)) return undefined;
  const out: RichMark[] = [];
  for (const mark of marks) {
    if (!mark || typeof mark !== "object" || !MARKS.has((mark as RichMark).type)) continue;
    const type = (mark as RichMark).type;
    if (type === "link") {
      const href = (mark as RichMark).attrs?.href;
      if (!isSafeLink(href)) continue;
      out.push({ type, attrs: { href, target: /^https?:/i.test(href) ? "_blank" : null } });
    } else out.push({ type });
  }
  return out.length ? out : undefined;
}

function cleanNode(node: unknown, depth: number): RichNode | null {
  if (!node || typeof node !== "object" || depth > 12) return null;
  const n = node as RichNode;
  if (n.type === "text") {
    if (typeof n.text !== "string" || !n.text) return null;
    const marks = cleanMarks(n.marks);
    return marks ? { type: "text", text: n.text.slice(0, 20000), marks } : { type: "text", text: n.text.slice(0, 20000) };
  }
  if (n.type === "hardBreak" || n.type === "horizontalRule") return { type: n.type };
  if (!BLOCKS.has(n.type) && !INLINE.has(n.type)) return null;

  if (n.type === "image") {
    const src = n.attrs?.src;
    if (!isSafeImageSrc(src)) return null;
    const alt = typeof n.attrs?.alt === "string" ? n.attrs.alt.slice(0, 400) : "";
    const mediaId = typeof n.attrs?.mediaId === "string" && /^[0-9a-f-]{36}$/i.test(n.attrs.mediaId) ? n.attrs.mediaId : null;
    return { type: "image", attrs: { src, alt, mediaId } };
  }
  if (n.type === "youtube") {
    const id = youtubeIdOf(n.attrs?.src);
    return id ? { type: "youtube", attrs: { src: `https://www.youtube.com/watch?v=${id}` } } : null;
  }

  const content = Array.isArray(n.content) ? n.content.map((child) => cleanNode(child, depth + 1)).filter((c): c is RichNode => c !== null) : [];
  if (n.type === "heading") {
    const level = n.attrs?.level === 3 ? 3 : 2;
    return { type: "heading", attrs: { level }, content };
  }
  if (n.type === "orderedList") {
    const start = typeof n.attrs?.start === "number" && n.attrs.start > 0 ? Math.floor(n.attrs.start) : 1;
    return { type: "orderedList", attrs: { start }, content };
  }
  return { type: n.type, content };
}

/** The document with only allowed content (what gets saved and rendered). */
export function sanitizeRichDoc(value: unknown): RichDoc {
  if (!value || typeof value !== "object" || (value as RichDoc).type !== "doc") return emptyRichDoc();
  const content = Array.isArray((value as RichDoc).content) ? (value as RichDoc).content : [];
  return { type: "doc", content: content.map((node) => cleanNode(node, 0)).filter((n): n is RichNode => n !== null && BLOCKS.has(n.type)).slice(0, 500) };
}

/** Plain text of a document (reading time, search, excerpts). */
export function richText(node: RichNode | RichDoc): string {
  if ((node as RichNode).type === "text") return (node as RichNode).text ?? "";
  const parts = (node.content ?? []).map((child) => richText(child));
  return parts.join(node.type === "doc" || node.type === "bulletList" || node.type === "orderedList" ? "\n" : " ");
}

export function readingMinutes(doc: RichDoc): number {
  const words = richText(doc).split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.ceil(words / 160));
}

/* ---- Conversion from the bundled article format ------------------------------ */

export type LegacyBlock = { type: "p"; text: string } | { type: "h"; text: string } | { type: "list"; items: string[] };

const textNode = (text: string): RichNode[] => (text ? [{ type: "text", text }] : []);

export function blocksToDoc(blocks: LegacyBlock[]): RichDoc {
  return {
    type: "doc",
    content: blocks.map((block): RichNode => {
      if (block.type === "h") return { type: "heading", attrs: { level: 2 }, content: textNode(block.text) };
      if (block.type === "list")
        return { type: "bulletList", content: block.items.map((item) => ({ type: "listItem", content: [{ type: "paragraph", content: textNode(item) }] })) };
      return { type: "paragraph", content: textNode(block.text) };
    }),
  };
}
