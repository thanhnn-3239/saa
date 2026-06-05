# Clarifications — Homepage SAA

MoMorph: Homepage SAA — https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
Specs: 46 design items · Test cases: 62

## Session 2026-06-05

- Q: Should `/` be public or stay protected (proxy redirects guests to /login)? → A: Make `/` PUBLIC. Guests see marketing content; authenticated users additionally get notification bell + account menu. Update proxy.ts to allow `/` for guests. Matches ID-0/ID-1.
- Q: Build scope for features pointing at non-existent systems (notifications, roles, target pages, widget menu)? → A: UI shell + working basics. Full homepage UI + working countdown, language switch, sign-out, responsive. Notification bell / account menu / widget render and open but with placeholder/empty content. No new DB/notification/role system.
- Q: How to handle header/footer/CTA/card links to unbuilt pages (Awards Information, Sun* Kudos, Tiêu chuẩn chung)? → A: Create minimal stub route pages ("coming soon") so links resolve (ID-59 no broken links). Award-card hash anchors (#slug) point at the awards-information stub.
- Q: i18n content scope (design is Vietnamese only, app supports vi+en)? → A: VN authored, EN mirrored. All copy authored in messages/vi.json; same keys added to en.json (VN text as placeholder / light EN where obvious). All strings go through next-intl.
- Q: Awards data source — static or DB? → A: Static hardcoded dataset (6 categories: Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP). No DB. Content via i18n keys; slug per category for hash anchor.
- Q: Countdown event datetime source & format? → A: `NEXT_PUBLIC_EVENT_DATETIME` env var, ISO-8601 (e.g. 2025-12-26T18:30:00+07:00). Client component ticks per minute. At/after event: show 00/00/00 and hide "Coming soon". Invalid/missing → graceful fallback, no crash (ID-41/42/43/56/57/60).
- Q: Account menu "Admin Dashboard" item — roles don't exist yet? → A: Gate on a role claim if present; no role system exists, so Admin Dashboard item is hidden by default. ID-5/ID-37 (admin-only menu) deferred until a role system exists — documented as known limitation.
- Q: Awards grid responsive columns (specs conflict: one says 1-col mobile)? → A: Desktop 3 columns, tablet/mobile 2 columns (per test cases ID-15/ID-16, authoritative).
- Q: Header/footer reuse across future pages? → A: Build AppHeader/AppFooter as shared components consumed by a public route-group layout, so stub pages reuse them.

## Session 2026-06-05 #2 (Phase D — FAB + Thể lệ, new scope)

- Q: Why weren't the FAB/Thể lệ screens in the original plan? → A: Homepage spec item 6 only described the widget as "opens menu" (no detail); FAB expanded + Thể lệ are SEPARATE MoMorph frames (_hphd32jN2, Sv7DFwBw1h, b1Filzi9i6) supplied later. Widget was a documented placeholder. Now added as Phase D1.
- Q: Is the FAB shown to guests or only authenticated users? → A: Visible to ALL (design has no auth condition on the homepage widget).
- Q: What does "Thể lệ" open? → A: A right-side drawer (frame b1Filzi9i6) with the rules content. Close via Đóng / × / overlay click / Esc. Public content.
- Q: What does "Viết KUDOS" do? → A: Placeholder — button present + styled, click is a TODO no-op. No write-kudos design provided; real flow deferred.
- Q: i18n for the new content? → A: New keys under Home.fab (labels) + Home.rules (Thể lệ content). VN authored, EN mirrored.
- Q: Assets (6 collection icons, hero badges)? → A: Download from the Thể lệ frame to public/homepage-saa/ via momorph-implement-design. No invented data.

## Unresolved / deferred
- Real notification system (panel content, badge data) — out of scope; bell opens empty placeholder panel.
- User role system (admin vs regular) — out of scope; ID-5/ID-37 deferred.
- Widget quick-action menu options — undefined in design; placeholder menu only.
- Awards Information / Sun* Kudos / Tiêu chuẩn chung full pages — stub only in this plan.
