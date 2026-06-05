# Phase D1 — Floating Action Button (speed-dial) + Thể lệ panel

**Added 2026-06-05** as new scope: the homepage spec (item 6) only described the widget as a
placeholder ("opens menu"). These are SEPARATE MoMorph frames provided later by the user.

**MoMorph refs (fileKey 9ypp4enmFmdK3YAFJLIu6C):**
- FAB collapsed: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/_hphd32jN2
- FAB expanded: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/Sv7DFwBw1h
- Thể lệ panel: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/b1Filzi9i6
- Clarifications: ../260605-1529-homepage-saa/clarifications.md (Session 2026-06-05 #2)

## Overview
- **Priority:** Medium · **Status:** todo · **Track:** A (UI) · **Depends on:** A1/C1 (homepage shell exists)
- Replace the placeholder `FloatingWidgetButton` with a real speed-dial FAB, and add the Thể lệ drawer.

## Design facts
**FAB collapsed (`_hphd32jN2`):** fixed bottom-right yellow pill (~105×64), pencil icon + "/" + SAA red bolt.
**FAB expanded (`Sv7DFwBw1h`):** click → two stacked yellow pills above the trigger — "⚡ Thể lệ" (SAA bolt) and "✏️ Viết KUDOS" (pencil) — and the trigger becomes a **red circular × close** button. Click × → collapse.
**Thể lệ panel (`b1Filzi9i6`):** right-side drawer, dark bg, scrollable. Content:
- Title "Thể lệ" (gold).
- Section "NGƯỜI NHẬN KUDOS: HUY HIỆU HERO…" + 4 hero-tier rows: **New Hero** (1-4), **Rising Hero** (5-9), **Super Hero** (10-20), **Legend Hero** (>20) — each a gradient-bordered chip + description.
- Section "NGƯỜI GỬI KUDOS: SƯU TẬP TRỌN BỘ 6 ICON…" + 3×2 grid of 6 circular icons: Revival, Touch of Light, Stay Gold, Flow to Horizon, Beyond the Boundary, Root Further (+ labels) + description.
- Section "KUDOS QUỐC DÂN" + description.
- Footer: "× Đóng" (outline) + "✏️ Viết KUDOS" (gold filled).

## Locked decisions (see clarifications #2)
- FAB visible to ALL users (guest + auth) — per design, no auth condition on the homepage widget.
- "Thể lệ" → opens the drawer (public content). Close via Đóng / × / overlay click / Esc.
- "Viết KUDOS" → **placeholder** (no write-kudos screen provided): button present + styled, click is a TODO no-op (or links to a stub). Mark `// TODO(kudos)`. Deferred until a write-kudos design exists.
- i18n: all strings via next-intl. New keys under `Home.fab` (labels) + `Home.rules` (Thể lệ content). VN authored, EN mirrored.

## Related code files
- Modify: `app/(public)/_components/floating-widget-button.tsx` → speed-dial (collapsed ⇄ expanded). Owns Thể lệ open state + renders the drawer.
- Create: `app/(public)/_components/the-le-panel.tsx` (drawer) + small subcomponents if >200 lines (e.g. `hero-tier-row.tsx`, `kudos-icon-grid.tsx`) or a `lib/kudos/rules-data.ts` for the tier/icon dataset.
- Modify: `messages/{vi,en}.json` (`Home.fab`, `Home.rules`).
- Assets: download the 6 collection icons + hero-tier badge graphics to `public/homepage-saa/` (via `momorph-implement-design`). No invented data — use design content.

## Implementation steps
1. Activate `momorph-implement-design`; fetch the 3 frames + download assets.
2. Build speed-dial FAB (collapsed pill ⇄ expanded actions + red × close), keyboard + Esc + outside-click.
3. Build Thể lệ drawer (focus trap, Esc, overlay click to close, scrollable, responsive — full-width sheet on mobile, right drawer ~480px on desktop).
4. Wire "Thể lệ" → open drawer; "Viết KUDOS" → placeholder TODO; "Đóng"/× → close.
5. i18n all copy (vi authored, en mirrored). Mount via the existing layout (FAB already rendered there).

## Todo
- [x] Speed-dial FAB (collapsed/expanded/close) + a11y — `floating-widget-button.tsx`
- [x] Thể lệ drawer (content, 6 icons, 4 hero tiers, sections, footer) — `the-le-panel.tsx` + `kudos-rules-data.ts`
- [x] Assets downloaded (6 icons + 4 hero badges + Close/Pen/Logo) → `public/homepage-saa/kudos/` (via media S3 endpoint; figma-image endpoint was 500-ing → used `get_media_files`)
- [x] i18n keys (`Home.fab` + `Home.thele`) vi+en
- [x] "Viết KUDOS" placeholder (no-op TODO — no write-kudos design)

## Status
✅ **Completed** (2026-06-05). Verified in browser desktop (1440) + mobile (375): FAB expand/collapse + red close; Thể lệ drawer opens with all content + images (4 hero badges, 6 collection icons), Đóng/Esc/overlay close, full-width sheet on mobile, no overflow. `pnpm build` + `pnpm test` (250/250) green; FAB/panel files lint-clean.

**Note:** first agent run timed out retrying the failing figma-image asset endpoint (10 PNGs landed as 0-byte). Fixed by downloading via `get_media_files` (S3) and orchestrator took over verification.

## Success criteria
- Matches the 3 designs (visual validation). FAB expands/collapses; Thể lệ opens/closes (Đóng/×/overlay/Esc); responsive; keyboard-accessible.
- `pnpm build` + `pnpm test` + `pnpm lint` green. No invented data.

## Out of scope / deferred
- Actual "Viết KUDOS" form/flow (no design provided). Real Kudos write/submit + hero-tier computation from DB.
