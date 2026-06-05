import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/render-with-intl";
import { LoginErrorBanner } from "./login-error-banner";

describe("LoginErrorBanner", () => {
  describe("rendering", () => {
    it("renders nothing when code is not provided", () => {
      const { container } = renderWithIntl(<LoginErrorBanner />);
      expect(container.firstChild).toBeNull();
    });

    it("renders nothing when code is undefined", () => {
      const { container } = renderWithIntl(<LoginErrorBanner code={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders nothing when code is empty string", () => {
      const { container } = renderWithIntl(<LoginErrorBanner code="" />);
      expect(container.firstChild).toBeNull();
    });

    it("renders alert role div when code is provided", () => {
      renderWithIntl(<LoginErrorBanner code="domain" />);
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });
  });

  describe("error messages", () => {
    it("displays domain error message in Vietnamese for code='domain'", () => {
      renderWithIntl(<LoginErrorBanner code="domain" />);
      expect(
        screen.getByText(
          /Tài khoản không thuộc miền @sun-asterisk.com/i
        )
      ).toBeInTheDocument();
    });

    it("displays oauth error message in Vietnamese for code='oauth'", () => {
      renderWithIntl(<LoginErrorBanner code="oauth" />);
      expect(
        screen.getByText(/Lỗi xác thực Google/i)
      ).toBeInTheDocument();
    });

    it("displays access_denied error message in Vietnamese for code='access_denied'", () => {
      renderWithIntl(<LoginErrorBanner code="access_denied" />);
      expect(
        screen.getByText(/Bạn đã từ chối đăng nhập/i)
      ).toBeInTheDocument();
    });

    it("displays generic error message for unknown code", () => {
      renderWithIntl(<LoginErrorBanner code="unknown_error" />);
      expect(
        screen.getByText(/Đăng nhập thất bại/i)
      ).toBeInTheDocument();
    });

    it("uses generic message for unknown error codes", () => {
      renderWithIntl(<LoginErrorBanner code="custom_error" />);
      expect(screen.getByText(/Đăng nhập thất bại/i)).toBeInTheDocument();
    });
  });

  describe("dismissal", () => {
    it("displays close button", () => {
      renderWithIntl(<LoginErrorBanner code="domain" />);
      const closeButton = screen.getByRole("button");
      expect(closeButton).toBeInTheDocument();
    });

    it("hides banner when close button is clicked", async () => {
      const user = userEvent.setup();
      renderWithIntl(<LoginErrorBanner code="domain" />);

      const closeButton = screen.getByRole("button");
      expect(screen.getByRole("alert")).toBeInTheDocument();

      await user.click(closeButton);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("close button has accessible aria-label in Vietnamese", () => {
      renderWithIntl(<LoginErrorBanner code="domain" />);
      const closeButton = screen.getByRole("button");
      expect(closeButton).toHaveAttribute("aria-label");
      expect(closeButton.getAttribute("aria-label")).toContain("Đóng");
    });

    it("remains hidden after dismissal even if re-rendered", async () => {
      const user = userEvent.setup();
      const { rerender } = renderWithIntl(<LoginErrorBanner code="domain" />);

      const closeButton = screen.getByRole("button");
      await user.click(closeButton);

      // Re-render with same code
      rerender(<LoginErrorBanner code="domain" />);

      // Should still be hidden (dismissed state persists within component)
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("keeps dismissed state when code prop stays the same", async () => {
      const user = userEvent.setup();
      const { rerender } = renderWithIntl(<LoginErrorBanner code="domain" />);

      const closeButton = screen.getByRole("button");
      await user.click(closeButton);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();

      // Re-render with same code (should stay dismissed)
      rerender(<LoginErrorBanner code="domain" />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("styling and structure", () => {
    it("renders with alert role for accessibility", () => {
      renderWithIntl(<LoginErrorBanner code="domain" />);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("displays error message text with proper styling", () => {
      renderWithIntl(<LoginErrorBanner code="domain" />);
      const alert = screen.getByRole("alert");
      expect(alert).toHaveStyle({ backgroundColor: "rgba(227, 29, 28, 0.15)" });
    });

    it("close button has proper aria-hidden SVG", () => {
      renderWithIntl(<LoginErrorBanner code="domain" />);
      const closeButton = screen.getByRole("button");
      const svg = closeButton.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });

    it("close icon SVG is present and functional", () => {
      renderWithIntl(<LoginErrorBanner code="domain" />);
      const closeButton = screen.getByRole("button");
      const svg = closeButton.querySelector("svg");
      expect(svg).toBeInTheDocument();
      // SVG should have path elements for the icon
      const paths = svg?.querySelectorAll("path");
      expect(paths?.length).toBeGreaterThan(0);
    });
  });

  describe("message mapping", () => {
    const viTestCases = [
      { code: "domain", expectedText: "sun-asterisk.com" },
      { code: "oauth", expectedText: "Google" },
      { code: "access_denied", expectedText: "từ chối" },
    ];

    viTestCases.forEach(({ code, expectedText }) => {
      it(`maps code="${code}" to correct Vietnamese message containing "${expectedText}"`, () => {
        renderWithIntl(<LoginErrorBanner code={code} />, { locale: "vi" });
        const alert = screen.getByRole("alert");
        expect(alert.textContent).toContain(expectedText);
      });
    });

    const enTestCases = [
      { code: "domain", expectedText: "sun-asterisk.com" },
      { code: "oauth", expectedText: "Google" },
      { code: "access_denied", expectedText: "declined" },
    ];

    enTestCases.forEach(({ code, expectedText }) => {
      it(`maps code="${code}" to correct English message containing "${expectedText}"`, () => {
        renderWithIntl(<LoginErrorBanner code={code} />, { locale: "en" });
        const alert = screen.getByRole("alert");
        expect(alert.textContent).toContain(expectedText);
      });
    });
  });

  describe("multiple instances", () => {
    it("handles multiple banner instances independently", () => {
      renderWithIntl(
        <>
          <LoginErrorBanner code="domain" />
          <LoginErrorBanner code="oauth" />
        </>
      );

      const alerts = screen.getAllByRole("alert");
      expect(alerts).toHaveLength(2);
    });
  });
});
