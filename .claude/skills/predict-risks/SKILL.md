---
name: tkm:predict-risks
description: "Five voices examine the plan before the first cut — expert personas debate architectural, security, performance, and UX risks in proposed changes. Use before major features or anything that cannot easily be undone."
argument-hint: "<feature description or change proposal> [--files <glob>]"
metadata:
  author: takumi-agent-kit
  attribution: "Multi-persona prediction pattern adapted from autoresearch by Udit Goenka (MIT)"
  license: MIT
  version: "1.0.0"
---

# Reading the Grain

Before the craftsman cuts, they read the wood.
They run a hand along the surface, feel where the grain runs true and where it twists,
where a cut would split cleanly and where it would shatter.

The material does not announce its weaknesses — it conceals them.
Only careful examination before the first cut reveals what failure is hiding inside the proposal.

## When to Read the Grain

- Before implementing a major or high-risk feature
- Before a significant refactor or architecture change
- Evaluating competing technical approaches
- Stress-testing assumptions in a proposed design

## When Not to Use This Skill

- Trivial or low-risk changes (use `tkm:debug-code` for bugs, `tkm:create-plan` for already-decided tasks)
- Already-approved work with no open design questions
- Pure dependency upgrades with no API changes

---

## Five Voices

Five distinct perspectives each examine the proposed change from their own discipline.
They do not consult one another during this phase — independence is what makes the debate valuable.

| Voice | Domain | What They Ask |
|---------|-------|----------------|
| **Architect** | System design, scalability, coupling | Does this fit the architecture? Will it scale? What new coupling does it introduce? |
| **Security** | Attack surface, data protection, auth | What can be abused? Where is data exposed? Are auth boundaries respected? |
| **Performance** | Latency, memory, queries, bundle size | What is the latency impact? N+1 queries? Memory leaks? Bundle bloat? |
| **UX** | User experience, accessibility, error states | Is this intuitive? What does the error state look like? Accessible on mobile? |
| **Devil's Advocate** | Hidden assumptions, simpler alternatives | Why not do nothing? What is the simplest alternative? Which assumption could be wrong? |

---

## The Debate Protocol

1. **Read** the proposed change/feature description from the argument
2. **Read relevant code** if file paths are provided (grep for affected areas)
3. **Each voice analyzes independently** — do not let voices influence each other during this phase
4. **Identify agreements** — points where all (or 4+) voices align
5. **Identify conflicts** — points where voices meaningfully disagree
6. **Weigh tradeoffs** — for each conflict, evaluate which concern has higher impact
7. **Produce verdict** — GO / CAUTION / STOP with actionable recommendations

---

## Report Format

```
## Grain Reading: [proposal title]

## Verdict: GO | CAUTION | STOP

### Where All Voices Agree
- [Point 1 — what they all agree on]
- [Point 2]

### Conflicts & Resolutions

| Topic | Architect | Security | Performance | UX | Devil's Advocate | Resolution |
|-------|-----------|----------|-------------|-----|-----------------|------------|
| [Issue] | [View] | [View] | [View] | [View] | [View] | [Recommendation] |

### Risk Summary

| Risk | Severity | Mitigation |
|------|----------|------------|
| [Risk description] | Critical/High/Medium/Low | [Concrete action] |

### Recommendations
1. [Action item — rationale]
2. [Action item — rationale]
3. [Action item — rationale]
```

---

## Verdict Levels

| Verdict | Meaning |
|---------|---------|
| **GO** | All voices aligned, no critical risks, proceed with confidence |
| **CAUTION** | Concerns exist but are manageable — mitigations identified, proceed carefully |
| **STOP** | Critical unresolved issue found — needs redesign or more information before proceeding |

### What Forces a STOP (any one is sufficient)
- Security voice identifies auth bypass or data exposure with no viable mitigation
- Architect identifies fundamental design incompatibility requiring significant rework
- Performance voice identifies unacceptable latency or query explosion with no workaround
- Devil's Advocate exposes a false assumption that invalidates the entire approach

---

## How This Connects to Other Skills

| Next Step | Skill | How |
|---------------|-------|-----|
| Create implementation blueprint | `tkm:create-plan` | Attach Recommendations as constraints to planner |
| High-risk feature forging | `tkm:takumi` | Reference CAUTION/STOP items as acceptance gates |

---

## Example Invocations

```
/tkm:predict-risks "Add WebSocket support for real-time notifications"
/tkm:predict-risks "Migrate authentication from JWT to session cookies"
/tkm:predict-risks "Add multi-tenancy to the database layer"
/tkm:predict-risks "Replace REST API with GraphQL" --files src/api/**/*.ts
```
