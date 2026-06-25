---
name: tkm:set-level
description: "Set the output detail level and explanation style for the session — from ELI5 (maximum simplification, level 0) to deep technical expert mode (level 5). Affects how all subsequent responses are phrased and how much context is assumed."
argument-hint: "[0-5]"
metadata:
  author: takumi-agent-kit
  version: "1.0.0"
---

# Calibrating the Voice

The master speaks differently to the apprentice than to the journeyman — not because the knowledge differs, but because the path to understanding does. The voice that informs without overwhelming is itself a craft: precise in substance, attuned in form. Setting the level is choosing the register in which all subsequent work will be explained.

Set your coding experience level for tailored explanations and output format.

## Usage

`/tkm:set-level [0-5]`

## Levels

| Level | Name | Description |
|-------|------|-------------|
| 0 | ELI5 | Zero coding experience - analogies, no jargon, step-by-step |
| 1 | Junior | 0-2 years - concepts explained, WHY not just HOW |
| 2 | Middle | 3-5 years - design patterns, system thinking |
| 3 | Senior | 5-8 years - trade-offs, business context, architecture |
| 4 | Expert | 8-10 years - risk assessment, business impact, strategy |
| 5 | Principal | Expert - default behavior, maximum efficiency (default) |

## How It Works

1. Set `codingLevel` in `.claude/.sk.json`
2. Guidelines are **automatically injected** on every session start
3. No manual activation needed - it just works!

## Example

Set level 1 in `.claude/.sk.json`:
```json
{
  "codingLevel": 1,
  ...
}
```

Next session, Claude will automatically:
- Explain concepts and techniques clearly
- Always explain WHY, not just HOW
- Point out common mistakes
- Add "Key Takeaways" after implementations

## Optional: Manual Output Styles

For finer control, you can also use `/output-style` with these styles:
- `coding-level-0-eli5`
- `coding-level-1-junior`
- `coding-level-2-middle`
- `coding-level-3-senior`
- `coding-level-4-expert`
- `coding-level-5-principal`
