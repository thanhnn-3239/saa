---
name: tkm:debug-code
description: "Find the flaw before touching the material. Use for bugs, test failures, unexpected behavior, performance issues, call stack tracing, multi-layer validation, log analysis, CI/CD failures, database diagnostics, system investigation."
languages: all
argument-hint: "[error or issue description]"
metadata:
  author: takumi-agent-kit
  version: "4.0.0"
---

# Finding the Flaw

The craftsman who patches the surface without finding the crack will patch it again.
And again. Every repair that does not address the root leaves the piece weaker.

This skill is the structured search for origin — tracing symptoms back to their source,
validating at every layer, and confirming the fix before claiming it is done.

## The Debug Law

**Find the root cause before touching anything.**

Random fixes waste time and introduce new flaws. Find where the failure originates.
Fix it at the source. Validate at every layer. Verify with evidence before claiming success.

## When to Use

**Code-level:** Test failures, bugs, unexpected behavior, build failures, integration problems
**System-level:** Server errors, CI/CD pipeline failures, performance degradation, database issues, log analysis
**Always:** Before claiming work complete

## Techniques

### 1. Systematic Debugging (`references/systematic-debugging.md`)

Four-phase framework: Root Cause Investigation → Pattern Analysis → Hypothesis Testing → Implementation. Complete each phase before proceeding. No fixes without Phase 1.

**Load when:** Any bug or issue requiring investigation and fix

### 2. Root Cause Tracing (`references/root-cause-tracing.md`)

Trace bugs backward through the call stack to find the original trigger. Fix at the source, not the symptom. Includes `scripts/find-polluter.sh` for bisecting test pollution.

**Load when:** Error deep in call stack, unclear where invalid data originated

### 3. Defense-in-Depth (`references/defense-in-depth.md`)

Validate at every layer: Entry validation → Business logic → Environment guards → Debug instrumentation

**Load when:** After finding root cause, need comprehensive validation across all layers

### 4. Verification (`references/verification.md`)

**Iron law:** NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE. Run the command. Read the output. Then claim the result.

**Load when:** About to claim work is complete, fixed, or passing

### 5. Investigation Methodology (`references/investigation-methodology.md`)

Five-step structured investigation for system-level issues: Initial Assessment → Data Collection → Analysis → Root Cause Identification → Solution Development

**Load when:** Server incidents, system behavior analysis, multi-component failures

### 6. Log & CI/CD Analysis (`references/log-and-ci-analysis.md`)

Collect and analyze logs from servers, CI/CD pipelines (GitHub Actions), application layers. Tools: `gh` CLI, structured log queries, correlation across sources.

**Load when:** CI/CD pipeline failures, server errors, deployment issues

### 7. Performance Diagnostics (`references/performance-diagnostics.md`)

Identify bottlenecks, analyze query performance, develop optimization strategies. Covers database queries, API response times, resource utilization.

**Load when:** Performance degradation, slow queries, high latency, resource exhaustion

### 8. Reporting Standards (`references/reporting-standards.md`)

Structured diagnostic reports: Executive Summary → Technical Analysis → Recommendations → Evidence

**Load when:** Need to produce an investigation report or diagnostic summary

### 9. Task Management (`references/task-management-debugging.md`)

Track investigation pipelines via Claude Native Tasks (TaskCreate, TaskUpdate, TaskList). Hydration pattern for multi-step investigations with dependency chains and parallel evidence collection. **Fallback:** Task tools are CLI-only — if unavailable (VSCode extension), use `TodoWrite` for tracking. Debug workflow remains fully functional.

**Load when:** Multi-component investigation (3+ steps), parallel log collection, coordinating debugger subagents

### 10. Frontend Verification (`references/frontend-verification.md`)

Visual verification of frontend implementations via Chrome MCP (Claude Chrome Extension) or `tkm:automate-browser` skill fallback. Detect if frontend-related → check Chrome MCP availability → screenshot + console error check → report. Skip if not frontend.

**Load when:** Implementation touches frontend files (tsx/jsx/vue/svelte/html/css), UI bugs, visual regressions

## Quick Reference

```
Code bug       → systematic-debugging.md (Phase 1-4)
  Deep in stack  → root-cause-tracing.md (trace backward)
  Found cause    → defense-in-depth.md (add layers)
  Claiming done  → verification.md (verify first)

System issue   → investigation-methodology.md (5 steps)
  CI/CD failure  → log-and-ci-analysis.md
  Slow system    → performance-diagnostics.md
  Need report    → reporting-standards.md

Frontend fix   → frontend-verification.md (Chrome/devtools)
```

## Tools Integration

- **Database:** `psql` for PostgreSQL queries and diagnostics
- **CI/CD:** `gh` CLI for GitHub Actions logs and pipeline debugging
- **Codebase:** `tkm:search-docs` skill for package/plugin docs; `tkm:pack-codebase` skill for codebase summary
- **Survey:** `/tkm:scan-codebase` or `/tkm:scan-codebase ext` for finding relevant files
- **Frontend:** Chrome browser or `tkm:automate-browser` skill for visual verification (screenshots, console, network)
- **Skills:** Activate `tkm:solve-problem` skill when stuck on complex issues

## Warning Signs

Stop and return to the structured process if thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "It's probably X, let me fix that"
- "Should work now" / "Seems fixed"
- "Tests pass, we're done"

**All of these mean:** Return to systematic investigation. The pattern that skips the process is the pattern that creates the next defect.
