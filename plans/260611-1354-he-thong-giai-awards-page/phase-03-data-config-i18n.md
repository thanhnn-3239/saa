---
phase: 03
track: B
title: "Award data config + i18n messages (vi/en)"
status: completed
priority: P2
parallel_with: [01, 02, 04]
blockedBy: []
blocks: []
---
# Phase 03 — Award data config + i18n (Track B)

## MoMorph refs
- Hệ thống giải: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
- Clarifications: ./clarifications.md

## Context Links
- `lib/awards/categories.ts` (AWARD_CATEGORIES — slugs + title/desc keys already exist)
- `messages/vi.json` + `messages/en.json` (Home.awards.* already has title/desc/detailsCta)
- `messages/messages.test.ts` (parity test — top-level namespaces + key trees must match)
- MoMorph specs (22 items) — exact quantity/value strings below

## Overview
- **Priority:** P2 (data source for cards + page chrome)
- **Status:** pending
- Provide the static award quantity/value data + all page-specific i18n strings, DRY-reusing
  existing `Home.awards.*` title/desc keys.

## Key Insights
- **DRY:** the 6 slugs + title/desc keys ALREADY exist in `categories.ts` and `Home.awards`.
  Do NOT duplicate names. ADD only: per-award `quantity` + `value` fields and page-chrome
  strings (eyebrow, page title, menu labels, kudos banner, the two field labels).
- **No DB** (decision 6). Static config array + i18n only.
- **EN content** (decision 7): translate vi→en; award NAMES stay English (already English).
- The 336×336 card image is the SAME asset as homepage award images
  (`public/homepage-saa/<Name>.png`) — reuse `imageSrc` from `categories.ts`. Verify a 336px
  render path; if homepage assets are smaller, use `next/image` sizing (no new asset needed).

## Requirements
**Functional — exact data (from specs, must match TC ID-6):**
| slug | quantity | value |
|------|----------|-------|
| top-talent | 10 Đơn vị | 7.000.000 VNĐ/giải |
| top-project | 02 Tập thể | 15.000.000 VNĐ/giải |
| top-project-leader | 03 Cá nhân | 7.000.000 VNĐ |
| best-manager | 01 Cá nhân | 10.000.000 VNĐ |
| signature-2025-creator | 01 | 5.000.000 VNĐ (cá nhân) / 8.000.000 VNĐ (tập thể) |
| mvp | 01 | 15.000.000 VNĐ |

Field labels: "Số lượng giải thưởng" / "Giá trị giải thưởng".

**Non-functional**
- vi.json and en.json key trees identical (parity test green).
- Numeric values: keep "VNĐ" formatting verbatim per spec (do NOT auto-localize numbers —
  they are content strings, TC ID-6 expects exact text).

## Architecture
Two data planes, joined by slug:
1. **Structural config** (`lib/awards/categories.ts`): slug, titleKey, descKey, imageSrc
   — extend with `quantityKey` + `valueKey` (i18n key refs) OR keep numbers in i18n only.
   **Decision (KISS):** quantity/value are localized strings (Đơn vị/Cá nhân/Tập thể differ
   by language) → store as i18n keys, reference via new `quantityKey`/`valueKey` on the
   `AwardCategory` interface. Config stays the single ordered source of the 6 cards.
2. **Content plane** (i18n): new `HeThongGiai` namespace holding page chrome + per-award
   quantity/value strings + the two field labels + menu labels + kudos banner copy.

Namespace shape (`HeThongGiai`):
```
eyebrow, pageTitle,
nav: { ...6 menu labels keyed by slug-derived name },
fields: { quantityLabel, valueLabel },
awards: { <slug>: { quantity, value } }  // 6 entries
kudos: { label, title, description, cta }
```
Reuse `Home.awards.<slug>Title/Desc` for card title/description (DRY — no duplication).

## Related Code Files
**Modify**
- `lib/awards/categories.ts` — add `quantityKey: string` + `valueKey: string` to
  `AwardCategory` and to each of the 6 entries.
- `messages/vi.json` — add `HeThongGiai` namespace (Vietnamese).
- `messages/en.json` — add `HeThongGiai` namespace (English, identical key tree).
**Create** — none (extend existing files).
**Delete** — none.

## Implementation Steps
1. Extend `AwardCategory` interface: add `quantityKey`, `valueKey`.
2. Add those two keys to all 6 entries (e.g. `quantityKey:"awards.top-talent.quantity"`).
3. Add `HeThongGiai` namespace to `vi.json` with: eyebrow="Sun* annual awards 2025",
   pageTitle="Hệ thống giải thưởng SAA 2025", fields.quantityLabel="Số lượng giải thưởng",
   fields.valueLabel="Giá trị giải thưởng", per-award quantity/value (table above), 6 nav
   labels (= award names), kudos {label:"Phong trào ghi nhận", title:"Sun* Kudos",
   description, cta:"Chi tiết"}.
4. Add identical-tree `HeThongGiai` to `en.json` (translate; award names stay English;
   translate units: Đơn vị→Units, Cá nhân→Individual, Tập thể→Team; keep VNĐ amounts).
5. Update header nav label string `Home.nav.awardInformation` → "Hệ thống giải" (vi) and
   appropriate EN (e.g. "Award System") per decision 1 (page replaces awards info).
6. Run `pnpm vitest run messages/messages.test.ts` — parity must pass.

## Todo List
- [x] Extend AwardCategory with quantityKey/valueKey + fill 6 entries
- [x] Add HeThongGiai namespace to vi.json
- [x] Add identical HeThongGiai namespace to en.json
- [x] Update Home.nav.awardInformation label (vi + en)
- [x] i18n parity test green

## Deviations
- **Home.footer.awardInformation label** also updated for consistency with header nav label rename (not explicitly in phase scope, but cross-referenced during integration).

## Success Criteria
- All 6 cards resolve exact quantity/value strings matching the spec table (TC ID-6).
- `messages.test.ts` passes (namespace + key-tree parity).
- No invented data — every string traces to spec or a faithful EN translation.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Key-tree drift vi vs en | Med | High | Author en by copying vi structure; parity test catches |
| Number auto-localization breaks exact-text TC | Low | Med | Store as plain content strings, not formatted numbers |
| Duplicating title/desc that already exist | Med | Low | Explicitly reuse Home.awards.*; only add new fields |

## Security Considerations
- Static non-sensitive content. No PII. No DB access. No injection surface.

## Next Steps
- Feeds phase-05 (integration binds config+i18n to phase-01 components). No blocker on 01.
