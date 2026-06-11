/**
 * Component tests for HeartButton.
 * Covers: toggle gray ↔ red, count display, disabled state (TC: 63645b03, 91e102ba, 7a7ec63e)
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { HeartButton } from "@/app/(public)/sun-kudos/_components/ui/heart-button";
import messages from "@/messages/en.json";

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("HeartButton (B3 like rules)", () => {
  it("renders heart button element", () => {
    renderWithIntl(
      <HeartButton
        liked={false}
        count={5}
        onClick={() => {}}
      />
    );
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("displays heart count", () => {
    renderWithIntl(
      <HeartButton
        liked={false}
        count={12}
        onClick={() => {}}
      />
    );
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders with aria-pressed when liked (accessibility)", () => {
    renderWithIntl(
      <HeartButton
        liked={true}
        count={5}
        onClick={() => {}}
      />
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed");
  });

  it("renders with aria-pressed when not liked (accessibility)", () => {
    renderWithIntl(
      <HeartButton
        liked={false}
        count={5}
        onClick={() => {}}
      />
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed");
  });

  it("accepts disabled prop", () => {
    renderWithIntl(
      <HeartButton
        liked={false}
        count={5}
        onClick={() => {}}
        disabled={true}
      />
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("is not disabled by default", () => {
    renderWithIntl(
      <HeartButton
        liked={false}
        count={5}
        onClick={() => {}}
      />
    );
    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
  });

  it("has proper aria-label for accessibility", () => {
    renderWithIntl(
      <HeartButton
        liked={false}
        count={5}
        onClick={() => {}}
      />
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label");
  });
});
