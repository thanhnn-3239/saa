# Phase 05 — Production verification

**Priority:** High · **Status:** pending · **Depends on:** 03 (and 02)

Prove the deploy actually works end-to-end before calling it done. Manual checks + one bundle grep.

## Checks
1. **App loads:** open `https://<app>.vercel.app` → home + `/login` render; no console errors.
2. **OAuth — allow path:** sign in with a `@sun-asterisk.com` Google account → lands authenticated on `/`.
3. **OAuth — deny path:** sign in with a non-`@sun-asterisk.com` account → redirected to
   `/login?error=domain`, session signed out (server-side enforcement).
4. **OAuth — decline path:** cancel Google consent → `/login?error=access_denied` (or `oauth`).
5. **i18n:** switch locale vi ↔ en → UI changes and persists across reload via `NEXT_LOCALE` cookie.
6. **Data path:** an authenticated read against the Cloud DB returns rows under RLS (no 401/empty
   due to a missing policy). Confirms migrations + RLS landed correctly.
7. **No secret leak:** download the client bundle and grep — only the publishable key may appear:
   ```bash
   # after `vercel pull` / from a local prod build:
   grep -rn "sb_secret\|service_role\|GOOGLE_CLIENT_SECRET" .next/static/ && echo "LEAK!" || echo "clean"
   ```
   (Should print `clean` — we never set a secret in Vercel anyway.)
8. **Preview deploy:** open a PR → preview URL OAuth completes (proves Supabase wildcard allow-list).

## Todo
- [ ] App + /login render on prod
- [ ] OAuth allow / deny / decline paths all behave
- [ ] i18n vi↔en persists via cookie
- [ ] Authenticated RLS read returns data
- [ ] Bundle grep = clean (no secret)
- [ ] Preview deploy OAuth works

## Success criteria
- All checks pass → Definition of Done in `plan.md` met.

## Follow-ups (out of scope here)
- Update `README.md` deploy runbook + mark `docs/tech-stack-decision.md` stage = "Deployed".
- Mark old `260603-1716-.../phase-05` as superseded by this plan.
- Custom domain (deferred): when added, update Supabase Site URL + allow-list + Google redirect URI.
