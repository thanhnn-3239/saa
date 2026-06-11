import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from "vitest";
import { NextRequest } from "next/server";

// Mock the Supabase clients — no live DB / network.
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { GET } from "@/app/auto-login/route";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const mockCreateAdminClient = createAdminClient as unknown as Mock;
const mockCreateClient = createClient as unknown as Mock;

const VALID_TOKEN = "super-secret-token";

/** Stub admin + SSR clients for the happy path; returns the inner spies for assertions. */
function stubClients(opts: { users?: Array<{ email: string }> } = {}) {
  const users = opts.users ?? [];
  const listUsers = vi.fn().mockResolvedValue({ data: { users }, error: null });
  const generateLink = vi.fn().mockResolvedValue({
    data: { properties: { hashed_token: "hashed-token-123" } },
    error: null,
  });
  mockCreateAdminClient.mockReturnValue({
    auth: { admin: { listUsers, generateLink } },
  });

  const verifyOtp = vi.fn().mockResolvedValue({ error: null });
  mockCreateClient.mockResolvedValue({ auth: { verifyOtp } });

  return { listUsers, generateLink, verifyOtp };
}

/** Build a GET /auto-login request with optional query token / header token. */
function makeRequest(params: {
  email?: string;
  token?: string;
  headerToken?: string;
  next?: string;
}) {
  const search = new URLSearchParams();
  if (params.email !== undefined) search.set("email", params.email);
  if (params.token !== undefined) search.set("token", params.token);
  if (params.next !== undefined) search.set("next", params.next);
  const url = `http://localhost:3000/auto-login?${search.toString()}`;
  return new NextRequest(
    url,
    params.headerToken
      ? { headers: { "x-auto-login-token": params.headerToken } }
      : undefined,
  );
}

function redirectPathname(response: Response) {
  return new URL(response.headers.get("location")!).pathname;
}

describe("GET /auto-login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("AUTO_LOGIN_TOKEN", VALID_TOKEN);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("production kill-switch", () => {
    it("returns 404 on Vercel production even with a valid token + existing user", async () => {
      vi.stubEnv("VERCEL_ENV", "production");
      stubClients({ users: [{ email: "admin-test@sun-asterisk.com" }] });

      const res = await GET(
        makeRequest({
          email: "admin-test@sun-asterisk.com",
          token: VALID_TOKEN,
        }),
      );

      expect(res.status).toBe(404);
      // The guard fires before any client work — the admin client is never created.
      expect(mockCreateAdminClient).not.toHaveBeenCalled();
    });
  });

  describe("token gate", () => {
    it("returns 404 when AUTO_LOGIN_TOKEN is unset/empty (disabled)", async () => {
      vi.stubEnv("AUTO_LOGIN_TOKEN", "");
      stubClients();

      const res = await GET(
        makeRequest({ email: "admin-test@sun-asterisk.com", token: "anything" }),
      );

      expect(res.status).toBe(404);
      expect(mockCreateAdminClient).not.toHaveBeenCalled();
    });

    it("returns 404 when the token is missing", async () => {
      stubClients();

      const res = await GET(
        makeRequest({ email: "admin-test@sun-asterisk.com" }),
      );

      expect(res.status).toBe(404);
      expect(mockCreateAdminClient).not.toHaveBeenCalled();
    });

    it("returns 404 for a wrong token of the same length (constant-time path)", async () => {
      stubClients();
      const wrong = "x".repeat(VALID_TOKEN.length);

      const res = await GET(
        makeRequest({ email: "admin-test@sun-asterisk.com", token: wrong }),
      );

      expect(res.status).toBe(404);
      expect(mockCreateAdminClient).not.toHaveBeenCalled();
    });

    it("returns 404 for a wrong token of a different length (no throw)", async () => {
      stubClients();

      const res = await GET(
        makeRequest({ email: "admin-test@sun-asterisk.com", token: "x" }),
      );

      expect(res.status).toBe(404);
      expect(mockCreateAdminClient).not.toHaveBeenCalled();
    });

    it("accepts the token from the x-auto-login-token header", async () => {
      const { verifyOtp } = stubClients({
        users: [{ email: "admin-test@sun-asterisk.com" }],
      });

      const res = await GET(
        makeRequest({
          email: "admin-test@sun-asterisk.com",
          headerToken: VALID_TOKEN,
        }),
      );

      expect(res.status).toBe(307);
      expect(verifyOtp).toHaveBeenCalled();
    });
  });

  describe("domain gate", () => {
    it("returns 404 for a disallowed domain without touching the admin client", async () => {
      stubClients();

      const res = await GET(
        makeRequest({ email: "intruder@gmail.com", token: VALID_TOKEN }),
      );

      expect(res.status).toBe(404);
      expect(mockCreateAdminClient).not.toHaveBeenCalled();
    });

    it("returns 404 when the email param is missing", async () => {
      stubClients();

      const res = await GET(makeRequest({ token: VALID_TOKEN }));

      expect(res.status).toBe(404);
      expect(mockCreateAdminClient).not.toHaveBeenCalled();
    });
  });

  describe("user lookup", () => {
    it("returns 404 when the user does not exist (no on-demand creation)", async () => {
      const { generateLink } = stubClients({ users: [] });

      const res = await GET(
        makeRequest({ email: "ghost@sun-asterisk.com", token: VALID_TOKEN }),
      );

      expect(res.status).toBe(404);
      expect(generateLink).not.toHaveBeenCalled();
    });
  });

  describe("happy path", () => {
    it("mints a session and redirects to / for an existing admin user", async () => {
      const email = "admin-test@sun-asterisk.com";
      const { generateLink, verifyOtp } = stubClients({ users: [{ email }] });

      const res = await GET(makeRequest({ email, token: VALID_TOKEN }));

      expect(res.status).toBe(307);
      expect(redirectPathname(res)).toBe("/");
      expect(generateLink).toHaveBeenCalledWith({ type: "magiclink", email });
      expect(verifyOtp).toHaveBeenCalledWith({
        type: "magiclink",
        token_hash: "hashed-token-123",
      });
    });

    it("works for a member user too", async () => {
      const email = "member-test@sun-asterisk.com";
      const { verifyOtp } = stubClients({ users: [{ email }] });

      const res = await GET(makeRequest({ email, token: VALID_TOKEN }));

      expect(res.status).toBe(307);
      expect(redirectPathname(res)).toBe("/");
      expect(verifyOtp).toHaveBeenCalled();
    });

    it("ignores a next param — always redirects to /", async () => {
      const email = "admin-test@sun-asterisk.com";
      stubClients({ users: [{ email }] });

      const res = await GET(
        makeRequest({ email, token: VALID_TOKEN, next: "/admin" }),
      );

      expect(res.status).toBe(307);
      expect(redirectPathname(res)).toBe("/");
    });

    it("returns 404 (not 500) when verifyOtp fails", async () => {
      const email = "admin-test@sun-asterisk.com";
      stubClients({ users: [{ email }] });
      mockCreateClient.mockResolvedValue({
        auth: {
          verifyOtp: vi.fn().mockResolvedValue({ error: new Error("boom") }),
        },
      });

      const res = await GET(makeRequest({ email, token: VALID_TOKEN }));

      expect(res.status).toBe(404);
    });
  });
});
