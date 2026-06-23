"use client";
/**
 * kudo-editor.tsx
 *
 * Tiptap rich-text editor for the kudo body field.
 * Replaces kudo-body-editor-placeholder.tsx in C1.
 *
 * Extensions enabled (mirrors sanitizer allowlist):
 *   StarterKit subset: Bold, Italic, Strike, OrderedList, Blockquote
 *   (headings, code, codeBlock, horizontalRule disabled)
 *   Link, Placeholder, Mention (visual-only @-mention)
 *
 * SSR safety: immediatelyRender=false (Next.js 16 / React 19).
 * Character counter counts editor text length (not HTML), max 2000.
 * Emits raw HTML via onChange.
 */

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import { useEffect, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { EditorToolbar } from "./editor-toolbar";
import { mentionSuggestion } from "./kudo-editor-suggestion";

const MAX_CHARS = 2000;

interface KudoEditorProps {
  value: string;
  onChange: (html: string) => void;
  onOpenCommunityStandards: () => void;
  error?: string;
}

export function KudoEditor({
  value,
  onChange,
  onOpenCommunityStandards,
  error,
}: KudoEditorProps) {
  const t = useTranslations("Home.kudosPage.sendDialog");
  const [charCount, setCharCount] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Disable extensions not in sanitizer allowlist
        heading: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        // Keep: bold, italic, strike, orderedList, listItem, blockquote, paragraph, hardBreak
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder: t("bodyPlaceholder"),
      }),
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
          "data-mention": "true",
        },
        suggestion: mentionSuggestion,
      }),
    ],
    content: value || "",
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const text = ed.getText();
      const len = text.length;
      setCharCount(len);
      // Enforce hard cap: revert last input if exceeded
      if (len > MAX_CHARS) {
        ed.commands.undo();
        return;
      }
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  // Sync external value reset (e.g. after form reset on close).
  // clearContent(true) fires onUpdate which resets charCount via setCharCount.
  useEffect(() => {
    if (!editor) return;
    if (value === "") {
      const current = editor.getText();
      if (current.length > 0) {
        editor.commands.clearContent(true);
      }
    }
  }, [value, editor]);

  // Active-state helpers for toolbar buttons
  const isBold = editor?.isActive("bold") ?? false;
  const isItalic = editor?.isActive("italic") ?? false;
  const isStrike = editor?.isActive("strike") ?? false;
  const isOrderedList = editor?.isActive("orderedList") ?? false;
  const isBlockquote = editor?.isActive("blockquote") ?? false;

  const handleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor]);
  const handleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor]);
  const handleStrike = useCallback(() => editor?.chain().focus().toggleStrike().run(), [editor]);
  const handleOrderedList = useCallback(
    () => editor?.chain().focus().toggleOrderedList().run(),
    [editor],
  );
  const handleLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL:", prev ?? "https://");
    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      // Only allow http/https to prevent javascript: or data: URIs
      if (!/^https?:\/\//i.test(url)) return;
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);
  const handleBlockquote = useCallback(
    () => editor?.chain().focus().toggleBlockquote().run(),
    [editor],
  );

  const isOverLimit = charCount > MAX_CHARS;

  return (
    <div className="flex flex-col w-full">
      <EditorToolbar
        onBold={handleBold}
        onItalic={handleItalic}
        onStrike={handleStrike}
        onOrderedList={handleOrderedList}
        onLink={handleLink}
        onBlockquote={handleBlockquote}
        onCommunityStandards={onOpenCommunityStandards}
        boldActive={isBold}
        italicActive={isItalic}
        strikeActive={isStrike}
        orderedListActive={isOrderedList}
        blockquoteActive={isBlockquote}
      />

      {/* Editor area — border top merged with toolbar. flex-col so the
          contenteditable fills the whole box (stable height, fully clickable). */}
      <div
        className={[
          "relative w-full bg-white border border-[#998C5F] border-t-0 px-6 py-4 flex flex-col",
          error || isOverLimit ? "border-[#CF1322]" : "",
        ].join(" ")}
        style={{ borderRadius: "0 0 8px 8px", minHeight: 160 }}
      >
        <EditorContent
          editor={editor}
          className="flex-1 flex flex-col prose-editor font-montserrat font-normal text-base text-[#00101A] leading-6 tracking-[0.15px]"
        />
      </div>

      {/* Counter + error row */}
      <div className="flex justify-between items-start mt-1">
        <div>
          {(error || isOverLimit) && (
            <p className="text-sm font-montserrat text-[#CF1322]">
              {isOverLimit
                ? `Nội dung không được vượt quá ${MAX_CHARS} ký tự`
                : error}
            </p>
          )}
        </div>
        <span
          className={[
            "text-xs font-montserrat font-bold shrink-0 ml-2",
            isOverLimit ? "text-[#CF1322]" : "text-[#999999]",
          ].join(" ")}
        >
          {charCount}/{MAX_CHARS}
        </span>
      </div>
    </div>
  );
}
