# 2026-06-10 — Takumi: Kudos UI Fidelity (4 screens, plan 260610-1011)

Branch `feat/sun-kudos-live-board` · commit `460bec3` · status: committed (not pushed).

## What shipped

Four UI-fidelity phases against Figma mockups: search inputs, filter dropdown, cards (unified base), sidebar stats. All visual gaps closed; 460 lines in /sun-kudos/_components/; 341/341 tests passing; pnpm build clean (Next 16, TS zero errors).

1. **Search inputs** (banner.tsx, spotlight-cloud.tsx): Removed WebKit native search `✕` via `[&::-webkit-search-cancel-button]:appearance-none` arbitrary variant; preserved `type="search"` + custom clear button. The double-✕ that haunted the last mockup was the conflict between both — solved by hiding the native one.

2. **Filter dropdown** (filter-dropdown.tsx): Trigger restyled to a single rounded-[4px] gold-glass pill. Trigger text now displays the selected option label; when nothing selected, falls back to the category name (selecting "All" maps to `null` → uses category as display fallback). Removed external "Category:" label span. Keyboard a11y + listbox panel untouched.

3. **Cards unified** (NEW lib/kudos/ui/kudo-card-base.tsx + thin wrappers for highlight-card.tsx & kudo-post-card.tsx): Two near-identical cards folded into one base component with variant props (showImages, showViewDetail, bodyClamp, maxHashtags, active). Body content moved into gold-glass box (border `saa-gold-accent`, bg `rgba(255,234,158,0.40)`, rounded-[12px]); timestamp moved below divider. Preserved carousel active/inactive scaling, anonymous handling, heart/copy event wiring. Closed test gap with 7 new unit tests.

4. **Sidebar stats** (sidebar-stats.tsx): Added flame "x2" badge to hearts row; moved gift icon after button text + filled state.

## Deliberately deferred (YAGNI call)

- Omitted "IDOL GIỎI TRẺ" card title display (no `kudos.title` or category column in data schema yet — deferred pending schema review).
- Did NOT add `showEdit` prop to cards (would render nothing without edit endpoint; violated YAGNI).

## The hard part — adjudicating reviewer feedback against actual token values

Reviewer scored 8/10 (0 critical/major, 3 minor). All three minors were examined and rejected as non-actionable:

1. **Text color on card body**: Suggested swap `text-gray-500` → `text-saa-text-muted`. Rejected — `saa-text-muted` is white@45% opacity, which on the cream gold-glass body background (rgba(255,234,158,0.40)) would render near-invisible. The original gray was correct and copied verbatim from pre-existing card code. Lesson: never blindly apply "convention fixes" without checking token values against the component's background. A token swap can break contrast.

2. **Timezone display**: Verbatim pre-existing behavior, out of scope for fidelity task.

3. **Image placeholder**: Verbatim pre-existing behavior, out of scope for fidelity task.

The frustrating part was that the reviewer's suggestions sounded authoritative (swap to the "standard" token) but lacked context about the actual visual stack. Had to push back and verify the CSS math rather than trust the suggestion. Future lesson: in code review, always provide context — "use this token because it's the convention" is weaker than "on this background, this token ensures WCAG AA contrast."

## Process notes

- Scoped the commit tightly: only the 17 fidelity files, leaving untracked _components/ dir, lib/kudos/* logic, and app/api/ (in-progress feature work, some with pre-existing lint noise). User explicitly chose "fidelity files only" to avoid tangling unrelated PRs.

- Amended commit to strip AI Co-Authored-By trailer (project rule: no AI references in commit messages) and fix wording inaccuracies in the initial message. Git amend felt safe here because the pre-commit hook had already validated the changes.

- Deliberately ran all verification gates: `pnpm build`, `pnpm test` (341 passing), lint (zero errors in modified files), and visual spot-checks against mockups.

## What worked well

- Unified card base reduced duplication and made variant logic explicit (easier to maintain than two copies).
- The Figma-to-code discipline (no invented mock data, pull layout + spacing directly from design) kept implementation tight and aligned.
- Test-first on the new base file caught a prop-wiring edge case before it shipped.

## Deferred (follow-up issues)

- Data schema for `kudos.title` / category column (blocks the "IDOL GIỎI TRẺ" title display).
- Edit endpoint + `showEdit` prop (YAGNI deferred; implement when endpoint exists).
- Remaining lint warnings in untracked lib/kudos/* files (13 pre-existing errors, not from this task — out of scope per user direction).

---

**Status:** DONE
**Summary:** Shipped 4 UI-fidelity screens with gold-glass refinements and unified card base; all gaps closed; adjudicated reviewer feedback against actual token/background values rather than blindly applying suggestions.
