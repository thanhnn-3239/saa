import { describe, it, expect } from "vitest";
import { hydrateNotification } from "./hydrate";
import type { RawNotificationRow } from "./hydrate";

const baseRow: RawNotificationRow = {
  id: 42,
  type: "kudo_received",
  kudo_id: "kudo-1",
  is_read: false,
  created_at: "2026-06-23T10:00:00.000Z",
  actor_name: "Alice",
  kudo_title: "IDOL",
};

describe("hydrateNotification", () => {
  it("maps a raw row to a NotificationItem (camelCase)", () => {
    expect(hydrateNotification(baseRow)).toEqual({
      id: 42,
      type: "kudo_received",
      kudoId: "kudo-1",
      isRead: false,
      createdAt: "2026-06-23T10:00:00.000Z",
      actorName: "Alice",
      kudoTitle: "IDOL",
    });
  });

  it("falls back to empty actorName when null (masking edge)", () => {
    expect(hydrateNotification({ ...baseRow, actor_name: null }).actorName).toBe("");
  });

  it("preserves null kudoId / kudoTitle", () => {
    const item = hydrateNotification({ ...baseRow, kudo_id: null, kudo_title: null });
    expect(item.kudoId).toBeNull();
    expect(item.kudoTitle).toBeNull();
  });
});
