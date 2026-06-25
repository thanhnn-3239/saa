/**
 * Component tests for ProfileFeed — kudo post card list rendering.
 *
 * Covers:
 * - renders KudoPostCard for each card
 * - empty state message when no cards
 * - correct baseUrl prop passing
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { ProfileFeed } from "./profile-feed";
import type { KudoCard } from "@/lib/kudos/types";

// Mock KudoPostCard to avoid complex setup
vi.mock("@/app/(public)/sun-kudos/_components/feed/kudo-post-card", () => ({
  KudoPostCard: ({
    card,
    baseUrl,
  }: {
    card: KudoCard;
    baseUrl: string;
  }) => (
    <div data-testid={`kudo-card-${card.id}`}>
      <div>{card.body}</div>
      <div data-testid="base-url">{baseUrl}</div>
    </div>
  ),
}));

const mockCards: KudoCard[] = [
  {
    id: "kudo-1",
    sender: {
      id: "sender-1",
      fullName: "Alice",
      avatarUrl: null,
      stars: 1,
      kudosReceived: 10,
      departmentId: 1,
    },
    recipient: {
      id: "recipient-1",
      fullName: "Bob",
      avatarUrl: null,
      stars: 2,
      kudosReceived: 20,
      departmentId: 2,
    },
    body: "Great work on the project!",
    isAnonymous: false,
    createdAt: "2026-06-25T10:00:00.000Z",
    heartTotal: 5,
    likeCount: 3,
    liked: false,
    ownedByViewer: false,
    hashtags: ["teamwork"],
    images: [],
    title: null,
  },
  {
    id: "kudo-2",
    sender: {
      id: "sender-2",
      fullName: "Charlie",
      avatarUrl: null,
      stars: 0,
      kudosReceived: 0,
      departmentId: 3,
    },
    recipient: {
      id: "recipient-2",
      fullName: "Diana",
      avatarUrl: null,
      stars: 3,
      kudosReceived: 55,
      departmentId: 1,
    },
    body: "Amazing contribution!",
    isAnonymous: false,
    createdAt: "2026-06-24T10:00:00.000Z",
    heartTotal: 10,
    likeCount: 8,
    liked: false,
    ownedByViewer: false,
    hashtags: ["innovation"],
    images: [],
    title: null,
  },
];

function renderFeed(
  cards: KudoCard[] = mockCards,
  baseUrl: string = "https://example.com",
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProfileFeed cards={cards} baseUrl={baseUrl} />
    </NextIntlClientProvider>,
  );
}

describe("ProfileFeed", () => {
  it("renders a card for each kudo", () => {
    renderFeed();
    expect(screen.getByTestId("kudo-card-kudo-1")).toBeInTheDocument();
    expect(screen.getByTestId("kudo-card-kudo-2")).toBeInTheDocument();
  });

  it("renders card content correctly", () => {
    renderFeed();
    expect(screen.getByText("Great work on the project!")).toBeInTheDocument();
    expect(screen.getByText("Amazing contribution!")).toBeInTheDocument();
  });

  it("passes baseUrl to each KudoPostCard", () => {
    renderFeed(mockCards, "https://saa.example.com");
    const baseUrlElements = screen.getAllByTestId("base-url");
    expect(baseUrlElements).toHaveLength(2);
    expect(baseUrlElements[0]).toHaveTextContent("https://saa.example.com");
    expect(baseUrlElements[1]).toHaveTextContent("https://saa.example.com");
  });

  it("passes correct card prop to KudoPostCard", () => {
    renderFeed([mockCards[0]]);
    const cardDiv = screen.getByTestId("kudo-card-kudo-1");
    expect(cardDiv.textContent).toContain("Great work on the project!");
  });

  it("renders an empty list container (no cards) when cards array is empty", () => {
    // Empty/loading-state UX is owned by the caller (ProfileContent) — see review H2.
    // ProfileFeed only renders the list wrapper with no cards.
    const { container } = renderFeed([]);
    expect(screen.queryByTestId("kudo-card-kudo-1")).not.toBeInTheDocument();
    expect(container.querySelector(".flex.flex-col.gap-6")).toBeInTheDocument();
  });

  it("renders flex column layout for cards", () => {
    const { container } = renderFeed();
    const wrapper = container.querySelector(".flex.flex-col.gap-6");
    expect(wrapper).toBeInTheDocument();
  });

  it("maintains gap between cards (gap-6)", () => {
    const { container } = renderFeed();
    const wrapper = container.querySelector(".flex.flex-col.gap-6");
    expect(wrapper).toHaveClass("gap-6");
  });

  it("passes full-width className to wrapper", () => {
    const { container } = renderFeed();
    const wrapper = container.querySelector(".w-full");
    expect(wrapper).toBeInTheDocument();
  });

  it("renders cards in correct order (by map index)", () => {
    renderFeed();
    const cardDivs = screen.getAllByTestId(/^kudo-card-/);
    expect(cardDivs[0]).toHaveAttribute("data-testid", "kudo-card-kudo-1");
    expect(cardDivs[1]).toHaveAttribute("data-testid", "kudo-card-kudo-2");
  });

  it("renders many cards without errors", () => {
    const manyCards = Array.from({ length: 50 }, (_, i) => ({
      ...mockCards[0],
      id: `kudo-${i}`,
      body: `Card ${i}`,
    }));
    renderFeed(manyCards);
    expect(screen.getAllByTestId(/^kudo-card-/)).toHaveLength(50);
  });
});
