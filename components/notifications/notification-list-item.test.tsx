import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { NotificationListItem } from "./notification-list-item";
import type { NotificationItem } from "@/lib/notifications/types";

const item: NotificationItem = {
  id: 1,
  type: "kudo_received",
  kudoId: "kudo-1",
  isRead: false,
  createdAt: "2026-06-23T10:00:00.000Z",
  actorName: "Alice",
  kudoTitle: null,
};

function renderItem(props: Partial<NotificationItem> = {}, onSelect = vi.fn()) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <NotificationListItem item={{ ...item, ...props }} onSelect={onSelect} />
    </NextIntlClientProvider>,
  );
  return { onSelect };
}

describe("NotificationListItem", () => {
  it("renders the localized kudo_received sentence with the actor name", () => {
    renderItem();
    expect(screen.getByText("Alice just sent you a kudo!")).toBeInTheDocument();
  });

  it("calls onSelect with the item when clicked", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderItem();
    await user.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  it("shows the unread indicator only when isRead is false", () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <NotificationListItem item={{ ...item, isRead: true }} onSelect={vi.fn()} />
      </NextIntlClientProvider>,
    );
    expect(container.querySelector('[data-unread="true"]')).toBeNull();
  });
});
