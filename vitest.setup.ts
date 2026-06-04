import "@testing-library/jest-dom";
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js Image (if used in components)
vi.mock("next/image", () => ({
  default: (props: any) => ({
    // Mock image component
    $$typeof: Symbol.for("react.element"),
    type: "img",
    props,
  }),
}));

// Mock window.location if needed
delete (window as any).location;
(window as any).location = { assign: vi.fn() };
