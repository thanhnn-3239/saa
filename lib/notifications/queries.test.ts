import { describe, it, expect } from "vitest";
import { buildNotificationsPage } from "./queries";
import type { RawNotificationRow } from "./hydrate";

function row(id: number): RawNotificationRow {
  return {
    id,
    type: "kudo_received",
    kudo_id: `kudo-${id}`,
    is_read: false,
    created_at: "2026-06-23T10:00:00.000Z",
    actor_name: "Alice",
    kudo_title: null,
  };
}

describe("buildNotificationsPage", () => {
  it("returns no nextCursor when rows do not exceed the limit", () => {
    const page = buildNotificationsPage([row(3), row(2)], 20);
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBeNull();
  });

  it("trims the extra row and sets nextCursor to the last kept id", () => {
    // limit 2, 3 rows fetched (limit + 1) → hasMore
    const page = buildNotificationsPage([row(5), row(4), row(3)], 2);
    expect(page.items.map((i) => i.id)).toEqual([5, 4]);
    expect(page.nextCursor).toBe(4);
  });
});
