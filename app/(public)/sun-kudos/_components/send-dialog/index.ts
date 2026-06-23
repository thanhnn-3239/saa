/**
 * send-dialog/index.ts — barrel export for the "Viết Kudo" send-kudos modal.
 *
 * Public surface for C1 (backend wiring) and any other consumers:
 *   - SendKudoDialogContainer — stateful root that owns form state + data hooks
 *   - All types               — integration contract
 *
 * Sub-components (incl. the presentational SendKudoDialog) are not re-exported
 * here intentionally; consumers mount the container and use the props contract
 * defined in send-kudo-types.ts.
 */

export { SendKudoDialogContainer } from "./send-kudo-dialog-container";

export type {
  SendKudoDialogProps,
  SendKudoPayload,
  SendKudoErrors,
  ProfileBrief,
  HashtagBrief,
  ImagePreview,
} from "./send-kudo-types";
