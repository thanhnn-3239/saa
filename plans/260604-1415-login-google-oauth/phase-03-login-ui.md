# Phase 03 — Login screen UI (Track A)

## MoMorph refs
- Login: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
- Clarifications: [clarifications.md](clarifications.md)

**Goal:** Code the Login screen UI pixel-faithful to the MoMorph design via the
`momorph-implement-design` skill. Use Figma design content as mock data — do NOT invent data.

**Components (from specs):** A Header (A.1 SAA Logo → homepage, A.2 VN/EN language switcher w/ flag+chevron+dropdown), B Main (B.1 "ROOT FURTHER" key visual, B.2 welcome text, B.3 Google login button), C full-screen background art, D copyright footer.

**Out of scope (handled in phase-04 integration):**
- Wiring login button to real OAuth (`signInWithGoogle`) — render presentational button + loading/disabled/hover states + `onClick`/`disabled`/`loading` props only.
- Error banner data — accept an `error?` prop; integration supplies it from `?error=`.
- Real language switching / i18n — dropdown opens with mock VN/EN options; default VN.

**Integration contract (props the page wires up):**
- `LoginButton`: `{ onClick, loading, disabled }`
- `LoginErrorBanner`: `{ code?: string }` (renders nothing when absent)
- Page reads `searchParams.error` (server) and renders inert UI otherwise.

**Files:** `app/login/page.tsx` + presentational components under `app/login/_components/` (kebab-case). Keep each file < 200 lines.

**Status:** completed

**Known follow-up items:**
- Background artwork (mms_C_Keyvisual) had no Figma export → gradient placeholder used; needs real asset replacement in future iteration.
- Language switcher UI-only; real i18n + i18n routing deferred to future plan.
