"use client";
/**
 * send-kudo-dialog-container.tsx
 *
 * Stateful container for the "Viết Kudo" dialog.
 * Owns ALL form state and wires B2 data hooks to the presentational SendKudoDialog.
 *
 * Responsibilities:
 *   - Form state: recipient, title, body HTML, hashtags, images, isAnonymous, anonymousName
 *   - B2 hooks: useRecipientSearch, useHashtagOptions, useCreateKudo
 *   - Validation predicate → submitDisabled + field-level errors map
 *   - Submit flow: upload images → RPC → success toast + close + reset; error toast + stay open
 *   - Image pick: validateKudoImages client-side, show field error on violation
 *   - Hashtag picker: inline dropdown from useHashtagOptions
 *   - Community-standards sub-modal state
 */

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { useRecipientSearch } from "@/lib/kudos/use-recipient-search";
import { useHashtagOptions } from "@/lib/kudos/use-hashtag-options";
import { useCreateKudo } from "@/lib/kudos/use-create-kudo";
import {
  validateKudoImages,
  ImageValidationError,
  MAX_KUDO_IMAGES,
} from "@/lib/kudos/upload-kudo-images";

import { SendKudoDialog } from "./send-kudo-dialog";
import { CommunityStandardsModal } from "./community-standards-modal";

import type { ProfileBrief, HashtagBrief, ImagePreview, SendKudoErrors } from "./send-kudo-types";

interface SendKudoDialogContainerProps {
  open: boolean;
  onClose: () => void;
}

const MAX_TITLE = 100;
const MAX_BODY_CHARS = 2000;
const MIN_HASHTAGS = 1;
const MAX_HASHTAGS = 5;

/** Extract plain text length from HTML string for validation. */
function htmlTextLength(html: string): number {
  if (typeof window === "undefined") return html.replace(/<[^>]*>/g, "").length;
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent ?? "").length;
}

/** Single validation predicate — returns field-level errors map. */
function validateForm(
  recipient: ProfileBrief | null,
  title: string,
  body: string,
  hashtags: HashtagBrief[],
  t: ReturnType<typeof useTranslations<"Home.kudosPage.sendDialog">>,
): SendKudoErrors {
  const errs: SendKudoErrors = {};

  if (!recipient) {
    errs.recipient = t("errors.recipientRequired");
  }
  if (!title.trim()) {
    errs.title = t("errors.titleRequired");
  } else if (title.trim().length > MAX_TITLE) {
    errs.title = t("errors.titleTooLong");
  }

  const bodyTextLen = htmlTextLength(body);
  if (!body || bodyTextLen === 0) {
    errs.body = t("errors.bodyRequired");
  } else if (bodyTextLen > MAX_BODY_CHARS) {
    errs.body = t("errors.bodyTooLong");
  }

  if (hashtags.length < MIN_HASHTAGS) {
    errs.hashtags = t("errors.hashtagsRequired");
  } else if (hashtags.length > MAX_HASHTAGS) {
    errs.hashtags = t("errors.hashtagsTooMany");
  }

  return errs;
}

function isValidForm(errors: SendKudoErrors): boolean {
  return Object.keys(errors).length === 0;
}

export function SendKudoDialogContainer({ open, onClose }: SendKudoDialogContainerProps) {
  const t = useTranslations("Home.kudosPage.sendDialog");

  // ── Form state ─────────────────────────────────────────────────────────────
  const [recipientSearchTerm, setRecipientSearchTerm] = useState("");
  const [recipient, setRecipient] = useState<ProfileBrief | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [hashtags, setHashtags] = useState<HashtagBrief[]>([]);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymousName, setAnonymousName] = useState("");

  // Submitted-once flag — only show errors after first submit attempt
  const [submitted, setSubmitted] = useState(false);
  const [imageError, setImageError] = useState<string | undefined>();

  // Community-standards sub-modal
  const [communityStandardsOpen, setCommunityStandardsOpen] = useState(false);

  // Toast state
  const [successToast, setSuccessToast] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Data hooks ─────────────────────────────────────────────────────────────
  const recipientQuery = useRecipientSearch(recipientSearchTerm);
  const hashtagOptionsQuery = useHashtagOptions();
  const createKudo = useCreateKudo();

  const recipientOptions: ProfileBrief[] = (recipientQuery.data ?? []).map((p) => ({
    id: p.id,
    name: p.fullName,
    avatarUrl: p.avatarUrl,
  }));

  const allHashtagOptions: HashtagBrief[] = hashtagOptionsQuery.data ?? [];

  // ── Derived: validation ────────────────────────────────────────────────────
  const currentErrors = validateForm(recipient, title, body, hashtags, t);
  const submitDisabled = !isValidForm(currentErrors) || createKudo.isPending;

  // ── Reset form ─────────────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setRecipientSearchTerm("");
    setRecipient(null);
    setTitle("");
    setBody("");
    setHashtags([]);
    // Revoke all blob URLs before clearing to avoid memory leaks
    setImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      return [];
    });
    setIsAnonymous(false);
    setAnonymousName("");
    setSubmitted(false);
    setImageError(undefined);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const showSuccess = useCallback(() => {
    setSuccessToast(true);
    if (successTimer.current) clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccessToast(false), 3000);
  }, []);

  const showError = useCallback((msg: string) => {
    setErrorToast(msg);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setErrorToast(null), 4000);
  }, []);

  // ── Image pick handler ─────────────────────────────────────────────────────
  const handleImagesChange = useCallback(
    (next: ImagePreview[]) => {
      // Validate immediately on pick
      try {
        validateKudoImages(next.map((i) => i.file));
        setImageError(undefined);
      } catch (err) {
        if (err instanceof ImageValidationError) {
          setImageError(err.message);
        }
      }
      setImages(next.slice(0, MAX_KUDO_IMAGES));
    },
    [],
  );

  // ── Image add (opens file picker) ─────────────────────────────────────────
  const handleAddImage = useCallback(() => {
    if (images.length >= MAX_KUDO_IMAGES) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.multiple = true;
    input.onchange = () => {
      const files = Array.from(input.files ?? []);
      const combined = [...images.map((i) => i.file), ...files].slice(0, MAX_KUDO_IMAGES);
      try {
        validateKudoImages(combined);
        setImageError(undefined);
      } catch (err) {
        if (err instanceof ImageValidationError) {
          setImageError(err.message);
        }
        return;
      }
      const newPreviews: ImagePreview[] = files
        .slice(0, MAX_KUDO_IMAGES - images.length)
        .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
      setImages((prev) => [...prev, ...newPreviews].slice(0, MAX_KUDO_IMAGES));
    };
    input.click();
  }, [images]);

  // ── Hashtag toggle handler ───────────────────────────────────────────────────
  // Click an unselected pill to add (capped at MAX_HASHTAGS), a selected one to remove.
  const handleToggleHashtag = useCallback(
    (tag: HashtagBrief) => {
      setHashtags((prev) => {
        if (prev.some((h) => h.id === tag.id)) {
          return prev.filter((h) => h.id !== tag.id);
        }
        if (prev.length >= MAX_HASHTAGS) return prev;
        return [...prev, tag];
      });
    },
    [],
  );

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    (payload: {
      recipientId: string;
      title: string;
      bodyHtml: string;
      hashtagIds: number[];
      imageFiles: File[];
      isAnonymous: boolean;
      anonymousName: string;
    }) => {
      setSubmitted(true);
      const errs = validateForm(recipient, title, body, hashtags, t);
      if (!isValidForm(errs)) {
        return;
      }

      createKudo.mutate(
        {
          recipientId: payload.recipientId,
          title: payload.title,
          bodyHtml: payload.bodyHtml,
          hashtagIds: payload.hashtagIds,
          imageFiles: payload.imageFiles,
          isAnonymous: payload.isAnonymous,
          anonymousName: payload.anonymousName,
        },
        {
          onSuccess: () => {
            showSuccess();
            handleClose();
          },
          onError: (err) => {
            const msg =
              err instanceof Error
                ? err.message
                : t("errors.submitFailed");
            showError(msg);
          },
        },
      );
    },
    [recipient, title, body, hashtags, t, createKudo, showSuccess, showError, handleClose],
  );

  // Merge field errors from validation state (submitted) with any image error
  const displayErrors: SendKudoErrors = submitted
    ? { ...currentErrors, ...(imageError ? { images: imageError } : {}) }
    : {};

  return (
    <>
      {/* Success toast */}
      {successToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] rounded-lg bg-[#00101A] border border-[#FFEA9E] px-5 py-3 text-sm font-semibold text-[#FFEA9E] shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {t("toastSuccess")}
        </div>
      )}

      {/* Error toast */}
      {errorToast && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] rounded-lg bg-[#CF1322] px-5 py-3 text-sm font-semibold text-white shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {errorToast}
        </div>
      )}

      {/* Community standards sub-modal (z-[60], above dialog z-50) */}
      <CommunityStandardsModal
        open={communityStandardsOpen}
        onClose={() => setCommunityStandardsOpen(false)}
      />

      {/* Main dialog */}
      <SendKudoDialog
        open={open}
        onClose={handleClose}
        onSubmit={handleSubmit}
        submitting={createKudo.isPending}
        submitDisabled={submitDisabled}
        recipientSearchTerm={recipientSearchTerm}
        onRecipientSearchChange={setRecipientSearchTerm}
        recipient={recipient}
        onRecipientSelect={(p) => {
          setRecipient(p);
          setRecipientSearchTerm("");
        }}
        onRecipientClear={() => {
          setRecipient(null);
          setRecipientSearchTerm("");
        }}
        recipientOptions={recipientOptions}
        title={title}
        onTitleChange={setTitle}
        body={body}
        onBodyChange={setBody}
        hashtags={hashtags}
        hashtagOptions={allHashtagOptions}
        onToggleHashtag={handleToggleHashtag}
        images={images}
        onImagesChange={handleImagesChange}
        onAddImage={handleAddImage}
        isAnonymous={isAnonymous}
        onIsAnonymousChange={setIsAnonymous}
        anonymousName={anonymousName}
        onAnonymousNameChange={setAnonymousName}
        errors={displayErrors}
        onOpenCommunityStandards={() => setCommunityStandardsOpen(true)}
      />
    </>
  );
}
