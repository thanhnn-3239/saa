# Code Review — Viết Kudo send-dialog

**Branch:** feat/viet-kudo-send-dialog (vs main)
**Date:** 2026-06-11
**Reviewer:** reviewer agent

---

## Scope

| Area | Files |
|------|-------|
| Migration | `supabase/migrations/20260611070000_kudo_title_anonymous_name.sql` |
| API routes | `app/api/kudos/route.ts` (new), `app/api/kudos/spotlight/route.ts` (mod) |
| Data layer | `lib/kudos/types.ts`, `hydrate.ts`, `queries.ts`, `spotlight-queries.ts`, `sanitize-html.ts`, `upload-kudo-images.ts`, `use-create-kudo.ts`, `use-hashtag-options.ts`, `use-recipient-search.ts` |
| UI | `app/(public)/sun-kudos/_components/send-dialog/` (15 files), `ui/kudo-card-base.tsx`, `kudos-board.tsx` |
| i18n | `messages/vi.json`, `messages/en.json` |
| Tests | 6 new test files, 172 new tests |

LOC (new): ~1 600 (excluding pnpm-lock)

---

## Overall Assessment

Solid foundation: security-definer RPC with explicit `auth.uid()` guard, DOMPurify sanitize-on-render, typed errors, full test coverage (537/537 green). However two blocking defects prevent the feature from being deployable: the recipient autocomplete is broken (non-functional UI), and anonymous sender identity leaks to every client in JSON. Five additional major defects are documented below.

Score: **6 / 10**
Verdict: **FIX-FIRST**

---

## Critical Issues

### C1 — Anonymous sender identity leaks to client (Security / Privacy)

**Severity:** Critical
**Files:** `lib/kudos/queries.ts:38-53`, `lib/kudos/hydrate.ts:83-105`, `app/(public)/sun-kudos/_components/ui/kudo-card-base.tsx:122-126`

`buildKudoSelect` always embeds the full sender profile:

```
sender:profiles!kudos_sender_id_fkey (
  id, full_name, avatar_url, department_id, departments ( name )
)
```

This is unconditional — no distinction for `is_anonymous=true` rows. The JSON response delivers `{ sender: { id, fullName, avatarUrl, ... }, isAnonymous: true }` to every authenticated client. Anyone can open DevTools → Network and read the real identity.

Three additional leakage paths in `kudo-card-base.tsx` even if the API were fixed:
- Line 122: `onClick={() => onOpenProfile?.(card.sender.id)}` — real sender id passed to profile handler
- Line 124: `aria-label={t("leaderboard.profileAria", { name: card.sender.fullName })}` — real name in accessibility tree
- Line 126: `<Avatar ... alt={card.sender.fullName}>` — real name in image alt text

The display layer correctly renders `senderName` (line 129) using the alias, but the DOM still contains the real name in aria attributes, and the full object is serialized in the `__NEXT_DATA__` script tag.

**Fix:** Server-side, mask sender profile before returning for `is_anonymous` rows. Either:
- Option A (preferred): strip sender in `hydrateKudoCard` when `raw.is_anonymous`:
  ```ts
  const sender = raw.is_anonymous
    ? { id: "", fullName: raw.anonymous_name?.trim() || "Ẩn danh", avatarUrl: null, stars: 0, kudosReceived: 0, departmentId: null }
    : (raw.sender ? hydrateProfile(raw.sender) : fallback);
  ```
- Option B: exclude sender profile from the select when `is_anonymous=true` — harder with PostgREST, go with Option A.
- Also fix lines 122/124/126 to use `senderName` / guard against showing real sender ID.

---

### C2 — Recipient autocomplete non-functional (Feature)

**Severity:** Critical
**File:** `app/(public)/sun-kudos/_components/send-dialog/recipient-field.tsx:21-26`

`RecipientField` declares `onSelect` and `options` in its `RecipientFieldProps` interface (lines 16-17) but the destructuring on line 21 only uses `searchTerm, onSearchChange, selected, error`. The autocomplete dropdown suggestions are **never rendered**. The user can type a name, the hook fetches results via `useRecipientSearch`, but no list appears and no selection is possible.

This means:
- `recipient` state in the container stays `null`
- `validateForm` always returns `errors.recipient = "Vui lòng chọn người nhận"`
- `submitDisabled` is always `true`
- The Gửi button is permanently disabled

The feature is completely inoperable.

**Fix:** Render the dropdown in `RecipientField`:
```tsx
export function RecipientField({ searchTerm, onSearchChange, selected, onSelect, options, error }: RecipientFieldProps) {
  return (
    <div ...>
      {/* existing input */}
      {options.length > 0 && !selected && (
        <div className="absolute top-full left-0 mt-1 z-20 bg-white border ...">
          {options.map(profile => (
            <button key={profile.id} type="button" onClick={() => onSelect(profile)}>
              {profile.name}
            </button>
          ))}
        </div>
      )}
      {error && <p ...>{error}</p>}
    </div>
  );
}
```

---

## High Priority

### H1 — `imagePaths` not validated server-side (Security)

**File:** `app/api/kudos/route.ts:52, 63`

The API route checks only that `imagePaths` is an array — no validation that each element is a non-empty string or starts with `{userId}/`. A valid authenticated user can POST `{ imagePaths: ["../../../other-user/secret.jpg", "some-random-string"] }` and associate arbitrary storage paths with their kudo row.

The count check (≤5) is delegated to the RPC, but path validity is not enforced anywhere server-side. This is a trust boundary issue — client-uploaded paths are user-controlled.

**Fix:** In the API route before calling RPC, validate each path:
```ts
const userPrefix = `${user.id}/`;
const validPaths = body.imagePaths.every(
  p => typeof p === "string" && p.startsWith(userPrefix) && !p.includes("..")
);
if (!validPaths) return NextResponse.json({ error: "Invalid image paths" }, { status: 400 });
```

---

### H2 — Link URL not validated before `setLink` (Security / UX)

**File:** `app/(public)/sun-kudos/_components/send-dialog/kudo-editor.tsx:118-123`

`window.prompt` returns any string the user types, including `javascript:alert(1)`, `data:text/html,...`, relative paths, etc. This is passed directly to `editor.chain().focus().setLink({ href: url })` with no validation:

```ts
const url = window.prompt("URL:", prev ?? "https://");
if (url === null) return;
if (url === "") { editor.chain().focus().unsetLink().run(); }
else { editor.chain().focus().setLink({ href: url }).run(); }  // no guard
```

`javascript:` is stripped by DOMPurify on render, so stored XSS via the body is mitigated. However this still stores malformed/malicious `href` values in the DB, and Tiptap's `autolink: true` may also inject links from body text without protocol normalization.

Additionally, `window.prompt` is a blocking UI anti-pattern — it breaks inside iframes and is blocked by some browsers in certain contexts. The design calls for an inline link popover.

**Fix (minimal):** Add validation before `setLink`:
```ts
const isValidUrl = /^https?:\/\//i.test(url);
if (!isValidUrl) { /* show inline error or ignore */ return; }
editor.chain().focus().setLink({ href: url }).run();
```

---

### H3 — Singleton `rendererInstance` in suggestion (Concurrency)

**File:** `app/(public)/sun-kudos/_components/send-dialog/kudo-editor-suggestion.ts:28`

```ts
let rendererInstance: ReactRenderer<MentionListHandle> | null = null;
```

This is a **module-level singleton**. If the dialog is unmounted while the dropdown is open (e.g., user presses Escape), `onExit` may never fire, leaving `rendererInstance` pointing at a destroyed React tree. On next `onStart`, the stale reference is overwritten but the DOM node from the previous instance may still be attached to `document.body`.

Race scenario: user opens dialog → types `@` → dropdown appears → dialog closes via Escape (two key handlers: dialog and mention) → `rendererInstance` is destroyed by dialog unmount but `onExit` not called → re-opening produces double DOM nodes.

**Fix:** Move renderer instance into the `render()` closure so each suggestion lifecycle is independent (Tiptap's own docs show this pattern). The singleton is unnecessary.

---

### H4 — Blob URL memory leak (Memory)

**File:** `app/(public)/sun-kudos/_components/send-dialog/send-kudo-dialog-container.tsx:211`

```ts
.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
```

`URL.createObjectURL` allocates a persistent blob URL. These are never revoked anywhere in the codebase (`grep revokeObjectURL` returns nothing). Each image add or dialog open/close cycle leaks a blob handle for the session lifetime.

If a user adds and removes images multiple times, or opens/closes the dialog repeatedly, this accumulates. Minor in a typical session but can be significant if users are heavy Kudo senders.

**Fix:** Revoke URLs when images are removed and when the dialog resets:
```ts
// In handleImagesChange / onRemove:
images.forEach(img => URL.revokeObjectURL(img.previewUrl));
// In resetForm:
images.forEach(img => URL.revokeObjectURL(img.previewUrl));
setImages([]);
```

---

### H5 — Dead code: `kudo-body-editor-placeholder.tsx` (YAGNI)

**File:** `app/(public)/sun-kudos/_components/send-dialog/kudo-body-editor-placeholder.tsx`

This was the Phase A1 placeholder. Phase C1 replaced it with `KudoEditor`. The file is still present, exported in nothing, but occupies a slot in the `send-dialog` directory. It confuses readers into thinking there's a fallback renderer.

**Fix:** Delete the file.

---

## Medium Priority

### M1 — Hardcoded Vietnamese strings in presentational components

**Files:** `send-kudo-dialog.tsx:123`, `kudo-editor.tsx:64`, `title-field.tsx:61-62`, `anonymous-field.tsx:61`, `recipient-field.tsx:73`, `dialog-footer.tsx:33`, `editor-toolbar.tsx:132`

There are ~15 hardcoded Vietnamese strings not using `useTranslations`. Examples:
- `send-kudo-dialog.tsx:123`: `"Gửi lời cám ơn và ghi nhận đến đồng đội"` (dialog `aria-label`)
- `kudo-editor.tsx:64`: placeholder text
- `title-field.tsx:61`: helper text with `\n` newline
- `anonymous-field.tsx:61`: checkbox label
- `editor-toolbar.tsx:132`: `"Tiêu chuẩn cộng đồng"` (hardcoded, key exists in i18n but not used)

All corresponding keys exist in `messages/vi.json` and `messages/en.json` (sendDialog namespace). The components simply don't use them. This means the English locale renders Vietnamese in all these places.

The previous review cycle noted ~22 hardcoded strings were fixed in the live-board feature — same pattern.

**Fix:** Replace each hardcoded string with `t("sendDialog.fieldKey")`. The `send-dialog` components are `"use client"` so `useTranslations` is available.

---

### M2 — `hashtag` field error position broken

**File:** `app/(public)/sun-kudos/_components/send-dialog/hashtag-field.tsx:127-131`

```tsx
{error && (
  <p className="text-sm font-montserrat text-[#CF1322] mt-1 w-full">
    {error}
  </p>
)}
```

The `HashtagField` uses `flex flex-row items-start gap-4 w-full` at the root. The error `<p>` is a sibling of the label div and the tag group — in a flex-row layout, it renders as a third column to the right of the tags, not below them. The error is likely invisible or partially clipped.

**Fix:** Wrap label+group in a div and put error below, or change root to `flex flex-col`.

---

### M3 — `RPC error.message` leaked to client in plain text

**File:** `app/api/kudos/route.ts:72-75`

```ts
const validation = /requires|too long|max 5|1\.\.5|authentication/.test(error.message);
return NextResponse.json({ error: error.message }, { status: validation ? 422 : 500 });
```

For 500 responses (unexpected DB errors), the raw Supabase/PostgreSQL error message is returned to the client. This can include table names, column names, constraint names, trigger bodies, and internal stack details.

**Fix:** For non-422 errors, return a generic message:
```ts
return NextResponse.json(
  { error: validation ? error.message : "Failed to create kudo" },
  { status: validation ? 422 : 500 }
);
```

---

### M4 — `createKudo` flow: no guard if `uploadKudoImages` partially succeeds

**File:** `lib/kudos/use-create-kudo.ts:23-43`

The comment acknowledges orphan uploads if the RPC fails. This is documented and intentional. However there's no retry-safe upload: if the upload succeeds for 3/5 images but fails on the 4th, the mutation throws and the 3 already-uploaded images are orphaned with no way for the user to retry without re-uploading.

**Minor concern** at current scale. Acceptable per the documented orphan policy. Listed for awareness.

---

### M5 — `cursor.createdAt` in `.or()` filter is not URL-encoded

**File:** `lib/kudos/queries.ts:342-344` (pre-existing, not this diff)

This was noted in the previous review as a known limitation (UUID v4 tie-breaker). Not introduced by this diff — included for awareness.

---

## Low Priority

### L1 — `ProfileBrief` type duplication

**Files:** `lib/kudos/types.ts:11-27`, `app/(public)/sun-kudos/_components/send-dialog/send-kudo-types.ts:9-13`

There are two `ProfileBrief` interfaces. The send-dialog one (`name` field) differs from the global one (`fullName` field). The container maps between them at line 126-130 of `send-kudo-dialog-container.tsx`. This is a deliberate isolation boundary but creates confusion and a mapping overhead. DRY concern.

**Fix (optional):** Extend the global `ProfileBrief` to add `name?: string` alias, or re-export it. Low urgency.

---

### L2 — `use-create-kudo.ts` `anonymousName` trimming done in two places

`use-create-kudo.ts:35`: `anonymousName: input.isAnonymous ? input.anonymousName.trim() || null : null`
`migration:53`: `nullif(btrim(p_anonymous_name), '')`

Both trim. The client trim is appropriate to avoid sending whitespace. The DB trim is a safety net. Not a bug; just a minor DRY observation.

---

### L3 — `hashtag-field.tsx` inline error column layout

Minor: `error` text rendered as a flex-row sibling (see M2 above — same root cause, noted here as layout inconsistency).

---

## Edge Cases Found

1. **Escape key conflict:** Both `send-kudo-dialog.tsx:68` and `community-standards-modal.tsx:25` register `window.addEventListener("keydown", ...)` for Escape. When the community-standards sub-modal is open, pressing Escape should close only it, not the parent dialog. The community standards handler calls `onClose()` which closes the sub-modal. The parent dialog's handler is still active and also fires — it calls `onClose()` on the parent. Net effect: Escape when community-standards is open closes **both** modals. This is a minor UX bug.

   **Fix:** `stopPropagation` on the sub-modal Escape handler, or check if the sub-modal is open in the parent's handler.

2. **Body reset race:** `kudo-editor.tsx:91-98` — the sync `useEffect` for external `value === ""` reset calls `editor.commands.clearContent(true)` which fires `onUpdate` → `onChange("")` → parent's `setBody("")`. If parent resets body to `""` and the editor is mid-composition (IME), the clear happens during composition, corrupting input. Low risk in practice.

3. **`undo()` cap behavior for Mentions:** When `charCount > MAX_CHARS`, the editor calls `ed.commands.undo()`. Mention insertion can be multi-character; if a mention pushes over 2000, undo removes the entire mention node. But if the user was at 1999 chars and typed a mention with 10 chars, undo might remove the mention entirely rather than just the last char. Expected? Acceptable but worth documenting.

4. **`handleAddImage` with external `validateKudoImages` error path:** Lines 200-209 — if validation throws, the function returns early WITHOUT updating `setImages`. But on line 199, `combined` includes `images.map(i => i.file)` (existing) + `files` (new). If only the new files fail validation, the existing valid images are not affected. Correct behavior. However, the code on line 195-215 creates `input` via `document.createElement` inside `useCallback` — every call creates a new `<input>` that is GC'd after the click handler fires, which is fine. But there's no `input.remove()` cleanup; this is benign in modern browsers.

---

## Positive Observations

- **Security-definer RPC with explicit `auth.uid()` check** (migration:27-29) — self-kudo blocked at DB layer (existing constraint) + search excludes self (spotlight route) = defense in depth.
- **DOMPurify allowlist is exactly the Tiptap output** — `ALLOWED_TAGS` mirrors exactly what StarterKit's configured extensions can emit. Tightly scoped.
- **`ALLOWED_URI_REGEXP: /^https?:\/\//i`** — correctly blocks `javascript:`, `data:`, `vbscript:` URIs.
- **`excludeSelf=1` search param** — clean separation: mention search intentionally allows self (visual mention), recipient search excludes self (no self-kudo). Correct distinction, clearly commented.
- **`p_links: []` hardcoded** — future links feature is stubbed out safely; no injection surface even if a caller somehow passes links.
- **`immediatelyRender: false`** on Tiptap — correct SSR guard for Next.js 16 / React 19.
- **Hash-based hashtag dedup** in container (line 135): `hashtags.some((h) => h.id === opt.id)` — prevents duplicate selections.
- **`setSubmitted(true)` on first submit** — errors only shown post-first-attempt, good UX.
- **172 new tests at 100% pass** — strong coverage on sanitizer, image validation, form validation, hook behavior, and card rendering.

---

## Recommended Actions (Ordered)

1. **[BLOCK]** Fix C2 — implement dropdown rendering in `RecipientField`. Feature is inoperable without this.
2. **[BLOCK]** Fix C1 — mask sender profile server-side in `hydrateKudoCard` when `is_anonymous=true`; fix `kudo-card-base.tsx:122-126` to use `senderName`/empty id.
3. Fix H1 — validate `imagePaths` prefix in API route.
4. Fix H2 — validate URL before `setLink`; replace `window.prompt` with inline popover (can be follow-on).
5. Fix H3 — move `rendererInstance` into `render()` closure to eliminate singleton.
6. Fix H4 — add `revokeObjectURL` in `resetForm` and on image removal.
7. Delete H5 — `kudo-body-editor-placeholder.tsx`.
8. Fix M1 — replace hardcoded VN strings with `t(...)` calls in all A1 components.
9. Fix M2 — hashtag field error layout.
10. Fix M3 — don't leak raw DB error message on 500.

---

## Metrics

| Metric | Value |
|--------|-------|
| Test coverage | 537/537 (100% pass) |
| TypeScript errors | 0 (build clean) |
| Linting issues | 0 blocking |
| Hardcoded i18n strings (new) | ~15 |
| Critical issues | 2 |
| Major issues | 5 |
| Medium issues | 5 |
| Minor/low | 3 |

---

**Status:** DONE_WITH_CONCERNS
**Summary:** Score 6/10. FIX-FIRST. 2 critical (anonymous identity leak + recipient dropdown broken) / 5 major / 5 medium.
**Concerns/Blockers:** C2 makes the feature 100% inoperable — Gửi button permanently disabled. C1 is a privacy breach that would expose anonymous sender identities to all authenticated users via the JSON feed response.

---

## Re-Review — 2026-06-11

**Branch:** feat/viet-kudo-send-dialog (post-fix pass)
**Tests:** 543/543 green (`pnpm test` confirmed)

### Per-finding verification

| ID | Finding | Verified | Notes |
|----|---------|----------|-------|
| C2 | Recipient dropdown rendered + onSelect wired + clear button | YES | `recipient-field.tsx` now renders suggestion list at lines 109-133 (guarded by `searchTerm.length > 0 && !selected && options.length > 0`). `onSelect` is wired. `onClearSelected` clears selection and resets search. Container wires `onRecipientSelect` (sets recipient + clears searchTerm) and `onRecipientClear`. Full chain verified. Gửi path unblocked. |
| C1 | Anonymous sender masked in `hydrateKudoCard` | YES | `hydrate.ts:84-88`: when `raw.is_anonymous`, sender is replaced with `{ id: "", fullName: alias || "Ẩn danh", avatarUrl: null, ... }`. Real sender profile is never returned in the hydrated object. `kudo-card-base.tsx:122-124`: `onOpenProfile` is guarded with `if (!card.isAnonymous && card.sender.id)`. `aria-label` and `Avatar alt` both use `senderName` (the masked alias). No real identity leaks in any render path. |
| H1 | `imagePaths` ownership prefix + `..` check | YES | `route.ts:57-64`: `userPrefix = \`${user.id}/\`` + `.every(p => typeof p === "string" && p.startsWith(userPrefix) && !p.includes(".."))` → 400 on failure. Correct. |
| H2 | URL `^https?://` validation before `setLink` | YES | `kudo-editor.tsx:126`: `if (!/^https?:\/\//i.test(url)) return;` added. |
| H3 | `rendererInstance` moved inside `render()` closure | YES | `kudo-editor-suggestion.ts:39`: `let rendererInstance` is declared at the top of the `render()` return closure — each suggestion lifecycle gets its own instance. Module-level singleton gone. |
| H4 | Blob URL revocation on remove + `resetForm` | YES | `send-kudo-dialog.tsx:178-181`: `URL.revokeObjectURL(images[idx].previewUrl)` called before `onImagesChange` on per-image removal. `send-kudo-dialog-container.tsx:148-152`: `resetForm` uses functional setter `setImages(prev => { prev.forEach(img => URL.revokeObjectURL(img.previewUrl)); return []; })`. Both paths correct. |
| H5 | `kudo-body-editor-placeholder.tsx` deleted | YES | File absent from directory. `index.ts` barrel does not reference it. No dangling imports. |
| M1 | Hardcoded VN strings replaced with `useTranslations` | PARTIAL | 8 originally-listed components fixed. However 4 new hardcoded VN strings were introduced by the C2/H4 fixes: `recipient-field.tsx:77` (`"Xóa người nhận đã chọn"`), `hashtag-field.tsx:67` (`"Xóa hashtag ${tag.name}"`), `image-field.tsx:52` (`"Ảnh đính kèm ${idx+1}"`), `image-field.tsx:61` (`"Xóa ảnh ${idx+1}"`). All are aria-labels, so they affect EN locale screen-reader users. vi/en key parity for every originally-fixed component confirmed (all sendDialog namespace keys present in both locales). |
| M2 | Hashtag field error below tag group | YES | `hashtag-field.tsx:58-136`: label+button group wrapped in `flex flex-col flex-1` div; error `<p>` is inside that wrapper, below the tag row. |
| M3 | Generic 500 message | YES | `route.ts:83-85`: `{ error: validation ? error.message : "Internal error" }`. Raw DB message no longer returned on 500. |
| M4 | Community-standards Escape `stopPropagation` capture phase | YES | `community-standards-modal.tsx:34`: `window.addEventListener("keydown", handleKey, true)` — capture phase. Event flow: window capture fires before window bubble. `stopPropagation()` in capture prevents window-bubble handler (parent dialog) from firing. Verified correct. |

### New issues introduced by the fixes

**W1 — 4 new hardcoded VN aria-labels (Warning / Medium)**

`recipient-field.tsx:77`, `hashtag-field.tsx:67`, `image-field.tsx:52,61` contain Vietnamese-only aria-label strings. EN locale screen-reader users will hear Vietnamese labels for these interactive controls. Same class of issue as original M1.

Keys to add to both locale files: `clearRecipient`, `removeHashtag`, `imageAlt`, `removeImage` (with `{name}` / `{index}` interpolation as needed).

No new criticals or high-priority issues introduced.

### Residual / non-blocking

- `hydrate.ts:85` hardcodes `"Ẩn danh"` as the server-side fallback alias — acceptable because `kudo-card-base.tsx:109` overrides it with `t("card.anonymous")` for display. The server value only matters if someone reads raw API JSON in the EN locale, which is a minor concern.
- `hydrate.ts:107` still serializes `anonymousName` (the user-chosen alias) in the feed JSON. This is the sender's chosen display name, not the real identity — intentional and correct.
- `recipient-field.tsx`: `handleImagesChange` in container does not revoke blob URLs for images rejected by validation (they were never added to state, so there are no URLs to revoke — correct).

### Updated Score

| Area | Before | After |
|------|--------|-------|
| C1 (anon leak) | Critical | Fixed |
| C2 (recipient broken) | Critical | Fixed |
| H1-H5 | Major | Fixed |
| M1 (i18n) | Medium | Partially fixed (4 new aria-labels) |
| M2-M4 | Medium | Fixed |
| W1 (new aria-labels) | — | Warning (medium) |

**Score: 9 / 10**
**Verdict: SHIP** with one tracked follow-on: add i18n keys for the 4 new VN aria-labels (W1) — no screen-reader regression for EN users if deferred, but should land before the feature is considered i18n-complete. Does not block deployment.

**Tests:** 543/543 green.
