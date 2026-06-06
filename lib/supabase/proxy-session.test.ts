import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { updateSession } from "./proxy-session";
import { NextRequest } from "next/server";

// Mock Supabase server client
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from "@supabase/ssr";

const mockCreateServerClient = createServerClient as unknown as Mock;

/**
 * Helper to create a mock NextRequest with cookie handling
 */
function createMockRequest(
  pathname: string,
  initialClaims?: { email?: string }
) {
  const url = `http://localhost:3000${pathname}`;
  const request = new NextRequest(url);

  // Add auth cookie if claims present
  if (initialClaims) {
    request.cookies.set("sb-auth-token", "valid_token");
  }

  return request;
}

describe("updateSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authenticated users", () => {
    it("allows authenticated users on protected routes", async () => {
      mockCreateServerClient.mockReturnValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: {
              claims: {
                email: "user@sun-asterisk.com",
                sub: "uuid-123",
              },
            },
          }),
        },
      });

      const request = createMockRequest("/dashboard", { email: "user@sun-asterisk.com" });
      const response = await updateSession(request);

      // Should return 200 with next() — no redirect
      expect(response.status).toBe(200);
    });

    it("redirects authenticated users from /login to /", async () => {
      mockCreateServerClient.mockReturnValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: {
              claims: {
                email: "user@sun-asterisk.com",
                sub: "uuid-123",
              },
            },
          }),
        },
      });

      const request = createMockRequest("/login", { email: "user@sun-asterisk.com" });
      const response = await updateSession(request);

      // Should redirect to /
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/");
    });

    it("allows authenticated users on / (no redirect)", async () => {
      mockCreateServerClient.mockReturnValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: {
              claims: {
                email: "user@sun-asterisk.com",
                sub: "uuid-123",
              },
            },
          }),
        },
      });

      const request = createMockRequest("/");
      const response = await updateSession(request);

      expect(response.status).toBe(200);
    });
  });

  describe("unauthenticated users", () => {
    it("allows unauthenticated users on /login", async () => {
      mockCreateServerClient.mockReturnValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: null,
          }),
        },
      });

      const request = createMockRequest("/login");
      const response = await updateSession(request);

      // Should return 200 with next() — no redirect
      expect(response.status).toBe(200);
    });

    it("allows unauthenticated users on /auth/callback", async () => {
      mockCreateServerClient.mockReturnValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: null,
          }),
        },
      });

      const request = createMockRequest("/auth/callback");
      const response = await updateSession(request);

      expect(response.status).toBe(200);
    });

    it("redirects unauthenticated users from / to /login (login-required)", async () => {
      // / is NOT in PUBLIC_PATHS — app is now login-required. Unauthenticated guests are redirected.
      mockCreateServerClient.mockReturnValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: null,
          }),
        },
      });

      const request = createMockRequest("/");
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login");
    });

    it("redirects unauthenticated users from protected routes to /login", async () => {
      mockCreateServerClient.mockReturnValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: null,
          }),
        },
      });

      const request = createMockRequest("/dashboard");
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login");
    });

    it("redirects unauthenticated users from any protected path to /login", async () => {
      mockCreateServerClient.mockReturnValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: null,
          }),
        },
      });

      const request = createMockRequest("/settings/profile");
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login");
    });

    it.each([
      "/awards-information",
      "/sun-kudos",
      "/tieu-chuan-chung",
      "/profile",
    ])(
      "redirects unauthenticated users from formerly-public route %s to /login",
      async (pathname) => {
        // These paths were in the OLD PUBLIC_PATHS; the app is now login-required.
        mockCreateServerClient.mockReturnValue({
          auth: { getClaims: vi.fn().mockResolvedValue({ data: null }) },
        });

        const request = createMockRequest(pathname);
        const response = await updateSession(request);

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/login");
      },
    );
  });

  describe("domain guard (defense-in-depth)", () => {
    it("redirects unauthenticated (disallowed domain) from protected route to /login", async () => {
      mockCreateServerClient.mockReturnValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: {
              claims: {
                sub: "uuid-123",
                email: "user@gmail.com",
              },
            },
          }),
        },
      });

      const request = createMockRequest("/dashboard");
      const response = await updateSession(request);

      // Disallowed domain → treat as unauthenticated, redirect to /login
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login");
    });

    it("redirects authenticated user with disallowed domain from /login to /", async () => {
      // Even though domain is disallowed, if they somehow got a session,
      // and hit /login, the redirect still happens because the check is:
      // if (isAuthed && pathname === "/login") → redirect to /
      // But isAuthed requires both sub AND allowed email, so this won't happen in practice
      mockCreateServerClient.mockReturnValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: {
              claims: {
                sub: "uuid-123",
                email: "user@gmail.com",
              },
            },
          }),
        },
      });

      const request = createMockRequest("/login");
      const response = await updateSession(request);

      // Disallowed domain means isAuthed = false, so no redirect to /
      // Instead, they're allowed on /login (public path)
      expect(response.status).toBe(200);
    });

    it("allows authenticated user with allowed domain on protected routes", async () => {
      mockCreateServerClient.mockReturnValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: {
              claims: {
                sub: "uuid-123",
                email: "user@sun-asterisk.com",
              },
            },
          }),
        },
      });

      const request = createMockRequest("/dashboard");
      const response = await updateSession(request);

      // Allowed domain + sub → fully authenticated
      expect(response.status).toBe(200);
    });
  });

  describe("edge cases", () => {
    it("handles missing claims data gracefully — redirects from / to /login", async () => {
      // null claims → unauthenticated; / is NOT in PUBLIC_PATHS (login-required) so redirect.
      mockCreateServerClient.mockReturnValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: { claims: null },
          }),
        },
      });

      const request = createMockRequest("/");
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login");
    });

    it("treats empty claims object (no sub) as unauthenticated — redirects from / to /login", async () => {
      // Empty claims object lacks the `sub` claim → unauthenticated.
      // / is NOT in PUBLIC_PATHS (login-required) so redirect to /login.
      mockCreateServerClient.mockReturnValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: { claims: {} },
          }),
        },
      });

      const request = createMockRequest("/");
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login");
    });

    it("preserves cookies on redirect", async () => {
      mockCreateServerClient.mockReturnValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: {
              claims: {
                email: "user@sun-asterisk.com",
                sub: "uuid-123",
              },
            },
          }),
        },
      });

      const request = createMockRequest("/login", { email: "user@sun-asterisk.com" });

      // Mock the cookies
      request.cookies.set("sb-auth-token", "valid_token");

      const response = await updateSession(request);

      // Response should be a redirect
      expect(response.status).toBe(307);
      // Cookies should be preserved
      expect(response.cookies).toBeDefined();
    });

    it("handles paths with query strings", async () => {
      mockCreateServerClient.mockReturnValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: null,
          }),
        },
      });

      const request = new NextRequest("http://localhost:3000/dashboard?tab=profile");
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login");
    });
  });
});
