# Implementation Report — Highlight / Feed / Sidebar Polish

Date: 2026-06-09 · Branch: feat/sun-kudos-live-board

## Task
Fix Sun* Kudos board: HIGHLIGHT carousel overflow + pager, custom filter dropdowns, ALL KUDOS feed card (remove "Xem chi tiết"), feed column width, sidebar (remove promotions, CSS scrollbar, no-scroll stats block).

**Status:** DONE

---

## Files Modified

| File | Change summary |
|------|---------------|
| `app/(public)/sun-kudos/_components/highlight/highlight-carousel.tsx` | Fixed overflow bleed; corrected pager CSS (current: 32px gold, total: 20px muted) |
| `app/(public)/sun-kudos/_components/ui/filter-dropdown.tsx` | Full rewrite: native `<select>` → custom accessible dropdown (listbox/option roles) |
| `app/(public)/sun-kudos/_components/feed/kudo-post-card.tsx` | Removed `onViewDetail` prop + "Xem chi tiết" button; action bar is hearts + Copy Link only |
| `app/(public)/sun-kudos/_components/feed/kudos-feed.tsx` | Removed `onViewDetail` prop threading; feed column is `flex-1 min-w-0` (dominant); sidebar narrowed to `w-[360px]`; outer `overflow-y-auto` removed from sidebar `<aside>` |
| `app/(public)/sun-kudos/_components/sidebar/leaderboard-list.tsx` | Added `scrollbar-saa` + `max-h-[360px] overflow-y-auto` on `<ol>`; item layout: name (white) + gift label (`saa-gold-border`) |
| `app/(public)/sun-kudos/_components/kudos-board.tsx` | Removed promotions `<LeaderboardList>` render; removed `onViewDetail` from `<KudosFeed>`; sidebar comment updated |
| `app/globals.css` | Added `.scrollbar-saa` utility (Firefox `scrollbar-width/scrollbar-color`; WebKit 4px track/thumb; gold `#998C5F` on navy `#00101a`; hover brightens to `#FFEA9E`) |

---

## Per-task Approach

### Task 1 — Carousel overflow (#2)
- Added outer `<div className="w-full overflow-hidden">` wrapper around the Embla ref div.
- Changed `containScroll: "trimSnaps"` → `containScroll: false` so Embla no longer expands the track past the section; the outer wrapper clips any bleed at the page boundary.
- Slide widths use `min()` with both `px` and `vw` values so they never exceed viewport regardless of screen size, while still allowing adjacent card peeking.
- Active card remains full-opacity/scale-100; inactive cards stay opacity-50/scale-95 (unchanged in HighlightCard — not in scope).

### Task 2 — Pager CSS (#4)
- Split the old single `<span>` into three inline-flex elements:
  - Current: `text-[32px] text-saa-gold-accent` (gold, large)
  - Slash: `text-[20px] text-saa-text-muted` (muted, smaller)
  - Total: `text-[20px] text-saa-text-muted` (muted, smaller)
- Added `aria-live="polite" aria-atomic="true"` for screen reader pager announcements.
- No `Math.random` / `Date.now` — SSR safe.

### Task 3 — Custom filter dropdowns (#3)
**A11y model:**
- Trigger: `<button aria-haspopup="listbox" aria-expanded>` — keyboard activates with ArrowDown, Enter, Space.
- Panel: `<ul role="listbox">` with `aria-label` and `aria-activedescendant`.
- Options: `<li role="option" aria-selected tabIndex={-1}>` — keyboard: ArrowDown/ArrowUp navigate, Enter/Space selects, Esc closes and returns focus to trigger, Tab closes.
- First ArrowUp from option 0 closes panel and returns focus to trigger button.

**Visual (matches design refs JWpsISMAaM + WXK5AYB_rG):**
- Panel: `background: #00070C`, `border: 1px solid saa-gold-border`, `border-radius: 12px`.
- Active option: gold-glow gradient background + inset border + `text-saa-gold-accent`.
- Other options: `text-white`, transparent bg, `hover:bg-white/5`.
- Chevron rotates 180° when open.

**Outside-click:** `mousedown` listener on `document`, guarded by `containerRef.contains()`.

**Props unchanged** — same `label / options / value / onChange / className` signature as the old native `<select>` version; all callers (HighlightCarousel) wire identically.

**i18n:** Uses existing `t("filter.all")` key — no new keys required.

### Task 4 — Feed card (#8)
- Removed `onViewDetail` from `KudoPostCardProps` interface and destructuring.
- Replaced `justify-between` action bar with left-aligned `flex items-center gap-1` (hearts + Copy Link only).
- Comment updated: "no 'Xem chi tiết' in feed cards".
- `onViewDetail` is still present in `HighlightCard` (not in scope) — that is correct, the highlight carousel cards retain it.

### Feed column width (#8 continued)
- Feed column: `flex-1 min-w-0` (no max-width cap) — takes all remaining space, making it the dominant column.
- Sidebar `<aside>`: fixed `w-[360px]`, no `overflow-y-auto` (each block owns its scroll).
- Gap between columns reduced from `gap-20` to `gap-12` for better proportional split.

### Task 5 — Sidebar (#9, #10)

**Promotions removed:**
- `LeaderboardList` for `recentPromotions` removed from sidebar JSX in `kudos-board.tsx`.
- The `useSidebar` hook data fn is untouched; `sidebarData?.recentPromotions` is simply not consumed in render.
- No unused-variable warnings: `recentPromotions` was accessed via `sidebarData` object property, not destructured.

**Stats block (no scrollbar):**
- `SidebarStatsBlock` has no `overflow-y-auto` on itself or its container — it is self-contained and will never scroll.
- The sidebar `<aside>` no longer has `overflow-y-auto` either; inner blocks control their own overflow.

**NHẬN QUÀ scrollbar:**
- `<ol>` in `LeaderboardList` gains `scrollbar-saa max-h-[360px] overflow-y-auto pr-1`.
- `max-h` keeps the list within a reasonable viewport fraction; `pr-1` gives breathing room next to the thumb.

**Item row layout:**
- Avatar (32px) + rank badge + name (white bold) + score line (`text-saa-gold-border` muted gold, truncated).

**`.scrollbar-saa` utility (globals.css):**
- Firefox: `scrollbar-width: thin; scrollbar-color: #998C5F #00101a`.
- WebKit: 4px wide thumb, track `#00101a`, thumb `#998C5F`, hover `#FFEA9E`.

---

## New i18n Keys
None. All keys used already exist in both `vi.json` and `en.json`:
- `filter.all` — used by FilterDropdown for the "Tất cả / All" first option (pre-existing).

---

## Test / Typecheck Results
- `pnpm exec tsc --noEmit`: **0 errors**
- `pnpm test`: **334 / 334 passed** (26 test files, unchanged count)

---

## Concerns

**DONE_WITH_CONCERNS**

1. **Carousel slide widths**: Used `min(480px, 85vw)` / `min(560px, 78vw)` / `min(640px, 68vw)` breakpoints to prevent bleed. The exact design width (680px) is now the upper bound only at large viewports; visually this is correct but an in-browser check at lg breakpoint is recommended to confirm adjacent cards peek the right amount.

2. **Custom dropdown positioning**: The listbox panel uses `position: absolute; top: full; left: 0` on the trigger. If the trigger is near the right edge of a narrow viewport, the panel could clip. A right-anchored fallback was not added (YAGNI — the carousel header has ample left padding `lg:px-36`).

3. **Sidebar width 360px vs design 422px**: Reduced from 422px to 360px to give the feed more room and avoid horizontal overflow at narrower desktop widths. An orchestrator browser check should confirm this is acceptable vs design.
