# Docs Canonical Mapping (kit-internal reference)

Single source of truth for which skill owns which doc topic. Loaded by `rebuild-spec`, `takumi`, `manage-docs`, and `doc-writer`. Update this file FIRST when changing layered-doc behavior — drift here counts as a breaking change (major version bump for every consumer).

## Layered Model

`docs/` is **human-maintained** narrative documentation (managed by `manage-docs`). `docs/specs/` is **machine-generated** structured specs (managed by `rebuild-spec`, Wave 9 promotion). Both layers coexist in the same project; they MUST NOT contain duplicate authoritative content for the same topic. When two skills both have a claim, the canonical home below wins; the loser emits a redirect stub or a link.

## Canonical Mapping

| Topic | Canonical path | Owner skill | Stub / link |
|---|---|---|---|
| System overview / arch narrative | `docs/system-architecture.md` | manage-docs | `docs/specs/system-overview.md` → redirect stub |
| Data model / ER diagram | `docs/specs/data-model.md` | rebuild-spec | `docs/system-architecture.md` links here |
| Routes / API endpoints | `docs/specs/route-list.md` | rebuild-spec | `docs/system-architecture.md` links here |
| Screens / UI inventory | `docs/specs/screen-list.md` | rebuild-spec | — |
| Screen flow / navigation | `docs/specs/screen-flow.md` | rebuild-spec | — |
| Background logic / jobs | `docs/specs/background-logic.md` | rebuild-spec | `docs/system-architecture.md` links here |
| Permissions / RBAC | `docs/specs/permissions.md` | rebuild-spec | `docs/system-architecture.md` links here |
| User stories | `docs/specs/user-stories.md` | rebuild-spec | — |
| Feature catalog | `docs/specs/feature-list.md` | rebuild-spec | `docs/project-overview-pdr.md` links here |
| Per-feature spec | `docs/specs/features/F###_Name/spec.md` | rebuild-spec | — |
| Roadmap | `docs/project-roadmap.md` | manage-docs | — |
| Code standards | `docs/code-standards.md` | manage-docs | — |
| Deployment | `docs/deployment-guide.md` | manage-docs | — |
| Design guidelines | `docs/design-guidelines.md` | manage-docs | — |
| Codebase summary | `docs/codebase-summary.md` | manage-docs | — |

(15 rows — matches R1 §3 row count.)

## Stub Rule

Exactly **one** redirect stub exists in this model: `docs/specs/system-overview.md`. It is overwritten unconditionally by `rebuild-spec` Wave 9 with the literal below (≤200 chars). Other artifacts get full content; manage-docs files are never stubbed.

**Stub literal (183 chars):**

> Canonical system architecture lives at [docs/system-architecture.md](../system-architecture.md). Spec-layer redirect; full draft kept at plans/<active>/artifacts/system-overview.md.

Recovery: prior full content is preserved in `plans/<active>/artifacts/system-overview.md` and in git history.

## Surgical-Edit Rule

When `doc-writer` is invoked via `tkm:takumi` Step 6 (NOT via `rebuild-spec` Wave 9), edits to `docs/specs/*.md` MUST be surgical:

- MAY: add / remove / edit rows in inventory tables (route-list, screen-list, data-model entity tables, permissions, background-logic, user-stories, feature-list); update counts ("Total routes: N"); copy adjacent-row schema when inserting new entries.
- MUST NOT: rewrite section headings, change document structure, edit schema codes (FR/BR/SM/ALG/INT/SC/F/US/SCR/REG/BL/PERM), modify `## Spec Documents` checklists in feature specs, or touch the `docs/specs/system-overview.md` stub.
- MUST NOT: create new per-feature spec files. If a new F### is detected → advise `Run /tkm:rebuild-spec --features F###`.

Wave 9 promotion (full-content writes) is a separate path and bypasses this rule.

## Escalation Heuristic

If a single artifact has **more than 3 changed source files** affecting it in one takumi session, `doc-writer` SKIPS the edit and appends a non-blocking advisory to its output:

```
Run /tkm:rebuild-spec --artifact <NAME>
```

User decides whether to regenerate. Edits to other artifacts in the same session proceed normally.

## Absent-Layer Advisory

When the spec/doc layer that `doc-writer` would surgically edit is **missing** AND the session changed `≥ 2` feature-surface files, `tkm:takumi` Step 6.a and `tkm:manage-docs update` Phase 2.a emit a 2-line `ℹ` advisory on **stderr only**. Two mutually-exclusive layers:

| Condition | Advisory points to |
|---|---|
| `! -d docs` AND `TRIGGER_HITS ≥ 2` | `/tkm:manage-docs init` |
| `-d docs` AND `SPECS_PRESENT == 0` AND `TRIGGER_HITS ≥ 2` | `/tkm:rebuild-spec` |
| `SPECS_PRESENT > 0` (Variant B) | *(no advisory — surgical edit proceeds)* |

**Contract:**

- Stderr only (`1>&2`); does NOT mutate the `doc-writer` prompt; does NOT block flow (fires in `--auto` mode too).
- Mutually exclusive by control flow (`if … elif …`) — `docs/` absent suppresses the specs advisory because `docs/specs/` cannot exist without its parent.
- `TRIGGER_HITS` counts session-changed files matching the trigger-pattern set **after** stripping test/mock/fixture paths (`tests/`, `__tests__/`, `mocks/`, `fixtures/`, `*.test.*`, `*.spec.*`). Pure-test sessions stay silent.
- Trigger patterns are an inline mirror of `subagent-patterns.md` → `## Documentation` → Trigger Mapping. Update both when adding patterns.

**Version policy:** adding/removing/relaxing this advisory is **patch** (additive console output, no contract change). The surgical-edit contract above and the canonical mapping table remain the breaking-change surface.

## Version Policy

This file is the contract. Any change to the mapping table, stub rule, surgical-edit rule, or escalation heuristic is **breaking** and bumps the major version of every consumer.

PR `2026-05-11` (this revision) bumps:

| Skill / agent | From | To |
|---|---|---|
| `rebuild-spec` | 2.9.1 | 3.0.0 |
| `takumi` | 2.1.1 | 3.0.0 |
| `manage-docs` | 1.0.0 | 2.0.0 |
| `doc-writer` (agent) | n/a (unversioned) | tagged "v3.0.0+" section |

Consumers: link this file from `## References` in each owner's SKILL.md / agent.md. Do NOT duplicate the table — link only.
