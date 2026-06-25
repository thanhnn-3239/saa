import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { NotificationsList } from "./notifications-list";
import type { NotificationItem } from "@/lib/notifications/types";

const { mockPush, state } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  state: {
    items: [] as NotificationItem[],
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    markOne: vi.fn(),
    markAll: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock("@/lib/notifications/use-notifications", () => ({
  useNotifications: () => ({
    data: { pages: [{ items: state.items, nextCursor: null }] },
    hasNextPage: state.hasNextPage,
    fetchNextPage: state.fetchNextPage,
    isFetchingNextPage: false,
  }),
}));
vi.mock("@/lib/notifications/use-mark-read", () => ({
  useMarkRead: () => ({ markOne: state.markOne, markAll: state.markAll, isPending: false }),
}));

const item: NotificationItem = {
  id: 7, type: "kudo_received", kudoId: "kudo-7", isRead: false,
  createdAt: "2026-06-23T10:00:00.000Z", actorName: "Bob", kudoTitle: null,
};

function renderList() {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <NotificationsList />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  state.items = [];
  state.hasNextPage = false;
  mockPush.mockReset();
  state.fetchNextPage.mockReset();
  state.markOne.mockReset();
});

describe("NotificationsList", () => {
  it("shows the empty state with no items", () => {
    renderList();
    expect(screen.getByText("No new notifications.")).toBeInTheDocument();
  });

  it("renders items and navigates on click", async () => {
    state.items = [item];
    const user = userEvent.setup();
    renderList();
    await user.click(screen.getByText("Bob just sent you a kudo!"));
    expect(state.markOne).toHaveBeenCalledWith(7);
    expect(mockPush).toHaveBeenCalledWith("/sun-kudos?kudo=kudo-7");
  });

  it("shows Load more and fetches the next page when present", async () => {
    state.items = [item];
    state.hasNextPage = true;
    const user = userEvent.setup();
    renderList();
    await user.click(screen.getByRole("button", { name: /Load more/i }));
    expect(state.fetchNextPage).toHaveBeenCalled();
  });
});
