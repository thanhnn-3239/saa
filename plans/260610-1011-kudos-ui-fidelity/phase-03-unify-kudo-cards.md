# Phase 03 — Unify highlight + feed kudo cards (shared base)

## Context links
- Parent: [plan.md](plan.md) · Analysis: [brainstorm report](../reports/brainstorm-260610-1011-kudos-ui-fidelity-diffs.md) §③
- Design: feed `C.3_KUDO Post` (`3127:21871`), highlight `B.3_KUDO - Highlight` (`2940:13465`) — same `256:5231` component family. Body box = `Frame 425` (`I3127:21871;662:11382`).

## Overview
- **Date:** 2026-06-10 · **Priority:** P2 · **Effort:** moderate (~2h)
- **Status:** done · **Review:** done
- Highlight and feed cards are two near-duplicate components that drift from the design. In Figma they're ONE component with variants.

## Key Insights
- Design shared Content order (column, gap 16px): `Time → [IDOL GIỎI TRẺ title] → Body-in-box → Images → Hashtags`.
- **Body box** (`Frame 425`): `border 1px #FFEA9E` (= `saa-gold-accent`), bg `rgba(255,234,158,0.40)`, `border-radius 12px`, `padding 16px 24px`, `gap 10px`, `align-self stretch`.
- Current code (BOTH cards): no body box (plain `<p>`); `HighlightCard` puts timestamp in the **header row** (design: below divider in content).
- Variant differences are real in the design: highlight = no images + "Xem chi tiết"; feed = images + edit-pencil + no "Xem chi tiết".
- **"IDOL GIỎI TRẺ" title is OMITTED** this phase — `kudos` table has no title/category column (deferred; see plan open questions).
- Card shells already match: `rounded-[24px]`, `bg-[rgba(255,248,225,1)]`, `p-10`, gold dividers — preserve.

## Requirements
- One shared base component renders both contexts via props.
- Both cards: timestamp BELOW the top divider (content area); body wrapped in the gold-glass rounded box.
- Highlight variant: no image gallery, action bar = Heart + Copy Link + "Xem chi tiết", body `line-clamp-3`, carousel active/inactive opacity+scale preserved.
- Feed variant: image gallery (≤5), action bar = Heart + Copy Link (no "Xem chi tiết"), body `line-clamp-5`.
- No regression to like/copy-link/profile/badge/stars wiring.

## Architecture
- New `app/(public)/sun-kudos/_components/ui/kudo-card-base.tsx` (<200 lines): renders sender→arrow→receiver, divider, content (time, body-box, optional images, hashtags), divider, action bar.
- Props: `card: KudoCard`, `baseUrl`, `variant: "feed" | "highlight"` OR explicit booleans `showImages`, `showViewDetail`, `showEdit`, `bodyClamp`, plus `active?` (highlight carousel), and the callbacks (`onLike`, `onCopyLink`, `onViewDetail`, `onOpenProfile`, `onOpenImage`).
- `highlight-card.tsx` + `kudo-post-card.tsx` become thin wrappers passing the right variant props (keeps carousel `active` scaling in `highlight-card`, keeps existing import sites in `kudos-feed.tsx` / `highlight-carousel.tsx` working).
- Reuse existing primitives: `Avatar`, `HeartButton`, `HashtagChip`, `StarsIndicator`, `CopyLinkButton`, `HeroTitlePill`, `getHeroTier`. Do NOT fork them.

## Related code files
- Create: `app/(public)/sun-kudos/_components/ui/kudo-card-base.tsx`
- Modify: `app/(public)/sun-kudos/_components/highlight/highlight-card.tsx` (→ wrapper)
- Modify: `app/(public)/sun-kudos/_components/feed/kudo-post-card.tsx` (→ wrapper)
- Read: `app/(public)/sun-kudos/_components/highlight/highlight-carousel.tsx`, `feed/kudos-feed.tsx` (call sites), `lib/kudos/types.ts` (`KudoCard`)
- Tests: `tests/sun-kudos/` (update/extend card tests)

## Implementation Steps
1. Read `node_modules/next/dist/docs/` relevant client-component guidance (per AGENTS.md) before refactor.
2. Build `kudo-card-base.tsx` from the design Content order; move timestamp into content (below divider); wrap body in the gold-glass box (border `saa-gold-accent`, bg `rgba(255,234,158,0.40)`, `rounded-[12px]`, `px-6 py-4`).
3. Gate image gallery behind `showImages`; gate "Xem chi tiết" behind `showViewDetail`; `showEdit` reserved (render nothing until scope confirmed).
4. Refactor `highlight-card.tsx` → wrapper: `showImages=false`, `showViewDetail=true`, `bodyClamp=3`, pass `active` for opacity/scale; keep the `<article aria-current>` active styling at the wrapper or via prop.
5. Refactor `kudo-post-card.tsx` → wrapper: `showImages=true`, `showViewDetail=false`, `bodyClamp=5`, pass `onOpenImage`.
6. Verify carousel still scales center card (`opacity-50 scale-95` on inactive) and feed grid spacing intact.
7. `pnpm build` + run `tests/sun-kudos/` + adjust tests for new structure.

## Todo list
- [x] Create `kudo-card-base.tsx` (design Content order + body box + timestamp placement)
- [x] Variant props wired (images / view-detail / clamp / active)
- [x] `highlight-card.tsx` → thin wrapper (keeps carousel active scaling)
- [x] `kudo-post-card.tsx` → thin wrapper (keeps image gallery)
- [x] Primitives reused, no forks; like/copy/profile wiring intact
- [x] build + tests green

## Success Criteria
- Highlight + feed cards render from one base; visually match design (body-in-box, timestamp below divider).
- Highlight: no images, "Xem chi tiết" present; feed: images present, no "Xem chi tiết".
- Carousel center/side scaling unchanged; no like/copy regressions; `tests/sun-kudos/` green.

## Risk Assessment
- Moderate (only structural change). Risks: losing carousel `active` scaling, breaking `onOpenImage`/`onViewDetail` callback wiring, file >200 lines (split if so). Mitigate: thin wrappers keep call sites stable; run tests.

## Security Considerations
- None new (presentational). Keep anonymous-sender handling (`card.isAnonymous`) intact.

## Next steps
- "IDOL GIỎI TRẺ" title + feed edit-pencil deferred pending data/scope decision (plan open questions).
