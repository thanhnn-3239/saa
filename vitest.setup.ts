import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Provide the client env vars the typed env module (lib/env.ts) validates at
// import time. Vitest does not load .env.local, so any test that imports a real
// (non-mocked) module pulling in @/lib/env would otherwise fail createEnv()
// validation. Set here — before test files are imported — so the capture
// succeeds. Values are non-secret local-dev placeholders.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://127.0.0.1:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js Image (if used in components)
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => ({
    // Mock image component
    $$typeof: Symbol.for("react.element"),
    type: "img",
    props,
  }),
}));

// Mock window.location if needed
delete (window as { location?: unknown }).location;
(window as { location: unknown }).location = { assign: vi.fn() };
