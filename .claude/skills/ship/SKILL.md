---
name: tkm:ship
description: "Release the finished piece — merge main, run tests, review, commit, push, open PR. One command carries the work from feature branch to PR URL. Use when a feature is complete and ready to merge into main."
argument-hint: "[official|beta] [--skip-tests] [--skip-review] [--skip-journal] [--skip-docs] [--dry-run]"
license: MIT
metadata:
  author: takumi-agent-kit
  version: "2.0.0"
---

# Ship: The Final Act of Craft

A piece leaves the workshop only when it has survived every stage.
Ship is the craftsman's final walk-through before the work meets the world.

Single command to ship a feature branch. Fully automated — only stops for test failures, critical inspection issues, or major version decisions.

**Inspired by:** gstack `/ship` by Garry Tan. Adapted for framework-agnostic, multi-language support.

## Arguments

| Flag | Effect |
|------|--------|
| `official` | Ship to default branch (main/master). Full pipeline with docs + journal |
| `beta` | Ship to dev/beta branch. Lighter pipeline, skip docs update |
| (none) | Auto-detect: if base branch is main/master → official, else → beta |
| `--skip-tests` | Skip tempering step (use when tests already passed) |
| `--skip-review` | Skip pre-landing inspection step |
| `--skip-journal` | Skip session record step |
| `--skip-docs` | Skip docs update step |
| `--dry-run` | Show what would happen without executing |

## Ship Mode Detection

```
If argument = "official" → target = main/master (auto-detect default branch)
If argument = "beta"     → target = dev/beta (auto-detect dev branch)
If no argument           → infer from current branch naming:
  - feature/* hotfix/* bugfix/* → official (target main)
  - dev/* beta/* experiment/*  → beta (target dev/beta)
  - unclear                    → AskUserQuestion
```

## When to Stop (blocking)

- On target branch already → abort
- Merge conflicts that can't be auto-resolved → stop, show conflicts
- Test failures → stop, show failures
- Critical inspection issues → AskUserQuestion per issue
- Major/minor version bump needed → AskUserQuestion

## When NOT to Stop

- Uncommitted changes → always include them
- Patch version bump → auto-decide
- Changelog content → auto-generate
- Commit message → auto-compose
- No version file → skip version step silently
- No changelog → skip changelog step silently

## Pipeline

```
Step 1:  Pre-flight      → Branch check, mode detection, status, diff analysis
Step 2:  Link Issues      → Find/create related GitHub issues
Step 3:  Merge target     → Fetch + merge origin/<target-branch>
Step 4:  Temper           → Auto-detect test runner, run, check results
Step 5:  Inspect          → Two-pass checklist review (critical + informational)
Step 6:  Version bump     → Auto-detect version file, bump patch/minor
Step 7:  Changelog        → Auto-generate from commits + diff
Step 8:  Record           → Write technical journal via /tkm:write-journal
Step 9:  Docs update      → Update project docs via /tkm:manage-docs update (official only)
Step 10: Commit           → Conventional commit with version/changelog
Step 11: Push             → git push -u origin <branch>
Step 12: Create PR        → gh pr create with structured body + linked issues
```

**Detailed steps:** Load `references/ship-workflow.md`
**Auto-detection:** Load `references/auto-detect.md`
**PR template:** Load `references/pr-template.md`

## Token Efficiency Rules

- Steps 4 (temper) and 5 (inspect): delegate to `tester` and `reviewer` subagents — don't inline
- Steps 8 (record) and 9 (docs): run in **background** — don't block pipeline
- Step 2 (issues): use single `gh` command batch — avoid multiple API calls
- Skip steps early via flags to save tokens on unnecessary work
- Beta mode auto-skips: docs update (Step 9)
- Capture step outputs inline — don't re-read files already in context

## Quick Start

User says `/tkm:ship` → run full pipeline → output PR URL.
User says `/tkm:ship beta` → ship to dev branch with lighter pipeline.
User says `/tkm:ship official` → ship to main with full docs + journal.

## Output Format

```
✓ Pre-flight: branch feature/foo, 5 commits, +200/-50 lines (mode: official)
✓ Issues: linked #42, created #43
✓ Merged: origin/main (up to date)
✓ Tempered: 42 passed, 0 failed
✓ Inspected: 0 critical, 2 informational
✓ Version: 1.2.3 → 1.2.4
✓ Changelog: updated
✓ Recorded: session journal written (background)
✓ Docs: updated (background)
✓ Committed: feat(auth): add OAuth2 login flow
✓ Pushed: origin/feature/foo
✓ PR: https://github.com/org/repo/pull/123 (linked: #42, #43)
```

## Important Rules

- **Never skip tempering** (unless `--skip-tests`). If tests fail, stop.
- **Never force push.** Regular `git push` only.
- **Never ask for confirmation** except for critical inspection issues and major/minor version bumps.
- **Auto-detect everything.** Test runner, version file, changelog format, target branch — detect from project files.
- **Framework-agnostic.** Works for Node, Python, Rust, Go, Ruby, Java, or any project with a test command.
- **Subagent delegation.** Use `tester` for tempering, `reviewer` for inspection, `journal-writer` for session record, `doc-writer` for docs. Don't inline.
- **Background tasks.** Session record and docs run in background to not block the pipeline.
