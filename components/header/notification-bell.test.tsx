import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { NotificationBell } from "./notification-bell";
import type { NotificationItem } from "@/lib/notifications/types";

const { mockPush, state } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  state: {
    unread: 2,
    items: [] as NotificationItem[],
    markOne: vi.fn(),
    markAll: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock("@/lib/notifications/use-notifications-realtime", () => ({
  useNotificationsRealtime: vi.fn(),
}));
vi.mock("@/lib/notifications/use-unread-count", () => ({
  useUnreadCount: () => ({ data: state.unread }),
}));
vi.mock("@/lib/notifications/use-notifications", () => ({
  useNotifications: () => ({ data: { pages: [{ items: state.items, nextCursor: null }] } }),
}));
vi.mock("@/lib/notifications/use-mark-read", () => ({
  useMarkRead: () => ({ markOne: state.markOne, markAll: state.markAll, isPending: false }),
}));

const sampleItem: NotificationItem = {
  id: 1, type: "kudo_received", kudoId: "kudo-9", isRead: false,
  createdAt: "2026-06-23T10:00:00.000Z", actorName: "Alice", kudoTitle: null,
};

function renderBell() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <NotificationBell />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  state.unread = 2;
  state.items = [];
  mockPush.mockReset();
  state.markOne.mockReset();
  state.markAll.mockReset();
});

describe("NotificationBell", () => {
  it("shows the unread badge count", () => {
    renderBell();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("hides the badge when there are no unread notifications", () => {
    state.unread = 0;
    renderBell();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("opens the panel and shows the empty state when there are no items", async () => {
    const user = userEvent.setup();
    renderBell();
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await waitFor(() => {
      expect(screen.getByText("No new notifications.")).toBeInTheDocument();
    });
  });

  it("marks read and navigates to the kudo when an item is clicked", async () => {
    state.items = [sampleItem];
    const user = userEvent.setup();
    renderBell();
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await user.click(await screen.findByText("Alice just sent you a kudo!"));
    expect(state.markOne).toHaveBeenCalledWith(1);
    expect(mockPush).toHaveBeenCalledWith("/sun-kudos?kudo=kudo-9");
  });

  it("calls markAll when the header button is clicked", async () => {
    const user = userEvent.setup();
    renderBell();
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await user.click(await screen.findByRole("button", { name: /Mark all as read/i }));
    expect(state.markAll).toHaveBeenCalled();
  });

  it("closes the panel when a pointer press lands outside the bell", async () => {
    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <div>
          <button type="button">outside</button>
          <NotificationBell />
        </div>
      </NextIntlClientProvider>,
    );
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    expect(await screen.findByText("No new notifications.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "outside" }));
    await waitFor(() => {
      expect(screen.queryByText("No new notifications.")).not.toBeInTheDocument();
    });
  });
});
