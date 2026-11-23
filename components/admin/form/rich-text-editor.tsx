"use client";

import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, Strikethrough, Underline, Undo2, Unlink, MonitorPlay as YoutubeIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { isSafeLink, sanitizeRichDoc, youtubeIdOf, type RichDoc } from "@/lib/cms/richtext";
import { MediaPicker } from "../media/media-picker";
import { Dialog } from "../ui/dialog";

/** Images keep the id of their media-library file (so the library knows where each file is used). */
const LibraryImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      mediaId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-media-id"),
        renderHTML: (attributes) => (attributes.mediaId ? { "data-media-id": attributes.mediaId } : {}),
      },
    };
  },
});

function ToolButton({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid size-8 place-items-center rounded-lg transition disabled:opacity-35 ${active ? "bg-ink-900 text-aqua-400" : "text-ink-700 hover:bg-ink-100"}`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, onImage, onLink, onVideo }: { editor: Editor; onImage: () => void; onLink: () => void; onVideo: () => void }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      undo: e.can().undo(),
      redo: e.can().redo(),
    }),
  });
  const chain = () => editor.chain().focus();
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--line)] bg-white/70 px-2 py-1.5" role="toolbar" aria-label="Formatting">
      <ToolButton label="Heading" active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        <Heading2 size={16} />
      </ToolButton>
      <ToolButton label="Sub-heading" active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
        <Heading3 size={16} />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-ink-200" />
      <ToolButton label="Bold" active={state.bold} onClick={() => chain().toggleBold().run()}>
        <Bold size={16} />
      </ToolButton>
      <ToolButton label="Italic" active={state.italic} onClick={() => chain().toggleItalic().run()}>
        <Italic size={16} />
      </ToolButton>
      <ToolButton label="Underline" active={state.underline} onClick={() => chain().toggleUnderline().run()}>
        <Underline size={16} />
      </ToolButton>
      <ToolButton label="Strikethrough" active={state.strike} onClick={() => chain().toggleStrike().run()}>
        <Strikethrough size={16} />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-ink-200" />
      <ToolButton label="Bulleted list" active={state.bullet} onClick={() => chain().toggleBulletList().run()}>
        <List size={16} />
      </ToolButton>
      <ToolButton label="Numbered list" active={state.ordered} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered size={16} />
      </ToolButton>
      <ToolButton label="Quote" active={state.quote} onClick={() => chain().toggleBlockquote().run()}>
        <Quote size={16} />
      </ToolButton>
      <ToolButton label="Divider" onClick={() => chain().setHorizontalRule().run()}>
        <Minus size={16} />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-ink-200" />
      <ToolButton label="Link" active={state.link} onClick={onLink}>
        <Link2 size={16} />
      </ToolButton>
      {state.link ? (
        <ToolButton label="Remove link" onClick={() => chain().extendMarkRange("link").unsetLink().run()}>
          <Unlink size={16} />
        </ToolButton>
      ) : null}
      <ToolButton label="Image from the media library" onClick={onImage}>
        <ImagePlus size={16} />
      </ToolButton>
      <ToolButton label="YouTube video" onClick={onVideo}>
        <YoutubeIcon size={16} />
      </ToolButton>
      <span className="ms-auto flex gap-0.5">
        <ToolButton label="Undo" disabled={!state.undo} onClick={() => chain().undo().run()}>
          <Undo2 size={16} />
        </ToolButton>
        <ToolButton label="Redo" disabled={!state.redo} onClick={() => chain().redo().run()}>
          <Redo2 size={16} />
        </ToolButton>
      </span>
    </div>
  );
}

/**
 * Article editor. Produces the structured document format the website
 * renders (never HTML); the same rules are enforced again when saving.
 */
export function RichTextEditor({ value, onChange, dir, label, invalid }: { value: RichDoc; onChange: (doc: RichDoc) => void; dir: "rtl" | "ltr"; label: string; invalid?: boolean }) {
  const [dialog, setDialog] = useState<"link" | "video" | "image" | null>(null);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, code: false, codeBlock: false, link: { openOnClick: false, autolink: true, defaultProtocol: "https" } }),
      LibraryImage.configure({ inline: false, allowBase64: false }),
      Youtube.configure({ nocookie: true, modestBranding: true, width: 640, height: 360 }),
      Placeholder.configure({ placeholder: dir === "rtl" ? "اكتب المقال هنا…" : "Write the article here…" }),
    ],
    content: value,
    editorProps: { attributes: { class: "ad-prose", dir, "aria-label": label, role: "textbox", "aria-multiline": "true" } },
    onUpdate: ({ editor: e }) => onChange(e.getJSON() as RichDoc),
  });

  // Content replaced from outside (copy from the other language, reset after saving).
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (JSON.stringify(sanitizeRichDoc(editor.getJSON())) !== JSON.stringify(sanitizeRichDoc(value))) editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  const openLink = () => {
    setUrl((editor?.getAttributes("link").href as string | undefined) ?? "");
    setUrlError(null);
    setDialog("link");
  };
  const applyLink = () => {
    const href = url.trim();
    if (!isSafeLink(href)) return setUrlError("Use a full https:// address, a site path such as /contact, or a tel: / mailto: link.");
    editor?.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setDialog(null);
  };
  const applyVideo = () => {
    if (!youtubeIdOf(url.trim())) return setUrlError("Paste the address of a YouTube video (youtube.com/watch?v=…, youtu.be/… or youtube.com/shorts/…).");
    editor?.chain().focus().setYoutubeVideo({ src: url.trim() }).run();
    setDialog(null);
  };

  return (
    <div className={`overflow-hidden rounded-2xl border bg-white/85 ${invalid ? "border-[var(--danger)]" : "border-[var(--line-strong)]"} focus-within:border-aqua-600 focus-within:shadow-[0_0_0_4px_rgb(73_217_244/0.22)]`}>
      {editor ? (
        <Toolbar
          editor={editor}
          onLink={openLink}
          onImage={() => setDialog("image")}
          onVideo={() => {
            setUrl("");
            setUrlError(null);
            setDialog("video");
          }}
        />
      ) : (
        <div className="h-11 border-b border-[var(--line)] bg-white/70" />
      )}
      <EditorContent editor={editor} />
      {dialog === "image" ? (
        <MediaPicker
          open
          kind="image"
          onClose={() => setDialog(null)}
          onSelect={(item) => editor?.chain().focus().setImage({ src: item.src, alt: (dir === "rtl" ? item.alt_ar : item.alt_en) || item.alt_en || item.alt_ar || "", mediaId: item.id } as never).run()}
        />
      ) : null}
      <Dialog
        open={dialog === "link" || dialog === "video"}
        onClose={() => setDialog(null)}
        title={dialog === "link" ? "Link" : "YouTube video"}
        description={dialog === "link" ? "Select the words to link first. Outside links open in a new tab." : "The video is embedded in the article."}
        footer={
          <>
            <button type="button" className="ad-btn ad-btn-ghost" onClick={() => setDialog(null)}>
              Cancel
            </button>
            <button type="button" className="ad-btn ad-btn-primary" onClick={dialog === "link" ? applyLink : applyVideo}>
              {dialog === "link" ? "Apply link" : "Insert video"}
            </button>
          </>
        }
      >
        <label className="block">
          <span className="ad-label">{dialog === "link" ? "Address" : "YouTube address"}</span>
          <input
            data-autofocus
            className="ad-input"
            dir="ltr"
            value={url}
            aria-invalid={!!urlError}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (dialog === "link") applyLink();
                else applyVideo();
              }
            }}
            placeholder={dialog === "link" ? "https://… or /contact" : "https://www.youtube.com/watch?v=…"}
          />
          {urlError ? <span className="ad-error-text block">{urlError}</span> : null}
        </label>
      </Dialog>
    </div>
  );
}
