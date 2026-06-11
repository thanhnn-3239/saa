import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import { AppHeader } from "@/app/(public)/_components/app-header";
import { ROUTES } from "@/lib/navigation/routes";

// Mock next/image to avoid issues during testing
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

// Controllable pathname so each test can simulate being on a different tab.
const { mockUsePathname } = vi.hoisted(() => ({
  mockUsePathname: vi.fn<() => string>(() => "/"),
}));
vi.mock("next/navigation", () => ({
  usePathname: mockUsePathname,
}));

beforeEach(() => {
  mockUsePathname.mockReturnValue("/");
});

/** Resolved EN nav labels — mirrors what the layout passes at runtime. */
const defaultNavLabels = {
  aboutSaa: "About SAA 2025",
  awardInformation: "Award Information",
  kudos: "Sun* Kudos",
};

describe("AppHeader (ID-0, ID-1, ID-18, ID-20, ID-21, ID-22)", () => {
  it("renders without authControls (guest view) — shows logo, nav, language switcher but NOT auth controls (ID-0)", () => {
    render(
      <AppHeader
        languageSwitcher={<div>Language Switcher Slot</div>}
        authControls={undefined}
        navLabels={defaultNavLabels}
      />
    );

    expect(screen.getByAltText("Sun* Annual Awards")).toBeInTheDocument();
    expect(screen.getByText("About SAA 2025")).toBeInTheDocument();
    expect(screen.getByText("Award Information")).toBeInTheDocument();
    expect(screen.getByText("Sun* Kudos")).toBeInTheDocument();
    expect(screen.getByText("Language Switcher Slot")).toBeInTheDocument();
  });

  it("renders with authControls provided — shows auth controls in the right slot (ID-1)", () => {
    render(
      <AppHeader
        languageSwitcher={<div>Language Switcher Slot</div>}
        authControls={<div>Auth Controls: Notification + Account Menu</div>}
        navLabels={defaultNavLabels}
      />
    );

    expect(screen.getByText("Auth Controls: Notification + Account Menu")).toBeInTheDocument();
    expect(screen.getByText("Language Switcher Slot")).toBeInTheDocument();
  });

  it("logo links to home (ID-18)", () => {
    render(
      <AppHeader
        languageSwitcher={<div>Language Switcher Slot</div>}
        navLabels={defaultNavLabels}
      />
    );

    const logoLink = screen.getByAltText("Sun* Annual Awards").closest("a");
    expect(logoLink).toHaveAttribute("href", ROUTES.home);
  });

  it("'About SAA 2025' nav link points to home (ID-20)", () => {
    render(
      <AppHeader
        languageSwitcher={<div>Language Switcher Slot</div>}
        navLabels={defaultNavLabels}
      />
    );

    const aboutLink = screen.getByText("About SAA 2025").closest("a");
    expect(aboutLink).toHaveAttribute("href", ROUTES.home);
  });

  it("'Award Information' nav link points to awardsInfo route (ID-21)", () => {
    render(
      <AppHeader
        languageSwitcher={<div>Language Switcher Slot</div>}
        navLabels={defaultNavLabels}
      />
    );

    const awardLink = screen.getByText("Award Information").closest("a");
    expect(awardLink).toHaveAttribute("href", ROUTES.awardsInfo);
  });

  it("'Sun* Kudos' nav link points to kudos route (ID-22)", () => {
    render(
      <AppHeader
        languageSwitcher={<div>Language Switcher Slot</div>}
        navLabels={defaultNavLabels}
      />
    );

    const kudosLink = screen.getByText("Sun* Kudos").closest("a");
    expect(kudosLink).toHaveAttribute("href", ROUTES.kudos);
  });
});

describe("AppHeader — active nav tab follows the current pathname", () => {
  function renderHeader() {
    render(
      <AppHeader
        languageSwitcher={<div>Language Switcher Slot</div>}
        navLabels={defaultNavLabels}
      />
    );
  }

  /** The link marked active via aria-current="page", or null when none is. */
  function activeLink(): HTMLElement | null {
    return screen.queryByRole("link", { current: "page" });
  }

  it("marks 'About SAA 2025' active on the home page", () => {
    mockUsePathname.mockReturnValue(ROUTES.home);
    renderHeader();

    expect(activeLink()).toHaveTextContent("About SAA 2025");
    expect(activeLink()?.className).toContain("text-saa-gold-accent");
  });

  it("marks 'Award Information' active on the awards-information page", () => {
    mockUsePathname.mockReturnValue(ROUTES.awardsInfo);
    renderHeader();

    expect(activeLink()).toHaveTextContent("Award Information");
    // The previously hardcoded tab must no longer be highlighted.
    const aboutLink = screen.getByText("About SAA 2025").closest("a");
    expect(aboutLink?.className).toContain("text-white");
    expect(aboutLink?.className).not.toContain("text-saa-gold-accent");
  });

  it("marks 'Sun* Kudos' active on the sun-kudos page", () => {
    mockUsePathname.mockReturnValue(ROUTES.kudos);
    renderHeader();

    expect(activeLink()).toHaveTextContent("Sun* Kudos");
    expect(activeLink()?.className).toContain("text-saa-gold-accent");
  });

  it("keeps 'Sun* Kudos' active on nested kudos paths", () => {
    mockUsePathname.mockReturnValue(`${ROUTES.kudos}/some-post`);
    renderHeader();

    expect(activeLink()).toHaveTextContent("Sun* Kudos");
  });

  it("highlights no tab on unrelated pages (e.g. /profile)", () => {
    mockUsePathname.mockReturnValue(ROUTES.profile);
    renderHeader();

    expect(activeLink()).toBeNull();
  });

  it("does NOT mark 'About SAA 2025' active outside home — only one tab is active at a time", () => {
    mockUsePathname.mockReturnValue(ROUTES.kudos);
    renderHeader();

    expect(screen.getAllByRole("link", { current: "page" })).toHaveLength(1);
  });
});
