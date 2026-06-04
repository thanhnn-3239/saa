import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/render-with-intl";

// Mock the router (next/navigation) and the server action boundary.
const refreshMock = vi.fn();
const setLocaleMock = vi.fn().mockResolvedValue(undefined);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));
vi.mock("@/lib/i18n/locale-actions", () => ({
  setLocale: (locale: string) => setLocaleMock(locale),
}));

// Imported after mocks so the component picks them up.
import { LanguageSwitcher } from "./language-switcher";

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    setLocaleMock.mockClear();
  });

  it("shows the current locale's display code (vi → VN)", () => {
    renderWithIntl(<LanguageSwitcher />, { locale: "vi" });
    expect(
      screen.getByRole("button", { name: /chọn ngôn ngữ/i }),
    ).toHaveTextContent("VN");
  });

  it("reflects the en locale (→ EN) with its own flag", () => {
    const { container } = renderWithIntl(<LanguageSwitcher />, { locale: "en" });
    expect(screen.getByRole("button")).toHaveTextContent("EN");
    // VN flag's unique yellow star must NOT be the trigger flag when locale is en.
    expect(container.querySelector('path[fill="#FFD221"]')).toBeNull();
  });

  it("trigger uses a pointer cursor", () => {
    renderWithIntl(<LanguageSwitcher />, { locale: "vi" });
    expect(screen.getByRole("button")).toHaveClass("cursor-pointer");
  });

  it("opens a listbox with both VN and EN options on click", async () => {
    const user = userEvent.setup();
    renderWithIntl(<LanguageSwitcher />, { locale: "vi" });
    await user.click(screen.getByRole("button"));
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options.map((o) => o.textContent)).toEqual(
      expect.arrayContaining(["VN", "EN"]),
    );
  });

  it("selecting the other locale calls setLocale then router.refresh", async () => {
    const user = userEvent.setup();
    renderWithIntl(<LanguageSwitcher />, { locale: "vi" });
    await user.click(screen.getByRole("button"));
    const enOption = within(screen.getByRole("listbox"))
      .getAllByRole("option")
      .find((o) => o.textContent === "EN")!;
    await user.click(enOption);

    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
    expect(setLocaleMock).toHaveBeenCalledWith("en");
  });

  it("selecting the already-active locale is a no-op", async () => {
    const user = userEvent.setup();
    renderWithIntl(<LanguageSwitcher />, { locale: "vi" });
    await user.click(screen.getByRole("button"));
    const vnOption = within(screen.getByRole("listbox"))
      .getAllByRole("option")
      .find((o) => o.textContent === "VN")!;
    await user.click(vnOption);

    expect(setLocaleMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
