# Init Workflow

## Phase 1: Parallel Codebase Scouting

1. Scan the codebase and calculate the number of files with LOC in each directory (skip credentials, cache or external modules directories, such as `.claude`, `.opencode`, `.git`, `tests`, `node_modules`, `__pycache__`, `secrets`, etc.)
2. Target directories **that actually exist** - adapt to project structure, don't hardcode paths
3. Activate `sk:scout` skill to explore the code base and return detailed summary reports to the main agent
4. Merge scout reports into context summary

## Phase 2: Documentation Creation (doc-writer Agent)

**CRITICAL:** You MUST spawn `doc-writer` agent via Task tool with merged reports. Do not wait for user input.

Pass the gathered context to doc-writer agent to create initial documentation:
- `README.md`: Update README with initial documentation (keep it under 300 lines)
- `docs/project-overview-pdr.md`: Project overview and PDR (Product Development Requirements)
- `docs/codebase-summary.md`: Codebase summary
- `docs/code-standards.md`: Codebase structure and code standards
- `docs/system-architecture.md`: System architecture
- `docs/project-roadmap.md`: Project roadmap
- `docs/deployment-guide.md` [optional]: Deployment guide
- `docs/design-guidelines.md` [optional]: Design guidelines

## Phase 3: Size Check (Post-Generation)

After doc-writer completes:
1. Run `wc -l docs/*.md 2>/dev/null | sort -rn` to check LOC
2. Use `docs.maxLoc` from session context (default: 800)
3. For files exceeding limit:
   - Report which files exceed and by how much
   - doc-writer should have already split proactively
   - If still oversized, ask user: split now or accept as-is?

## Note on docs/specs/ (v2.0.0+)

`init` does NOT scaffold `docs/specs/`. The machine-generated spec layer is produced by `/tkm:rebuild-spec` after the codebase has measurable scope (routes, models, screens). If `docs/specs/` already exists at init time, leave it untouched. See `claude/skills/_shared/docs-canonical-mapping.md` for the layered model.
