import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import { CountdownTimer } from "@/app/(public)/_components/homepage/countdown-timer";

describe("CountdownTimer (ID-40, ID-41, ID-42, ID-43)", () => {
  it("renders 2-digit padded values with default labels when showComingSoon is true (ID-40)", () => {
    const { container } = render(
      <CountdownTimer
        days={5}
        hours={9}
        minutes={3}
        showComingSoon={true}
      />
    );

    // Verify "Coming soon" label is shown
    expect(screen.getByText("Coming soon")).toBeInTheDocument();

    // Verify days are 2-digit padded: 05
    expect(screen.getByText("DAYS")).toBeInTheDocument();
    const digitTiles = screen.getAllByText(/^[0-9]$/);
    // Should have 6 tiles: 0,5 (days), 0,9 (hours), 0,3 (minutes)
    expect(digitTiles).toHaveLength(6); // 2 tiles per unit × 3 units

    // Check that container has the expected structure
    const text = container.textContent || "";
    expect(text).toContain("05");
    expect(text).toContain("09");
    expect(text).toContain("03");
  });

  it("renders hour and minute labels (ID-41)", () => {
    render(
      <CountdownTimer
        days={1}
        hours={2}
        minutes={3}
        showComingSoon={false}
      />
    );

    expect(screen.getByText("DAYS")).toBeInTheDocument();
    expect(screen.getByText("HOURS")).toBeInTheDocument();
    expect(screen.getByText("MINUTES")).toBeInTheDocument();
  });

  it("hides 'Coming soon' label when showComingSoon is false (ID-42)", () => {
    render(
      <CountdownTimer
        days={5}
        hours={9}
        minutes={3}
        showComingSoon={false}
      />
    );

    expect(screen.queryByText("Coming soon")).not.toBeInTheDocument();
    // But still renders the timer units
    expect(screen.getByText("DAYS")).toBeInTheDocument();
  });

  it("accepts custom i18n labels and renders them (ID-43)", () => {
    render(
      <CountdownTimer
        days={2}
        hours={4}
        minutes={6}
        showComingSoon={true}
        labelDays="NGÀY"
        labelHours="GIỜ"
        labelMinutes="PHÚT"
        labelComingSoon="Sắp ra mắt"
      />
    );

    expect(screen.getByText("Sắp ra mắt")).toBeInTheDocument();
    expect(screen.getByText("NGÀY")).toBeInTheDocument();
    expect(screen.getByText("GIỜ")).toBeInTheDocument();
    expect(screen.getByText("PHÚT")).toBeInTheDocument();
  });

  it("correctly pads single-digit values to 2 digits", () => {
    render(
      <CountdownTimer
        days={0}
        hours={5}
        minutes={9}
        showComingSoon={false}
      />
    );

    // Days should be 00, hours 05, minutes 09
    const digitTiles = screen.getAllByText(/^[0-9]$/);
    expect(digitTiles).toHaveLength(6); // 2 per unit × 3 units
  });

  it("renders large numbers with correct padding", () => {
    const { container } = render(
      <CountdownTimer
        days={25}
        hours={23}
        minutes={59}
        showComingSoon={false}
      />
    );

    expect(screen.getByText("DAYS")).toBeInTheDocument();
    const text = container.textContent || "";
    // 25, 23, 59 should all appear
    expect(text).toContain("25");
    expect(text).toContain("23");
    expect(text).toContain("59");
  });
});
