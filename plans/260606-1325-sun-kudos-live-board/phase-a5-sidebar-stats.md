# Phase A5 — Right Sidebar: Stats + Leaderboards UI

**Track:** A (UI) · **Status:** ✅ done · **Depends on:** A1 (primitives)

## MoMorph refs
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: ../260606-1325-sun-kudos-live-board/clarifications.md

## Goal
Section D: sticky right sidebar (independent scroll). Stats block (D.1): 5 labeled values — Số Kudos bạn
nhận được / đã gửi / Số tim bạn nhận được / Secret Box đã mở / chưa mở — with divider + **"Mở quà"**
button (D.1.8, opens a stub/placeholder). Two leaderboards (D.3): "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT"
and "10 SUNNER NHẬN QUÀ MỚI NHẤT" — each a vertical list of avatar + name + short description, click →
profile (stub). Empty list → "Chưa có dữ liệu".

## Out of scope
Real stats/leaderboard data + Mở quà flow + profile navigation → C1. Use Figma content as mock data.

## Integration contract
Takes `stats: SidebarStats`, `promotions: LeaderboardItem[]`, `giftReceivers: LeaderboardItem[]`,
`onOpenGift`, `onOpenProfile`. Consumes A1 primitives (avatar, section-header, empty-state).
