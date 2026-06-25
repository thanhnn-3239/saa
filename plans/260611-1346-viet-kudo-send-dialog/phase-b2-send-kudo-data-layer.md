# Phase B2 — Send-kudo data layer

Track B. Status: done. Priority: P1. Depends on: B1 (new RPC signature).

## Context links
- Existing search: `lib/kudos/spotlight-queries.ts` (`searchSunners`, line ~119 → returns `ProfileBrief[]`)
- Hashtag options: `lib/kudos/queries.ts` `getHashtags()` + `app/api/kudos/filters/route.ts` → `{hashtags:{id,name}[]}`
- Query keys: `lib/kudos/query-keys.ts`; feed/highlight hooks: `use-kudos-feed.ts`, `use-highlight-kudos.ts`
- Mapper: `lib/kudos/hydrate.ts` (`RawKudoRow`, `hydrateKudoCard`); types: `lib/kudos/types.ts`
- Storage bucket `kudo-images` (private; auth read+write policies exist)
- Clarifications #2,#3,#4,#5

## Key insights
- `searchSunners(term)` does NOT exclude current user → add self-exclusion param.
- `KudoCard.title?` already declared (types.ts:43, "dormant"); only need to add `anonymousName?: string | null`.
- Board reads kudos columns via `buildKudoSelect` → add `title, anonymous_name` to selected columns + map in `hydrateKudoCard`. (Highlight select in queries.ts:218/221 needs `title` too since card shows title.)
- Realtime already live on `kudos` → after RPC, invalidating feed/highlight queries (or relying on realtime) refreshes board. Invalidate to be deterministic.
- Sanitize on RENDER (board), not only on store — store HTML from Tiptap, sanitize with `isomorphic-dompurify` before `dangerouslySetInnerHTML` (works SSR + client).

## Requirements
1. **Recipient search hook** — `lib/kudos/use-recipient-search.ts`:
   - Extend `searchSunners` (or add `searchSunners(term, excludeUserId?)` param) to add `.neq("id", excludeUserId)` when provided.
   - Hook: `useRecipientSearch(term)` — `useQuery`, debounced term (caller debounces or hook does), enabled when `term.length >= 1`, excludes current user (resolve uid via supabase client). Returns `ProfileBrief[]`.
2. **Hashtag options hook** — `lib/kudos/use-hashtag-options.ts`: `useQuery` against `/api/kudos/filters` (reuse) selecting `.hashtags`. Returns `{id:number,name:string}[]`. DRY: do not duplicate fetch logic if `use-filters.ts` already exposes hashtags — reuse it.
3. **Image upload helper** — `lib/kudos/upload-kudo-images.ts`:
   - Client-side validate: type ∈ {jpg,png,webp}, size ≤5MB, count ≤5 → throw typed error on violation (mirror B1 server guard).
   - Upload each to bucket `kudo-images`, path `{uid}/{uuid}.{ext}`; return `string[]` storage paths.
   - Use `crypto.randomUUID()`; derive ext from mime/name.
4. **Create-kudo mutation** — `lib/kudos/use-create-kudo.ts`:
   - `useMutation`: input `{ recipientId, title, bodyHtml, hashtagIds, imageFiles, isAnonymous, anonymousName }`.
   - Flow: `upload-kudo-images` (if any) → `supabase.rpc("create_kudo", { p_recipient_id, p_title, p_body: bodyHtml, p_is_anonymous, p_hashtag_ids, p_image_paths, p_links: [], p_anonymous_name })`.
   - onSuccess: invalidate feed + highlight query keys (`query-keys.ts`).
   - Surface RPC error message to caller for toast.
5. **Sanitization util** — `lib/kudos/sanitize-html.ts`: `sanitizeKudoHtml(html): string` via `isomorphic-dompurify`; allowlist tags emitted by Tiptap config (p, strong, em, s, ol, li, a[href], blockquote, br, span[data-mention]). Strip everything else. Used by board render (C1).
6. **Types** — `lib/kudos/types.ts`: add `anonymousName?: string | null` to `KudoCard`. Add `CreateKudoInput` interface.
7. **Mapper** — `lib/kudos/hydrate.ts`: extend `RawKudoRow` with `title?: string | null`, `anonymous_name?: string | null`; in `hydrateKudoCard` return add `title: raw.title ?? undefined`, `anonymousName: raw.anonymous_name ?? null`.
8. **Select columns** — `lib/kudos/queries.ts`: add `title, anonymous_name` to `buildKudoSelect` column list; add `title` to highlight selects (lines ~218/221).
9. **API route (optional)** — only if existing pattern requires server route for mutations. Board feed/filters use route handlers, but mutations (toggle-like) appear client-direct via supabase. Follow toggle-like precedent: if `use-toggle-like.ts` calls supabase client directly → do same for create (no new route). Confirm during impl; do not add `app/api/kudos/create` unless toggle-like uses a route.

## Related code files
- Create: `lib/kudos/use-recipient-search.ts`, `use-hashtag-options.ts`, `upload-kudo-images.ts`, `use-create-kudo.ts`, `sanitize-html.ts`
- Modify: `lib/kudos/spotlight-queries.ts` (self-exclude param), `types.ts`, `hydrate.ts`, `queries.ts` (selects), `query-keys.ts` (add create key if needed)
- Read for pattern: `use-toggle-like.ts`, `use-filters.ts`

## Implementation steps
1. Add `excludeUserId` to `searchSunners`; add `useRecipientSearch`.
2. Add `useHashtagOptions` (reuse filters fetch).
3. Add `upload-kudo-images` with client validation.
4. Add `sanitize-html` util + install `isomorphic-dompurify`.
5. Add `use-create-kudo` mutation (upload → rpc → invalidate).
6. Extend types + hydrate + selects for title + anonymous_name.
7. Confirm mutation pattern (client-direct vs route) by reading `use-toggle-like.ts`.
8. `pnpm typecheck` / `pnpm build` clean.

## Todo
- [x] `searchSunners` excludes current user
- [x] `useRecipientSearch`, `useHashtagOptions` hooks
- [x] `upload-kudo-images` (type/size/count validation, `{uid}/{uuid}.{ext}`)
- [x] `sanitize-html` util + dep installed
- [x] `use-create-kudo` (upload→rpc→invalidate, error surfaced)
- [x] `KudoCard.anonymousName` + `CreateKudoInput` types
- [x] hydrate + buildKudoSelect + highlight selects carry title/anonymous_name
- [x] mutation pattern confirmed against toggle-like
- [x] typecheck/build clean

## Success criteria
- `useCreateKudo.mutate(validInput)` inserts a kudo; feed/highlight refetch shows it (title + sanitized body + alias).
- Image validation rejects >5MB / wrong type / >5 count before upload.
- Recipient search never returns current user.
- Board cards expose `title` + `anonymousName` from queries.

## Risk assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| RPC named-arg mismatch with B1 signature | Med | High | Single source of param names; smoke-test rpc after B1 |
| XSS via stored Tiptap HTML | Med | High | sanitize on render with strict allowlist; never render raw |
| Orphaned uploaded images if RPC fails after upload | Med | Med | Upload then rpc; on rpc error, attempt best-effort delete OR accept orphan (bucket private, low harm) — document choice |
| Self-exclusion regresses spotlight callers | Low | Med | New param optional/default off; spotlight search unchanged |

## Rollback
Hooks/util are additive — revert by deleting new files + reverting type/select edits. No data migration. B1 must roll back separately if both reverted.
