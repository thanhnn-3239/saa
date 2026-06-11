# Sungen pilot — evaluation & integration notes

[`@sun-asterisk/sungen`](https://www.npmjs.com/package/@sun-asterisk/sungen)
(v2.6.15, MIT, by Sun\* engineer-excellence) is a **deterministic E2E test
compiler**: AI writes three human-readable input files — Gherkin `.feature`,
`selectors.yaml`, `test-data.yaml` — and `sungen generate` compiles them into
Playwright `.spec.ts`. No AI runs during compilation, so the same inputs always
produce the same tests.

This pilot wired it into the repo and proved the full pipeline end-to-end on the
**login screen**. Status: **working, 4/4 compiled tests green against the real
app**, coexisting with the existing hand-written `e2e/` suite (13/13 total).

## What was set up

```bash
pnpm add -D yaml @sun-asterisk/sungen        # pnpm-aware (init's npm install is skipped)
pnpm exec sungen init --base-url http://localhost:3000
```

`init` skipped every existing file (`playwright.config.ts`, `tsconfig.json`,
`README.md`, `CLAUDE.md`) and added:

| Path | Tracked? | Notes |
|---|---|---|
| `qa/screens/<name>/` | ✅ | Gherkin + selectors + test-data + requirements (the source) |
| `specs/generated/` | ✅ | Compiled `.spec.ts` + `base.ts`/`test-data.ts`/`locale-fixture.ts` runtime |
| `.github/prompts/`, `.github/skills/`, `.github/copilot-instructions.md` | ✅ | Copilot AI rules (25 files) |
| `.claude/commands/sungen/`, `.claude/skills/sungen-*/` | ❌ gitignored | Claude Code rules — `.gitignore` has `/.claude/*`, so these are **local-only** |
| `.mcp.json`, `.vscode/mcp.json`, `.vscode/settings.json` | ✅ | MCP servers (playwright + figma) + Copilot auto-approve |

### Manual reconciliation applied

- **`playwright.config.ts`** — added a `sungen` project (`testDir: specs/generated`)
  that reuses the existing `webServer` + `baseURL`. The hand-written suite stays
  in `e2e/` (project `chromium`); the two never overlap.
- **`package.json`** — replaced sungen's generic `test:headed`/`test:debug`/`report`/
  `install:browsers` scripts with namespaced `test:sungen`, `test:sungen:ui`,
  `sungen:generate` to match the repo's `test:e2e*` convention.
- **`eslint.config.mjs`** — added `specs/generated/**` to `globalIgnores`. Sungen's
  generated runtime trips `react-hooks/rules-of-hooks` (Playwright's `use()`
  fixture) and `no-explicit-any`; it's auto-generated ("DO NOT EDIT"), so it's
  excluded like `.claude/**` already is.
- **`.gitignore`** — kept only the genuinely new `specs/.auth/`; dropped sungen's
  duplicates of `test-results/`, `playwright-report/`, `.playwright-mcp/`.
- **`pnpm-workspace.yaml`** — set `esbuild: false` (sungen runs via tsx; no native
  build needed).

## Workflow

```bash
pnpm exec sungen add --screen login --path /login   # scaffold qa/screens/login/
# write/AI-generate .feature + selectors.yaml + test-data.yaml
pnpm exec sungen generate --screen login            # → specs/generated/login/login.spec.ts
pnpm test:sungen                                     # playwright test --project=sungen
```

The Gherkin reads like plain English and compiles 1:1 to Playwright — e.g.
`Then User see [login] page` → `await expect(page).toHaveURL(/\/login/)`, and
`Then User see [error banner] text contains {{domain_error_fragment}}` →
`getByText('không thuộc miền').toContainText(testData.get('domain_error_fragment'))`.
NFC selector keys hold Vietnamese strings directly (`không thuộc miền`,
`Đăng nhập bằng Google`), which is the awkward part of the hand-written vi/en suite.

## Findings

**Strengths**
- Deterministic compile → output is diff-reviewable; no AI flakiness in CI.
- Reused the repo's Playwright infra (webServer, baseURL, Chromium) with zero duplication.
- QA-readable Gherkin + CSV/XLSX delivery export fit the Sun\* QA process.
- First-class Vietnamese/Japanese selectors and an i18n overlay flow (`/sungen:locale`).

**Rough edges (worth knowing before adopting)**
1. **`init` is not pnpm-aware** — it shells out to `npm install -D`. Pre-installing
   the deps via pnpm (as above) sidesteps it; otherwise you get a stray `package-lock.json`.
2. **Bug in 2.6.15: `base.ts` imports `./locale-fixture` but neither `init` nor the
   first `generate` created it** (the create-if-missing branch is skipped because
   `init` pre-creates `base.ts`). Worked around by copying the template:
   `cp node_modules/@sun-asterisk/sungen/dist/orchestrator/templates/specs-locale-fixture.ts specs/generated/locale-fixture.ts`.
   Reported upstream candidate — re-check on the next release.
3. **`.claude/` is gitignored in this repo**, so the Claude Code slash commands/skills
   are local-only. The shareable, committed path is Copilot (`.github/`). Anyone using
   Claude Code must run `sungen init` (or `sungen update`) locally to get the commands.
4. **Large footprint** — 25 tracked `.github/` rule files. Acceptable, but a deliberate choice.
5. **`.vscode/settings.json` auto-approves** `sungen` + `npx playwright` terminal commands
   for Copilot — review before keeping.

## Two-tier convention (recommended)

- **Sungen (`qa/` → `specs/generated/`)** — broad coverage of static screens & forms:
  login, awards-information, profile, homepage. QA owns the Gherkin.
- **Hand-written (`e2e/`)** — flows Gherkin can't express: optimistic UI, realtime,
  the like-persistence race, Spotlight pan/zoom. Engineers own these.

Without this split the two suites drift and duplicate.

## Next steps (not done in this pilot)

- Wire `@auth:<role>` to the existing `/auto-login` backdoor (write
  `specs/.auth/<role>.json` from a setup project) so authed screens (sun-kudos)
  compile too — sungen's own `makeauth` opens a browser for manual SSO, which we
  don't need.
- Decide whether to run `--project=sungen` in CI, and whether to commit generated
  specs (currently yes) or regenerate them in CI from `qa/`.
