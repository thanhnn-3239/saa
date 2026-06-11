# Sungen pilot — evaluation & integration notes

[`@sun-asterisk/sungen`](https://www.npmjs.com/package/@sun-asterisk/sungen)
(v2.6.15, MIT, by Sun\* engineer-excellence) is a **deterministic E2E test
compiler**: AI writes three human-readable input files — Gherkin `.feature`,
`selectors.yaml`, `test-data.yaml` — and `sungen generate` compiles them into
Playwright `.spec.ts`. No AI runs during compilation, so the same inputs always
produce the same tests.

This pilot wired it into the repo and proved the full pipeline end-to-end on
**two screens**:

- **login** (unauthenticated) — 4 compiled tests.
- **sun-kudos** (authenticated via `@auth:member`) — 4 compiled tests: board
  sections, hashtag filter → empty state, hashtag filter drops non-matching
  kudos, and like→unlike.

Status: **working, all green against the real app + local Supabase**. The full
combined run — hand-written `e2e/` + sungen, authed and unauthed — is **34/34**.
Unauthenticated runs (CI without Supabase) stay green: the base `sungen` project
skips authed screens, so the no-token suite is 13 tests.

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
| `.claude/commands/sungen/`, `.claude/skills/sungen-*/` | ✅ | Claude Code rules. The repo's `/.claude/*` gitignore was **removed** in this pilot so these are committed and shared (23 markdown files) |
| `.mcp.json`, `.vscode/mcp.json`, `.vscode/settings.json` | ✅ | MCP servers (playwright + figma) + Copilot auto-approve |

### Manual reconciliation applied

- **`playwright.config.ts`** — added a `sungen` project (`testDir: specs/generated`)
  reusing the existing `webServer` + `baseURL`, plus `sungen-setup` + `sungen-auth`
  (gated on `AUTO_LOGIN_TOKEN`) for authed screens. The base `sungen` project
  `testIgnore`s the authed screen dirs (listed in `SUNGEN_AUTHED_SCREENS`), so
  unauthenticated runs stay green. The hand-written suite stays in `e2e/`.
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

### Authed screens (`@auth:member`)

`@auth:member` compiles to `newContext({ storageState: 'specs/.auth/member.json' })`.
We mint that session through the existing `/auto-login` backdoor in
`specs/auth.setup.ts` (the `sungen-setup` project), instead of sungen's `makeauth`
(which opens a browser for manual SSO). Run authed locally:

```bash
pnpm db:start
SUPABASE_EXTRA_SEEDS="./seeds/dev/*.sql" pnpm db:reset
export AUTO_LOGIN_TOKEN=dev-e2e-secret \
  NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
  NEXT_PUBLIC_SUPABASE_ANON_KEY=$(pnpm -s db:status | awk '/Publishable/ {print $3}') \
  SUPABASE_SECRET_KEY=$(pnpm -s db:status | awk '/Secret/ {print $3}')
pnpm exec playwright test --project=sungen-setup --project=sungen-auth
```

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
3. **Repeated components need test landmarks.** Each kudo renders in BOTH the
   highlight carousel and the feed, so an unscoped locator matches twice (strict-mode
   error). We added one `data-testid="all-kudos-feed"` to the feed `<section>` and
   scoped the feed selectors with it. Expect a few such `data-testid` additions when
   adopting sungen on dynamic screens.
4. **Two parallel auth setups for the SAME user race in GoTrue.** The e2e `setup`
   (member-test) and `sungen-setup` initially both logged in as member-test;
   concurrent `/auto-login` left one stuck on the redirect. Fixed by giving sungen a
   distinct user (member03). Lesson: one seeded user per parallel setup project.
5. **Large footprint** — ~25 `.github/` + 23 `.claude/` rule files now tracked
   (the `/.claude/*` gitignore was removed so both AI assistants share the rules).
6. **`.vscode/settings.json` auto-approves** `sungen` + `npx playwright` terminal commands
   for Copilot — review before keeping.

> Earlier bug (2.6.15): `base.ts` imports `./locale-fixture` but neither `init` nor
> the first `generate` created it — worked around by copying the template (see above).

## Two-tier convention (recommended)

- **Sungen (`qa/` → `specs/generated/`)** — broad coverage of static screens & forms:
  login, awards-information, profile, homepage. QA owns the Gherkin.
- **Hand-written (`e2e/`)** — flows Gherkin can't express: optimistic UI, realtime,
  the like-persistence race (reload mid-mutation), Spotlight pan/zoom. Engineers own
  these. The sungen sun-kudos like test deliberately stays at like→unlike (no reload),
  which is exactly the boundary: the cross-reload persistence race lives in `e2e/`.

Without this split the two suites drift and duplicate.

## Next steps (not done in this pilot)

- Decide whether to run `--project=sungen` (and the authed `sungen-auth`) in CI, and
  whether to commit generated specs (currently yes) or regenerate them from `qa/` in CI.
- Expand sungen coverage to the remaining static screens (awards-information, profile).
- Re-check the `locale-fixture` bug on the next sungen release; drop the workaround if fixed.
