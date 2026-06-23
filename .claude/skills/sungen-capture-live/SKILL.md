---
name: sungen-capture-live
description: 'Capture a live running page via Playwright MCP — snapshot + screenshot for visual context. Auto-loaded by create-test when user picks Live page scan.'
user-invocable: false
---

## Purpose

Navigate a running application, take **one accessibility snapshot** and **one screenshot**, and save them as visual context for test generation. Use when the app is live (dev, staging, or production with read-only access) and you want the tests grounded in the actual rendered UI.

This skill handles auth gracefully: if the page redirects to login, it asks the user to sign in manually rather than injecting cookies.

---

## Prerequisites

- Playwright MCP connected.
- Dev/staging server reachable (or a public URL).
- `playwright.config.ts` exists at the project root (for `baseURL` fallback).

---

## Steps

### 1. Resolve target URL

Resolve in this order:

1. `Live URL` field in `qa/screens/<screen>/requirements/spec.md` (Overview section)
2. `baseURL` from `playwright.config.ts` + `URL Path` from `spec.md`
3. If neither works → `AskUserQuestion`: *"Paste the full URL for the page to scan"*

### 2. Navigate

`browser_navigate` to the resolved URL.

### 3. Handle auth redirect

If the page redirects to a login route (URL contains `/login`, `/signin`, `/auth`, or the page title/content indicates a login screen):

1. Tell the user which login URL they landed on.
2. `AskUserQuestion`:
   - **I'll log in manually** — wait for user confirmation, then re-navigate to the target URL
   - **Skip live scan** — tell caller to invoke `sungen-capture-local` instead
   - **Cancel**
3. **Never** inject cookies or localStorage via `browser_evaluate` or `browser_run_code`. Auth belongs to the user.

### 4. Snapshot

Take **ONE** `browser_snapshot`. This accessibility tree is the primary AI context — it contains roles, names, text, and structure that the tc-generation skill uses to identify sections and fields.

### 5. Screenshot (optional but recommended)

Take **ONE** `browser_take_screenshot` with `fullPage: true`. Save to:

```
qa/screens/<screen>/requirements/ui/live-<timestamp>.png
```

Where `<timestamp>` is `YYYYMMDD-HHMM` in local time (e.g. `live-20260421-1430.png`).

This gives users a visual record they can reference later without re-scanning.

### 6a. Verify unauthenticated redirect target (flow capture only)

When capturing for a **flow** that includes security scenarios (e.g., "unauthenticated user cannot access X"):

1. Open a **fresh incognito/unauthenticated** browser context (no storage state).
2. `browser_navigate` to the protected route (e.g., `/dashboard`).
3. Record the **actual redirect URL** — do NOT assume it goes to `/login`. The app may redirect to `/register`, `/`, or any other route.
4. Report the redirect target to the caller: *"Unauthenticated access to `/dashboard` redirects to `/register`"*.
5. The caller must use the **actual redirect URL** in Gherkin assertions (e.g., `Then User is on [Register] page`), never an assumed one.

Skip this step if the flow has no security scenarios or the user explicitly says to skip.

### 6. Detect discrepancies vs spec

If `spec.md` exists, briefly cross-check the snapshot against spec sections:

- Fields listed in spec but not in snapshot → flag as *missing in UI*
- Elements visible in snapshot but not in spec → flag as *missing in spec*

Report findings but **do not** auto-edit `spec.md` — let the user decide.

### 7. Report back

> Captured live page `<URL>`:
> - Snapshot: <N> interactive elements detected
> - Screenshot: `requirements/ui/live-<timestamp>.png`
> - Discrepancies vs spec: <count, or "none">

Hand back to the calling command.

---

## What this skill does NOT do

- Does not run tests
- Does not generate `selectors.yaml` (that's `/sungen:run-test`)
- Does not inject auth state (user logs in manually)
- Does not crawl — scans **exactly one** page per invocation
- Does not generate Gherkin — that's `sungen-tc-generation`

---

## Relationship to other capture skills

- `sungen-capture-figma` — design source of truth (pre-launch)
- `sungen-capture-local` — any image the user dropped in `requirements/ui/`
- `sungen-capture-live` — this skill, verifies/supplements against the running app

All three write to `requirements/ui/` and report back to the caller. They are mutually exclusive per create-test run, but a user can run create-test multiple times with different sources to layer context.
