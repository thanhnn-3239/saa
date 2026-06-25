# Sun* Slide Layout Library

A library of proven slide layouts for Sun*-branded presentations. Match each content shape to a layout — varying layouts across slides creates the visual rhythm that distinguishes a polished deck from a forgettable one.

## How to use this file

Each layout entry has:
- **When to use it** — the content shape it fits
- **Visual sketch** — quick mental picture
- **Code snippet** — drop into your generator, adapt dimensions and content

Coordinates assume `LAYOUT_WIDE` (13.333 × 7.5 inches). Constants like `SUN_RED`, `LIGHT_GREY`, `FONT_JP` are from `scripts/helpers.js`.

## A note about icons & emoji

Slides feel more alive when you sprinkle in icons or emoji thoughtfully. Use them to:
- Reinforce category meaning (✓ for success, ⚠ for warnings, ★ for tiers, → for flow)
- Replace plain bullet points with topical glyphs (📊 for data, 🎯 for goals, 🚀 for launches, 💡 for ideas, 🔧 for tools, 🌍 for global)
- Add personality to numbered points or section headers

Two ways to add them:

**Inline emoji** — easiest, render directly in text:
```javascript
slide.addText("🚀 Launch the product", { ... });
slide.addText([
  { text: "🎯 ", options: { fontSize: 18 } },
  { text: "Strategic priority", options: { fontSize: 14, bold: true } },
], { ... });
```

**Symbol characters from `pres.shapes` or unicode** — used for arrows, checks, etc.:
```javascript
slide.addText("→", { fontSize: 24, color: SUN_RED, bold: true, ... });
slide.addText("✓", { fontSize: 18, color: "FFFFFF", bold: true, ... });
```

Don't go overboard — 1-3 icons per slide is plenty. A slide drowning in emoji feels juvenile.

## Table of contents

1. [Numbered points (3-5 items)](#1-numbered-points)
2. [Comparison columns (2 columns)](#2-comparison-columns-2)
3. [Comparison columns (3 columns)](#3-comparison-columns-3)
4. [Card grid (2×2)](#4-card-grid-2x2)
5. [Process flow (horizontal)](#5-process-flow-horizontal)
6. [Metrics table (Before / After / Δ)](#6-metrics-table-before-after-delta)
7. [Pain / Solution split](#7-pain-solution-split)
8. [Hero callout (single big message)](#8-hero-callout)
9. [Field grid (project info / metadata)](#9-field-grid)
10. [Question cards (Q1 / Q2)](#10-question-cards)
11. [Definition slide (3 points + side callout)](#11-definition-slide)
12. [Tier ladder (1, 2, 3 stars)](#12-tier-ladder)

---

## 1. Numbered points

**When**: 3–5 sequential or enumerated points, each with a header + 1–2 lines of detail.

**Sketch**: Red circle with number on the left, bold header + description text on the right, repeated vertically.

```javascript
const points = [
  { header: "First key idea here", body: "Brief description supporting the first idea." },
  { header: "Second key idea here", body: "Brief description supporting the second idea." },
  { header: "Third key idea here", body: "Brief description supporting the third idea." },
];

points.forEach((p, i) => {
  const y = 1.5 + i * 1.4;
  // Number circle (red)
  slide.addShape(pres.shapes.OVAL, {
    x: 0.7, y: y, w: 0.6, h: 0.6,
    fill: { color: SUN_RED }, line: { type: "none" },
  });
  slide.addText(String(i + 1), {
    x: 0.7, y: y, w: 0.6, h: 0.6,
    fontSize: 22, fontFace: FONT_EN, color: "FFFFFF",
    bold: true, align: "center", valign: "middle", margin: 0,
  });
  // Header
  slide.addText(p.header, {
    x: 1.5, y: y - 0.05, w: 11.0, h: 0.45,
    fontSize: 17, fontFace: FONT_JP, color: TEXT_DARK,
    bold: true, align: "left", valign: "middle", margin: 0,
  });
  // Body
  slide.addText(p.body, {
    x: 1.5, y: y + 0.45, w: 11.0, h: 0.85,
    fontSize: 13, fontFace: FONT_JP, color: TEXT_GREY,
    align: "left", valign: "top", margin: 0,
  });
});
```

For 5 points (compact spacing): use `y = 1.5 + i * 0.7` and reduce height to 0.4-0.6.

**Variation with emoji**: replace the numeric circle with a topical emoji to add personality:
```javascript
const points = [
  { icon: "🎯", header: "Goal", body: "..." },
  { icon: "🚀", header: "Approach", body: "..." },
  { icon: "📊", header: "Outcome", body: "..." },
];
// Instead of the OVAL + number, render the emoji at fontSize 28
slide.addText(p.icon, { x: 0.7, y, w: 0.7, h: 0.7, fontSize: 32, valign: "middle", margin: 0 });
```

---

## 2. Comparison columns (2)

**When**: Two things compared in detail — "Before vs After", "Option A vs Option B", "Old approach vs New approach".

**Sketch**: Two equal-width cards side by side, each with a left accent bar in the column's color.

```javascript
const colW = 6.0;
const startX = 0.5;
const startY = 1.3;
const colH = 4.7;

// Left column (e.g. "Approach A" — gold accent)
slide.addShape(pres.shapes.RECTANGLE, {
  x: startX, y: startY, w: colW, h: colH,
  fill: { color: "FAF5EC" }, line: { type: "none" },
});
slide.addShape(pres.shapes.RECTANGLE, {
  x: startX, y: startY, w: 0.1, h: colH,
  fill: { color: SUN_GOLD }, line: { type: "none" },
});
slide.addText("Approach A", {
  x: startX + 0.3, y: startY + 0.2, w: colW - 0.5, h: 0.5,
  fontSize: 22, fontFace: FONT_EN, color: SUN_GOLD,
  bold: true, align: "left", valign: "middle", margin: 0,
});

// ... add labeled items inside ...

// Right column (e.g. "Approach B" — Sun Red accent)
const rx = startX + colW + 0.3;
slide.addShape(pres.shapes.RECTANGLE, {
  x: rx, y: startY, w: colW, h: colH,
  fill: { color: "FFEEEC" }, line: { type: "none" },
});
slide.addShape(pres.shapes.RECTANGLE, {
  x: rx, y: startY, w: 0.1, h: colH,
  fill: { color: SUN_RED }, line: { type: "none" },
});
// ...
```

Pair this with a centered "key message" beneath the columns at y=6.2 to summarize.

---

## 3. Comparison columns (3)

**When**: Three things on a spectrum or progression (e.g., "Beginner / Intermediate / Advanced", "Past / Present / Future", "Small / Medium / Large").

**Sketch**: Three equal cards across, each with a top accent bar, title, subtitle, separator, and labeled items.

```javascript
const cols = [
  { title: "Tier 1", subtitle: "Entry level", color: TEXT_GREY, bgColor: "F2F2F2", items: [...] },
  { title: "Tier 2", subtitle: "Intermediate", color: SUN_GOLD, bgColor: "FAF5EC", items: [...] },
  { title: "Tier 3", subtitle: "Advanced", color: SUN_RED, bgColor: "FFEEEC", items: [...] },
];

const colW = 4.0;
const colGap = 0.15;
const startX = 0.5;

cols.forEach((col, i) => {
  const x = startX + i * (colW + colGap);
  // Card
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y: 1.4, w: colW, h: 5.4,
    fill: { color: col.bgColor }, line: { type: "none" },
  });
  // Top accent bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y: 1.4, w: colW, h: 0.08,
    fill: { color: col.color }, line: { type: "none" },
  });
  // Title
  slide.addText(col.title, {
    x: x + 0.25, y: 1.55, w: colW - 0.5, h: 0.5,
    fontSize: 22, fontFace: FONT_EN, color: col.color,
    bold: true, align: "left", valign: "middle", margin: 0,
  });
  // Subtitle, separator, items...
});
```

---

## 4. Card grid (2x2)

**When**: 4 parallel concepts of equal weight (e.g., "4 personas", "4 risk categories", "4 quadrants").

**Sketch**: 2 rows × 2 columns of cards, each with an icon/symbol + label + body.

```javascript
const items = [
  { icon: "🎯", title: "First topic", body: "Description..." },
  { icon: "💡", title: "Second topic", body: "Description..." },
  { icon: "🚀", title: "Third topic", body: "Description..." },
  { icon: "📊", title: "Fourth topic", body: "Description..." },
];

items.forEach((item, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 0.5 + col * 6.2;
  const y = 1.4 + row * 2.3;

  // Card with red left accent
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 6.0, h: 2.1,
    fill: { color: LIGHT_GREY }, line: { type: "none" },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 0.1, h: 2.1,
    fill: { color: SUN_RED }, line: { type: "none" },
  });

  // Big emoji icon (or use a symbol like ✗ for warnings, ✓ for confirmations)
  slide.addText(item.icon, {
    x: x + 0.25, y: y + 0.15, w: 0.7, h: 0.7,
    fontSize: 32, align: "left", valign: "middle", margin: 0,
  });
  // Label / category tag
  slide.addText(`Item ${i + 1}`, {
    x: x + 0.95, y: y + 0.15, w: 4.8, h: 0.4,
    fontSize: 11, fontFace: FONT_EN, color: SUN_RED,
    bold: true, align: "left", valign: "middle", margin: 0,
    charSpacing: 2,
  });
  // Title
  slide.addText(item.title, {
    x: x + 0.95, y: y + 0.5, w: 4.8, h: 0.4,
    fontSize: 16, fontFace: FONT_JP, color: TEXT_DARK,
    bold: true, align: "left", valign: "middle", margin: 0,
  });
  // Body
  slide.addText(item.body, {
    x: x + 0.25, y: y + 1.05, w: 5.5, h: 0.95,
    fontSize: 11, fontFace: FONT_JP, color: TEXT_DARK,
    align: "left", valign: "top", margin: 0,
  });
});
```

For an "anti-patterns" or "common mistakes" variant, use ✗ as the symbol and a light red tint as the card background (`FFEEEC`).

---

## 5. Process flow (horizontal)

**When**: Sequential steps (3-5 steps work best — more becomes cluttered).

**Sketch**: Boxes in a row, connected by arrows, each box numbered + brief description.

```javascript
const steps = [
  "Step one description",
  "Step two description",
  "Step three description",
  "Step four description",
  "Step five description",
];
const stepW = 2.4;
const stepGap = 0.05;
const totalW = stepW * 5 + stepGap * 4;
const startX = (13.333 - totalW) / 2;

steps.forEach((s, i) => {
  const x = startX + i * (stepW + stepGap);
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y: 4.3, w: stepW, h: 0.95,
    fill: { color: LIGHT_GREY }, line: { type: "none" },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y: 4.3, w: 0.08, h: 0.95,
    fill: { color: SUN_RED }, line: { type: "none" },
  });
  slide.addText(`${i + 1}`, {
    x: x + 0.18, y: 4.35, w: 0.4, h: 0.35,
    fontSize: 14, fontFace: FONT_EN, color: SUN_RED,
    bold: true, align: "left", valign: "middle", margin: 0,
  });
  slide.addText(s, {
    x: x + 0.2, y: 4.7, w: stepW - 0.3, h: 0.5,
    fontSize: 9, fontFace: FONT_JP, color: TEXT_DARK,
    align: "left", valign: "top", margin: 0,
  });
});
```

For a "colored journey" version where each step has a different color (e.g., raw → processed → validated → final), use a `flowSteps[i].color` field for the box fill and white text inside, with red `→` arrows between boxes.

---

## 6. Metrics table (Before / After / Δ)

**When**: Quantitative comparisons — case study results, A/B test outcomes, pre/post data.

**Sketch**: Multi-row table with metric name + Before column + After column + Delta column. The delta column uses Sun Red bold for "improved" values.

```javascript
const tableData = [
  // Header
  [
    { text: "Metric", options: { bold: true, color: "FFFFFF", fill: { color: SUN_RED }, fontSize: 13, fontFace: FONT_JP, align: "left", valign: "middle" } },
    { text: "Before", options: { bold: true, color: "FFFFFF", fill: { color: TEXT_GREY }, fontSize: 13, fontFace: FONT_JP, align: "center", valign: "middle" } },
    { text: "After", options: { bold: true, color: "FFFFFF", fill: { color: SUN_RED }, fontSize: 13, fontFace: FONT_JP, align: "center", valign: "middle" } },
    { text: "Δ", options: { bold: true, color: "FFFFFF", fill: { color: SUN_DARK_RED }, fontSize: 13, fontFace: FONT_JP, align: "center", valign: "middle" } },
  ],
  // Data rows (use placeholders if user hasn't supplied real numbers)
  [
    { text: "Metric A", options: { bold: true, fontSize: 11, fontFace: FONT_JP, valign: "middle" } },
    { text: "[X]", options: { fontSize: 12, fontFace: FONT_EN, align: "center", valign: "middle" } },
    { text: "[Y]", options: { fontSize: 12, fontFace: FONT_EN, align: "center", valign: "middle" } },
    { text: "[+%]", options: { fontSize: 12, fontFace: FONT_EN, color: SUN_RED, bold: true, align: "center", valign: "middle" } },
  ],
  // ... more rows
];

slide.addTable(tableData, {
  x: 0.5, y: 1.3, w: 12.35,
  colW: [4.85, 2.5, 2.5, 2.5],
  rowH: 0.55,
  border: { type: "solid", pt: 0.5, color: BORDER_GREY },
});
```

---

## 7. Pain / Solution split

**When**: Slides where you describe a problem first, then the solution. Particularly useful for use-case slides.

**Sketch**: Left side is a red-tinted card titled "⚠ THE PROBLEM" with bullets. Right side is a wider area with the solution details.

```javascript
// Left: Problem (red-tinted)
slide.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.3, w: 4.0, h: 4.0,
  fill: { color: "FFEEEC" }, line: { type: "none" },
});
slide.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.3, w: 0.08, h: 4.0,
  fill: { color: SUN_RED }, line: { type: "none" },
});
slide.addText("⚠  THE PROBLEM", {
  x: 0.7, y: 1.45, w: 3.8, h: 0.3,
  fontSize: 10, fontFace: FONT_EN, color: SUN_RED,
  bold: true, align: "left", valign: "middle", margin: 0,
  charSpacing: 2,
});
slide.addText([
  { text: "Pain point one description", options: { bullet: { code: "25AA" }, breakLine: true } },
  { text: "Pain point two description", options: { bullet: { code: "25AA" }, breakLine: true } },
  { text: "Pain point three description", options: { bullet: { code: "25AA" } } },
], {
  x: 0.7, y: 1.8, w: 3.7, h: 3.4,
  fontSize: 11, fontFace: FONT_JP, color: TEXT_DARK,
  align: "left", valign: "top", margin: 0,
  paraSpaceAfter: 6,
});

// Right: Solution (full width, no special background)
slide.addText("✓  OUR APPROACH", {
  x: 4.85, y: 1.3, w: 8.0, h: 0.35,
  fontSize: 11, fontFace: FONT_EN, color: SUN_RED,
  bold: true, align: "left", valign: "middle", margin: 0,
  charSpacing: 2,
});
// ... solution content (e.g., a small metrics table or numbered list)
```

---

## 8. Hero callout

**When**: A single high-impact message you want to dominate the slide. Use sparingly — once or twice in a deck max.

**Sketch**: Most of the slide is empty whitespace. A red bar runs across the bottom with a quote in white.

Or: a red-tinted callout fills 70% of the slide content area, with a single quote in large italic text.

```javascript
// Variant A: red bar at bottom
slide.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 6.0, w: 12.35, h: 0.85,
  fill: { color: SUN_RED }, line: { type: "none" },
});
slide.addText('"Your single biggest takeaway in one line."', {
  x: 0.5, y: 6.0, w: 12.35, h: 0.85,
  fontFace: FONT_JP, fontSize: 14, color: "FFFFFF",
  italic: true, bold: true, align: "center", valign: "middle", margin: 0,
});
```

For variant B (whole-slide hero), enlarge the rectangle to occupy y=2 to y=5 and add a quotation mark glyph or 💡 emoji at large scale (60-80pt) as the visual anchor.

---

## 9. Field grid

**When**: Structured metadata, project parameters, or specs (e.g., "Project name", "Customer", "Domain", "Team size").

**Sketch**: 2-column grid of small cards, each with an UPPERCASE label + a value below.

```javascript
const fields = [
  { label: "Field one", val: "[Value placeholder]" },
  { label: "Field two", val: "[Value placeholder]" },
  { label: "Field three", val: "[Value placeholder]" },
  { label: "Field four", val: "[Value placeholder]" },
  { label: "Field five", val: "[Value placeholder]" },
  { label: "Field six", val: "[Value placeholder]" },
];

const cardW = 6.0, cardH = 0.95, gapX = 0.35, gapY = 0.2;
fields.forEach((f, i) => {
  const col = i % 2, row = Math.floor(i / 2);
  const x = 0.5 + col * (cardW + gapX);
  const y = 1.4 + row * (cardH + gapY);
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w: cardW, h: cardH,
    fill: { color: LIGHT_GREY }, line: { type: "none" },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 0.08, h: cardH,
    fill: { color: SUN_RED }, line: { type: "none" },
  });
  slide.addText(f.label.toUpperCase(), {
    x: x + 0.25, y: y + 0.1, w: cardW - 0.4, h: 0.3,
    fontSize: 9, fontFace: FONT_EN, color: SUN_RED,
    bold: true, align: "left", valign: "middle", margin: 0,
    charSpacing: 2,
  });
  slide.addText(f.val, {
    x: x + 0.25, y: y + 0.4, w: cardW - 0.4, h: 0.5,
    fontSize: 13, fontFace: FONT_JP, color: TEXT_DARK,
    align: "left", valign: "middle", margin: 0,
  });
});
```

---

## 10. Question cards

**When**: Two questions framed as a checklist or screening criteria.

**Sketch**: Two large cards labeled "Q1" / "Q2" with a big red Q-number in the corner and the question + reasoning below.

```javascript
const qCards = [
  { num: "Q1", title: "First question?", body: "Reasoning and detail behind question 1." },
  { num: "Q2", title: "Second question?", body: "Reasoning and detail behind question 2." },
];

qCards.forEach((q, i) => {
  const x = 0.5 + i * 6.3;
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y: 1.6, w: 6.0, h: 3.7,
    fill: { color: LIGHT_GREY }, line: { type: "none" },
  });
  slide.addText(q.num, {
    x: x + 0.3, y: 1.75, w: 1.0, h: 0.7,
    fontSize: 36, fontFace: FONT_EN, color: SUN_RED,
    bold: true, align: "left", valign: "middle", margin: 0,
  });
  slide.addText(q.title, {
    x: x + 0.3, y: 2.5, w: 5.5, h: 1.0,
    fontSize: 14, fontFace: FONT_JP, color: TEXT_DARK,
    bold: true, align: "left", valign: "top", margin: 0,
  });
  slide.addText(q.body, {
    x: x + 0.3, y: 3.6, w: 5.5, h: 1.6,
    fontSize: 11, fontFace: FONT_JP, color: TEXT_GREY,
    align: "left", valign: "top", margin: 0,
  });
});

// Conclusion bar at the bottom
slide.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 5.6, w: 12.3, h: 1.0,
  fill: { color: SUN_RED }, line: { type: "none" },
});
slide.addText("✓  Both YES   →   Conclusion", {
  x: 0.5, y: 5.6, w: 12.3, h: 1.0,
  fontFace: FONT_JP, fontSize: 22, color: "FFFFFF",
  bold: true, align: "center", valign: "middle", margin: 0,
});
```

---

## 11. Definition slide

**When**: Defining a concept with 3 supporting points + a key message callout.

**Sketch**: Left 60% — three numbered points with circle + header + body. Right 40% — a key message callout.

This is a great "first content slide" after the cover, because it sets up a definition + the takeaway.

```javascript
// Left side — 3 numbered points (using the Numbered Points pattern, narrowed to w=6.5)
const points = [
  { header: "First supporting point", body: "Brief description." },
  { header: "Second supporting point", body: "Brief description." },
  { header: "Third supporting point", body: "Brief description." },
];
points.forEach((p, i) => {
  const y = 1.45 + i * 1.4;
  slide.addShape(pres.shapes.OVAL, {
    x: 0.7, y, w: 0.6, h: 0.6,
    fill: { color: SUN_RED }, line: { type: "none" },
  });
  slide.addText(String(i + 1), {
    x: 0.7, y, w: 0.6, h: 0.6,
    fontSize: 22, fontFace: FONT_EN, color: "FFFFFF",
    bold: true, align: "center", valign: "middle", margin: 0,
  });
  slide.addText(p.header, {
    x: 1.5, y: y - 0.05, w: 6.5, h: 0.45,
    fontSize: 17, fontFace: FONT_JP, color: TEXT_DARK,
    bold: true, align: "left", valign: "middle", margin: 0,
  });
  slide.addText(p.body, {
    x: 1.5, y: y + 0.45, w: 6.5, h: 0.85,
    fontSize: 13, fontFace: FONT_JP, color: TEXT_GREY,
    align: "left", valign: "top", margin: 0,
  });
});

// Right side — key message callout
slide.addShape(pres.shapes.RECTANGLE, {
  x: 8.6, y: 1.45, w: 4.2, h: 4.0,
  fill: { color: LIGHT_GREY }, line: { type: "none" },
});
slide.addShape(pres.shapes.RECTANGLE, {
  x: 8.6, y: 1.45, w: 0.08, h: 4.0,
  fill: { color: SUN_RED }, line: { type: "none" },
});
slide.addText("💡 KEY MESSAGE", {
  x: 8.85, y: 1.65, w: 3.8, h: 0.4,
  fontSize: 11, fontFace: FONT_EN, color: SUN_RED,
  bold: true, align: "left", valign: "middle", margin: 0,
  charSpacing: 4,
});
slide.addText('"Your one-line takeaway here."', {
  x: 8.85, y: 2.1, w: 3.8, h: 3.2,
  fontSize: 18, fontFace: FONT_JP, color: TEXT_DARK,
  italic: true, align: "left", valign: "top", margin: 0,
});
```

---

## 12. Tier ladder

**When**: Skill levels, maturity tiers, progression (e.g., "Basic / Intermediate / Advanced", or "★ / ★★ / ★★★").

**Sketch**: 3 horizontal bars stacked vertically, each darker/redder than the last, with stars + title + description on the left and "impact / who" details on the right.

```javascript
const levels = [
  { stars: "★", title: "Tier one", desc: "Description for tier one.", impact: "Impact note", who: "Audience note", color: SUN_GOLD, bgColor: "FAF5EC" },
  { stars: "★★", title: "Tier two", desc: "Description for tier two.", impact: "Impact note", who: "Audience note", color: SUN_DARK_RED, bgColor: "FFF0EE" },
  { stars: "★★★", title: "Tier three", desc: "Description for tier three.", impact: "Impact note", who: "Audience note", color: SUN_RED, bgColor: "FFEEEC" },
];

levels.forEach((lv, i) => {
  const y = 1.55 + i * 1.4;
  // Card
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y, w: 8.5, h: 1.25,
    fill: { color: lv.bgColor }, line: { type: "none" },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y, w: 0.1, h: 1.25,
    fill: { color: lv.color }, line: { type: "none" },
  });
  slide.addText(lv.stars, {
    x: 0.75, y: y + 0.1, w: 1.0, h: 0.4,
    fontSize: 18, fontFace: FONT_EN, color: lv.color,
    bold: true, align: "left", valign: "middle", margin: 0,
  });
  slide.addText(lv.title, {
    x: 1.65, y: y + 0.1, w: 7.0, h: 0.4,
    fontSize: 18, fontFace: FONT_JP, color: lv.color,
    bold: true, align: "left", valign: "middle", margin: 0,
  });
  slide.addText(lv.desc, {
    x: 0.75, y: y + 0.55, w: 8.0, h: 0.7,
    fontSize: 11, fontFace: FONT_JP, color: TEXT_DARK,
    align: "left", valign: "top", margin: 0,
  });
  // Right-side impact + who labels
  slide.addText("IMPACT", {
    x: 9.2, y: y + 0.1, w: 3.6, h: 0.25,
    fontSize: 8, fontFace: FONT_EN, color: TEXT_GREY,
    bold: true, align: "left", valign: "middle", margin: 0,
    charSpacing: 2,
  });
  slide.addText(lv.impact, {
    x: 9.2, y: y + 0.32, w: 3.6, h: 0.4,
    fontSize: 10, fontFace: FONT_JP, color: TEXT_DARK,
    align: "left", valign: "top", margin: 0,
  });
  // ... and similar for "WHO"
});
```

---

## Picking layouts: a heuristic

If your content is...

| Content shape | Try layout |
|--------------|------------|
| 3-5 sequential or enumerated points | Numbered points (#1) or process flow (#5) |
| 2 things compared in detail | Comparison columns 2 (#2) |
| 3 things on a spectrum | Comparison columns 3 (#3) |
| 4 parallel items of equal weight | Card grid 2×2 (#4) |
| Sequential steps | Process flow (#5) |
| Pre/post numbers | Metrics table (#6) |
| Problem → solution slide | Pain/Solution split (#7) |
| One huge takeaway | Hero callout (#8) |
| Project parameters / metadata | Field grid (#9) |
| 2 framed questions | Question cards (#10) |
| Definition + key message | Definition slide (#11) |
| Levels / progression | Tier ladder (#12) |

When picking layouts across consecutive slides, **vary the choice** — don't run three "numbered points" slides in a row. The variety is what makes a deck feel polished.
