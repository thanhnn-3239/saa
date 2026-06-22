# Phase C2 — Tests

Track —. Status: done. Priority: P1. Depends on: C1.

## Context links
- Test home: `tests/sun-kudos/` (vitest + @testing-library; 341 tests currently green)
- Existing reference: `lib/kudos/kudos.test.ts`
- Run: `pnpm test` (vitest). Build gate: `pnpm build`, `pnpm lint`.
- Targets under test: B2 hooks/utils + C1 dialog/validation/card render

## Key insights
- Keep all 341 existing tests green — additive only.
- Mock supabase client + storage (unit level); do NOT hit real DB/network. (Integration of real RPC validated manually + via B1 db reset smoke.)
- Validation predicate should be pure/extractable → unit-test directly (DRY: test the predicate, not just via DOM).

## Requirements — test matrix
**Unit (pure):**
- `sanitizeKudoHtml`: strips `<script>`, `onerror=`, disallowed tags; preserves allowed (p/strong/em/s/ol/li/a[href]/blockquote/br/mention span).
- Validation predicate: required recipient/title/body/hashtags; title >100 invalid; body >2000 invalid; 0 hashtags invalid; 6 hashtags invalid; valid happy path.
- `upload-kudo-images` validation: rejects >5MB, rejects non jpg/png/webp, rejects >5 count; accepts boundary (exactly 5 files, exactly 5MB, webp).

**Hook (mocked supabase):**
- `useRecipientSearch`: excludes current user id from results; empty term → no query/empty.
- `useCreateKudo`: calls `rpc("create_kudo", ...)` with mapped params; onSuccess invalidates feed + highlight keys; onError surfaces message.

**Component (@testing-library):**
- Anonymous toggle: checked → alias input revealed; unchecked → hidden.
- Gửi disabled until required valid; enabling after filling all required.
- Invalid field → red border + error message (sample ID-7..ID-56 cases: empty recipient, empty title, empty body, 0 hashtags, 6th hashtag blocked, oversize image rejected).
- "+ Image" button hidden at 5 images; chip x-remove removes one.
- Hashtag chip x-remove; "+ Hashtag" disabled/notes "Tối đa 5" at 5.
- Card render: `card.title` shown as title; sanitized HTML body rendered (no raw tags as text); `isAnonymous` + `anonymousName` → alias shown; `isAnonymous` + empty alias → "Ẩn danh".

## Related code files
- Create: `tests/sun-kudos/send-kudo-validation.test.ts`, `sanitize-html.test.ts`, `upload-kudo-images.test.ts`, `use-create-kudo.test.ts`, `use-recipient-search.test.ts`, `send-kudo-dialog.test.tsx`, `kudo-card-render.test.tsx`
- Read for pattern: `lib/kudos/kudos.test.ts`, existing testing-library setup
- Modify: none (tests own test files only)

## Implementation steps
1. Extract validation predicate to a pure fn in B2/C1 if not already (enables direct unit test) — coordinate with C1.
2. Write unit tests (sanitize, validation, image validation).
3. Write hook tests with mocked supabase client + QueryClient wrapper.
4. Write component tests (dialog interactions, card render).
5. `pnpm test` — all new + 341 existing green.
6. `pnpm build` + `pnpm lint` clean.

## Todo
- [x] sanitize-html unit tests (XSS strip + allowlist)
- [x] validation predicate unit tests (all required + length + hashtag bounds)
- [x] image-validation unit tests (size/type/count + boundaries)
- [x] useRecipientSearch self-exclusion test
- [x] useCreateKudo rpc-params + invalidation + error tests
- [x] dialog component tests (anonymous toggle, disabled Gửi, error borders, image/hashtag limits)
- [x] card render tests (title, sanitized body, alias/"Ẩn danh")
- [x] 341 existing tests still green
- [x] build + lint clean

## Success criteria
- `pnpm test` green incl. new suites + all 341 prior.
- No mocks/fakes used to mask real logic (mock only external boundaries: supabase, storage).
- `pnpm build` + `pnpm lint` exit 0.

## Risk assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Tiptap editor hard to render in jsdom | High | Med | test validation/sanitize/card as pure units; mock editor in dialog test (stub onChange) |
| Flaky async hook tests | Med | Med | use `waitFor`, mocked client returns resolved promises |
| Over-mocking hides real bug | Med | High | mock only supabase/storage boundary; test real predicate + sanitize logic |

## Rollback
Tests are additive — revert by deleting new test files. No production impact.
