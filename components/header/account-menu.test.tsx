import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { AccountMenu } from "./account-menu";
import messages from "@/messages/en.json";

// Mock the sign-out action — correct module path
vi.mock("@/lib/auth/sign-out-action", () => ({
  signOut: vi.fn(),
}));

/**
 * Helper to render AccountMenu with next-intl provider.
 * Wraps in NextIntlClientProvider so useTranslations("Home") works.
 */
function renderMenu(props = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AccountMenu {...props} />
    </NextIntlClientProvider>
  );
}

describe("AccountMenu", () => {
  describe("rendering (ID-36)", () => {
    it("renders menu trigger button with person icon", () => {
      renderMenu();
      const button = screen.getByRole("button", { name: /Account menu/i });
      expect(button).toBeInTheDocument();
      // Trigger contains an inline <svg>
      const svg = button.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("displays Profile menu item (ID-36)", async () => {
      const user = userEvent.setup();
      renderMenu();
      const trigger = screen.getByRole("button", { name: /Account menu/i });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(/Profile/i)).toBeInTheDocument();
      });
    });

    it("displays Logout menu item (ID-36)", async () => {
      const user = userEvent.setup();
      renderMenu();
      const trigger = screen.getByRole("button", { name: /Account menu/i });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(/Logout/i)).toBeInTheDocument();
      });
    });
  });

  describe("dropdown behavior (ID-30, ID-31, ID-32, ID-33, ID-34, ID-35)", () => {
    it("opens dropdown menu on button click (ID-30)", async () => {
      const user = userEvent.setup();
      renderMenu();
      const trigger = screen.getByRole("button", { name: /Account menu/i });

      // Menu should not be visible initially
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();

      // Click to open
      await user.click(trigger);

      // Menu should now be visible
      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });
    });

    it("closes dropdown when clicking outside (ID-34)", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <AccountMenu />
        </NextIntlClientProvider>
      );

      const trigger = screen.getByRole("button", { name: /Account menu/i });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      // Click the backdrop (fixed inset-0 div with onClick={setOpen(false)})
      // Query by aria-hidden=true to find the backdrop overlay
      const backdrop = container.querySelector('div[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
      await user.click(backdrop!);

      await waitFor(() => {
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      });
    });

    it("closes dropdown on Escape key (ID-35)", async () => {
      const user = userEvent.setup();
      renderMenu();
      const trigger = screen.getByRole("button", { name: /Account menu/i });

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      // Press Escape
      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      });
    });

    it("closes when menu item is selected (ID-33)", async () => {
      const user = userEvent.setup();
      renderMenu();
      const trigger = screen.getByRole("button", { name: /Account menu/i });

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      // Click Profile item
      const profileItem = screen.getByText(/Profile/i);
      await user.click(profileItem);

      // Menu should close after selection
      await waitFor(() => {
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      });
    });
  });

  describe("admin menu item (ID-5, ID-37 — gated on role)", () => {
    it("hides Admin Dashboard item when role is undefined (menu open)", async () => {
      const user = userEvent.setup();
      renderMenu();
      await user.click(screen.getByRole("button", { name: /Account menu/i }));

      // Menu is open (Profile + Logout visible) but Admin Dashboard must be absent.
      await waitFor(() => {
        expect(screen.getByText(/Profile/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/Logout/i)).toBeInTheDocument();
      expect(screen.queryByText(/Admin Dashboard/i)).not.toBeInTheDocument();
    });

    it("hides Admin Dashboard item when role is not admin (menu open)", async () => {
      const user = userEvent.setup();
      renderMenu({ role: "user" });
      await user.click(screen.getByRole("button", { name: /Account menu/i }));

      await waitFor(() => {
        expect(screen.getByText(/Profile/i)).toBeInTheDocument();
      });
      expect(screen.queryByText(/Admin Dashboard/i)).not.toBeInTheDocument();
    });

    it("shows Admin Dashboard item when role is admin", async () => {
      const user = userEvent.setup();
      renderMenu({ role: "admin" });
      const trigger = screen.getByRole("button", { name: /Account menu/i });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe("keyboard navigation (ID-30/31/32/33/34/35)", () => {
    it("opens dropdown with keyboard (Enter)", async () => {
      const user = userEvent.setup();
      renderMenu();
      const trigger = screen.getByRole("button", { name: /Account menu/i });

      // Focus and activate with keyboard
      trigger.focus();
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });
    });

    it("focus returns to trigger on Escape close", async () => {
      const user = userEvent.setup();
      renderMenu();
      const trigger = screen.getByRole("button", { name: /Account menu/i });

      trigger.focus();
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      // Press Escape
      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
        // Focus should return to trigger
        expect(trigger).toHaveFocus();
      });
    });
  });
});
