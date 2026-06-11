# Brainstorm — Sun* Kudos Live Board UI Fidelity Diffs

**Date:** 2026-06-10 · **Design ref:** screenId `MaZUn5xHXZ`, fileKey `9ypp4enmFmdK3YAFJLIu6C`
**Method:** Design-spec ↔ code comparison (page is OAuth-gated; design specs authoritative for CSS).

## Commission
Re-analyze 4 components against the Figma design, identify where the current implementation diverges, agree a fix scope. Page: `app/(public)/sun-kudos`.

## Diffs found (evidence-backed)

### ① Search input — double ✕ + poor typing CSS
- Files: `banner.tsx:188-219`, **same bug** in `spotlight/spotlight-cloud.tsx:197`.
- Root cause: `type="search"` → native `::-webkit-search-cancel-button` (✕) renders on type, AND code renders its own custom clear button → two ✕. Native search decoration also disrupts flex layout.
- Fix: `type="text"` OR hide native control via `[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none`. Both files. Low risk.

### ② Filter dropdown — closed trigger (open panel already correct)
- File: `ui/filter-dropdown.tsx:136-181`. Design node `2940:13459`: radius **4px**, padding **16px**, 136×56px, bg gold-glass 10%, border `#998C5F`.
- Diffs: code uses `rounded-full` (design = `rounded-[4px]`); code renders external bold `Hashtag:` label + separate value pill → "Hashtag: [Tất cả ▾]"; design shows a SINGLE pill `Hashtag ▾`. Code padding `pr-8 pl-4 py-1.5` (design = 16px).
- Fix: remove external label/colon; trigger text = selected option label, fallback to category name when none; `rounded-[4px]` + 16px padding. Open panel unchanged.

### ③ Highlight ↔ Feed cards — same component in design
- Files: `highlight/highlight-card.tsx`, `feed/kudo-post-card.tsx`. Figma: both share base `256:5231` (`C.3_KUDO Post` / `B.3_KUDO - Highlight`).
- Design Content order (gap 16, column): Time → "IDOL GIỎI TRẺ" title → Body-in-box → Images → Hashtags. Body box `Frame 425`: border `1px #FFEA9E`, bg gold-glass **40%**, radius 12, padding 16/24.
- Code diffs (both cards): ❌ no "IDOL GIỎI TRẺ" title; ❌ body is plain `<p>` (no box); ⚠️ HighlightCard timestamp in header row (design: below divider). Images & "Xem chi tiết" already differ correctly. Feed edit-pencil not rendered.
- Data finding: `kudos` table has NO title/category column (`docs/database-design.md:99-110`). `awards` catalog exists but kudos don't FK to it → "IDOL GIỎI TRẺ" has no backing data.

### ④ Secret box / sidebar stats — small diffs
- File: `sidebar/sidebar-stats.tsx`. Container + fonts already MATCH (radius 17, padding 24, bg `#00070C`, border `#998C5F`, value 32px, label ~22px).
- Diffs: ❌ missing 🔥 "x2" flame icon on "Số tim bạn nhận được:" row (code comment admits it, L73); gift icon is BEFORE text + outline (design: AFTER text + filled).

## Paths examined (③ scope)
- A. Design-faithful unify — shared base + body-box + timestamp fix; omit IDOL title (no data). **CHOSEN.**
- B. Full incl. title — needs schema/product decision for the title. Rejected (scope/data creep).
- C. Minimal unify — match current feed styling only. Rejected (stays off-design).

## Agreed direction
- ①②④ fix as described above.
- ③ = **Path A**: extract shared `KudoCardBase`; variant props (`showImages`, `showViewDetail`, `showEdit`); add rounded body-box; fix timestamp placement; highlight hides images; **OMIT** "IDOL GIỎI TRẺ" title.
- Next: produce a written implementation plan via `/tkm:create-plan`, user approves before coding.

## What to watch
- ③ refactor: keep heart/copy/badge wiring intact while extracting base; embla carousel active/inactive scaling unaffected.
- ② trigger restyle must not break the already-correct open-panel a11y (listbox roles).
- ① if switching `search`→`text`, confirm no a11y/role regression (role="search" form wrapper stays).
- Body-box bg is gold-glass **40%** (`rgba(255,234,158,0.40)`) on the cream card — verify contrast with navy body text.

## Success criteria
- Single ✕ in both search inputs; clean typing layout.
- Filter triggers render as `radius-4px` single pills matching design; open panel still works.
- Highlight & feed cards render from one shared base; body sits in the gold-glass box; timestamp below divider; highlight omits images.
- Sidebar hearts row shows x2 flame; gift icon after text.

## Open questions
- "IDOL GIỎI TRẺ" title: deferred — needs product/data decision (add `kudos.title`? link `awards` category?) before it can render.
- Feed owner edit-pencil: in scope now or later? (owner-only action; not in the 4 reported issues.)
