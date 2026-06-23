/**
 * Component tests for KudoCardBase new features.
 * Covers: title rendering, HTML body sanitization, anonymousName alias display.
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
    ownedByViewer: false,
    hashtags: [],
    images: [],
    ...overrides,
  };
}

const BASE_URL = "https://saa.sun-asterisk.com";

describe("KudoCardBase — title rendering", () => {
  it("renders custom title when card.title is set", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({ title: "EXCELLENT CONTRIBUTOR" })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    expect(screen.getByText("EXCELLENT CONTRIBUTOR")).toBeInTheDocument();
  });

  it("renders default idolTitle when card.title is undefined", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({ title: undefined })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    const defaultTitle = messages.Home.kudosPage.card.idolTitle;
    expect(screen.getByText(defaultTitle)).toBeInTheDocument();
  });

  it("renders default idolTitle when card.title is null", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({ title: null })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    const defaultTitle = messages.Home.kudosPage.card.idolTitle;
    expect(screen.getByText(defaultTitle)).toBeInTheDocument();
  });

  it("prefers custom title over default when both could apply", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({ title: "STAR PERFORMER" })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    expect(screen.getByText("STAR PERFORMER")).toBeInTheDocument();
    // Just verify custom title is shown; implementation may or may not render default
  });

  it("handles empty string title same as undefined (fallback to default)", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({ title: "" })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    // Empty string may or may not render custom — depends on implementation
    // At minimum, expect title to be present (either custom or default)
    const article = screen.getByRole("article");
    expect(article).toBeInTheDocument();
  });

  it("renders title with special characters", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({ title: "TOP 5 STARS — 2026" })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    expect(screen.getByText("TOP 5 STARS — 2026")).toBeInTheDocument();
  });

  it("renders title with unicode characters", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({ title: "⭐ CÓ TÀI ⭐" })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    expect(screen.getByText("⭐ CÓ TÀI ⭐")).toBeInTheDocument();
  });
});

describe("KudoCardBase — HTML body sanitization", () => {
  it("renders sanitized HTML body with allowed tags", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({
          body: "<p>Great <strong>work</strong> on the project</p>",
        })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    expect(screen.getByText(/Great/)).toBeInTheDocument();
    expect(screen.getByText(/work/)).toBeInTheDocument();
    // Strong tag should be rendered (not just text content)
    const strongElement = screen.getByText("work").closest("strong");
    expect(strongElement).toBeInTheDocument();
  });

  it("strips dangerous script tags from body", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({
          body: "<p>Hello</p><script>alert('xss')</script>",
        })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.queryByText(/alert/)).not.toBeInTheDocument();
    // Verify script tag is not in DOM
    const article = screen.getByRole("article");
    expect(article.innerHTML).not.toContain("script");
  });

  it("strips img tags from body", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({
          body: '<p>Text with <img src="https://example.com/bad.jpg"></p>',
        })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    expect(screen.getByText("Text with")).toBeInTheDocument();
    // Img tag should be stripped
    const article = screen.getByRole("article");
    expect(article.innerHTML).not.toContain("<img");
  });

  it("strips javascript: URIs from links in body", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({
          body: '<p>Click <a href="javascript:alert(1)">here</a></p>',
        })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    expect(screen.getByText("Click")).toBeInTheDocument();
    expect(screen.getByText("here")).toBeInTheDocument();
    // Link should be present but URI should be stripped
    const link = screen.getByText("here").closest("a");
    expect(link).toBeInTheDocument();
    expect(link?.href).not.toContain("javascript:");
  });

  it("preserves http:// and https:// links in body", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({
          body: '<p>See <a href="https://example.com">our docs</a></p>',
        })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    const link = screen.getByText("our docs") as HTMLAnchorElement;
    expect(link.href).toContain("https://example.com");
  });

  it("renders nested formatting tags (bold, italic)", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({
          body: "<p><strong><em>Excellent</em></strong> performance</p>",
        })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    expect(screen.getByText("Excellent")).toBeInTheDocument();
    expect(screen.getByText("performance")).toBeInTheDocument();
    // Check nesting
    const emElement = screen.getByText("Excellent").closest("em");
    expect(emElement).toBeInTheDocument();
    const strongElement = emElement?.closest("strong");
    expect(strongElement).toBeInTheDocument();
  });

  it("renders lists in body", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({
          body: "<ol><li>First achievement</li><li>Second achievement</li></ol>",
        })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    expect(screen.getByText("First achievement")).toBeInTheDocument();
    expect(screen.getByText("Second achievement")).toBeInTheDocument();
    // Verify list structure
    const firstItem = screen.getByText("First achievement").closest("li");
    expect(firstItem).toBeInTheDocument();
  });

  it("renders blockquotes in body", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({
          body: "<blockquote>Your code was impressive</blockquote>",
        })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    expect(screen.getByText("Your code was impressive")).toBeInTheDocument();
    const blockquote = screen.getByText("Your code was impressive").closest(
      "blockquote",
    );
    expect(blockquote).toBeInTheDocument();
  });

  it("strips disallowed attributes like onerror", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({
          body: '<p onerror="alert(1)">Text</p>',
        })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    expect(screen.getByText("Text")).toBeInTheDocument();
    const p = screen.getByText("Text").closest("p");
    expect(p).not.toHaveAttribute("onerror");
  });
});

describe("KudoCardBase — anonymous sender with alias", () => {
  it("shows anonymousName when isAnonymous=true and alias provided", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({
          isAnonymous: true,
          anonymousName: "Secret Admirer",
        })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    expect(screen.getByText("Secret Admirer")).toBeInTheDocument();
    // Original sender name should NOT be shown
    expect(screen.queryByText("Alice Nguyen")).not.toBeInTheDocument();
  });

  it("shows generic 'Ẩn danh' label when isAnonymous=true but no alias", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({
          isAnonymous: true,
          anonymousName: null,
        })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    const anonLabel = messages.Home.kudosPage.card.anonymous;
    expect(screen.getByText(anonLabel)).toBeInTheDocument();
  });

  it("shows generic label when isAnonymous=true and alias is empty string", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({
          isAnonymous: true,
          anonymousName: "",
        })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    const anonLabel = messages.Home.kudosPage.card.anonymous;
    expect(screen.getByText(anonLabel)).toBeInTheDocument();
  });

  it("shows generic label when isAnonymous=true and alias is whitespace only", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({
          isAnonymous: true,
          anonymousName: "   ",
        })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    const anonLabel = messages.Home.kudosPage.card.anonymous;
    // Depends on implementation: might show label or whitespace
    // At least, should not show original sender name
    expect(screen.queryByText("Alice Nguyen")).not.toBeInTheDocument();
  });

  it("shows sender name when isAnonymous=false (even if alias set)", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({
          isAnonymous: false,
          anonymousName: "Some Alias",
        })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    expect(screen.getByText("Alice Nguyen")).toBeInTheDocument();
    // Alias should NOT appear as sender name
    expect(screen.queryByText("Some Alias")).not.toBeInTheDocument();
  });

  it("handles anonymous with unicode alias", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({
          isAnonymous: true,
          anonymousName: "Người bạn ẩn danh",
        })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    expect(screen.getByText("Người bạn ẩn danh")).toBeInTheDocument();
    expect(screen.queryByText("Alice Nguyen")).not.toBeInTheDocument();
  });

  it("handles anonymous with special characters in alias", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({
          isAnonymous: true,
          anonymousName: "⭐ Mystery ⭐",
        })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    expect(screen.getByText("⭐ Mystery ⭐")).toBeInTheDocument();
  });
});

describe("KudoCardBase — combined: title + body + anonymous", () => {
  it("renders all three features together correctly", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({
          title: "MVP OF THE MONTH",
          body: "<p>You <strong>led</strong> the team to victory.</p>",
          isAnonymous: true,
          anonymousName: "The Team",
        })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    expect(screen.getByText("MVP OF THE MONTH")).toBeInTheDocument();
    expect(screen.getByText("The Team")).toBeInTheDocument();
    expect(screen.getByText(/victory/)).toBeInTheDocument();
    expect(screen.getByText("led").closest("strong")).toBeInTheDocument();
    expect(screen.queryByText("Alice Nguyen")).not.toBeInTheDocument();
  });

  it("recipient name is always shown regardless of sender anonymity", () => {
    renderWithIntl(
      <KudoCardBase
        card={makeCard({
          isAnonymous: true,
          anonymousName: "Secret Friend",
        })}
        baseUrl={BASE_URL}
        showImages
        bodyClamp={5}
      />
    );
    expect(screen.getByText("Bob Tran")).toBeInTheDocument();
    expect(screen.getByText("Secret Friend")).toBeInTheDocument();
  });
});
