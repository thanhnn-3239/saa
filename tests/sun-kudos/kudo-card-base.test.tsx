/**
 * Component tests for KudoCardBase — the shared base behind the feed (C.3)
 * and highlight (B.3) cards. Guards the variant wiring after the Phase-3
 * unify refactor (plans/260610-1011-kudos-ui-fidelity/phase-03).
 *
 * Covers: feed vs highlight variant differences (images, "View detail",
 * hashtag overflow, carousel active state) + anonymous sender handling.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { KudoCardBase } from "@/app/(public)/sun-kudos/_components/ui/kudo-card-base";
import type { KudoCard, ProfileBrief } from "@/lib/kudos/types";
import messages from "@/messages/en.json";

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

// avatarUrl null → Avatar renders initials (no next/image in jsdom);
// kudosReceived 0 → getHeroTier returns null (no hero-title pill).
function profile(fullName: string): ProfileBrief {
  return {
    id: `id-${fullName}`,
    fullName,
    avatarUrl: null,
    stars: 0,
    kudosReceived: 0,
    departmentId: null,
  };
}

function makeCard(overrides: Partial<KudoCard> = {}): KudoCard {
  return {
    id: "kudo-1",
    sender: profile("Alice Nguyen"),
    recipient: profile("Bob Tran"),
    body: "Cảm ơn bạn rất nhiều vì đã hỗ trợ.",
    isAnonymous: false,
    createdAt: "2026-06-10T03:30:00.000Z",
    heartTotal: 5,
    likeCount: 3,
    liked: false,
    hashtags: [],
    images: [],
    ...overrides,
  };
}

const BASE_URL = "https://saa.sun-asterisk.com";
const VIEW_DETAIL = messages.Home.kudosPage.card.viewDetail; // "View detail"

describe("KudoCardBase — feed variant", () => {
  it("renders the image gallery and omits 'View detail'", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({ images: ["a.png", "b.png"] })}
        baseUrl={BASE_URL}
        showImages
        showViewDetail={false}
        bodyClamp={5}
      />
    );
    // imageAlt = "Kudo image" → one button per thumbnail
    expect(screen.getAllByLabelText(/Kudo image/)).toHaveLength(2);
    expect(screen.queryByText(VIEW_DETAIL)).not.toBeInTheDocument();
  });

  it("shows all hashtags with no overflow chip when maxHashtags is unset", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({ hashtags: ["#a", "#b", "#c", "#d", "#e", "#f"] })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    expect(screen.getByText("#f")).toBeInTheDocument();
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it("does not apply carousel scaling/aria-current when active is undefined", () => {
    renderWithIntl(
      <KudoCardBase card={makeCard()} baseUrl={BASE_URL} showImages bodyClamp={5} />
    );
    const article = screen.getByRole("article");
    expect(article).not.toHaveAttribute("aria-current");
    expect(article.className).not.toMatch(/scale-95/);
  });
});

describe("KudoCardBase — highlight variant", () => {
  it("renders 'View detail', no image gallery, and sets aria-current when active", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({ images: ["a.png", "b.png"] })}
        baseUrl={BASE_URL}
        showImages={false}
        showViewDetail
        bodyClamp={3}
        maxHashtags={5}
        active
      />
    );
    expect(screen.getByText(VIEW_DETAIL)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Kudo image/)).not.toBeInTheDocument();
    expect(screen.getByRole("article")).toHaveAttribute("aria-current", "true");
  });

  it("caps hashtags at maxHashtags and shows a '+N' overflow chip", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({ hashtags: ["#1", "#2", "#3", "#4", "#5", "#6", "#7"] })}
        baseUrl={BASE_URL}
        showViewDetail
        bodyClamp={3}
        maxHashtags={5}
        active
      />
    );
    expect(screen.getByText("#5")).toBeInTheDocument();
    expect(screen.queryByText("#6")).not.toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("dims the card (scale-95, no aria-current) when active is false", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard()}
        baseUrl={BASE_URL}
        showViewDetail
        bodyClamp={3}
        active={false}
      />
    );
    const article = screen.getByRole("article");
    expect(article.className).toMatch(/scale-95/);
    expect(article).not.toHaveAttribute("aria-current");
  });
});

describe("KudoCardBase — anonymous sender", () => {
  it("renders the anonymous label instead of the sender name", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({ isAnonymous: true })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    expect(screen.getByText(messages.Home.kudosPage.card.anonymous)).toBeInTheDocument();
    expect(screen.queryByText("Alice Nguyen")).not.toBeInTheDocument();
    // recipient name still shown
    expect(screen.getByText("Bob Tran")).toBeInTheDocument();
  });
});
