---
name: tkm:run-tests
description: "Temper the work under fire — run unit, integration, e2e, and UI tests. Covers test execution, coverage analysis, build verification, visual regression, and QA reports. A piece untested is a piece unfinished."
argument-hint: "[context] OR ui [url]"
metadata:
  author: takumi-agent-kit
  version: "1.0.0"
---

# Tempering the Work

A blade fresh from the forge is soft. It cuts nothing.
Tempering is what reveals whether the metal holds — applying heat, then controlled stress, until the flaw shows or the strength proves out.

This skill is that tempering: structured, thorough, unsparing.
Passing builds do not prove correctness. Evidence does.

## When Called Without Arguments

If invoked with context (test scope), proceed with testing. If invoked WITHOUT arguments, use `AskUserQuestion` to present available test operations:

| Operation | Description |
|-----------|-------------|
| `(default)` | Run unit/integration/e2e tests |
| `ui` | Run UI tests on a website |

Present as options via `AskUserQuestion` with header "Test Operation", question "What would you like to do?".

## The Tempering Law

**NEVER IGNORE FAILING TESTS.** Fix root causes, not symptoms. No mocks, tricks, or workarounds to pass builds.

A test that is silenced rather than fixed is a crack hidden under lacquer.

## When to Temper

- **After forging**: Validate new features or bug fixes
- **Coverage checks**: Ensure coverage meets project thresholds (80%+)
- **UI verification**: Visual regression, responsive layout, accessibility
- **Build validation**: Verify build process, dependencies, CI/CD compatibility
- **Before delivery**: Final quality gate before committing or pushing

## Tempering Methods

### 1. Code Testing (`references/test-execution-workflow.md`)

Execute test suites, analyze results, generate coverage. Supports JS/TS (Jest/Vitest/Mocha), Python (pytest), Go, Rust, Flutter. Includes working process, quality standards, and tool commands.

**Load when:** Running unit/integration/e2e tests, checking coverage, validating builds

### 2. UI Testing (`references/ui-testing-workflow.md`)

Browser-based visual testing via `tkm:automate-browser` skill. Screenshots, responsive checks, accessibility audits, form automation, console error collection. Includes auth injection for protected routes.

**Load when:** Visual regression testing, UI bugs, responsive layout checks, accessibility audits

### 3. Report Format (`references/report-format.md`)

Structured QA report template: test results overview, coverage metrics, failed tests, performance, build status, recommendations.

**Load when:** Generating test summary reports

## Quick Reference

```
Code tests     → test-execution-workflow.md
  npm test / pytest / go test / cargo test / flutter test
  Coverage: npm run test:coverage / pytest --cov

UI tests       → ui-testing-workflow.md
  Screenshots, responsive, a11y, forms, console errors
  Auth: inject-auth.js for protected routes

Reports        → report-format.md
  Structured QA summary with metrics & recommendations
```

## The Tempering Process

1. Identify testing scope from recent changes or requirements
2. Run typecheck/analyze commands to catch syntax errors first
3. Execute appropriate test suites
4. Analyze results — focus on failures
5. Generate coverage reports if applicable
6. For frontend: run UI tests via `tkm:automate-browser` skill
7. Produce structured summary report

## Tools

- **Test runners**: Jest, Vitest, Mocha, pytest, go test, cargo test, flutter test
- **Coverage**: Istanbul/c8/nyc, pytest-cov, go cover
- **Browser**: `tkm:automate-browser` skill for UI testing (screenshots, ARIA, console, network)
- **Debugging**: `tkm:debug-code` skill when tests reveal flaws requiring investigation
- **Thinking**: `tkm:think-sequential` skill for complex failure analysis

## Standards of Craft

- All critical paths must have test coverage
- Validate the intended path AND every failure scenario
- Ensure test isolation — no interdependencies
- Tests must be deterministic and reproducible
- Clean up test data after execution
- Never silence a failing test to pass the build

## Report Output
**IMPORTANT:** Invoke "/tkm:organize-files" skill to organize the outputs.

Use naming pattern from `## Naming` section injected by hooks.

## Working in a Team

When operating as teammate:
1. On start: check `TaskList`, claim assigned/next unblocked task via `TaskUpdate`
2. Read full task description via `TaskGet` before starting
3. Wait for blocked tasks (implementation) to complete before testing
4. Respect file ownership — only create/edit test files assigned
5. When done: `TaskUpdate(status: "completed")` then `SendMessage` results to lead

**Fallback:** Task tools (`TaskList`/`TaskUpdate`/`TaskGet`) are CLI-only — unavailable in VSCode extension. If they error, use `TodoWrite` for progress tracking and coordinate via `SendMessage` only.
