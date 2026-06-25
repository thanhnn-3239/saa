---
name: tkm:draw-diagram
description: Sketch the structure before explaining it — Mermaid.js v11 diagrams. Use for flowcharts, sequence diagrams, class diagrams, ER diagrams, Gantt charts, state diagrams, architecture diagrams, timelines, user journeys.
argument-hint: "[diagram-type or description]"
metadata:
  author: takumi-agent-kit
  version: "1.0.0"
---

# The Draftsman

Before the structure is built, it is drawn.
The draftsman translates structure — data flows, state machines, call sequences, entity relationships — into clear visual form that others can read without ambiguity.
A good diagram is not a decoration. It is a specification drawn accurately enough to build from.

Mermaid.js v11: text-based diagrams rendered to SVG/PNG/PDF or inline in browsers and markdown.

## Quick Start

**Basic Diagram Structure:**
```
{diagram-type}
  {diagram-content}
```

**Common Diagram Types:**
- `flowchart` - Process flows, decision trees
- `sequenceDiagram` - Actor interactions, API flows
- `classDiagram` - OOP structures, data models
- `stateDiagram` - State machines, workflows
- `erDiagram` - Database relationships
- `gantt` - Project timelines
- `journey` - User experience flows

See `references/diagram-types.md` for all 24+ types with syntax.

## Creating Diagrams

**Inline Markdown Code Blocks:**
````markdown
```mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action]
    B -->|No| D[End]
```
````

**Configuration via Frontmatter:**
````markdown
```mermaid
---
theme: dark
---
flowchart LR
    A --> B
```
````

**Comments:** Use `%% ` prefix for single-line comments.

## CLI Usage

Convert `.mmd` files to images:
```bash
# Installation
npm install -g @mermaid-js/mermaid-cli

# Basic conversion
mmdc -i diagram.mmd -o diagram.svg

# With theme and background
mmdc -i input.mmd -o output.png -t dark -b transparent

# Custom styling
mmdc -i diagram.mmd --cssFile style.css -o output.svg
```

See `references/cli-usage.md` for Docker, batch processing, and advanced workflows.

## JavaScript Integration

**HTML Embedding:**
```html
<pre class="mermaid">
  flowchart TD
    A[Client] --> B[Server]
</pre>
<script src="https://cdn.jsdelivr.net/npm/mermaid@latest/dist/mermaid.min.js"></script>
<script>mermaid.initialize({ startOnLoad: true });</script>
```

See `references/integration.md` for Node.js API and advanced integration patterns.

## Configuration & Theming

**Common Options:**
- `theme`: "default", "dark", "forest", "neutral", "base"
- `look`: "classic", "handDrawn"
- `fontFamily`: Custom font specification
- `securityLevel`: "strict", "loose", "antiscript"

See `references/configuration.md` for complete config options, theming, and customization.

## Practical Patterns

Load `references/examples.md` for:
- Architecture diagrams
- API documentation flows
- Database schemas
- Project timelines
- State machines
- User journey maps

## Resources

- `references/diagram-types.md` - Syntax for all 24+ diagram types
- `references/configuration.md` - Config, theming, accessibility
- `references/cli-usage.md` - CLI commands and workflows
- `references/integration.md` - JavaScript API and embedding
- `references/examples.md` - Practical patterns and use cases
