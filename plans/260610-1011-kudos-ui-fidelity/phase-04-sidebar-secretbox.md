# Phase 04 — Sidebar secret-box block

## Context links
- Parent: [plan.md](plan.md) · Analysis: [brainstorm report](../reports/brainstorm-260610-1011-kudos-ui-fidelity-diffs.md) §④
- Design: block `2940:13489` (`D.1_Thống kê tổng quat`), hearts row `3241:14882` (`D.1.4_Số tim`), button `2940:13497` (`D.1.8_Button mở quà`).

## Overview
- **Date:** 2026-06-10 · **Priority:** P2 · **Effort:** small (~40m)
- **Status:** done · **Review:** done
- Stats container + typography already match design; two element-level details are off.

## Key Insights
- Already correct: container `radius 17px`, `padding 24px`, bg `#00070C`, border `1px #998C5F`; value `32px`/line-40 gold; label `~22px` white; button `radius 8px`, bg `rgba(255,234,158,1)`, ~60px tall.
- Gap 1: "Số tim bạn nhận được:" row needs a 🔥 **x2 flame badge** between label and value (design `3241:14882`). Code comment on L73 admits it but renders no icon.
- Gap 2: "Mở Secret Box" button — design has the gift icon **AFTER** the text (filled gift); code renders an outline gift **BEFORE** the text (L102-118).

## Requirements
- Hearts row shows the flame "x2" multiplier badge before the value, matching design placement.
- Button: gift icon positioned after the label text; icon style closer to design (filled gift).
- No change to container/typography/values (already correct).

## Architecture
- `SidebarStatsBlock` is a presentational client component. The x2 row is the only one diverging from the generic `StatRow` (it has a middle icon) — keep its bespoke markup (L74-81) and inject the badge there.

## Related code files
- Modify: `app/(public)/sun-kudos/_components/sidebar/sidebar-stats.tsx` (hearts row L73-81; button L96-120)
- Optional asset: check `public/sun-kudos/` for an existing flame/x2 asset before inlining SVG. Fetch design item image of `3241:14882` if a raster asset is needed.

## Implementation Steps
1. Inspect design `3241:14882` to confirm the x2 badge form (flame glyph + "x2" text vs single combined asset). Prefer inline SVG + small "x2" text using `saa-gold-accent`, else use a downloaded asset in `public/sun-kudos/`.
2. Render the badge inline in the hearts row between label and value (`flex items-center gap-1.5`), aligned with the value baseline.
3. Button: move the `<svg>` gift to AFTER `{t("openGift")}`; swap the outline gift path for a filled/closer-to-design gift glyph; keep `gap-1`, sizing, `bg-saa-gold-accent`, `rounded-[8px]`.
4. `pnpm build`.

## Todo list
- [x] x2 flame badge added to hearts row (correct placement)
- [x] Gift icon moved after text + filled style
- [x] Container/fonts untouched
- [x] build clean

## Success Criteria
- Hearts row matches design (flame x2 between label and value).
- "Mở Secret Box" button shows gift icon after the text, filled.
- No regression to other stat rows / values.

## Risk Assessment
- Low. Markup-only. Watch: keep `tabular-nums` value alignment when inserting the badge; don't shift the 32px value column.

## Security Considerations
- None.

## Next steps
- Independent of other phases. Secret-box OPEN flow itself remains a stub (out of scope).
