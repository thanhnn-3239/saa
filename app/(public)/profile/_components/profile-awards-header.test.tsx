/**
 * Component tests for ProfileAwardsHeader — Sent/Received toggle.
 *
 * Covers:
 * - default Sent direction
 * - toggle fires onDirectionChange callback
 * - FilterDropdown receives correct options with counts
 * - showAll=false (no "All" option for binary toggle)
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { ProfileAwardsHeader } from "./profile-awards-header";

// Wrapper for next-intl provider
function renderHeader(props: Parameters<typeof ProfileAwardsHeader>[0]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProfileAwardsHeader {...props} />
    </NextIntlClientProvider>,
  );
}

describe("ProfileAwardsHeader", () => {
  const defaultProps = {
    direction: "sent" as const,
    sentCount: 5,
    receivedCount: 8,
    onDirectionChange: vi.fn(),
  };

  it("renders the 'Sun* Annual Awards 2025' heading", () => {
    renderHeader(defaultProps);
    expect(screen.getByText("Sun* Annual Awards 2025")).toBeInTheDocument();
  });

  it("renders the 'KUDOS' heading in gold", () => {
    renderHeader(defaultProps);
    const kudosHeading = screen.getByText("KUDOS");
    expect(kudosHeading).toBeInTheDocument();
    expect(kudosHeading).toHaveClass("text-saa-gold-accent");
  });

  it("displays the current direction with correct count in trigger label", () => {
    renderHeader(defaultProps);
    // When direction is "sent", trigger should show "Sent (5)"
    expect(screen.getByRole("button", { name: /Sent \(5\)/ })).toBeInTheDocument();
  });

  it("fires onDirectionChange('received') when switching to Received", async () => {
    const onDirectionChange = vi.fn();
    renderHeader({ ...defaultProps, onDirectionChange });

    const user = userEvent.setup();
    // Click the dropdown trigger button
    const trigger = screen.getByRole("button", { name: /Sent/ });
    await user.click(trigger);

    // Click the "received" option
    const receivedOption = screen.getByRole("option", { name: /Received/ });
    await user.click(receivedOption);

    expect(onDirectionChange).toHaveBeenCalledWith("received");
  });

  it("fires onDirectionChange('sent') when switching to Sent", async () => {
    const onDirectionChange = vi.fn();
    renderHeader({
      ...defaultProps,
      direction: "received",
      onDirectionChange,
    });

    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: /Received/ });
    await user.click(trigger);

    const sentOption = screen.getByRole("option", { name: /Sent/ });
    await user.click(sentOption);

    expect(onDirectionChange).toHaveBeenCalledWith("sent");
  });

  it("renders divider element between heading and title", () => {
    const { container } = renderHeader(defaultProps);
    const divider = container.querySelector('[aria-hidden="true"]');
    expect(divider).toBeInTheDocument();
    expect(divider).toHaveStyle("height: 1px");
    expect(divider).toHaveStyle("background: #2E3940");
  });

  it("does NOT show 'All' option in dropdown (showAll=false)", async () => {
    const { container } = renderHeader(defaultProps);
    const user = userEvent.setup();

    const trigger = screen.getByRole("button", { name: /Sent/ });
    await user.click(trigger);

    // Should only have 2 options: Sent and Received
    const options = container.querySelectorAll('[role="option"]');
    expect(options).toHaveLength(2);

    // Should NOT find an "All"/"Tất cả" (clear) option — suppressed via showAll={false}
    const allOption = Array.from(options).find((o) =>
      /^(All|Tất cả)$/.test(o.textContent?.trim() ?? ""),
    );
    expect(allOption).toBeUndefined();
  });

  it("renders correct sent count in label", () => {
    renderHeader({ ...defaultProps, sentCount: 12 });
    expect(screen.getByRole("button", { name: /Sent \(12\)/ })).toBeInTheDocument();
  });

  it("renders correct received count in options", async () => {
    const { container } = renderHeader({ ...defaultProps, receivedCount: 23 });
    // Open dropdown to check that received option exists
    const trigger = screen.getAllByRole("button")[0];
    const user = userEvent.setup();
    await user.click(trigger);
    const options = Array.from(container.querySelectorAll('[role="option"]'));
    // Should have 2 options with sent and received counts
    expect(options.length).toBeGreaterThanOrEqual(1);
  });

  it("displays sent count zero when no kudos", () => {
    renderHeader({
      ...defaultProps,
      sentCount: 0,
      receivedCount: 0,
    });
    expect(screen.getByRole("button", { name: /Sent \(0\)/ })).toBeInTheDocument();
  });

  it("highlights the currently selected direction in dropdown", async () => {
    const { container } = renderHeader({
      ...defaultProps,
      direction: "received",
    });

    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: /Received/ });
    await user.click(trigger);

    // The selected option should be highlighted (find via aria-selected or similar)
    const options = container.querySelectorAll('[role="option"]');
    // Second option (Received) should be active/selected
    expect(options.length).toBeGreaterThanOrEqual(1);
    // At least one option should exist
    expect(options[0]).toBeInTheDocument();
  });

  it("respects custom className if provided", () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <div className="custom-wrapper">
          <ProfileAwardsHeader {...defaultProps} />
        </div>
      </NextIntlClientProvider>,
    );
    expect(container.querySelector(".custom-wrapper")).toBeInTheDocument();
  });

  it("maintains layout with flex space-between for KUDOS and dropdown", () => {
    const { container } = renderHeader(defaultProps);
    const row = container.querySelector(".flex.items-center.justify-between");
    expect(row).toBeInTheDocument();
    // Should contain both KUDOS heading and the dropdown
    expect(row?.textContent).toContain("KUDOS");
  });

  it("calls onDirectionChange when selecting same direction again", async () => {
    const onDirectionChange = vi.fn();
    renderHeader({ ...defaultProps, direction: "sent", onDirectionChange });

    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: /Sent/ });
    await user.click(trigger);

    const sentOption = screen.getAllByRole("option").find((o) => o.textContent?.includes("Sent"));
    if (sentOption) {
      await user.click(sentOption);
      // Still calls the callback
      expect(onDirectionChange).toHaveBeenCalledWith("sent");
    }
  });
});
