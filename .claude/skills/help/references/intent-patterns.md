# Intent Patterns — Natural Language → Skill Routing

> The guide reads these patterns to match user intent to the right skill.
> Patterns are fuzzy — apply semantic matching, not exact string matching.
> Multi-language: patterns apply to English, Vietnamese, and Japanese queries.

---

## Design & Frontend

### Replicate existing visual asset → `/tkm:design-to-code`
User HAS an existing asset (mockup, screenshot, Figma link, video, HTML file) and wants to turn it into code.

**English triggers:**
"redesign this page", "make it look like [X]", "replicate this UI", "copy this design",
"convert this mockup to code", "from this screenshot", "from Figma", "pixel-perfect",
"match this design", "code this design", "implement this wireframe", "like the attached image"

**Vietnamese triggers:**
"thiết kế lại trang này", "làm giống như [X]", "code từ ảnh này", "chuyển design thành code",
"tạo UI giống cái này", "từ screenshot này", "từ Figma"

**Japanese triggers:**
"このデザインをコードに", "このスクリーンショットを実装", "デザインを複製"

**NOT this pattern if:** user has no asset and needs design decisions → use `design-ui`

---

### Design UI from scratch → `/tkm:design-ui`
User needs to DECIDE what the interface should look like (no existing asset).

**English triggers:**
"design a new page", "what should the UI look like", "choose color scheme", "pick fonts",
"design system", "UI style", "color palette", "typography", "what design style",
"how should this look", "create UI from scratch", "design inspiration"

**Vietnamese triggers:**
"thiết kế giao diện mới", "chọn màu sắc", "chọn font", "phong cách thiết kế",
"design system", "giao diện trông như thế nào"

---

### Build React/TypeScript components → `/tkm:build-frontend`
User wants to build NEW UI components/pages using React/TS patterns, not replicate a design.

**English triggers:**
"React component", "TypeScript frontend", "build with MUI", "TanStack Router",
"useSuspenseQuery", "lazy loading", "Suspense boundary", "frontend with React"

---

### Build Next.js app → `/tkm:build-nextjs`
**English triggers:**
"Next.js App Router", "RSC", "server components", "SSR", "ISR", "Turborepo",
"Next.js project", "build with Next"

---

## Implementation

### Full feature implementation → `/tkm:takumi`
User wants to BUILD something end-to-end.

**English triggers:**
"implement", "build feature", "add [X] to my app", "develop", "create functionality",
"I want to add", "make it work", "build this feature", "code this"

**Vietnamese triggers:**
"implement", "xây dựng tính năng", "thêm [X] vào app", "phát triển", "tạo chức năng"

**Japanese triggers:**
"実装する", "機能を追加", "開発する", "作る"

---

### Quick/fast implementation → `/tkm:takumi --fast`
**English triggers:**
"quick", "fast", "simple change", "small tweak", "just do it", "skip research",
"don't overthink", "straightforward"

---

### Plan only, no code → `/tkm:create-plan`
User explicitly wants a plan/blueprint before any code is written.

**English triggers:**
"create a plan", "plan this", "blueprint", "plan before coding", "design the architecture",
"technical roadmap", "implementation plan", "phase it out", "plan only"

**Vietnamese triggers:**
"lên kế hoạch", "tạo plan", "blueprint", "thiết kế kiến trúc trước"

---

### Architecture/trade-off decision → `/tkm:brainstorm`
User needs to DECIDE between approaches, not implement yet.

**English triggers:**
"should I use X or Y", "trade-offs", "architecture decision", "which approach is better",
"help me decide", "pros and cons", "CTO perspective", "debate this", "is this the right way"

---

### Research technology → `/tkm:research`
User needs to gather information before deciding.

**English triggers:**
"research", "evaluate", "best library for", "compare options", "what technology",
"investigate", "study", "what's the best way to", "find information about"

---

## Bug Fixing & Debugging

### Fix known bug → `/tkm:fix-bug`
Something is broken and user wants it fixed.

**English triggers:**
"bug", "error", "broken", "not working", "failing", "crash", "exception", "issue",
"fix this", "something went wrong", "doesn't work", "TypeError", "404", "500",
"CI failing", "tests failing", "lint error", "build failing"

**Vietnamese triggers:**
"lỗi", "bug", "không hoạt động", "bị lỗi", "crash", "fix cái này", "sửa lỗi"

**Japanese triggers:**
"バグ", "エラー", "動かない", "壊れた", "修正"

---

### Investigate unknown root cause → `/tkm:debug-code`
Problem is unclear, investigation needed before fixing.

**English triggers:**
"why is X happening", "investigate", "root cause", "strange behavior", "unexpected",
"trace", "diagnose", "performance issue", "slow", "memory leak", "odd behavior",
"I don't know why", "figure out what's wrong"

---

### Security vulnerabilities → `/tkm:audit-security`
**English triggers:**
"security", "vulnerabilities", "OWASP", "harden", "security audit", "scan for exploits",
"injection", "XSS", "sensitive data", "security review"

---

## Deployment

### Deploy to a platform → `/tkm:deploy-app`
**English triggers:**
"deploy", "publish", "go live", "push to production", "host", "Vercel", "Netlify",
"Cloudflare", "Railway", "Fly.io", "Heroku", "AWS", "GCP", "DigitalOcean"

**Vietnamese triggers:**
"deploy", "triển khai", "đưa lên production", "publish app"

---

### Ship feature branch → `/tkm:ship`
Feature complete, want to merge + PR.

**English triggers:**
"ship", "merge", "open PR", "pull request", "feature is done", "ready to merge",
"finish up", "submit for review"

---

## Testing

### Run tests → `/tkm:run-tests`
**English triggers:**
"run tests", "check tests", "test coverage", "unit tests", "e2e tests", "does it pass",
"test suite", "coverage report"

---

### Review code quality → `/tkm:review-code`
**English triggers:**
"review my code", "code review", "check my PR", "before merging", "is this safe",
"review changes", "feedback on code"

---

## Documentation

### Update docs → `/tkm:manage-docs`
**English triggers:**
"update docs", "document this", "README", "codebase docs", "sync documentation",
"update codebase-summary"

---

### Session wrap-up → `/tkm:write-journal`
**English triggers:**
"journal", "wrap up", "end session", "what did we do today", "write up", "session notes",
"document decisions", "record what happened"

---

## Project Estimation

### Estimate effort from spec document → `/tkm:estimate`
User has a spec document (PDF, Excel, Word, Markdown, PPTX, URL, image) and wants effort/man-day estimation.

**English triggers:**
"estimate this project", "how many man-days", "WBS from this spec", "effort estimate", "story points",
"estimate from this PDF/Excel/Word", "bidding estimate", "project profile", "function list",
"screen flow from spec", "estimate document", "spec-based estimate", "quick estimate"

**Vietnamese triggers:**
"dự toán dự án này", "ước tính effort", "man-days từ tài liệu này", "lập WBS", "dự toán từ spec",
"estimate tài liệu này", "đấu thầu", "function count", "project profile", "dự toán nhanh"

**Japanese triggers:**
"見積もり", "工数", "マンデイ", "WBS", "仕様書から見積もり", "スペックから工数"

---

### Estimate from Clio KG (Sun* internal) → `/tkm:estimate` (auto-detects clio mode)
`.estimate.yml` in project root OR user mentions Clio/project-id.

**English triggers:**
"estimate from Clio", "Clio project", "generate project profile from Clio", "project-id",
"screen flow from Clio", "function list from Clio", "clio mode"

**Vietnamese triggers:**
"estimate từ Clio", "dự án Clio", "project profile từ Clio", "lấy data từ Clio"

---

### Import historical estimate data → `/tkm:estimate import`

**English triggers:**
"import historical", "add to historical data", "import estimate", "record past project",
"add this estimate to knowledge base", "track actuals"

---

### Calibrate estimation knowledge base → `/tkm:estimate calibrate`

**English triggers:**
"calibrate", "calibration", "tune knowledge base", "analyze historical",
"adjust multipliers", "improve estimate accuracy", "update KB"

---

### Pre-estimation discovery Q&A → `/tkm:estimate discovery`

**English triggers:**
"pre-estimate analysis", "discovery Q&A", "analyze spec before estimating",
"spec analysis questions", "what to clarify before estimating"

---

## Git

### Commit/push → `/tkm:git`
**English triggers:**
"commit", "push", "stage", "git commit", "save changes", "conventional commit"

---

### Isolate work in worktree → `/tkm:create-worktree`
**English triggers:**
"worktree", "isolated branch", "parallel work", "don't touch main", "separate workspace",
"work on feature without affecting"

---

## Codebase Understanding

### Find files / understand structure → `/tkm:scan-codebase`
**English triggers:**
"find files", "where is X", "what files", "scan code", "map codebase", "locate",
"search for", "what's in this project"

---

## Utility / Configuration

### Ask an expert → `/tkm:ask-expert`
**English triggers:**
"expert opinion", "best practice advice", "architectural guidance", "consult", "ask an expert"

### Set explanation level → `/tkm:set-level`
**English triggers:**
"explain simply", "ELI5", "junior mode", "expert mode", "set level", "too technical",
"more detail", "less detail"

### Solve a stuck problem → `/tkm:solve-problem`
**English triggers:**
"stuck", "can't figure out", "recurring problem", "going in circles", "break the pattern",
"tried everything"

---

## Ambiguous / Multi-Domain

When intent spans multiple domains, recommend the PRIMARY skill and mention the next step:

| Pattern | Primary | Next |
|---------|---------|------|
| "design and implement X" | `design-ui` or `design-to-code` | then `takumi` |
| "plan and build X" | `create-plan` | then `takumi plan.md` |
| "fix and deploy" | `fix-bug` | then `ship` |
| "review and merge" | `review-code` | then `ship` |
