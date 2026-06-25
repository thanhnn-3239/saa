# Clarifications — Profile bản thân (/profile)

MoMorph screen: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/3FoIx6ALVb

## Session 2026-06-25
- Q: Secret Box "Mở Secret Box" button (B.6) scope — open-box flow in scope? → A: Display only — show stat counts + button as link/placeholder; defer the open-box reveal/mutation flow to a separate plan.
- Q: Icon collection "Bộ sưu tập icon của tôi" (6 slots, B2–B7) rendering? → A: Show full badges catalog (ordered by weight); owned badges (user_badges) in color, locked badges gray. Matches spec A "gray if not unlocked".
- Q: Feed Sent/Received filter (C.3 "Đã gửi (5)") behavior? → A: Add sent/received dimension; options "Đã gửi (Sent)" + "Đã nhận (Received)" with count in label; default to Sent.
- Q: Route scope — self only or generic [userId]? → A: Self only at /profile (current logged-in user). Write components userId-parameterizable, but only /profile ships now; other-user profiles deferred.

## Defaulted assumptions (not asked — confirm if wrong)
- Q: Profile editing / avatar upload? → A: Read-only display (design shows no edit affordances). No edit/upload in this plan.
- Q: "Spam" tag + "IDOL GIỎI TRẺ" category label on cards (D.3.1)? → A: Reuse KudoPostCard as-is (published kudos only, no spam/category tag for end users). Design artifacts omitted; kudos has no category column.
- Q: Which statuses show in the Sent feed? → A: Published only, consistent with the public board.
