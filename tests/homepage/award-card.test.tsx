import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import { AwardCard } from "@/app/(public)/_components/homepage/award-card";

// Mock next/image to avoid issues during testing
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

describe("AwardCard (ID-47, ID-48, ID-49, ID-50, ID-52)", () => {
  it("renders title text (ID-47)", () => {
    render(
      <AwardCard
        title="Top Talent"
        description="Award for outstanding individuals"
        imageSrc="/homepage-saa/Top_Talent.png"
        href="/he-thong-giai#top-talent"
        detailsCta="Details"
      />
    );

    expect(screen.getByText("Top Talent")).toBeInTheDocument();
  });

  it("renders description with line-clamp-2 class applied (ID-48)", () => {
    render(
      <AwardCard
        title="Top Talent"
        description="Award for outstanding individuals across all fields"
        imageSrc="/homepage-saa/Top_Talent.png"
        href="/he-thong-giai#top-talent"
        detailsCta="Details"
      />
    );

    const description = screen.getByText("Award for outstanding individuals across all fields");
    expect(description).toHaveClass("line-clamp-2");
  });

  it("renders award overlay image with correct alt text (ID-49)", () => {
    render(
      <AwardCard
        title="Top Talent"
        description="Award for outstanding individuals"
        imageSrc="/homepage-saa/Top_Talent.png"
        href="/he-thong-giai#top-talent"
        detailsCta="Details"
      />
    );

    expect(screen.getByAltText("Top Talent")).toBeInTheDocument();
    expect(screen.getByAltText("Top Talent")).toHaveAttribute(
      "src",
      expect.stringContaining("Top_Talent.png")
    );
  });

  it("renders detailsCta text (ID-50)", () => {
    render(
      <AwardCard
        title="Top Talent"
        description="Award for outstanding individuals"
        imageSrc="/homepage-saa/Top_Talent.png"
        href="/he-thong-giai#top-talent"
        detailsCta="Chi tiết"
      />
    );

    expect(screen.getByText("Chi tiết")).toBeInTheDocument();
  });

  it("entire card is wrapped in a link with the correct href (ID-52)", () => {
    render(
      <AwardCard
        title="Top Talent"
        description="Award for outstanding individuals"
        imageSrc="/homepage-saa/Top_Talent.png"
        href="/he-thong-giai#top-talent"
        detailsCta="Details"
      />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/he-thong-giai#top-talent");
    // Verify that title and description are children of the link
    expect(link).toContainElement(screen.getByText("Top Talent"));
    expect(link).toContainElement(
      screen.getByText("Award for outstanding individuals")
    );
  });

  it("renders arrow icon in the details CTA section", () => {
    const { container } = render(
      <AwardCard
        title="Best Manager"
        description="Award for inspiring and effective managers"
        imageSrc="/homepage-saa/Best_Manager.png"
        href="/he-thong-giai#best-manager"
        detailsCta="Chi tiết"
      />
    );

    // SVG should be present in the document (arrow icon)
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("handles multiple award cards with different data", () => {
    const awards = [
      {
        title: "Top Project",
        description: "Outstanding project of the year",
        imageSrc: "/homepage-saa/Top_Project.png",
        href: "/he-thong-giai#top-project",
      },
      {
        title: "MVP",
        description: "Most valuable person",
        imageSrc: "/homepage-saa/MVP.png",
        href: "/he-thong-giai#mvp",
      },
    ];

    const { rerender } = render(
      <AwardCard
        title={awards[0].title}
        description={awards[0].description}
        imageSrc={awards[0].imageSrc}
        href={awards[0].href}
        detailsCta="Details"
      />
    );

    expect(screen.getByText("Top Project")).toBeInTheDocument();

    rerender(
      <AwardCard
        title={awards[1].title}
        description={awards[1].description}
        imageSrc={awards[1].imageSrc}
        href={awards[1].href}
        detailsCta="Details"
      />
    );

    expect(screen.getByText("MVP")).toBeInTheDocument();
  });
});
