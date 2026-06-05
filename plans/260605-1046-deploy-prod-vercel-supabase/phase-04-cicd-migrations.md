# Phase 04 — CI/CD: GitHub Action for migrations

**Priority:** Medium · **Status:** pending · **Depends on:** 01 (parallel-safe with 02/03)

Vercel already auto-deploys the front end on push to `main` (Phase 02 Git connection). This phase adds
the **other half**: auto-push DB migrations to Supabase Cloud when they change. Vercel never touches the DB.

## Create `.github/workflows/supabase-migrations.yml`
```yaml
name: Supabase migrations
on:
  push:
    branches: [main]
    paths: ["supabase/migrations/**"]   # only run when migrations change
jobs:
  push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v2
        with: { version: latest }
      - run: supabase link --project-ref "$SUPABASE_PROJECT_REF"
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_REF:  ${{ secrets.SUPABASE_PROJECT_REF }}
          SUPABASE_DB_PASSWORD:  ${{ secrets.SUPABASE_DB_PASSWORD }}
      - run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD:  ${{ secrets.SUPABASE_DB_PASSWORD }}
```

## GitHub repo secrets (Settings → Secrets and variables → Actions)
| Secret | Source |
|--------|--------|
| `SUPABASE_ACCESS_TOKEN` | Supabase account → Access Tokens (generate a CI token) |
| `SUPABASE_PROJECT_REF`  | the project ref from Phase 01 |
| `SUPABASE_DB_PASSWORD`  | the DB password saved in Phase 01 |

## Todo
- [x] Author `.github/workflows/supabase-migrations.yml` (YAML-validated; `setup-cli@v2`, path filter, concurrency guard) — 2026-06-05
- [ ] Generate a Supabase access token for CI
- [ ] Add the 3 repo secrets (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`)
- [ ] Commit + push the workflow file
- [ ] Test: push a no-op migration tweak on a branch → merge → watch the Action push it
- [ ] Confirm `supabase migration list` shows remote in sync after the run

## Success criteria
- Merging a migration change to `main` applies it to Cloud automatically; non-migration pushes skip the job.

## Security
- `setup-cli@v2` is the current action (verified). Never echo secrets in logs.
- Token is account-scoped — use a dedicated CI token, revocable independently.

## Risks
- **`db push` mid-deploy ordering:** if a migration renames a column the running app reads, the Vercel
  deploy and the migration race. For this app's additive schema it's low risk; for breaking changes,
  use expand/contract (add new → deploy app → remove old) rather than one-shot.
- **Forgotten path filter** → Action runs on every push (wasteful, not harmful). Keep the `paths:` filter.
