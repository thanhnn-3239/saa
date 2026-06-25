---
description: Fix bugs, errors, test failures, CI/CD issues with intelligent routing
argument-hint: [bug description or error log]
---

Activate the `fix` skill.

<issue>$ARGUMENTS</issue>

Before implementing:
1. Reproduce the issue and pinpoint root cause (not just symptom).
2. If reproduction requires test run, invoke `tester` subagent first.
3. For CI failures, fetch logs via `gh run view --log-failed`.
4. Propose minimal fix, explain why the root cause makes the fix work.
5. After fix, run tests again to verify — NEVER skip tests to pass the build.

**IMPORTANT**: Do not use fake data, mocks, or workarounds just to pass CI.
