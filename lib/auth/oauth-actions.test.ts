import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { signInWithGoogle } from "./oauth-actions";
import { ALLOWED_DOMAIN } from "./allowed-domain";

// Mock the Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/client";

const mockCreateClient = createClient as any;

describe("signInWithGoogle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.origin
    delete (window as any).location;
    (window as any).location = { origin: "http://localhost:3000" };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("redirectTo URL construction", () => {
    it("constructs redirectTo with default next parameter", async () => {
      const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithOAuth: mockSignInWithOAuth,
        },
      });

      await signInWithGoogle("/");

      const callArgs = mockSignInWithOAuth.mock.calls[0][0];
      expect(callArgs.options.redirectTo).toBe(
        "http://localhost:3000/auth/callback?next=%2F"
      );
    });

    it("constructs redirectTo with custom next parameter", async () => {
      const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithOAuth: mockSignInWithOAuth,
        },
      });

      await signInWithGoogle("/dashboard");

      const callArgs = mockSignInWithOAuth.mock.calls[0][0];
      expect(callArgs.options.redirectTo).toBe(
        "http://localhost:3000/auth/callback?next=%2Fdashboard"
      );
    });

    it("URL-encodes the next parameter", async () => {
      const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithOAuth: mockSignInWithOAuth,
        },
      });

      await signInWithGoogle("/dashboard?tab=settings");

      const callArgs = mockSignInWithOAuth.mock.calls[0][0];
      // encodeURIComponent("/dashboard?tab=settings") = "%2Fdashboard%3Ftab%3Dsettings"
      expect(callArgs.options.redirectTo).toBe(
        "http://localhost:3000/auth/callback?next=%2Fdashboard%3Ftab%3Dsettings"
      );
    });

    it("preserves window.location.origin in redirectTo", async () => {
      const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithOAuth: mockSignInWithOAuth,
        },
      });

      (window as any).location.origin = "https://example.com:8080";
      await signInWithGoogle("/");

      const callArgs = mockSignInWithOAuth.mock.calls[0][0];
      expect(callArgs.options.redirectTo).toBe(
        "https://example.com:8080/auth/callback?next=%2F"
      );
    });
  });

  describe("OAuth provider configuration", () => {
    it("calls signInWithOAuth with provider=google", async () => {
      const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithOAuth: mockSignInWithOAuth,
        },
      });

      await signInWithGoogle("/");

      const callArgs = mockSignInWithOAuth.mock.calls[0][0];
      expect(callArgs.provider).toBe("google");
    });

    it("sets hd query param to ALLOWED_DOMAIN", async () => {
      const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithOAuth: mockSignInWithOAuth,
        },
      });

      await signInWithGoogle("/");

      const callArgs = mockSignInWithOAuth.mock.calls[0][0];
      expect(callArgs.options.queryParams.hd).toBe(ALLOWED_DOMAIN);
    });

    it("sets prompt to select_account", async () => {
      const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithOAuth: mockSignInWithOAuth,
        },
      });

      await signInWithGoogle("/");

      const callArgs = mockSignInWithOAuth.mock.calls[0][0];
      expect(callArgs.options.queryParams.prompt).toBe("select_account");
    });

    it("includes both queryParams in the options", async () => {
      const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithOAuth: mockSignInWithOAuth,
        },
      });

      await signInWithGoogle("/");

      const callArgs = mockSignInWithOAuth.mock.calls[0][0];
      expect(callArgs.options.queryParams).toHaveProperty("hd");
      expect(callArgs.options.queryParams).toHaveProperty("prompt");
    });
  });

  describe("error handling", () => {
    it("throws when signInWithOAuth returns an error", async () => {
      const error = new Error("OAuth provider unavailable");
      const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error });
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithOAuth: mockSignInWithOAuth,
        },
      });

      await expect(signInWithGoogle("/")).rejects.toThrow(
        "OAuth provider unavailable"
      );
    });

    it("throws when signInWithOAuth returns an error object", async () => {
      const errorObj = {
        message: "network error",
        status: 0,
      };
      const mockSignInWithOAuth = vi
        .fn()
        .mockResolvedValue({ error: errorObj });
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithOAuth: mockSignInWithOAuth,
        },
      });

      await expect(signInWithGoogle("/")).rejects.toBeDefined();
    });

    it("does not throw when signInWithOAuth succeeds", async () => {
      const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithOAuth: mockSignInWithOAuth,
        },
      });

      await expect(signInWithGoogle("/")).resolves.toBeUndefined();
    });

    it("propagates any Supabase error to caller", async () => {
      const error = {
        message: "invalid_grant",
        status: 400,
      };
      const mockSignInWithOAuth = vi
        .fn()
        .mockResolvedValue({ error, data: null });
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithOAuth: mockSignInWithOAuth,
        },
      });

      await expect(signInWithGoogle("/")).rejects.toBeDefined();
    });
  });

  describe("default parameters", () => {
    it("uses / as default next parameter when called with no args", async () => {
      const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithOAuth: mockSignInWithOAuth,
        },
      });

      // Call with no args
      await signInWithGoogle();

      const callArgs = mockSignInWithOAuth.mock.calls[0][0];
      expect(callArgs.options.redirectTo).toContain("next=%2F");
    });
  });

  describe("multiple calls", () => {
    it("allows calling signInWithGoogle multiple times", async () => {
      const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithOAuth: mockSignInWithOAuth,
        },
      });

      await signInWithGoogle("/dashboard");
      await signInWithGoogle("/profile");

      expect(mockSignInWithOAuth).toHaveBeenCalledTimes(2);
    });

    it("each call uses the correct next parameter", async () => {
      const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithOAuth: mockSignInWithOAuth,
        },
      });

      await signInWithGoogle("/dashboard");
      await signInWithGoogle("/profile");

      const callArgs1 = mockSignInWithOAuth.mock.calls[0][0];
      const callArgs2 = mockSignInWithOAuth.mock.calls[1][0];

      expect(callArgs1.options.redirectTo).toContain("%2Fdashboard");
      expect(callArgs2.options.redirectTo).toContain("%2Fprofile");
    });
  });

  describe("client creation", () => {
    it("creates a Supabase client", async () => {
      const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithOAuth: mockSignInWithOAuth,
        },
      });

      await signInWithGoogle("/");

      expect(mockCreateClient).toHaveBeenCalled();
    });

    it("uses the created client to call signInWithOAuth", async () => {
      const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithOAuth: mockSignInWithOAuth,
        },
      });

      await signInWithGoogle("/");

      expect(mockSignInWithOAuth).toHaveBeenCalled();
    });
  });
});
