import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/render-with-intl";
import { LoginButton } from "./login-button";

describe("LoginButton", () => {
  describe("rendering", () => {
    it("renders button with Google login text in Vietnamese", () => {
      renderWithIntl(<LoginButton />, { locale: "vi" });
      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.getByText(/Đăng nhập bằng Google/i)).toBeInTheDocument();
    });

    it("renders button with Google login text in English", () => {
      renderWithIntl(<LoginButton />, { locale: "en" });
      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.getByText(/Sign in with Google/i)).toBeInTheDocument();
    });

    it("renders with correct aria-label in Vietnamese", () => {
      renderWithIntl(<LoginButton />, { locale: "vi" });
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Đăng nhập bằng Google");
    });

    it("renders with correct aria-label in English", () => {
      renderWithIntl(<LoginButton />, { locale: "en" });
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Sign in with Google");
    });

    it("renders Google icon SVG", () => {
      renderWithIntl(<LoginButton />);
      const button = screen.getByRole("button");
      // SVG should be present in the button
      const svg = button.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });

    it("renders button with type='button'", () => {
      renderWithIntl(<LoginButton />);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });
  });

  describe("click handling", () => {
    it("calls onClick when button is clicked", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      renderWithIntl(<LoginButton onClick={handleClick} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not call onClick when button is disabled", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      renderWithIntl(<LoginButton onClick={handleClick} disabled={true} />);

      const button = screen.getByRole("button");
      // Try to click — should be prevented by disabled attribute
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("does not call onClick when button is in loading state", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      renderWithIntl(<LoginButton onClick={handleClick} loading={true} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("loading state", () => {
    it("sets aria-busy=true when loading", () => {
      renderWithIntl(<LoginButton loading={true} />);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-busy", "true");
    });

    it("sets aria-busy=false when not loading", () => {
      renderWithIntl(<LoginButton loading={false} />);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-busy", "false");
    });

    it("disables button when loading", () => {
      renderWithIntl(<LoginButton loading={true} />);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("shows spinner when loading", () => {
      renderWithIntl(<LoginButton loading={true} />);
      const button = screen.getByRole("button");
      // Spinner should be present (inline-block with animation)
      const spinner = button.querySelector("span[class*='animate-spin']");
      expect(spinner).toBeInTheDocument();
    });

    it("hides text and icon when loading", () => {
      renderWithIntl(<LoginButton loading={true} />);
      // Text should not be visible when loading (spinner replaces it)
      expect(screen.queryByText(/Đăng nhập bằng Google/)).not.toBeInTheDocument();
    });

    it("shows text and icon when not loading", () => {
      renderWithIntl(<LoginButton loading={false} />);
      expect(screen.getByText(/Đăng nhập bằng Google/i)).toBeInTheDocument();
    });
  });

  describe("disabled state", () => {
    it("disables button when disabled prop is true", () => {
      renderWithIntl(<LoginButton disabled={true} />);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("enables button when disabled prop is false", () => {
      renderWithIntl(<LoginButton disabled={false} />);
      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
    });

    it("disables button when loading=true even if disabled=false", () => {
      renderWithIntl(<LoginButton disabled={false} loading={true} />);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("can still be disabled when loading=false", () => {
      renderWithIntl(<LoginButton disabled={true} loading={false} />);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });

  describe("visual states", () => {
    it("has correct background color when enabled", () => {
      renderWithIntl(<LoginButton disabled={false} loading={false} />);
      const button = screen.getByRole("button");
      // Should have opaque background
      expect(button).toHaveStyle({
        backgroundColor: "rgba(255, 234, 158, 1)",
        cursor: "pointer",
      });
    });

    it("has reduced opacity background when disabled", () => {
      renderWithIntl(<LoginButton disabled={true} />);
      const button = screen.getByRole("button");
      expect(button).toHaveStyle({
        backgroundColor: "rgba(255, 234, 158, 0.5)",
        cursor: "not-allowed",
      });
    });

    it("has reduced opacity background when loading", () => {
      renderWithIntl(<LoginButton loading={true} />);
      const button = screen.getByRole("button");
      expect(button).toHaveStyle({
        backgroundColor: "rgba(255, 234, 158, 0.5)",
      });
    });

    it("has cursor pointer when enabled", () => {
      renderWithIntl(<LoginButton disabled={false} loading={false} />);
      const button = screen.getByRole("button");
      expect(button).toHaveStyle({ cursor: "pointer" });
    });

    it("has cursor not-allowed when disabled", () => {
      renderWithIntl(<LoginButton disabled={true} />);
      const button = screen.getByRole("button");
      expect(button).toHaveStyle({ cursor: "not-allowed" });
    });
  });

  describe("interaction states", () => {
    it("applies hover styles on mouse enter when enabled", async () => {
      const user = userEvent.setup();
      renderWithIntl(<LoginButton disabled={false} loading={false} />);
      const button = screen.getByRole("button");

      await user.hover(button);

      // Should have box-shadow
      expect(button).toHaveStyle({
        boxShadow: "0 4px 16px rgba(255, 234, 158, 0.4)",
      });
    });

    it("removes hover styles on mouse leave", async () => {
      const user = userEvent.setup();
      renderWithIntl(<LoginButton disabled={false} loading={false} />);
      const button = screen.getByRole("button");

      await user.hover(button);
      await user.unhover(button);

      expect(button).toHaveStyle({ boxShadow: "none" });
    });

    it("does not apply hover styles when disabled", async () => {
      const user = userEvent.setup();
      renderWithIntl(<LoginButton disabled={true} />);
      const button = screen.getByRole("button");

      // Initial style should be the disabled background
      expect(button).toHaveStyle({
        backgroundColor: "rgba(255, 234, 158, 0.5)",
      });

      await user.hover(button);

      // Should still have disabled background, no hover effect
      expect(button).toHaveStyle({
        backgroundColor: "rgba(255, 234, 158, 0.5)",
      });
    });
  });

  describe("spinner styling", () => {
    it("shows spinner with correct dimensions", () => {
      renderWithIntl(<LoginButton loading={true} />);
      const button = screen.getByRole("button");
      const spinner = button.querySelector("span[class*='animate-spin']");
      expect(spinner).toHaveStyle({ width: "22px", height: "22px" });
    });

    it("spinner has spinner aria-hidden attribute", () => {
      renderWithIntl(<LoginButton loading={true} />);
      const button = screen.getByRole("button");
      const spinner = button.querySelector("span[class*='animate-spin']");
      expect(spinner).toHaveAttribute("aria-hidden", "true");
    });

    it("spinner is not present when not loading", () => {
      renderWithIntl(<LoginButton loading={false} />);
      const button = screen.getByRole("button");
      const spinner = button.querySelector("span[class*='animate-spin']");
      expect(spinner).not.toBeInTheDocument();
    });
  });

  describe("props combinations", () => {
    it("renders all props correctly when all are provided", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      renderWithIntl(
        <LoginButton onClick={handleClick} loading={false} disabled={false} />
      );

      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "false");

      await user.click(button);
      expect(handleClick).toHaveBeenCalled();
    });

    it("handles loading=true and disabled=false (loading takes precedence)", () => {
      renderWithIntl(<LoginButton loading={true} disabled={false} />);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "true");
    });

    it("handles loading=false and disabled=true", () => {
      renderWithIntl(<LoginButton loading={false} disabled={true} />);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "false");
    });
  });

  describe("multiple clicks", () => {
    it("can be clicked multiple times when enabled", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      renderWithIntl(<LoginButton onClick={handleClick} />);

      const button = screen.getByRole("button");
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });
});
