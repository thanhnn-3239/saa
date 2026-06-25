# 260611 — Blueprint: Viết Kudo Send-Dialog Modal (5-phase plan, 260611-1346)

Plan: `plans/260611-1346-viet-kudo-send-dialog/` · MoMorph screenId `ihQ26W78P2`, fileKey `9ypp4enmFmdK3YAFJLIu6C` · 26 specs + 57 test cases · status: blueprint locked, ready for takumi implementation.

## What happened

Planned implementation for the "Viết Kudo" send-dialog modal (the `onOpenSendDialog` stub from 260606 live-board plan + the open "card title" gap from 260610 fidelity work). Planner subagent systematized the design → specs → test cases, caught a critical spec-vs-design divergence, clarified 4 decisions with user, and locked a parallel-runnable 5-phase blueprint.

## The discovery that changed scope

**Design contains a field missing from all specs and DB schema.** The Figma frame shows a required "Danh hiệu" (title) input field above the kudo message. Zero specs mention it. Zero test cases cover it. The DB schema has no `kudos.title` column.

Caught by cross-referencing the frame image against the specs CSV. This is exactly the kind of gap that would have shipped as a broken feature if specs were trusted blindly. Honest call: design is authoritative here (user approved); specs were incomplete.

## Four clarifications locked

1. **Implement title + add kudos.title column** — yes, honor the design. New NOT NULL VARCHAR(100) in migration.
2. **Tiptap HTML editor for body** — store sanitized HTML in kudos.body (not markdown or plaintext). TipTap client validates server-side via DOMPurify.
3. **Anonymous alias field** — add nullable `kudos.anonymous_name` VARCHAR(50) + client-side input to override sender display name.
4. **Hashtags picker** — existing-only (no create-new flow), query saa_tags table, multi-select listbox.

All decisions in `clarifications.md`. No re-asks needed for implementation.

## Plan shape: parallel-runnable two-track

**Track A (UI, background subagents)**
- Phase A1: Send-dialog UI from design (Figma content as mock data, ≤30 lines per MoMorph rule)

**Track B (Backend + integration, orchestrator)**
- Phase B1: DB migration (add kudos.title, kudos.anonymous_name)
- Phase B2: Data layer (hydrate.ts extend KudoCard interface, build queries)
- Phase C1: Integration (wire form to create_kudo RPC + image upload, error handling)
- Phase C2: Tests (end-to-end + edge cases)

Tracks are parallel-runnable. No phase blocks another until integration (C1).

## Key verified facts that shaped the blueprint

- **KudoCard.title already dormant** — declared in types.ts, rendered in kudo-card-base.tsx. Just needs real data from column.
- **Board feed reads columns directly** — not views. Uses lib/kudos/queries.ts buildKudoSelect. Migration needs no view edits; column additions live in select builders + hydrate.ts.
- **searchSunners exists but needs excludeUserId param** — used for the "who are you sending to" autocomplete.
- **create_kudo RPC needs extended signature** — currently only handles message + images; must accept title + anonymous_name.

## Friction points & craft notes

- **RPC vs API route**: Unresolved — is create mutation client-side RPC call or API route? Planner deferred to implementer (affects error boundaries + retry logic).
- **Orphaned image cleanup**: If RPC fails after upload, who cleans up dangling images? No policy defined. Task for implementation phase.
- **Task tools unavailable in VSCode extension**: .claude/scripts/set-active-plan.cjs does not exist in this project (skill references it); plan discoverable by naming convention alone. Task hydration skipped — blueprint files are source of truth.

## What worked

Planner caught the spec-vs-design divergence before code started. Cross-referencing frame image against specs CSV is a discipline worth keeping. Two-track shape (UI agents parallel to backend planning + implementation) unblocks faster shipping.

---

**Status:** DONE
**Summary:** Locked 5-phase blueprint for send-dialog modal after discovering design-vs-specs divergence (missing title field) and clarifying 4 core decisions; tracks parallel-runnable, ready for takumi execution.
