/**
 * send-kudo-dialog.tsx
 *
 * Root modal for "Viết Kudo" — composes all field sub-components into a scrollable
 * cream/ivory panel (bg #FFF8E1, radius 24px, padding 40px, width 752px max).
 *
 * Design: 520:11647 — gap 32px between sections, cream panel on dark backdrop.
 *
 * Phase C1: KudoBodyEditorPlaceholder replaced by KudoEditor (Tiptap).
 * All fields are controlled via props. State lives in SendKudoDialogContainer.
 */

"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { RecipientField } from "./recipient-field";
import { TitleField } from "./title-field";
import { KudoEditor } from "./kudo-editor";
import { HashtagField } from "./hashtag-field";
import { ImageField } from "./image-field";
import { AnonymousField } from "./anonymous-field";
import { DialogFooter } from "./dialog-footer";
import type { SendKudoDialogProps } from "./send-kudo-types";

export function SendKudoDialog({
  open,
  onClose,
  onSubmit,
  submitting,
  submitDisabled,
  recipientSearchTerm,
  onRecipientSearchChange,
  recipient,
  onRecipientSelect,
  onRecipientClear,
  recipientOptions,
  title,
  onTitleChange,
  body,
  onBodyChange,
  onOpenCommunityStandards,
  hashtags,
  hashtagOptions,
  onToggleHashtag,
  images,
  onImagesChange,
  onAddImage,
  isAnonymous,
  onIsAnonymousChange,
  anonymousName,
  onAnonymousNameChange,
  errors,
}: SendKudoDialogProps) {
  const t = useTranslations("Home.kudosPage.sendDialog");
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Focus panel when opened
  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  function handleSubmit() {
    onSubmit({
      recipientId: recipient?.id ?? "",
      title,
      bodyHtml: body,
      hashtagIds: hashtags.map((h) => h.id),
      imageFiles: images.map((i) => i.file),
      isAnonymous,
      anonymousName,
    });
  }

  return (
    /* Backdrop — dark overlay; this element is the scroll container so a modal
       taller than the viewport scrolls from the top instead of clipping. */
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60"
      aria-modal="true"
      role="dialog"
      aria-label={t("title")}
    >
      {/* Centering wrapper — min-h-full centers the panel when it fits and lets
          it scroll naturally (no top clip) when it's taller than the screen. */}
      <div
        className="flex min-h-full items-center justify-center p-4 sm:py-8"
        onClick={handleBackdropClick}
      >
        {/* Panel — cream/ivory bg, rounded 24px, max-w 752px. Padding/gap scale
            down on mobile so the form doesn't get squeezed on small screens. */}
        <div
          ref={panelRef}
          tabIndex={-1}
          className="relative w-full bg-[#FFF8E1] outline-none shadow-2xl flex flex-col rounded-3xl p-5 gap-6 sm:p-10 sm:gap-8"
          style={{ maxWidth: 752 }}
        >
        {/* 1. Title: mms_A */}
        <h2
          className="font-montserrat font-bold text-[#00101A] text-center w-full leading-tight sm:leading-10 text-[26px] sm:text-[32px]"
        >
          {t("title")}
        </h2>

        {/* 2. Recipient row: mms_B */}
        <RecipientField
          searchTerm={recipientSearchTerm}
          onSearchChange={onRecipientSearchChange}
          selected={recipient}
          onSelect={onRecipientSelect}
          onClearSelected={onRecipientClear}
          options={recipientOptions}
          error={errors.recipient}
        />

        {/* 3. Title (danh hiệu) field: Frame 552 */}
        <TitleField
          value={title}
          onChange={onTitleChange}
          error={errors.title}
        />

        {/* 4. Editor block: toolbar + Tiptap body + hint */}
        <div className="flex flex-col w-full" style={{ gap: 4 }}>
          <KudoEditor
            value={body}
            onChange={onBodyChange}
            onOpenCommunityStandards={onOpenCommunityStandards}
            error={errors.body}
          />

          {/* Hint text: mms_D.1_Gợi ý — centered per design */}
          <p className="font-montserrat font-bold text-[#00101A] text-center w-full leading-6 tracking-[0.5px] text-base">
            {t("bodyMentionHint")}
          </p>
        </div>

        {/* 5. Hashtag row: mms_E — inline toggle-pill list */}
        <HashtagField
          options={hashtagOptions ?? []}
          selected={hashtags}
          onToggle={(tag) => onToggleHashtag?.(tag)}
          error={errors.hashtags}
        />

        {/* 6. Image row: mms_F */}
        <ImageField
          images={images}
          onAdd={onAddImage}
          onRemove={(idx) => {
            URL.revokeObjectURL(images[idx].previewUrl);
            onImagesChange(images.filter((_, i) => i !== idx));
          }}
          error={errors.images}
        />

        {/* 7. Anonymous checkbox + alias input: mms_G */}
        <AnonymousField
          isAnonymous={isAnonymous}
          onIsAnonymousChange={onIsAnonymousChange}
          anonymousName={anonymousName}
          onAnonymousNameChange={onAnonymousNameChange}
        />

        {/* 8. Footer: mms_H */}
        <DialogFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitDisabled={submitDisabled}
        />
        </div>
      </div>
    </div>
  );
}
