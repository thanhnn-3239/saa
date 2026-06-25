# Takumi Skill Catalog

> Complete catalog of all takumi-kit skills organized by domain.
> **Maintainers:** Update this file whenever a skill is added, renamed, or removed.

---

## Design & Frontend

| Skill | Use for | Key triggers |
|-------|---------|-------------|
| `/tkm:design-to-code` | Replicate an existing design (mockup, screenshot, Figma, video, HTML) into polished frontend code with full aesthetic fidelity | "redesign this", "make it look like", "replicate UI", "from screenshot", "from Figma", "pixel-perfect", "convert design to code", "thiết kế lại" |
| `/tkm:design-ui` | Make UI/UX design DECISIONS — choose color palette, typography, style system, UX patterns for a new or existing interface | "design from scratch", "choose colors", "pick fonts", "design system", "what style should", "UX guidelines", "create UI from idea" |
| `/tkm:build-frontend` | Build React/TypeScript frontend components and pages with modern patterns (Suspense, TanStack, MUI v7, lazy loading) | "React component", "TypeScript frontend", "TanStack Router", "MUI", "useSuspenseQuery", "lazy loading" |
| `/tkm:build-nextjs` | Build with Next.js App Router — RSC, SSR, ISR, Turborepo monorepos, caching strategies | "Next.js", "App Router", "RSC", "server components", "Turborepo" |

**Don't confuse:**
- `design-to-code` = TRANSLATE existing visual → code (input: asset)
- `design-ui` = DECIDE what the design should look like (input: requirements)
- `build-frontend` = BUILD components with React/TS patterns (input: specs)

---

## Implementation

| Skill | Use for | Key triggers |
|-------|---------|-------------|
| `/tkm:takumi` | End-to-end feature implementation: research → plan → implement → test → review → commit. The full craftsman pipeline. | "implement", "build feature", "add X to app", "develop", "create functionality", "end-to-end" |
| `/tkm:create-plan` | Create a detailed implementation plan (blueprint) BEFORE writing code | "plan this", "create a plan", "design architecture", "blueprint", "before implementing", "plan only" |
| `/tkm:brainstorm` | CTO-level trade-off analysis BEFORE committing to an approach — surfaces alternatives, quantifies risks | "should I use X or Y", "trade-offs", "architecture decision", "which approach", "help me think through", "before deciding" |
| `/tkm:bootstrap` | Start a new project from scratch: research stack, scaffold structure, set up foundations | "new project", "start from scratch", "scaffold", "init project", "create new app" |
| `/tkm:research` | Multi-source technical research with ranked recommendations | "research", "evaluate", "compare libraries", "best practice for", "what technology", "investigate options" |

---

## Bug Fixing & Debugging

| Skill | Use for | Key triggers |
|-------|---------|-------------|
| `/tkm:fix-bug` | Fix ANY bug, error, test failure, CI/CD issue, type error, lint error | "bug", "error", "broken", "not working", "failing", "crash", "exception", "CI failing", "fix this" |
| `/tkm:debug-code` | Root cause investigation — trace symptoms to source before touching code | "investigate", "why is X happening", "root cause", "strange behavior", "unexpected", "trace", "diagnose" |
| `/tkm:audit-security` | STRIDE + OWASP security scan with optional auto-fix | "security", "vulnerabilities", "OWASP", "harden", "security audit", "scan for exploits" |

---

## Backend & Database

| Skill | Use for | Key triggers |
|-------|---------|-------------|
| `/tkm:build-backend` | Build Node.js/Python/Go APIs (NestJS, FastAPI, Django) — REST, GraphQL, gRPC, auth, microservices | "API", "backend", "REST endpoint", "GraphQL", "NestJS", "FastAPI", "Django", "auth backend", "microservice" |
| `/tkm:design-database` | Design schemas and write queries for MongoDB or PostgreSQL | "database schema", "SQL query", "MongoDB", "PostgreSQL", "index", "migration", "aggregation pipeline" |

---

## Testing & Code Quality

| Skill | Use for | Key triggers |
|-------|---------|-------------|
| `/tkm:run-tests` | Run unit/integration/e2e/UI tests, check coverage, verify build | "run tests", "test coverage", "unit test", "e2e", "visual regression", "does it pass" |
| `/tkm:review-code` | Adversarial code review — security holes, false assumptions, failure modes | "review code", "code review", "check my PR", "before merging", "is this safe" |
| `/tkm:predict-risks` | 5 expert personas debate risks in a proposed change BEFORE implementing | "risks", "what could go wrong", "before major change", "predict failure", "expert review of plan" |
| `/tkm:auto-research` | Autonomous iterative optimization loop against a measurable metric | "improve coverage", "optimize bundle", "iterative improvement", "auto-optimize", "N iterations" |

---

## Deployment & Infrastructure

| Skill | Use for | Key triggers |
|-------|---------|-------------|
| `/tkm:deploy-app` | Deploy to any platform — Vercel, Netlify, Cloudflare, Railway, Fly.io, AWS, GCP | "deploy", "publish", "go live", "push to production", "host this app", platform names |
| `/tkm:ship` | Full ship pipeline: merge main + tests + review + commit + push + open PR | "ship", "merge feature", "open PR", "feature is done", "ready to merge" |
| `/tkm:devops` | Docker, Kubernetes, Cloudflare Workers/R2/D1, GCP Cloud Run, CI/CD pipelines, Helm | "Docker", "Kubernetes", "CI/CD pipeline", "GitOps", "Helm", "Cloudflare Workers" |
| `/tkm:infra` | AWS infrastructure as Terraform code — modules, cost review, IaC | "Terraform", "AWS", "infrastructure as code", "IaC", "EC2", "RDS", "cost estimate" |

---

## Planning & Architecture

| Skill | Use for | Key triggers |
|-------|---------|-------------|
| `/tkm:create-plan` | Detailed implementation plan with phases (see Implementation section) | — |
| `/tkm:brainstorm` | Architecture decisions, trade-off analysis (see Implementation section) | — |
| `/tkm:research` | Technical research before deciding (see Implementation section) | — |
| `/tkm:think-sequential` | Step-by-step analysis with revision capability for complex multi-step problems | "think through step by step", "complex problem", "analyze carefully", "reason through" |

---

## Documentation & Knowledge

| Skill | Use for | Key triggers |
|-------|---------|-------------|
| `/tkm:manage-docs` | Update and manage project documentation in `./docs` | "update docs", "document this", "README", "codebase summary", "sync docs" |
| `/tkm:write-journal` | End-of-session journal entry — decisions, lessons, what was built | "journal", "write up session", "wrap up", "document what we did", "session notes" |
| `/tkm:run-retro` | Sprint retrospective from git metrics — commits, LOC, hotspots, churn | "sprint retro", "retrospective", "sprint review", "what happened this week", "git metrics" |
| `/tkm:rebuild-spec` | Reverse-engineer codebase → 9 structured doc artifacts (architecture, API specs, flows) | "document existing codebase", "reverse engineer", "spec from code", "what does this code do" |
| `/tkm:search-docs` | Search library/framework docs via context7 | "docs for X", "API reference", "how does X work in library Y", "latest docs" |

---

## Git & Version Control

| Skill | Use for | Key triggers |
|-------|---------|-------------|
| `/tkm:git` | Stage, commit, push with conventional commits; secrets scan before commit | "commit", "push", "stage changes", "git", "commit message" |
| `/tkm:ship` | Full ship pipeline (see Deployment) | — |
| `/tkm:create-worktree` | Create isolated git worktrees for parallel feature development | "worktree", "isolated branch", "work in parallel", "don't touch main branch", "separate workspace" |

---

## Project & Context Management

| Skill | Use for | Key triggers |
|-------|---------|-------------|
| `/tkm:scan-codebase` | Parallel codebase scouting — file discovery, pattern search | "find files", "where is X", "what files do I need", "scan code", "map the codebase" |
| `/tkm:manage-project` | Track plan statuses, manage Tasks, generate reports, cross-session continuity | "project status", "what's done", "update plan", "track progress", "task management" |
| `/tkm:view-plans` | Plans kanban dashboard — phase progress, timeline | "show plans", "kanban", "plan progress", "what's left", "plan dashboard" |
| `/tkm:optimize-context` | Optimize context window — monitor usage, prevent token waste | "context full", "token limit", "optimize context", "memory management" |
| `/tkm:organize-files` | Organize files and directories — naming, structure, output paths | "organize files", "where to put this", "naming convention", "file structure" |

---

## AI & Collaboration

| Skill | Use for | Key triggers |
|-------|---------|-------------|
| `/tkm:agent-team` | Spawn parallel agent teams for independent work streams | "parallel agents", "team of agents", "multiple specialists", "agent team" |
| `/tkm:ask-expert` | Expert technical and architectural consultation | "expert opinion", "best practice advice", "architectural guidance", "ask an expert" |
| `/tkm:find-skill` | Search EXTERNAL skills registry (skills.sh) for new installable skills | "find new skill", "install skill", "skills registry", "new capability" |

---

## Automation & Browser

| Skill | Use for | Key triggers |
|-------|---------|-------------|
| `/tkm:automate-browser` | Puppeteer CLI — screenshots, scraping, performance, form automation | "screenshot", "scrape", "automate browser", "Puppeteer", "web automation", "performance test" |

---

## Specialized Output

| Skill | Use for | Key triggers |
|-------|---------|-------------|
| `/tkm:generate-slide` | Polished presentation slides (HTML scroll-snap or Sun* branded PPTX) | "slides", "presentation", "deck", "tạo slide", "gen deck", "PPTX" |
| `/tkm:preview-output` | Visual explanations, diagrams, slides in browser as self-contained HTML | "show me", "preview", "explain visually", "make a diagram", "render this" |
| `/tkm:pack-codebase` | Repomix codebase snapshot for LLM context or security audit | "pack codebase", "repomix", "LLM context", "codebase snapshot" |
| `/tkm:document-skills` | Work with Word/PDF/PowerPoint/Excel files | "Word doc", "PDF", "PowerPoint", "Excel", "office document" |
| `/tkm:audio-transcribe` | Transcribe audio/video to SRT with domain-aware correction | "transcribe", "subtitles", "SRT", "audio to text", "video captions" |
| `/tkm:gkg` | GitLab Knowledge Graph — go-to-definition, find-usages, impact analysis | "find usages", "who calls this", "impact analysis", "semantic search", "large codebase" |
| `/tkm:solve-problem` | Systematic problem-solving when stuck on a recurring issue | "stuck", "can't figure out", "recurring problem", "break the pattern" |

---

## MCP & External Tools

| Skill | Use for | Key triggers |
|-------|---------|-------------|
| `/tkm:manage-mcp` | Discover and manage MCP server tools | "MCP server", "MCP tools", "discover MCP" |
| `/tkm:use-mcp` | Execute MCP server capabilities | "use MCP tool", "run MCP", "call MCP" |

---

## Configuration & Level

| Skill | Use for | Key triggers |
|-------|---------|-------------|
| `/tkm:set-level` | Set output detail level from ELI5 (0) to expert (5) | "explain simply", "set level", "junior mode", "expert mode", "ELI5" |

---

## Takumi-Specific (Project/Client Tools)

| Skill | Use for | Key triggers |
|-------|---------|-------------|
| `/tkm:estimate` | Effort estimation from spec docs (PDF/Excel/Word/URL/image) or Clio KG — 5 modes: quick, full, clio, import, calibrate | "estimate", "man-days", "WBS", "effort estimate", "function count", "dự toán", "見積もり", "spec document", "bidding" |
| &nbsp;&nbsp;└ `discovery` | Pre-estimation Q&A from spec directory | "pre-estimate", "discovery Q&A", "spec analysis questions", "before estimating" |
| &nbsp;&nbsp;└ `task-breakdown` | WBS breakdown from feature/function list | "WBS", "task breakdown", "breakdown per feature", "effort per task" |
| `/tkm:generate-testcases` | QA testcases from MoMorph screen or spec | "testcases", "QA cases", "generate test scenarios from spec" |
| `/tkm:generate-ui-specs` | Per-component UI specs from MoMorph/screenshot | "UI specs", "component spec", "MoMorph spec" |
| `/tkm:momorph-implement-design` | Pixel-perfect code from MoMorph/Figma screen | MoMorph URL, `fileKey+screenId` |
| `/tkm:upsale` | Customer-ready upsale proposal for repository | "upsale", "improvement proposal", "client proposal" |
