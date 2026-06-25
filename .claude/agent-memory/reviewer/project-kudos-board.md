---
name: project-kudos-board
description: Known defects, pre-deploy checklist, and patterns from the Sun* Kudos Live Board review (feat/sun-kudos-live-board, 2026-06-06). All blockers cleared as of re-review 2026-06-06.
metadata:
  type: project
---

## Status (as of re-review 2026-06-06)

All 2 critical + 4 high defects resolved. Build clean (15 routes). 334/334 tests green. **SHIP verdict.**

## Blockers — all resolved

1. `supabase/migrations/20260606000000_kudo_likes.sql:80` — `alter table public.kudo_likes replica identity full;` added.
2. Same migration `:86-87` — `grant select on public.kudo_heart_counts, public.profile_kudo_stats to authenticated, anon;` added.
3. `kudos-board.tsx:56` — `baseUrl` destructured and threaded through `HighlightCarousel` → `HighlightCard` and `KudosFeed` → `KudoPostCard`. No `window.location.origin` fallbacks in cards.
4. `app/api/kudos/feed/route.ts:22-52` — ISO_RE + UUID_RE cursor validation; 400 on malformed input.
5. `feed/route.ts:36` + `highlight/route.ts:24` — `Number.isFinite(Number(deptParam))` NaN guard.
6. `lib/kudos/sidebar-queries.ts:163` — `.limit(50)` on Step-1 `profile_kudo_stats` query.
7. i18n — ~22 hardcoded VN strings replaced across all leaf components; all new keys in both `messages/vi.json` + `messages/en.json`.

**Why:** All were mechanical omissions, not design flaws.

**How to apply:** When reviewing future Supabase migrations, always check: (a) REPLICA IDENTITY for realtime-published tables, (b) explicit GRANT SELECT on new views, (c) trace any server-injected prop all the way to the leaf component that uses it.

## Pre-deploy validation items (live DB required — still open)

- Verify `profile_kudo_stats_profile_id_fkey` join hint resolves: `\d profile_kudo_stats` on live DB. Spotlight and sidebar queries break silently if wrong.
- Run `supabase/seed/kudos-board-seed.sql` — confirm idempotent, top-5 by hearts emerges.
- Confirm `kudo_heart_counts` view returns expected shape (array-of-1 vs object form in `flattenHeartCounts`).

## Viết Kudo send-dialog (feat/viet-kudo-send-dialog, 2026-06-11)

Score 6/10. FIX-FIRST verdict due to 2 critical + 5 major defects.

### Critical
1. **Anonymous identity leak (data):** `buildKudoSelect` in `queries.ts` always embeds full sender profile even when `is_anonymous=true`. Real `id`, `fullName`, `avatarUrl` of anonymous sender reach the browser in JSON. `kudo-card-base.tsx` lines 122/124/126 also leak via `onOpenProfile`, `aria-label`, and Avatar `alt` attributes.
2. **Recipient dropdown non-functional (feature):** `RecipientField` (`recipient-field.tsx:21-26`) only destructures `searchTerm, onSearchChange, selected, error` — `onSelect` and `options` are declared in interface but not used. Autocomplete never renders; user cannot select a recipient → submit always fails with "please select recipient".

### Major
- `imagePaths` not validated server-side: API route passes arbitrary caller-supplied paths to `create_kudo` RPC without checking they start with `{user.id}/`.
- `window.prompt` for link insertion in `kudo-editor.tsx:118` — no URL validation before `setLink`. XSS mitigated by sanitize-on-render but `javascript:` links are stored in DB.
- Singleton `rendererInstance` in `kudo-editor-suggestion.ts:28` — module-level leak; multiple simultaneous editors (possible if dialog re-opens quickly) corrupt shared state.
- `URL.createObjectURL` image preview URLs never revoked (no `revokeObjectURL` anywhere in codebase).
- `kudo-body-editor-placeholder.tsx` is dead code — superseded by `KudoEditor` but still shipped.

### Deferred non-blockers (tracked for follow-on)

- `liked` flag always `false` on SSR hydration — documented in `hydrateKudoCard` JSDoc. Corrects on interaction/realtime.
- Cursor tie-breaking with random UUID v4 — rare duplicate/skip; client-side dedup or bigserial tie-breaker for v2.
- `getHighlightKudos` client-side sort on `heart_total` — fine for top-5; revisit if extended to top-20.
- `window.alert()` stub for gift flow — replaced with toast. Gift flow itself still a stub.
- Clipboard failure now shows error toast (N4 fixed as bonus). 
