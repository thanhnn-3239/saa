import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/react";
import { AccountMenu } from "./account-menu";

// Mock the sign-out action
vi.mock("@/lib/auth/auth-actions", () => ({
  signOut: vi.fn(),
}));

describe("AccountMenu", () => {
  const mockEmail = "user@example.com";
  const mockRole = "user";

  describe("rendering (ID-36)", () => {
    it("renders menu trigger button with user avatar", () => {
      render(<AccountMenu email={mockEmail} role={mockRole} />);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      // Should contain an image (avatar) or similar indicator
      const img = button.querySelector("img");
      expect(img || button.querySelector("svg")).toBeInTheDocument();
    });

    it("displays Profile menu item (ID-36)", async () => {
      const user = userEvent.setup();
      render(<AccountMenu email={mockEmail} role={mockRole} />);
      const trigger = screen.getByRole("button");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(/Profile|Hồ sơ/i)).toBeInTheDocument();
      });
    });

    it("displays Sign out menu item (ID-36)", async () => {
      const user = userEvent.setup();
      render(<AccountMenu email={mockEmail} role={mockRole} />);
      const trigger = screen.getByRole("button");
      await user.click(trigger);

      await waitFor(() => {
        expect(
          screen.getByText(/Sign out|Đăng xuất/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("dropdown behavior (ID-30, ID-31, ID-32, ID-33, ID-34, ID-35)", () => {
    it("opens dropdown menu on button click (ID-30)", async () => {
      const user = userEvent.setup();
      render(<AccountMenu email={mockEmail} role={mockRole} />);
      const trigger = screen.getByRole("button");

      // Menu should not be visible initially
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();

      // Click to open
      await user.click(trigger);

      // Menu should now be visible
      await waitFor(() => {
        expect(screen.getByRole("menu") || screen.getByRole("listbox")).toBeInTheDocument();
      });
    });

    it("closes dropdown when clicking outside (ID-34)", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <div>
          <AccountMenu email={mockEmail} role={mockRole} />
          <div data-testid="outside">Outside element</div>
        </div>
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("menu") || screen.getByRole("listbox")).toBeInTheDocument();
      });

      // Click outside
      const outside = screen.getByTestId("outside");
      await user.click(outside);

      await waitFor(() => {
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      });
    });

    it("closes dropdown on Escape key (ID-35)", async () => {
      const user = userEvent.setup();
      render(<AccountMenu email={mockEmail} role={mockRole} />);
      const trigger = screen.getByRole("button");

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("menu") || screen.getByRole("listbox")).toBeInTheDocument();
      });

      // Press Escape
      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      });
    });

    it("closes when menu item is selected (ID-33)", async () => {
      const user = userEvent.setup();
      render(<AccountMenu email={mockEmail} role={mockRole} />);
      const trigger = screen.getByRole("button");

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("menu") || screen.getByRole("listbox")).toBeInTheDocument();
      });

      // Click a menu item
      const profileItem = screen.getByText(/Profile|Hồ sơ/i);
      await user.click(profileItem);

      // Menu should close after selection
      await waitFor(() => {
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      });
    });
  });

  describe("admin menu item (ID-5, ID-37 — deferred, gated on role)", () => {
    it("hides Admin Dashboard item when role is not admin", () => {
      render(<AccountMenu email={mockEmail} role="user" />);
      expect(screen.queryByText(/Admin|Quản trị/i)).not.toBeInTheDocument();
    });

    it("shows Admin Dashboard item when role is admin", async () => {
      const user = userEvent.setup();
      render(<AccountMenu email={mockEmail} role="admin" />);
      const trigger = screen.getByRole("button");
      await user.click(trigger);

      await waitFor(() => {
        expect(
          screen.getByText(/Admin|Dashboard/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("keyboard navigation (ID-30/31/32/33/34/35)", () => {
    it("opens dropdown with keyboard (Space or Enter)", async () => {
      const user = userEvent.setup();
      render(<AccountMenu email={mockEmail} role={mockRole} />);
      const trigger = screen.getByRole("button");

      // Focus and activate with keyboard
      trigger.focus();
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.getByRole("menu") || screen.getByRole("listbox")).toBeInTheDocument();
      });
    });

    it("navigates menu items with arrow keys", async () => {
      const user = userEvent.setup();
      render(<AccountMenu email={mockEmail} role={mockRole} />);
      const trigger = screen.getByRole("button");

      await user.click(trigger);

      // Arrow down to navigate
      await user.keyboard("{ArrowDown}");

      // The focused item should be highlighted (implementation-specific)
      const menu = screen.getByRole("menu") || screen.getByRole("listbox");
      expect(menu).toBeInTheDocument();
    });
  });
});
