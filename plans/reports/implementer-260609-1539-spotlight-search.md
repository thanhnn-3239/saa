# Implementer Report — Spotlight + Banner Search UI Fidelity

Date: 2026-06-09 | Branch: feat/sun-kudos-live-board

## Files Modified / Created

| File | Lines | Change |
|------|-------|--------|
| `app/(public)/sun-kudos/_components/spotlight/spotlight-cloud.tsx` | 305 | Rewrite: centered count, search top-left, forwardRef, client-side filter, real word-cloud |
| `app/(public)/sun-kudos/_components/spotlight/word-cloud-layout.ts` | 178 | New: deterministic spiral word-cloud layout algorithm |
| `app/(public)/sun-kudos/_components/banner.tsx` | 225 | Search pill converted from stub `<button>` to real `<form>`+`<input>`, wired to shared state |
| `app/(public)/sun-kudos/_components/kudos-board.tsx` | ~300 | Lifted `spotlightSearchTerm` state + `spotlightSectionRef`; removed `useSpotlightSearch` usage; pass to both Banner and SpotlightCloud |
| `messages/vi.json` | +3 keys | `banner.clearSearch`, `spotlight.noMatch`, `spotlight.totalAria` |
| `messages/en.json` | +3 keys | Same keys in English |

## Task Acceptance Criteria

### Task 1 — Count + search position (#5)
- **Total count CENTERED**: `{n} KUDOS` rendered in a full-width `justify-center` flex row; search form is `position: absolute left-6` so it does not shift the count off-centre. White text, Montserrat Bold, 30px.
- **Search TOP-LEFT**: absolute-positioned inside the same header row, `left: 24px`, vertically centred. Width 219px, height 39px — matches design node `B.7.3` dimensions exactly.
- **maxLength 100** on the input.

### Task 2 — Search behaviour (#6, #1)
- **Client-side filter**: `filteredNodes = normalised ? nodes.filter(n => n.profile.fullName.toLowerCase().includes(normalised)) : nodes` — no API call.
- **Live filtering on `onChange`** (no submit needed); clearing restores all nodes.
- **Empty-state split**: `t("noMatch")` when filter yields 0 results but nodes exist; `t("empty")` when no data at all.
- **Shared state flow**: `spotlightSearchTerm` in `kudos-board.tsx` → passed as controlled prop to both `Banner` (as `spotlightSearch`) and `SpotlightCloud` (as `searchTerm`). Both inputs have local mirror state that stays in sync via `useEffect` watching the parent prop, so clearing from either input propagates to the other.
- **Banner pill**: converted from `<button>` to `<form role="search">` with a real `<input>` of the same pill dimensions (max-w-[381px], py-5, rounded-[68px]). Submit scrolls Spotlight into view via `spotlightSectionRef`.
- `useSpotlightSearch` mutation removed from kudos-board — search is fully client-side now.

### Task 3 — Word-cloud layout (#7)
**Algorithm** (`word-cloud-layout.ts`):
- Sorts nodes heaviest-first so largest names get best placement.
- For each node: computes a deterministic starting angle (`hashFrac(label, 0) * 2π`) and grid-cell hint (index % cols, deterministic jitter ±30% of cell).
- Runs an **Archimedean spiral** from that hint (up to 200 steps, angle += 0.15 rad/step, radius grows at 0.035×step×6 %-units).
- At each spiral step, AABB collision-checks against all already-placed boxes with 1.5% padding.
- Falls back to a deterministic offset slot if no non-colliding position is found in 200 steps.
- **No `Math.random`** — all decisions seeded by `name` string + `seed` int via `Math.imul` Knuth hash → SSR/hydration stable.
- Font-size **4 tiers**: 24 | 20 | 17 | 14 px, mapped from weight thresholds 0.75 / 0.5 / 0.25 (matches Figma's 4 observed sizes).
- Container width/height measured by `ResizeObserver` for accurate % estimates; falls back to 800×320 on mount.
- Top-ranked recipient (index 0 after nodes sorted by `kudosReceived` descending from API) gets `color: #F17676` — the salmon/red accent matching design node `rgba(241,118,118,1)`.
- Names remain keyboard-focusable `<button>` elements with `aria-label` + `focus-visible:ring`.

## New i18n Keys

```
Home.kudosPage.banner.clearSearch        (vi: "Xóa tìm kiếm" / en: "Clear search")
Home.kudosPage.spotlight.noMatch         (vi: "Không tìm thấy sunner phù hợp" / en: "No matching sunner found")
Home.kudosPage.spotlight.totalAria       (vi: "Tổng cộng {count} kudos" / en: "Total {count} kudos")
```

## Test / Typecheck Results

- `pnpm exec tsc --noEmit`: **0 errors**
- `pnpm test`: **334/334 passed** (26 test files, no changes to test files needed — component interfaces changed but existing tests target lower-level utils/hooks that are unaffected)

---

**Status:** DONE

**Summary:** Spotlight count is now centered independent of search position; search is top-left per design. Both the banner pill and the in-panel search drive the same client-side cloud filter via lifted state in `kudos-board.tsx`. Word-cloud uses a deterministic spiral packing algorithm (no Math.random) with 4 font-size tiers matching the Figma design, accent colour on top recipient, and ResizeObserver-based responsive layout.

**Concerns:**
- The word-cloud uses percentage-based AABB estimates for text width (chars × 0.62 × fontSize / containerWidth). These are approximations — actual Montserrat glyph widths vary. At ~20 nodes (current seed data) there is ample space; at 80 nodes some names may still overlap despite the spiral. A canvas-based `measureText` approach would be more precise but adds complexity. Accepted trade-off.
- The `ResizeObserver` layout recalculation triggers a React re-render on every resize. With ~80 nodes and 200-step spiral per node this is O(n²) worst-case per frame. Acceptable for the expected node count; would need debouncing if nodes grew beyond ~200.
- Banner `spotlightRef` prop is typed as `React.RefObject<HTMLElement | null>`. TypeScript sees `useRef<HTMLElement | null>(null)` as compatible — no cast needed.
