# Reviewer Report: Hệ thống giải (/he-thong-giai)
**Date:** 2026-06-11
**Reviewer:** Staff Engineer (reviewer agent)
**Score:** 6.5 / 10

---

## Scope
- Changed files: 12 (routes, categories, i18n, next.config, 7 new page files, 4 test updates)
- New code: ~800 LOC production + ~350 LOC tests
- Focus: full diff vs HEAD on branch worktree-he-thong-giai

## Overall Assessment

Good structural intent — server/client component boundary is correct, auth gating follows established pattern (proxy + defense-in-depth), redirect via next.config is clean, i18n parity coverage added. However **5 tests are currently failing** (the tester report's "537/537 pass" claim is incorrect — actual result: 5 failed / 378 passed across 30 test files). The failing tests include the primary data-accuracy tests for the new page, which undermines the test coverage narrative. Two additional correctness issues: (1) one i18n data value diverges from the plan spec, and (2) the SectionNav active button has no `aria-current` attribute. Production code is deployable but test suite is not green.

---

## Critical Issues

None (no security holes, no auth bypass, no data loss).

---

## High Priority

### H-1 — 5 unit tests failing (tester report incorrect)
**Files/lines:** `lib/awards/categories.test.ts:73`, `messages/messages.test.ts:115`, `app/(public)/he-thong-giai/_components/use-scroll-spy.test.ts:38 & 94`

Running `npx vitest run` produces: **3 test files failed, 5 tests failed, 378 passed**. The tester's claim of "537/537 pass" is wrong — either the tester ran on a different working tree state or the reported run did not complete correctly.

**Failure 1 — categories.test.ts: i18n namespace prefix missing**
`quantityKey = "awards.top-talent.quantity"` is traversed from `messagesVi` root, but the actual JSON structure is `messagesVi.HeThongGiai.awards["top-talent"].quantity`. The traversal does `messagesVi["awards"]` → `undefined`. Fix: start traversal from `messagesVi.HeThongGiai` (or prepend `"HeThongGiai."` to the path).

**Failure 2 — categories.test.ts: stale expected values**
Even after the namespace fix, `expectedValues` in the test contains data that doesn't match `vi.json`:

| slug | test expects | vi.json actual |
|------|-------------|----------------|
| top-project | `5 Dự án` / `15.000.000 VNĐ/dự án` | `02 Tập thể` / `15.000.000 VNĐ/giải` |
| top-project-leader | `5 Cá nhân` / `5.000.000 VNĐ/giải` | `03 Cá nhân` / `7.000.000 VNĐ` |
| best-manager | `10 Cá nhân` / `3.000.000 VNĐ/giải` | `01 Cá nhân` / `10.000.000 VNĐ` |
| signature-2025-creator | different wording | `01` / `5.000.000 VNĐ (cá nhân) / 8.000.000 VNĐ (tập thể)` |
| mvp | `3 Cá nhân` / `10.000.000 VNĐ/giải` | `01` / `15.000.000 VNĐ` |

The `vi.json` values match the phase-03 plan's authoritative data table exactly. The test was written with different (draft/placeholder) values. Fix: update `expectedValues` in the test to match the plan spec table.

**Failure 3 — messages.test.ts: wrong sort order**
Test expects `["bestManager", "mvp", "signature2025Creator", "topProjectLeader", "topProject", "topTalent"]` but alphabetical sort of the actual keys produces `"topProject"` before `"topProjectLeader"`. The test has `topProjectLeader` and `topProject` transposed. Fix: swap them in the assertion.

**Failure 4+5 — use-scroll-spy.test.ts: IntersectionObserver mock not a constructor**
```ts
global.IntersectionObserver = vi.fn(() => ({ observe: vi.fn(), ... })) as any;
```
`vi.fn()` produces a Vitest spy, which is not usable with `new`. The two tests that create a real DOM element trigger the `useEffect` path that calls `new IntersectionObserver(...)`, crashing with "is not a constructor". The two passing tests ("unknown slug" + "empty slug") avoid the crash because no DOM element is found so observer creation is never reached. Fix:
```ts
global.IntersectionObserver = vi.fn(function(this: unknown, cb: IntersectionObserverCallback) {
  return { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
}) as unknown as typeof IntersectionObserver;
```
Or use a class-based mock.

---

## Medium Priority

### M-1 — Missing `aria-current` on active nav button
**File:** `app/(public)/he-thong-giai/_components/section-nav.tsx:27-42`

The active `<button>` has only visual active styling. Screen readers cannot identify the currently active section. Add:
```tsx
aria-current={isActive ? "true" : undefined}
```

### M-2 — `prizeValue2` / `prizeNote2` props on `AwardCardData` never populated
**Files:** `he-thong-giai-screen.tsx:28-30`, `page.tsx:44-54`

`AwardCardData` declares optional `prizeValue2` and `prizeNote2` but `page.tsx` never populates them. The `signature-2025-creator` award in vi.json stores both prize tiers as a single combined string (`"5.000.000 VNĐ (cá nhân) / 8.000.000 VNĐ (tập thể)"`), which means the "Hoặc" divider in `AwardInfoCard` is dead code as currently wired. This is YAGNI-negative: the UI code was built for a split-tier rendering that the data doesn't feed. Either populate the second-tier props for signature-2025-creator or remove the dead props/render branch.

### M-3 — `proxy-session.test.ts` tests `/awards-information` path hitting proxy directly
**File:** `lib/supabase/proxy-session.test.ts:200-219`

The test at line 200-218 still lists `/awards-information` in the "formerly-public routes" block with a comment "These paths were in the OLD PUBLIC_PATHS." In production, `/awards-information` never reaches the proxy (next.config.ts redirect fires first, permanently redirecting to `/he-thong-giai`). The test is technically still correct (the proxy WOULD redirect unauthenticated users from any non-PUBLIC path), but the comment is misleading and the path entry is stale. It should be replaced with `/he-thong-giai` to reflect the actual current protected route under test.

### M-4 — `app-header.test.tsx` hardcoded label mismatch with updated i18n
**File:** `tests/homepage/app-header.test.tsx:30,140`

`defaultNavLabels.awardInformation = "Award Information"` is hardcoded in the test. The nav label in `vi.json` is now `"Hệ thống giải"` and `en.json` is `"Award System"`. The test still passes because it passes its own hardcoded string directly to `AppHeader` (doesn't go through i18n), and line 140 only checks that the active item matches whatever was passed in. This makes the test non-representative of the real rendered output. Minor regression risk: if the component ever uses the i18n label internally instead of the prop, this test would silently hide the mismatch.

### M-5 — `hero-section.tsx` comment references old route
**File:** `app/(public)/_components/homepage/hero-section.tsx:94`

Comment `{/* mm:2167:9063 — About Awards (primary gold) → awards-information */}` still references the old path. The `<Link href={ROUTES.awardsInfo}>` is correct (uses the constant), but the comment is stale. Low risk (dead comment), but adds confusion.

---

## Minor Priority

### N-1 — `AwardInfoCard` receives both `slug` and `id` as separate props (same value)
**Files:** `award-info-card.tsx:8-33`, `he-thong-giai-screen.tsx:91-92`

The component accepts `slug: string` as part of `AwardInfoCardProps` interface (line 8) but the implementation uses `Omit<AwardInfoCardProps, 'slug'>` (line 49) — the tester's lint fix removed `slug` from the destructure but left it in the interface. Then `he-thong-giai-screen.tsx` passes both `id={award.slug}` and `slug={award.slug}`. The `id` is actually used; `slug` in the interface is vestigial. Remove `slug` from the interface or remove the `Omit<>` and use it for the DOM `id` instead of the separate `id` prop.

### N-2 — `scroll-mt-[96px]` on AwardInfoCard outer div, not on the heading
**File:** `award-info-card.tsx:221`

`scroll-mt` is set on the outermost `<div id={id}>`. When `scrollIntoView({ block: "start" })` fires, the scroll-margin applies correctly. However if the outer div has 80px of gap from the previous card's bottom divider, the visible top after scroll might show the divider/space, not the card title. This is an aesthetic concern, not a bug — acceptable for shipping.

### N-3 — HTTP 308 vs 301 (clarification says 301)
**File:** `next.config.ts`

`permanent: true` in Next.js generates an HTTP 308 (for non-GET) / 301 (for GET with some versions) or 308 universally in Next.js 13+. The clarification doc says "301 permanent". In practice curl shows 308, which is semantically equivalent to 301 but HTTP-spec-compliant for non-GET. For bookmarks and browser navigation (GET), 308 behaves identically to 301. No action needed, but the clarification should note that Next.js issues 308, not 301.

---

## Edge Cases Found

**Race between click-scroll and IntersectionObserver:** When a user clicks a nav item, `scrollTo()` triggers `scrollIntoView()` which is asynchronous. During the scroll animation, sections may cross in/out of the observer's rootMargin window, potentially causing the active highlight to flicker through intermediate sections before settling. The `recomputeActive` function always picks the topmost intersecting slug, which is the correct final state, but intermediate states may flicker. With only 6 sections and smooth scroll this is typically imperceptible; no fix needed unless reported.

**`resolvedActive = activeSlug ?? slugs[0] ?? ""`:** On first render (before scroll-spy fires), the first nav item is always highlighted. This is correct behavior per the design's "top-most section wins" rule, but if the page is loaded mid-scroll (e.g., with a hash anchor), the initial highlight may be wrong until the observer fires. Acceptable for this use case.

**Empty `slugs[]`:** Handled — `slugs[0] ?? ""` gives empty string, `SectionNav` renders no items. No crash.

---

## Positive Observations

- Auth gating is correctly layered: proxy → `getSessionUser()` defense-in-depth. Session data is not passed to client components — `await getSessionUser()` result is discarded.
- `next.config.ts` redirect placement is ideal (fires before middleware, before rendering — cheapest possible path).
- DRY: reuses `Home.awards.*` title/desc keys, extends categories.ts without duplication.
- `use-scroll-spy.ts` is well-documented with rationale for rootMargin values and the TC ID-13 null-guard. Observer cleanup in `useEffect` return is correct.
- All production Tailwind classes use valid `saa-*` design tokens (no invalid `saa-navy-hover` in code — the tester report's description was inaccurate; actual code uses `saa-gold-glass` which is defined in globals.css).
- File sizes are within guidelines: only `award-info-card.tsx` at 239 lines slightly exceeds the 200-line recommendation, but it's a single visual component with no extractable logic — acceptable.
- `AwardInfoCard` applies `aria-hidden="true"` to all decorative SVG icons correctly.
- Redirect from `/awards-information → /he-thong-giai` is correctly permanent and does not require a stub route file (next.config handles it before any page renders).
- `slug` naming is kebab-case, file names are kebab-case, no inline styles in new code.
- i18n parity test structure is correct (even though one assertion has a sort-order bug — the structure itself is right).

---

## Recommended Actions (Priority Order)

1. **[Blocking]** Fix `use-scroll-spy.test.ts` IntersectionObserver mock to be newable (H-1 failure 4+5).
2. **[Blocking]** Fix `categories.test.ts` i18n traversal to start from `messagesVi.HeThongGiai` and update `expectedValues` to match vi.json / plan spec (H-1 failure 1+2).
3. **[Blocking]** Fix `messages.test.ts` nav key sort order — swap `topProject` / `topProjectLeader` (H-1 failure 3).
4. **[High]** Add `aria-current={isActive ? "true" : undefined}` to the active `<button>` in `SectionNav` (M-1).
5. **[Medium]** Decide on `prizeValue2`/`prizeNote2` — either wire them for signature-2025-creator or remove dead props and render branch (M-2).
6. **[Low]** Replace `/awards-information` with `/he-thong-giai` in proxy-session.test.ts line 201 test data (M-3).
7. **[Nit]** Remove `slug` from `AwardInfoCardProps` interface or consolidate `slug`/`id` into one prop (N-1).
8. **[Nit]** Update stale comment in hero-section.tsx:94 (M-5).

---

## Metrics

- Type Coverage: Clean (tsc --noEmit passes)
- Test Coverage: 5/383 tests FAILING (tester report was incorrect)
- Linting: Clean
- Build: Clean

## Unresolved Questions

1. Is the `vi.json` data (phase-03 plan table) authoritative, or should it be updated to match what `categories.test.ts` expected? The plan spec and vi.json agree; the test was wrong.
2. Should `signature-2025-creator` render two prize tiers via `prizeValue2`/`prizeNote2`, or is the combined string in vi.json the intended UX?
