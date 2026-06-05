import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

const mockCreateClient = createClient as unknown as Mock;

/**
 * Helper to create a mock NextRequest for /auth/callback
 */
function createMockRequest(params: {
  code?: string;
  error?: string;
  next?: string;
  origin?: string;
}) {
  const { code, error, next, origin = "http://localhost:3000" } = params;

  let queryString = "";
  if (code) queryString += `code=${encodeURIComponent(code)}`;
  if (error) queryString += `${queryString ? "&" : ""}error=${encodeURIComponent(error)}`;
  if (next) queryString += `${queryString ? "&" : ""}next=${encodeURIComponent(next)}`;

  const url = `${origin}/auth/callback?${queryString}`;
  const request = new NextRequest(url, { method: "GET" });
  return request;
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("provider error handling", () => {
    it("redirects to /login?error=access_denied when user declines consent", async () => {
      const request = createMockRequest({ error: "access_denied" });
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login?error=access_denied"
      );
    });

    it("maps unknown provider errors to /login?error=oauth", async () => {
      const request = createMockRequest({ error: "invalid_request" });
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login?error=oauth"
      );
    });

    it("maps arbitrary provider error codes to /login?error=oauth (allowlist enforcement)", async () => {
      const request = createMockRequest({ error: "server_error" });
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login?error=oauth"
      );
    });
  });

  describe("missing code", () => {
    it("redirects to /login?error=oauth when code is missing", async () => {
      const request = createMockRequest({});
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login?error=oauth"
      );
    });

    it("ignores code and redirects to error when both code and error are present", async () => {
      const request = createMockRequest({
        code: "valid_code",
        error: "access_denied",
      });
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login?error=access_denied"
      );
    });
  });

  describe("exchange code error", () => {
    it("redirects to /login?error=oauth when exchangeCodeForSession fails", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            error: { message: "Code invalid or expired" },
          }),
        },
      });

      const request = createMockRequest({ code: "invalid_code" });
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login?error=oauth"
      );
    });
  });

  describe("successful exchange, allowed domain", () => {
    it("redirects to / when email is @sun-asterisk.com", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
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

      const request = createMockRequest({ code: "valid_code" });
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/");
    });

    it("redirects to custom next parameter when email is allowed", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
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

      const request = createMockRequest({
        code: "valid_code",
        next: "/dashboard",
      });
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/dashboard"
      );
    });

    it("redirects to / when next parameter is missing", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
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

      const request = createMockRequest({ code: "valid_code", next: "" });
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/");
    });
  });

  describe("getClaims exception handling", () => {
    it("signs out and redirects to /login?error=oauth when getClaims throws", async () => {
      const mockSignOut = vi.fn().mockResolvedValue({});
      mockCreateClient.mockResolvedValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
          getClaims: vi.fn().mockRejectedValue(new Error("JWT decode failed")),
          signOut: mockSignOut,
        },
      });

      const request = createMockRequest({ code: "valid_code" });
      const response = await GET(request);

      // getClaims threw, so signOut should be called
      expect(mockSignOut).toHaveBeenCalled();
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login?error=oauth"
      );
    });

    it("handles getClaims throwing with missing error message", async () => {
      const mockSignOut = vi.fn().mockResolvedValue({});
      mockCreateClient.mockResolvedValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
          getClaims: vi.fn().mockRejectedValue(new Error()),
          signOut: mockSignOut,
        },
      });

      const request = createMockRequest({ code: "valid_code" });
      const response = await GET(request);

      expect(mockSignOut).toHaveBeenCalled();
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login?error=oauth"
      );
    });
  });

  describe("domain guard", () => {
    it("signs out and redirects to /login?error=domain for non-allowed domain", async () => {
      const mockSignOut = vi.fn().mockResolvedValue({});
      mockCreateClient.mockResolvedValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
          getClaims: vi.fn().mockResolvedValue({
            data: {
              claims: {
                email: "user@gmail.com",
                sub: "uuid-123",
              },
            },
          }),
          signOut: mockSignOut,
        },
      });

      const request = createMockRequest({ code: "valid_code" });
      const response = await GET(request);

      expect(mockSignOut).toHaveBeenCalled();
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login?error=domain"
      );
    });

    it("signs out for any non-sun-asterisk domain", async () => {
      const mockSignOut = vi.fn().mockResolvedValue({});
      mockCreateClient.mockResolvedValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
          getClaims: vi.fn().mockResolvedValue({
            data: {
              claims: {
                email: "user@example.com",
                sub: "uuid-123",
              },
            },
          }),
          signOut: mockSignOut,
        },
      });

      const request = createMockRequest({ code: "valid_code" });
      const response = await GET(request);

      expect(mockSignOut).toHaveBeenCalled();
      expect(response.headers.get("location")).toContain("error=domain");
    });

    it("signs out when email is undefined or missing", async () => {
      const mockSignOut = vi.fn().mockResolvedValue({});
      mockCreateClient.mockResolvedValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
          getClaims: vi.fn().mockResolvedValue({
            data: {
              claims: {
                sub: "uuid-123",
              },
            },
          }),
          signOut: mockSignOut,
        },
      });

      const request = createMockRequest({ code: "valid_code" });
      const response = await GET(request);

      expect(mockSignOut).toHaveBeenCalled();
      expect(response.headers.get("location")).toContain("error=domain");
    });
  });

  describe("open redirect protection", () => {
    it("rejects next parameter starting with //", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
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

      const request = createMockRequest({
        code: "valid_code",
        next: "//evil.com/phishing",
      });
      const response = await GET(request);

      expect(response.headers.get("location")).toBe("http://localhost:3000/");
    });

    it("rejects next parameter with https absolute URL", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
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

      const request = createMockRequest({
        code: "valid_code",
        next: "https://evil.com",
      });
      const response = await GET(request);

      expect(response.headers.get("location")).toBe("http://localhost:3000/");
    });

    it("accepts valid relative paths starting with /", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
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

      const request = createMockRequest({
        code: "valid_code",
        next: "/internal/page",
      });
      const response = await GET(request);

      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/internal/page"
      );
    });

    it("accepts valid relative paths with query strings", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
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

      const request = createMockRequest({
        code: "valid_code",
        next: "/dashboard?tab=settings",
      });
      const response = await GET(request);

      // Callback route preserves the next parameter as-is
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/dashboard?tab=settings"
      );
    });
  });
});
