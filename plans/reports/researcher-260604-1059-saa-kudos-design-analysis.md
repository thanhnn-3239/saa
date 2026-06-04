# SAA 2025 Kudos — Design Analysis for Backend Architecture

File: `9ypp4enmFmdK3YAFJLIu6C` ("SAA 2025 - Internal Live Coding"). Web + iOS variants exist; web is canonical. Source = MoMorph specs (only 8 screens have real specs/`Spec Created`; admin screens are empty placeholder frames). Confidence noted per item.

## 1. Data Entities (inferred)

| Entity | Key fields | Relationships | Source |
|---|---|---|---|
| **User (Sunner)** | id, name, avatar, email (Google), department, role(normal/admin) | M:N Department; 1:N Kudo (sent/received); 1:N SecretBox; M:N Badge/Title | Login, Profile, Admin dropdown |
| **Department** | id, name | M:N User; used as filter facet | Dropdown Phòng ban, filters |
| **Kudo** | id, sender_id, recipient_id, content(rich text/HTML), is_anonymous(bool), anon_name, created_at, status(public/spam/hidden), award_title?(optional) | sender→User, recipient→User; M:N Hashtag; 1:N Image; 1:N Link | Viết Kudo spec (26 items), Profile feed, Live board |
| **KudoRecipient** | likely single recipient per kudo (search selects one); confirm if multi | FK Kudo↔User | Viết Kudo (B "Người nhận", single search field) |
| **Hashtag** | id, label | M:N Kudo; filter facet; max 5 per kudo, min 1 | Viết Kudo (E), Hashtag filter dropdown |
| **KudoImage** | id, kudo_id, url | N:1 Kudo; max 5 per kudo | Viết Kudo (F, image_upload) |
| **KudoLink** | id, kudo_id, url, open_in_new_tab | N:1 Kudo (rich-text inline links) | Viết Kudo (C.5 link), Addlink Box |
| **Award/Prize (Giải thưởng)** | id, name, description, image, quantity, value(VND), category, scope(individual/team) | catalog, read-only display | Hệ thống giải (22 items) |
| **Badge/Title (Huy hiệu / Danh hiệu)** | id, name, image, rarity/probability | M:N User (collection); awarded via SecretBox | Open secret box, Profile (Danh hiệu, "Bộ sưu tập icon của tôi") |
| **SecretBox** | id, owner_id, status(unopened/opened), opened_at, awarded_badge_id | N:1 User; 1:1 Badge on open | Open secret box ("Số box chưa mở") |
| **Notification** | id, user_id, type, read(bool), payload | N:1 User | Header notification bell + badge dot |
| **Campaign** | id, name, start/end dates, status | drives event period; admin CRUD | Admin - Setting - Campaign (placeholder), Action-Campaign |
| **UserStatistics** (likely derived/aggregate) | kudos_sent, kudos_received, badges, ranking metrics (~7 tiles) | per User | Profile "Thống kê" (7-tile block) |

Distinct named badges w/ drop rates (server-authoritative): Stay Gold 30%, Touch of Light 20%, Flow to Horizon 25%, Beyond the Boundary 10%, Revival 10%, Root Further 5%.

Award categories: Top Talent (qty 10 / 7M VND), Top Project (02 / 15M), Top Project Leader (03 / 7M), Best Manager (01 / 10M), Signature 2025-Creator (01 / 5M indiv, 8M team), MVP (01 / 15M).

## 2. Core User Flows

- **Login** — Google OAuth only (`mms_B.3` Google sign-in → redirect Homepage; loading/error states). No password. CONFIDENCE: high.
- **Write Kudo** (Viết Kudo, modal): pick ONE recipient via autocomplete search of Sunners (required) → optional award/title field → rich-text body (B/I/strike/list/quote/link, @-mention support, required) → ≥1 ≤5 hashtags (required) → ≤5 images (optional) → optional "send anonymous" toggle (reveals anon-name field) → Cancel/Send. Send disabled until required fields filled; server validates recipient is a real Sunner. No points/balance shown — kudos are NOT a point-currency in this design.
- **Open Secret Box** (Open secret box): user has N unopened boxes ("Số box chưa mở"); click box → server picks 1 random badge by fixed probability table → adds badge to collection, decrements unopened count; disabled when count=0; one badge per open. Animation present (box-open effect). MUST be server-authoritative.
- **Live board / Feed** (Sun* Kudos - Live board): Spotlight section (118 child nodes = large dynamic feed) + "All kudos" list; supports KUDO + KUDO-spam item variants. Homepage also shows award list + kudos teaser.
- **Profile** (Profile bản thân): avatar, name, detail info, department, title/badge collection (Danh hiệu, 6 slots), my-icon collection, 7-tile stats block, personal kudo feed (received). "Profile người khác" variant = other users' public profile.
- **Award system page** (Hệ thống giải): read-only catalog w/ left-nav jump links to 6 categories.
- **Rules** (Thể lệ UPDATE): static rules modal + "Viết kudos" CTA.
- **Prelaunch** (Countdown): full-screen days/hours/minutes countdown to event start, auto-updating.
- **Admin** (placeholder frames, no specs): Overview/dashboard, Review content (moderation + search), Setting (Campaign CRUD: add/edit/delete + date picker), User management, Role dropdown.

## 3. Backend-Decision Signals

| Signal | Present? | Where | Note |
|---|---|---|---|
| **Auth & roles** | YES | Login (Google OAuth), Admin-profile dropdown has **Dashboard** entry vs normal dropdown (Profile/Logout only); Error 403 page; iOS "Access denied" | Two roles min: normal vs admin. OAuth (Google Workspace) → likely domain-restricted. |
| **Transactions / atomicity** | YES | Open secret box (decrement unopened count + award badge atomically, once); Kudo create (kudo + hashtags + images in one tx) | No point-balance decrement on giving kudos (kudos are not currency here). Box-open is the critical atomic op. |
| **Realtime** | LIKELY | Live board (Spotlight ~118 nodes, "live"), Notification bell + unread dot, iOS Notifications screen | Live board name implies push/auto-refresh; notifications need push or polling. Confirm websocket vs polling. |
| **File/image upload** | YES | Viết Kudo (≤5 images), avatars, badge images, award images | Need object storage + image handling; link preview (Addlink Box) optional. |
| **Scheduling / time-gating** | YES | Countdown prelaunch (server time → event start), Campaign start/end dates (admin), Thể lệ rules | Event window gating; pre-launch lock; server clock authoritative. |
| **Randomness / server-authoritative** | YES (critical) | Open secret box — fixed % drop table (30/25/20/10/10/5) | MUST be decided server-side; never trust client. Anti-tamper on box count. |
| **Aggregations / leaderboard** | YES | Profile 7-tile stats, Live board spotlight, award context | Counts of sent/received kudos, badge collections; potentially heavy — consider materialized/cached aggregates. No explicit ranked leaderboard table seen, but stats + spotlight imply ranking queries. |
| **Filtering / search** | YES | Hashtag filter dropdown, Department dropdown, recipient autocomplete search, filter "đã nhận/gửi" (received/sent), status filter, Admin review search | Need indexed search on users (autocomplete) + faceted filter on kudos (hashtag, dept, sent/received, status). |
| **i18n** | YES | Language dropdown (VN/EN) on every screen incl. Login | UI i18n at minimum; confirm whether user-generated content (kudos/rules/awards) is localized or pass-through. Rules/award text likely need localized copy. |
| **Admin operations** | YES | Admin Overview, Review content (moderation — spam/hide; "KUDO spam" variant + Action-Spam/Public), Campaign CRUD w/ date picker, User mgmt, Role dropdown | Moderation workflow (mark spam/public/hide), campaign lifecycle, user/role management. |
| **Anonymous kudos** | YES | Viết Kudo anon toggle, "View kudo ẩn danh", "Ẩn danh" screen | Store sender but hide from public view; admin may still see sender (confirm). |

## 4. Open Questions / Ambiguities

1. **Single vs multi recipient** per kudo — search field looks single-select; "Dropdown list người nhận" exists. Confirm multi-recipient support.
2. **Are kudos a point economy?** No balance/points UI seen. Likely pure recognition (unlimited send). Confirm.
3. **How are SecretBoxes earned?** Count exists but no flow shows granting (e.g. per kudo sent/received, per campaign milestone?). Critical for box lifecycle.
4. **Realtime transport** — Live board & notifications: websocket vs SSE vs polling? Not specified.
5. **Anonymous visibility to admin** — does moderation reveal anonymous sender? Affects data model (always store sender_id).
6. **i18n scope** — UI-only, or are awards/rules/badge names localized content (needs translation tables)?
7. **Award winners** — Hệ thống giải is read-only catalog; is there a winners/results entity, or are awards purely informational? No winner-assignment flow seen.
8. **Leaderboard** — stats tiles exist but no explicit ranked board; is ranking a feature or just personal stats?
9. **Spam detection** — automatic or manual-only (admin review)? "KUDO spam" + Action-Spam suggest a status, mechanism unclear.
10. **Login domain restriction** — Google OAuth: restricted to Sun* workspace domain? Affects auth config.

## Key takeaways for BE

- **Server-authoritative randomness** (secret box) + **atomic decrement** = the single most important correctness constraint.
- **Auth = Google OAuth, 2 roles** (user/admin); admin has full moderation + campaign CRUD.
- **Time-gating** via campaign dates + prelaunch countdown (server clock).
- **Realtime-ish** needs (live board + notifications) — pick a transport.
- **Faceted filtering/search** + **image upload** + **i18n** are baseline.
- Kudos appear to be **non-currency recognition** (no point balance) — verify.
