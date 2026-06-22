# Phase A1 — Viết Kudo modal UI (static)

Track A. Status: done. Priority: P2.

## MoMorph refs
- Viết Kudo: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- Clarifications: ../260611-1346-viet-kudo-send-dialog/clarifications.md

## Goal
Build the static modal UI from Figma via `momorph-implement-design` skill — all fields presentational, mock data extracted directly from the Figma design (no invented data).

## Out of scope
- No real data wiring, no submit logic, no Supabase/RPC calls.
- No Tiptap behavior wiring (C1 adds editor); render a static rich-text placeholder area only.
- Mock data sourced from Figma design only.

## Integration contract (props the modal must expose for C1)
- `open: boolean`, `onClose: () => void`
- `onSubmit: (payload) => void` where payload = `{ recipientId, title, bodyHtml, hashtagIds, imageFiles, isAnonymous, anonymousName }`
- Per-field controlled value/onChange: recipient, title, body, hashtags, images, isAnonymous, anonymousName
- `submitting: boolean` (footer Gửi loading), `submitDisabled: boolean`, `errors` map (field → message)

`momorph-implement-design` handles component breakdown + visual validation at runtime.
