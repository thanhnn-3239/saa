/**
 * Component tests for empty states.
 * Covers: "Hiện tại chưa có Kudos nào." (feed), "Chưa có dữ liệu" (spotlight/sidebar)
 * TC: 926d92a5 (feed), ddf67e52 (spotlight)
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/app/(public)/sun-kudos/_components/ui/empty-state";

describe("EmptyState (shared component)", () => {
  it("renders with provided message", () => {
    render(
      <EmptyState message="Hiện tại chưa có Kudos nào." />
    );
    expect(screen.getByText("Hiện tại chưa có Kudos nào.")).toBeInTheDocument();
  });

  it("renders with different empty state message for spotlight", () => {
    render(
      <EmptyState message="Chưa có dữ liệu" />
    );
    expect(screen.getByText("Chưa có dữ liệu")).toBeInTheDocument();
  });

  it("renders inbox icon", () => {
    const { container } = render(
      <EmptyState message="Test message" />
    );
    // Icon is an SVG element
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
  });

  it("has centered layout structure (flex, items-center, justify-center)", () => {
    const { container } = render(
      <EmptyState message="Test" />
    );
    // Should have flex centering classes
    const wrapper = container.querySelector("[class*='flex']");
    expect(wrapper).toHaveClass("flex", "items-center", "justify-center");
  });

  it("accepts both Vietnamese strings", () => {
    const { rerender } = render(
      <EmptyState message="Hiện tại chưa có Kudos nào." />
    );
    expect(screen.getByText("Hiện tại chưa có Kudos nào.")).toBeInTheDocument();

    rerender(
      <EmptyState message="Chưa có dữ liệu" />
    );
    expect(screen.getByText("Chưa có dữ liệu")).toBeInTheDocument();
  });

  it("accepts optional className prop", () => {
    const { container } = render(
      <EmptyState message="Test" className="custom-class" />
    );
    const wrapper = container.querySelector("[class*='custom-class']");
    expect(wrapper).toBeTruthy();
  });
});
