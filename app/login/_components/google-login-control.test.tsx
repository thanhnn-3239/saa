import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/render-with-intl";
import { GoogleLoginControl } from "./google-login-control";

// Mock the oauth-actions module
vi.mock("@/lib/auth/oauth-actions", () => ({
  signInWithGoogle: vi.fn(),
}));

import { signInWithGoogle } from "@/lib/auth/oauth-actions";

const mockSignInWithGoogle = signInWithGoogle as any;

describe("GoogleLoginControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.location.assign mock
    (window.location as any).assign = vi.fn();
  });

  describe("rendering", () => {
    it("renders the login button", () => {
      renderWithIntl(<GoogleLoginControl />);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(screen.getByText(/Đăng nhập bằng Google/i)).toBeInTheDocument();
    });

    it("button starts in not-loading state", () => {
      renderWithIntl(<GoogleLoginControl />);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-busy", "false");
      expect(button).not.toBeDisabled();
    });
  });

  describe("successful sign-in flow", () => {
    it("calls signInWithGoogle when button is clicked", async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockResolvedValue(undefined);

      renderWithIntl(<GoogleLoginControl />);
      const button = screen.getByRole("button");

      await user.click(button);

      expect(mockSignInWithGoogle).toHaveBeenCalledWith("/");
    });

    it("sets loading state to true while signInWithGoogle is pending", async () => {
      const user = userEvent.setup();
      let resolveSignIn: () => void;
      const signInPromise = new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignInWithGoogle.mockReturnValue(signInPromise);

      renderWithIntl(<GoogleLoginControl />);
      const button = screen.getByRole("button");

      await user.click(button);

      // Button should be disabled and show loading state while promise is pending
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "true");

      resolveSignIn!();
      // After resolution, button should remain in loading state (success path redirects)
      expect(button).toHaveAttribute("aria-busy", "true");
    });

    it("keeps loading state true after success (browser navigates away)", async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockResolvedValue(undefined);

      renderWithIntl(<GoogleLoginControl />);
      const button = screen.getByRole("button");

      await user.click(button);

      // Should remain disabled because success redirects to Google
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "true");
    });
  });

  describe("error handling", () => {
    it("resets loading state when signInWithGoogle throws an error", async () => {
      const user = userEvent.setup();
      const error = new Error("OAuth initialization failed");
      mockSignInWithGoogle.mockRejectedValue(error);

      renderWithIntl(<GoogleLoginControl />);
      const button = screen.getByRole("button");

      await user.click(button);

      // Error should be caught, loading reset, and redirect assigned
      expect(button).not.toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "false");
    });

    it("assigns window.location to error page when signInWithGoogle throws", async () => {
      const user = userEvent.setup();
      const error = new Error("OAuth initialization failed");
      mockSignInWithGoogle.mockRejectedValue(error);

      renderWithIntl(<GoogleLoginControl />);
      const button = screen.getByRole("button");

      await user.click(button);

      expect((window.location as any).assign).toHaveBeenCalledWith(
        "/login?error=oauth"
      );
    });

    it("handles different error types", async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockRejectedValue(new TypeError("fetch failed"));

      renderWithIntl(<GoogleLoginControl />);
      const button = screen.getByRole("button");

      await user.click(button);

      expect((window.location as any).assign).toHaveBeenCalledWith(
        "/login?error=oauth"
      );
      expect(button).not.toBeDisabled();
    });

    it("handles error with undefined message", async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockRejectedValue({});

      renderWithIntl(<GoogleLoginControl />);
      const button = screen.getByRole("button");

      await user.click(button);

      expect((window.location as any).assign).toHaveBeenCalledWith(
        "/login?error=oauth"
      );
    });
  });

  describe("multiple clicks", () => {
    it("ignores second click while first request is pending", async () => {
      const user = userEvent.setup();
      let resolveSignIn: () => void;
      const signInPromise = new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignInWithGoogle.mockReturnValue(signInPromise);

      renderWithIntl(<GoogleLoginControl />);
      const button = screen.getByRole("button");

      await user.click(button);
      await user.click(button); // Second click while disabled

      // Should only have been called once
      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);

      resolveSignIn!();
    });

    it("allows click again after error", async () => {
      const user = userEvent.setup();
      const error = new Error("OAuth initialization failed");
      mockSignInWithGoogle.mockRejectedValue(error);

      renderWithIntl(<GoogleLoginControl />);
      const button = screen.getByRole("button");

      await user.click(button);
      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);

      // Reset mock for second attempt
      mockSignInWithGoogle.mockClear();
      mockSignInWithGoogle.mockResolvedValue(undefined);

      await user.click(button);
      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    });
  });

  describe("integration with LoginButton", () => {
    it("passes loading state to LoginButton", async () => {
      const user = userEvent.setup();
      let resolveSignIn: () => void;
      const signInPromise = new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignInWithGoogle.mockReturnValue(signInPromise);

      renderWithIntl(<GoogleLoginControl />);
      const button = screen.getByRole("button");

      // Initially not loading
      expect(button).toHaveAttribute("aria-busy", "false");

      await user.click(button);

      // After click, should be loading
      expect(button).toHaveAttribute("aria-busy", "true");

      resolveSignIn!();
    });

    it("button displays spinner during loading", async () => {
      const user = userEvent.setup();
      let resolveSignIn: () => void;
      const signInPromise = new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignInWithGoogle.mockReturnValue(signInPromise);

      renderWithIntl(<GoogleLoginControl />);
      const button = screen.getByRole("button");

      await user.click(button);

      // Spinner should be visible (replaces text)
      const spinner = button.querySelector("span[class*='animate-spin']");
      expect(spinner).toBeInTheDocument();

      resolveSignIn!();
    });

    it("button text is hidden while loading", async () => {
      const user = userEvent.setup();
      let resolveSignIn: () => void;
      const signInPromise = new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignInWithGoogle.mockReturnValue(signInPromise);

      renderWithIntl(<GoogleLoginControl />);
      const button = screen.getByRole("button");

      // Text visible before click
      expect(screen.getByText(/Đăng nhập bằng Google/i)).toBeInTheDocument();

      await user.click(button);

      // Text hidden during loading
      expect(screen.queryByText(/Đăng nhập bằng Google/i)).not.toBeInTheDocument();

      resolveSignIn!();
    });
  });

  describe("signInWithGoogle parameters", () => {
    it("calls signInWithGoogle with '/' as redirect target", async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockResolvedValue(undefined);

      renderWithIntl(<GoogleLoginControl />);
      const button = screen.getByRole("button");

      await user.click(button);

      expect(mockSignInWithGoogle).toHaveBeenCalledWith("/");
    });

    it("always uses '/' as the default redirect path", async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockResolvedValue(undefined);

      renderWithIntl(<GoogleLoginControl />);

      const button = screen.getByRole("button");
      await user.click(button);

      const callArgs = mockSignInWithGoogle.mock.calls[0];
      expect(callArgs[0]).toBe("/");
    });
  });

  describe("error redirect URL", () => {
    it("redirects to /login?error=oauth on catch", async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockRejectedValue(new Error("Network error"));

      renderWithIntl(<GoogleLoginControl />);
      const button = screen.getByRole("button");

      await user.click(button);

      expect((window.location as any).assign).toHaveBeenCalledWith(
        "/login?error=oauth"
      );
    });

    it("uses exact error URL format", async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockRejectedValue(new Error("OAuth provider error"));

      renderWithIntl(<GoogleLoginControl />);
      const button = screen.getByRole("button");

      await user.click(button);

      const assignCall = (window.location as any).assign.mock.calls[0][0];
      expect(assignCall).toMatch(/^\/login\?error=oauth$/);
    });
  });

  describe("state management", () => {
    it("maintains independent loading state across multiple instances", async () => {
      const user = userEvent.setup();
      let resolveSignIn: () => void;
      const signInPromise = new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignInWithGoogle.mockReturnValue(signInPromise);

      const { rerender } = renderWithIntl(<GoogleLoginControl />);
      const firstButton = screen.getByRole("button");

      await user.click(firstButton);
      expect(firstButton).toHaveAttribute("aria-busy", "true");

      resolveSignIn!();

      // Re-render (simulate second instance separately)
      mockSignInWithGoogle.mockClear();
      mockSignInWithGoogle.mockResolvedValue(undefined);

      renderWithIntl(<GoogleLoginControl />);
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(2);
    });
  });
});
