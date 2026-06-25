---
name: tkm:generate-slide
description: "Generate polished presentation slides from content or outline. Two modes: --html for modern scroll-snap HTML slides with 12 style presets (deliverable-quality, opens in browser), or --sun/--pptx for Sun* brand-compliant PowerPoint decks (branded .pptx via pptxgenjs). Use when user says 'tạo slide', 'làm presentation', 'gen deck', 'create slides', 'プレゼン作って', or provides an outline/markdown and wants it turned into a deck. NOT for quick dev-internal explanations (use tkm:preview-output --slides for those)."
category: content
keywords: [slides, presentation, pptx, html, sun-asterisk, deck, generate]
argument-hint: "<content|outline|plan.md|*.pptx> [--html|--sun|--pptx] [--from-pptx] [--auto]"
metadata:
  author: takumi-agent-kit
  version: "1.0.0"
---

# Generate Slide

Convert content, outlines, or markdown into polished presentation slides.

**Two output modes:**
- `--html` *(default)* — Self-contained HTML file, scroll-snap navigation, 12 style presets, opens directly in browser. Best for internal demos, stakeholder walkthroughs, developer-facing content.
- `--sun` / `--pptx` — Sun\* brand-compliant `.pptx` deck via pptxgenjs. 12 layout patterns, Sun Red palette, Noto Sans JP. Best for client deliverables, internal company decks.

**Optional input:**
- `--from-pptx <file.pptx>` — Import existing PowerPoint, extract content, then re-style in either mode.

## Usage

```
/tkm:generate-slide "AI governance framework for 20 stakeholders" --sun
/tkm:generate-slide outline.md --html
/tkm:generate-slide --from-pptx old-deck.pptx --sun
/tkm:generate-slide "Takumi Kit overview for onboarding" --auto
```

## Intent Detection

| Input Pattern | Mode |
|---------------|------|
| `--sun` or `--pptx` | Sun* PPTX mode |
| Mentions Sun*, STVC, BrSE, client, khách hàng | Auto-select `--sun` |
| `--html` | HTML mode |
| Default / no flag | HTML mode |
| `--from-pptx <file>` | PPT import → then HTML or PPTX |
| `--auto` | Skip approval gates |

---

## Phase 0 — Mode Detection

1. Read the argument and detect mode (HTML or PPTX) from flags or context clues above.
2. If `--from-pptx` given: run **PPT Import** first (see section below), then continue to Phase 1 with the extracted content.
3. If no flag and audience context is ambiguous, default to `--html`.

---

## HTML Mode Workflow (`--html`)

### Phase 1 — Content Discovery

Read the user's content (markdown, outline, raw notes, or natural-language description). Map to slide roles:

| Content shape | Slide role |
|---------------|-----------|
| Document title | Title slide |
| Top-level `##` headings | Section divider |
| `###` sub-sections or numbered items | Body slides |
| Final "Q&A" / "Contact" / "Next steps" | Closing slide |

**Density rule:** If a section has >80 words or >5 bullets, plan to split it into 2 slides. Ask one clarifying question if intent is unclear, otherwise infer.

**One-shot discovery question (if content is sparse):**
> "Quick questions before I start: (1) Who's the audience? (2) What's the main message? (3) Any content I should avoid?"

### Phase 2 — Style Selection

Generate **3 single-slide HTML previews** — one from each theme group (dark / light / specialty). Use `viewport-base.css` + the chosen preset's color palette. Open the previews or describe them clearly, let user pick.

Skip this step if `--auto` flag is set — pick the most contextually appropriate preset automatically.

Load `references/style-presets.md` to select three preview candidates. Consider audience:
- Dev-focused / internal tech → Terminal Green (#10) or Neon Cyber (#9)
- Client-facing professional → Electric Studio (#2) or Swiss Modern (#11)
- Creative / product launch → Bold Signal (#1) or Creative Voltage (#3)
- Formal / editorial → Vintage Editorial (#8) or Paper & Ink (#12)

### Phase 3 — Generate HTML

Generate a **single self-contained HTML file** using:
- `references/html-template.md` — `SlidePresentation` class, base structure
- `references/viewport-base.css` — paste inline in `<style>` block
- `references/style-presets.md` — chosen preset's CSS variables
- `references/animation-patterns.md` — `.reveal` animations + optional effects

**Hard rules:**
- All sizing via `clamp()` — no fixed px for typography or spacing
- Negative CSS functions: `calc(-1 * clamp(...))` — never `-clamp(...)`
- Fonts: Fontshare or Google Fonts URLs only — **never** Inter, Roboto, Arial, system fonts
- Images: `max-height: min(50vh, 400px)` — never fill full slide
- `prefers-reduced-motion: reduce` — set `animation-duration: 0.01ms !important`
- Nav dots: always `innerHTML = ''` before building (prevents duplicate dots on re-open)
- Content density: title slides = 1 heading + 1 subtitle; content slides = max 4–6 bullets; grids = max 6 cards

### Phase 4 — Deliver HTML

Open the file in the user's browser or copy it to CWD. Brief the user on:
- File path and how to navigate (arrow keys / swipe)
- Slide count and structure
- Any placeholder content to fill in

**Optional (ask once):**
- Export to PDF? → run `scripts/export-to-pdf.sh`
- Inline edit mode? → enable `contenteditable` hotzone for live editing

---

## Sun* PPTX Mode Workflow (`--sun` / `--pptx`)

### Phase 0 — Check Dependencies

```bash
echo "Node.js:     $(command -v node >/dev/null 2>&1 && node --version || echo 'MISSING')"
echo "pptxgenjs:   $(npm list -g --depth=0 2>/dev/null | grep -q pptxgenjs && echo 'installed' || echo 'MISSING')"
echo "LibreOffice: $(command -v soffice >/dev/null 2>&1 && echo 'installed' || echo 'MISSING (QA disabled)')"
echo "Poppler:     $(command -v pdftoppm >/dev/null 2>&1 && echo 'installed' || echo 'MISSING (QA disabled)')"
```

**If `pptxgenjs` is missing** — stop and tell the user:
> "`pptxgenjs` is not installed. Run `tkm init --install-skills` to install all skill dependencies (includes pptxgenjs), then retry."

**If `LibreOffice` or `Poppler` is missing** — continue without QA, use conservative layout defaults (50–60 words/slide, 12–13pt body, generous padding), warn user at delivery.

**If `Node.js` is missing** — stop with: "Node.js not found. Install from https://nodejs.org and retry."

### Phase 1 — Read Content

Map sections → slide roles (same as HTML Phase 1). Density rule: ~60–80 words max per body slide. Pre-plan splits for dense sections.

### Phase 2 — Pick Layouts

Load `references/layouts.md`. For each body slide, pick the layout that fits the content shape — vary across slides, no two consecutive slides with identical layouts.

Quick mapping:
- 3–5 enumerated points → Numbered points (#1)
- 2 things compared → Comparison columns 2 (#2)
- 3 parallel items → Comparison columns 3 (#3)
- 4 grid items → Card grid 2×2 (#4)
- Steps/process → Process flow (#5)
- Before/after metrics → Metrics table (#6)
- Problem/solution → Pain/Solution split (#7)
- Single big message → Hero callout (#8)
- Project info/metadata → Field grid (#9)
- Definition + key message → Definition slide (#11)
- Levels/tiers → Tier ladder (#12)

### Phase 3 — Generate PPTX

Create `generate.js` in a `.sun-slide-build/` directory inside CWD. Use `assets/helpers.js` (or inline its brand constants). Copy `assets/logo_sun.png` into the build dir.

**Critical rules from `assets/helpers.js`:**
- Hex colors: `"FF2200"` — **never** `"#FF2200"` (pptxgenjs corrupts files with `#`)
- Reused option objects: use factory functions `const makeShadow = () => ({...})` — pptxgenjs mutates objects in-place
- Unicode bullets: use `bullet: { code: "25AA" }` in run options — never `"• Item"` (creates double bullets)
- `breakLine: true` on every text run except the last in an array
- `margin: 0` on text boxes aligned with shapes
- CJK / Vietnamese text: use `"Noto Sans JP"` for `fontFace`
- Footer y-coordinate: `7.05` — don't place content below `y = 7.0`
- Slide dimensions: `LAYOUT_WIDE` = 13.333" × 7.5" (16:9)
- Sun Red: `"FF2200"` — one accent element per body slide, not a flood fill

Run the script:
```bash
cd .sun-slide-build && node generate.js
```

### Phase 4 — Visual QA

If LibreOffice + Poppler available:
```bash
soffice --headless --convert-to pdf output.pptx
pdftoppm -jpeg -r 100 output.pdf slide
```
View each `slide-*.jpg` and check: text overflow, cramping, tiny fonts (<11pt), overlap, footer collision (y>7.0), color overuse (>2 red elements per slide), visual monotony (3+ identical layouts in a row). Fix and re-render once.

If QA tools absent: use conservative defaults (50–60 words/slide, 12–13pt body, generous padding) and warn user.

### Phase 5 — Deliver PPTX

```bash
cp output.pptx ../<MeaningfulName>.pptx
```

Brief user on: file path, slide count, structure, any `[placeholder]` content to fill.

---

## PPT Import (`--from-pptx`)

Run the extractor script:
```bash
python3 <skill-path>/scripts/extract-pptx.py input.pptx extracted-content.md
```

If `python-pptx` missing:
```bash
~/.claude/skills/.venv/bin/pip install python-pptx
# or: pip install python-pptx
```

Review extracted content with user, confirm section mapping, then proceed to the chosen output mode (HTML or PPTX).

---

## Common Pitfalls Summary

| Issue | Fix |
|-------|-----|
| pptxgenjs color bug | `"FF2200"` not `"#FF2200"` |
| Negative CSS function | `calc(-1 * clamp(...))` not `-clamp(...)` |
| Double nav dots on re-open | `navDotsContainer.innerHTML = ''` before building |
| Generic AI fonts | Always Fontshare or Google Fonts — never Inter/Roboto/Arial |
| CJK/Vietnamese PPTX font | `fontFace: "Noto Sans JP"` |
| pptxgenjs object mutation | Factory fn `const makeOpts = () => ({...})` |

---

## Reference Files

Load on demand — only what the current phase needs:

| File | When to load |
|------|-------------|
| `references/style-presets.md` | HTML Phase 2 (style selection) |
| `references/viewport-base.css` | HTML Phase 3 (paste inline) |
| `references/html-template.md` | HTML Phase 3 (SlidePresentation class) |
| `references/animation-patterns.md` | HTML Phase 3 (animation CSS/JS) |
| `references/layouts.md` | PPTX Phase 2 (layout selection) |
| `references/examples.md` | PPTX Phase 3 (code examples) |
| `assets/helpers.js` | PPTX Phase 3 (brand constants + helper fns) |
| `assets/sun-brand.md` | PPTX Phase 3 (when in doubt about colors/fonts) |
| `scripts/extract-pptx.py` | PPT import mode only |
| `scripts/export-to-pdf.sh` | HTML PDF export (user-requested) |
