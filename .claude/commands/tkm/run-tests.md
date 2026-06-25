---
description: Run unit/integration/e2e tests, coverage analysis, verification
argument-hint: [scope: unit|integration|e2e|ui|all]
---

Activate the `test` skill and delegate to `tester` subagent.

<scope>$ARGUMENTS</scope>

- 100% pass required to finalize
- Never use fake data or mocks just to pass CI
- Failed tests: fix root cause, re-run, repeat until green
- Report coverage, flaky tests, perf regressions
