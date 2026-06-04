# Phase 03 — DB Migrations, Seeds & Example Read

**Priority:** High · **Status:** pending · **Depends on:** 02

Prove the full data path end-to-end: a migration creates an RLS-protected table, a seed populates
it, and a Server Component reads it through the Supabase server client. This is the smoke test for
the entire foundation.

## Key Insights
- `supabase init` is done; migrations live in `supabase/migrations/`, seeds in `supabase/seeds/{common,dev}`.
- `supabase db reset` drops the local DB, reapplies ALL migrations, then runs seeds — the canonical local reset.
- `config.toml` may reference `SUPABASE_EXTRA_SEEDS`; if `db reset` warns, set it to `""` in `.env.local`.
- Example table must have RLS enabled with an explicit policy, or reads return empty / setup looks "broken".

## Related Code Files
**Create:**
- `supabase/migrations/<timestamp>_create_notes.sql`
- `supabase/seeds/dev/notes.sql` (or wire via `config.toml [db.seed]`)
- `app/notes/page.tsx` — example Server Component reading `notes`
**Modify:** `supabase/config.toml` (only if seed paths need wiring), `app/page.tsx` (optional link)

## Implementation Steps
1. **Create the migration:** `supabase migration new create_notes`, then edit the SQL:
   ```sql
   create table if not exists public.notes (
     id          bigint generated always as identity primary key,
     title       text not null,
     created_at  timestamptz not null default now()
   );

   alter table public.notes enable row level security;

   -- Foundation demo: allow anonymous read (tighten once auth UI is added).
   create policy "notes are publicly readable"
     on public.notes for select
     to anon, authenticated
     using (true);
   ```
2. **Seed data** — `supabase/seeds/dev/notes.sql`:
   ```sql
   insert into public.notes (title) values
     ('First note from Supabase'),
     ('Second note'),
     ('Hello from the local stack');
   ```
   Ensure `config.toml [db.seed]` includes this path (CLI seeds `supabase/seed.sql` by default;
   confirm the existing `seeds/` wiring or add `sql_paths = ["./seeds/**/*.sql"]`).
3. **Apply locally:** `supabase start` (Phase 04 covers Docker; CLI start works standalone),
   then `supabase db reset` to apply migration + seed. Capture keys from `supabase status` into `.env.local`.
4. **Example Server Component** — `app/notes/page.tsx`:
   ```tsx
   import { createClient } from '@/lib/supabase/server'

   export default async function NotesPage() {
     const supabase = await createClient()
     const { data: notes, error } = await supabase
       .from('notes')
       .select('id, title, created_at')
       .order('created_at', { ascending: false })

     if (error) return <pre className="p-8 text-red-600">{error.message}</pre>

     return (
       <main className="mx-auto max-w-xl p-8">
         <h1 className="mb-4 text-2xl font-semibold">Notes</h1>
         <ul className="space-y-2">
           {notes?.map((n) => (
             <li key={n.id} className="rounded border p-3">{n.title}</li>
           ))}
         </ul>
       </main>
     )
   }
   ```
5. **Verify:** `pnpm dev` → visit `/notes` → seeded rows render. This confirms client + RLS + migration + seed.
6. **Compile check:** `pnpm run build`.

## Todo
- [ ] `supabase migration new create_notes` + SQL with RLS policy
- [ ] seed file + confirm `config.toml` seed wiring
- [ ] `supabase db reset` applies cleanly
- [ ] `app/notes/page.tsx` renders seeded rows
- [ ] `pnpm run build` passes

## Success Criteria
- `/notes` shows 3 seeded rows in dev.
- `supabase db reset` is idempotent and warning-free.

## Security Considerations
- RLS enabled on every table from day one. The public-read policy here is a demo affordance —
  flag it in docs as "loosen/tighten when auth lands."
- Never disable RLS to "make it work"; fix the policy instead.

## Risks
- **Empty `/notes`** almost always = missing/incorrect RLS policy or unseeded DB → re-run `db reset`, check policy.
- **Seed not applied:** verify the seed path is registered in `config.toml` `[db.seed]`.
