---
name: sungen-capture-figma
description: 'Fetch design context + PNG from a Figma frame URL via Figma Dev Mode MCP. Auto-loaded by create-test when user picks Figma as the visual source.'
user-invocable: false
---

## Purpose

Pull **structured design data** (layout, typography, colors, component tree, design tokens) and a **PNG screenshot** from a Figma frame URL, so `sungen-tc-generation` can author Gherkin + test-data before a live domain exists.

Use this when the project is pre-launch, or when Figma is the source of truth and the live build lags the design.

---

## Prerequisites

- **Figma MCP server** (`https://mcp.figma.com/mcp`, HTTP transport) connected in `.vscode/mcp.json` — `sungen init` scaffolds this automatically. On first use, VS Code / Copilot opens a browser for Figma OAuth. Official tools: `get_design_context`, `get_variable_defs`, `get_screenshot`.
- Figma account signed in with access to the file. **Dev/Full seats** get per-minute rate limits; **Starter/View seats** get monthly tool-call limits.
- A Figma URL with both **fileKey** and **nodeId** in it.

If the MCP is not connected, **do not fail silently** — tell the user:
> "Figma MCP not detected. Run `sungen init` to scaffold the config, or manually add `figma` with `url: https://mcp.figma.com/mcp` to `.vscode/mcp.json`. Then sign in when VS Code prompts."

Then stop.

---

## Steps

### 1. Resolve Figma URL

Prefer in this order:

1. `Figma URL` field in `qa/screens/<screen>/requirements/spec.md` (Overview section)
2. If empty or missing → ask the user: *"Paste the Figma frame URL"*

Accept any of these URL shapes:

```
https://www.figma.com/file/<fileKey>/<title>?node-id=<nodeId>
https://www.figma.com/design/<fileKey>/<title>?node-id=<nodeId>
https://www.figma.com/proto/<fileKey>/<title>?node-id=<nodeId>
```

Parse:
- `fileKey` = the segment after `/file/`, `/design/`, or `/proto/`
- `nodeId` = the `node-id` query param (may use `-` or `:` — pass through as-is; MCP accepts both)

If `node-id` is missing, ask the user to select a frame in Figma and copy the **frame URL** specifically (not the file root URL).

### 2. Fetch design context

Call **both** in parallel:

```
get_design_context({ fileKey, nodeId })
get_variable_defs({ fileKey, nodeId })
```

`get_design_context` returns layout, typography, color values, component structure, spacing.
`get_variable_defs` returns named design tokens (color/spacing/typography variables).

### 3. Fetch screenshot

```
get_screenshot({ fileKey, nodeId })
```

Save the returned PNG to:

```
qa/screens/<screen>/requirements/ui/figma-<sanitized-nodeId>.png
```

Sanitize `nodeId` for filesystem: replace `:` and `-` with `_`. Example: `42-15` → `figma-42_15.png`.

### 4. Write metadata dump

Combine the design context + variables into a Markdown summary at:

```
qa/screens/<screen>/requirements/ui/figma-meta.md
```

Format:

```markdown
# Figma Capture — <nodeId>

**Source:** <full Figma URL>
**Captured:** <ISO date>

## Components
<hierarchical list of component names + variants from get_design_context>

## Typography
<font families, sizes, weights, line heights>

## Colors
<color tokens + raw hex values>

## Spacing & Layout
<spacing tokens, auto-layout specs>

## Text Content
<visible text strings from the frame — used by tc-generation to populate test-data>
```

This file is consumed by `sungen-tc-generation` as a secondary source alongside `spec.md`.

### 5. Report back

Output a short summary to the user:

> Captured Figma frame `<nodeId>`:
> - Components: N
> - Text strings: M
> - Design tokens: K
> - Screenshot: `qa/screens/<screen>/requirements/ui/figma-<nodeId>.png`
> - Metadata: `requirements/ui/figma-meta.md`

Then hand back to the calling command.

---

## Error handling

| Error | Action |
|---|---|
| MCP tool not available | Print setup instructions, stop, do not fall back silently |
| `fileKey` missing from URL | Ask user to paste a valid frame URL |
| `nodeId` missing from URL | Ask user to right-click a frame in Figma → *Copy link to selection* |
| `get_design_context` 403 | Ask user to check Dev Mode seat on that file |
| `get_screenshot` returns no image | Continue with metadata only; warn user no PNG was captured |

---

## What this skill does NOT do

- Does not generate Gherkin (that's `sungen-tc-generation`)
- Does not write `selectors.yaml` (that's `/sungen-run-test`)
- Does not validate the design against live UI (future skill: `sungen-capture-live` can be run afterwards for cross-check)
