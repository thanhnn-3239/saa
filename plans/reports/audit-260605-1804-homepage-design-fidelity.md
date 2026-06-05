# Audit — Homepage SAA design fidelity vs MoMorph

Date: 2026-06-05 · Screen: Homepage SAA (`i87tDx10uM`) · Verified live at `localhost:3000` (desktop 1440 / tablet 768 / mobile 375) vs MoMorph frame image + node specs.

## Verdict: high fidelity. 1 content bug found + fixed this round; earlier rounds fixed countdown + ROOT FURTHER + responsive.

## Section-by-section

| Section | Match | Notes |
|---------|-------|-------|
| **Header** | ✅ | Logo, nav (About SAA 2025 active / Award Information / Sun* Kudos), VN switcher. Bell + account menu hidden for guest (design shows them = authenticated state; render conditionally — correct). |
| **Hero — ROOT FURTHER** | ✅ | Large title; ROOT centered over FURTHER. |
| **Hero — Coming soon** | ⚠️ minor | We render "Coming soon"; design literally has the typo "Comming soon". Intentional correction — confirm if you want the typo kept. |
| **Countdown** | ✅ (fixed) | Was washed-out (opacity on whole tile) + font not loaded. Now: glass tile dimmed only, digits full-white in 7-segment "Digital Numbers" (DSEG7, self-hosted). Updates per minute (no seconds) — per spec B1.3. |
| **Event info** | ✅ | "Thời gian: 26/12/2025 / Địa điểm: Âu Cơ Art Center / Tường thuật trực tiếp qua sóng Livestream". (Static text date 26/12/2025 is design value; live countdown uses `NEXT_PUBLIC_EVENT_DATETIME`.) |
| **CTA buttons** | ✅ | ABOUT AWARDS (filled gold) + ABOUT KUDOS (outline). |
| **Root Further content (B4)** | ✅ (fixed) | ROOT now centered over FURTHER (+51px); justified paragraphs + centered quote. |
| **Awards — caption** | ✅ (fixed this round) | **Bug:** caption showed "ABOUT AWARDS" (hero CTA text mistakenly reused). Fixed → "Sun* annual awards 2025" per spec C1. |
| **Awards — grid** | ✅ | 6 cards (Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP), orb graphics, title, 2-line desc, "Chi tiết". Desktop 3-col, tablet/mobile 2-col. Cards link `/awards-information#<slug>`. |
| **Sun* Kudos (D)** | ✅ | Label "Phong trào ghi nhận", title, "ĐIỂM MỚI…" desc, "Chi tiết" button, KUDOS logo + gold gradient right. Mobile reflows to single column. |
| **Floating widget** | ✅ | Gold pill bottom-right, opens placeholder menu. |
| **Footer** | ✅ | Logo, nav + "Tiêu chuẩn chung", "Bản quyền thuộc về Sun* © 2025". |

## Fixes applied across this session
1. Countdown opacity layering (digits now visible) + 7-segment font self-hosted (`public/fonts/DSEG7Modern-*.woff2`, `@font-face` "Digital Numbers").
2. **proxy.ts matcher** excluded fonts — was 307-redirecting all `.woff2` to `/login` (would break every web-font in production). Fixed.
3. ROOT centered over FURTHER (hero + B4).
4. Mobile/tablet horizontal-overflow fixed (countdown + Kudos used fixed px).
5. Page `<title>` set ("Sun* Annual Awards 2025 — ROOT FURTHER").
6. Awards caption "ABOUT AWARDS" → "Sun* annual awards 2025".

## Minor / open items
- "Comming soon" design typo — we use correct "Coming soon". Confirm preference.
- Spec C1 mentions a sub-description ("Các hạng mục sẽ được trao giải theo TOP…") under the awards heading; not present in the rendered design frame nor implemented. Confirm if needed.
- EN locale copy currently mirrors VN where translation was non-obvious (per plan: "VN authored, EN mirrored").
- Deferred per clarifications: real notifications, roles/Admin Dashboard, widget menu options, full target pages (stubs only).

## Status
250/250 tests pass, build green. UI matches design on all sections after fixes.
