/**
 * send-kudo-types.ts
 *
 * Shared TypeScript interfaces for the "Viết Kudo" send-kudos modal (Phase A1).
 * These types define the integration contract that C1 (backend wiring) depends on.
 */

/** Minimal profile shape needed by the recipient selector. */
export interface ProfileBrief {
  id: string;
  name: string;
  avatarUrl: string | null;
}

/** Minimal hashtag shape from the `hashtags` table. */
export interface HashtagBrief {
  id: number;
  name: string;
}

/** Image preview tuple: the raw File + its object URL for display. */
export interface ImagePreview {
  file: File;
  previewUrl: string;
}

/**
 * Payload emitted by `onSubmit`. Matches the shape C1 needs to call the RPC.
 */
export interface SendKudoPayload {
  recipientId: string;
  title: string;
  bodyHtml: string;
  hashtagIds: number[];
  imageFiles: File[];
  isAnonymous: boolean;
  anonymousName: string;
}

/**
 * Field-level validation errors. All keys are optional — only include the ones
 * that have an active error.
 */
export type SendKudoErrors = Partial<
  Record<"recipient" | "title" | "body" | "hashtags" | "images", string>
>;

/**
 * Root props for the send-kudo dialog (integration contract for C1).
 */
export interface SendKudoDialogProps {
  // ---- Visibility ----
  open: boolean;
  onClose: () => void;

  // ---- Submission ----
  onSubmit: (payload: SendKudoPayload) => void;
  submitting: boolean;
  submitDisabled: boolean;

  // ---- Recipient field ----
  recipientSearchTerm: string;
  onRecipientSearchChange: (term: string) => void;
  recipient: ProfileBrief | null;
  onRecipientSelect: (profile: ProfileBrief) => void;
  /** Clears the current recipient selection so the user can search again. */
  onRecipientClear?: () => void;
  recipientOptions: ProfileBrief[];

  // ---- Title field ----
  title: string;
  onTitleChange: (value: string) => void;

  // ---- Body field (rich HTML from Tiptap) ----
  body: string;
  onBodyChange: (value: string) => void;

  // ---- Editor toolbar ----
  /** Opens the community-standards sub-modal from the editor toolbar. */
  onOpenCommunityStandards: () => void;

  // ---- Hashtags (inline toggle-pill list) ----
  /** Currently selected hashtags. */
  hashtags: HashtagBrief[];
  /** All selectable hashtags (existing taxonomy). */
  hashtagOptions?: HashtagBrief[];
  /** Toggle a hashtag on/off (parent enforces the max-5 cap). */
  onToggleHashtag?: (tag: HashtagBrief) => void;

  // ---- Images ----
  images: ImagePreview[];
  onImagesChange: (images: ImagePreview[]) => void;
  /** Opens the native file picker for image selection. */
  onAddImage?: () => void;

  // ---- Anonymous ----
  isAnonymous: boolean;
  onIsAnonymousChange: (value: boolean) => void;
  anonymousName: string;
  onAnonymousNameChange: (value: string) => void;

  // ---- Validation ----
  errors: SendKudoErrors;
}
