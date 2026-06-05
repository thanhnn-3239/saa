import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

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
