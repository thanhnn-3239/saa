# Phase C1 — Integration: wire modal + Tiptap + submit + board render

Track A+B. Status: done. Priority: P1. Depends on: A1 (modal UI), B2 (data layer).

## Context links
- Integration point: `app/(public)/sun-kudos/_components/kudos-board.tsx` (`onOpenSendDialog={noop}` at line ~256; `noop` defined ~186)
- Banner trigger: `_components/banner.tsx` (button onClick={onOpenSendDialog}, line ~138 — already wired, no change)
- Card render: `_components/ui/kudo-card-base.tsx` (`senderName` ~107; `card.title` already wired ~198; body `{card.body}` ~233)
- Data layer (B2): `lib/kudos/use-create-kudo.ts`, `use-recipient-search.ts`, `use-hashtag-options.ts`, `upload-kudo-images.ts`, `sanitize-html.ts`
- Modal (A1): the static modal component + integration contract (props)
- i18n: `messages/vi.json` + `messages/en.json` under `Home.kudosPage`
- Clarifications (all); test-case IDs ID-7..ID-56 for error states

## Key insights
- Board already re-renders via Realtime; modal just needs to fire `create_kudo` then close + toast. Query invalidation in B2 mutation makes refresh deterministic.
- `card.title` render already exists (falls back to `t("card.idolTitle")`); once DB title populated it shows real value — no card change for title needed beyond passing data (B2 selects it).
- Anonymous display: `senderName` (card-base:107) currently `card.isAnonymous ? t("card.anonymous") : sender.fullName`. Change to `card.isAnonymous ? (card.anonymousName?.trim() || t("card.anonymous")) : sender.fullName`.
- Body currently plain text `{card.body}`. Switch to sanitized HTML: `<div dangerouslySetInnerHTML={{ __html: sanitizeKudoHtml(card.body) }} />` with prose styling + existing line-clamp. Keep clamp behavior.
- Modal owns form state; passes payload to `useCreateKudo`. Disabled `Gửi` until required valid (recipient + title + body non-empty + 1..5 hashtags).

## Requirements
- Install Tiptap deps: `@tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-mention @tiptap/extension-placeholder @tiptap/suggestion`.
- **Tiptap editor component** `_components/send-dialog/kudo-editor.tsx`:
  - StarterKit (bold, italic, strike, ordered list, blockquote), Link, Placeholder (helper text), Mention (visual-only suggestion list from `searchSunners`; insert mention node, NO notification).
  - Toolbar: Bold, Italic, Strikethrough, Numbered list, Link, Quote + "Tiêu chuẩn cộng đồng" link → opens static i18n modal.
  - Char counter (text length, max 2000) + onChange emits sanitized-on-store-or-raw HTML (sanitize on render in board; editor emits raw HTML).
- **Community-standards modal** `_components/send-dialog/community-standards-modal.tsx`: static i18n content (v1).
- **Wire modal into board**: in `kudos-board.tsx` add `const [sendOpen, setSendOpen] = useState(false)`; pass `onOpenSendDialog={() => setSendOpen(true)}` (replace noop for banner only); render `<SendKudoDialog open={sendOpen} onClose={...} />`. Modal internally uses B2 hooks.
- **Submit flow**: validate → `submitting=true` → `useCreateKudo.mutate(payload)` → onSuccess: toast success + close + reset form; onError: toast error, keep modal open, `submitting=false`.
- **Validation + disabled Gửi** (per test cases): required = recipient, title (≤100), body (non-empty, ≤2000), hashtags (1..5). Images optional (0..5, type/size). Anonymous alias optional. Red border + field message on invalid (ID-7..ID-56 mapping).
- **Board card render**: anonymous alias display + sanitized HTML body (edits above).
- **i18n keys** (vi + en) under `Home.kudosPage`: modal title, field labels/placeholders/helpers, hashtag "Tối đa 5", image hints, anonymous label, buttons (Hủy/Gửi), community-standards content, error messages, success toast. Keep parity vi↔en.

## Related code files
- Create: `_components/send-dialog/send-kudo-dialog.tsx` (container; may be A1 output renamed), `kudo-editor.tsx`, `kudo-editor-toolbar.tsx`, `community-standards-modal.tsx`
- Modify: `kudos-board.tsx` (state + open handler + render dialog), `ui/kudo-card-base.tsx` (senderName + body HTML), `messages/vi.json`, `messages/en.json`
- Read for pattern: `use-toggle-like.ts` (mutation/toast pattern), existing toast util
- Keep file size <200 lines each — split editor/toolbar/dialog.

## Implementation steps
1. ⚠️ Read `node_modules/next/dist/docs/` for Next 16 client-component / dynamic-import notes before adding Tiptap (client-only).
2. Install Tiptap deps via pnpm.
3. Build `kudo-editor` + toolbar (client component; SSR-safe via `immediatelyRender:false` per Tiptap+Next).
4. Build community-standards modal (i18n static).
5. Assemble `send-kudo-dialog` from A1 UI + B2 hooks (recipient search, hashtag options, image upload, create mutation).
6. Wire validation + disabled Gửi + error states.
7. Wire into `kudos-board.tsx` (replace banner noop with state setter).
8. Update `kudo-card-base.tsx`: anonymous alias + sanitized HTML body.
9. Add vi + en i18n keys (parity).
10. `pnpm build` + `pnpm lint` clean; manual smoke: open → fill → send → toast → board shows card with title + rich body + alias.

## Todo
- [x] Tiptap deps installed
- [x] `kudo-editor` + toolbar (B/I/S/list/link/quote + community-standards link + mention visual-only + counter ≤2000 + placeholder)
- [x] community-standards static modal (i18n)
- [x] `send-kudo-dialog` assembled from A1 + B2 hooks
- [x] validation + Gửi disabled until required valid + error red borders (ID-7..ID-56)
- [x] submit flow: upload→rpc→toast→close→reset; error keeps open
- [x] board noop replaced (banner opens dialog)
- [x] card-base: anonymous alias display + sanitized HTML body
- [x] vi + en i18n keys added (parity)
- [x] build + lint clean

## Success criteria
- Banner "Viết Kudo" opens modal; Gửi disabled until required fields valid; invalid fields show red border + message.
- Submitting creates kudo; modal closes, success toast shows, board displays new card (real title, sanitized rich body, alias or "Ẩn danh").
- Self not selectable as recipient; hashtags limited 1..5; images limited 0..5 with type/size enforcement; "+ Image" hides at 5.
- @mention inserts visual mention, no notification fired.

## Risk assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Tiptap SSR hydration mismatch (Next 16) | High | Med | `immediatelyRender:false`, client-only dynamic import; read Next docs |
| XSS via body HTML on board | Med | High | sanitize via `sanitizeKudoHtml` before render; strict allowlist |
| i18n key drift vi↔en → missing string crash | Med | Med | add both files same commit; lint/test for key parity |
| Disabled-Gửi logic diverges from 57 test cases | Med | High | encode validation rules as single predicate; C2 tests cover |
| Realtime + manual invalidate double-insert flicker | Low | Low | invalidate idempotent; realtime upsert dedupes by id |

## Rollback
Revert `kudos-board.tsx` open handler to noop (instant disable of entry point) + revert card-base edits. Modal/editor files are additive — safe to leave or delete. No DB rollback needed (B1 columns nullable).
