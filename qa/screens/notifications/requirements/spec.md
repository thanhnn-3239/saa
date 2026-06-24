# notifications Screen Specification

## Overview
- **URL Path:** /notifications
- **Auth Required:** yes (`@auth:member` — member03 session via /auto-login)
- **Platform:** web

The full notifications list page. Server-prefetches the first page of the
current user's notifications and renders a client infinite list. Reached from
the bell dropdown's "View all" link or directly by URL.

## Sections

### Section: Page header
- **Type:** navigation
- **Description:** Title plus a "mark all as read" action. Both render
  unconditionally (independent of whether any notifications exist).

#### Actions
| Action | Element | Behavior |
|--------|---------|----------|
| Mark all as read | button "Đánh dấu đọc tất cả" | Marks every unread notification read; badge → 0 |

### Section: Notification list
- **Type:** list
- **Description:** One row per notification (icon, localized sentence, date,
  unread dot). Clicking a row marks it read and navigates to
  `/sun-kudos?kudo=<id>`. A "Load more" button appears only when more pages
  exist. When the member has no notifications, an empty-state message renders
  instead ("Chưa có thông báo mới.").

## States
| State | Trigger | UI |
|-------|---------|----|
| Empty | member has no notifications | empty-state text, no list |
| Populated | member has ≥1 notification | list of rows; "Load more" if paginated |

## Notes
- The header bell dropdown (open/preview/realtime badge) is covered by the
  hand-written suite (`e2e/notifications.authed.spec.ts`) per the two-tier
  convention in `docs/sungen-pilot.md` — sungen owns the static page here.
- Anonymous-kudo notifications surface the alias / "Ẩn danh", never the real
  sender (masked in the `notification_feed` DB view).
