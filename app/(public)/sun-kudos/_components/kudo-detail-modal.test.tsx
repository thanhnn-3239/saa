import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { KudoDetailModal } from "./kudo-detail-modal";
import type { KudoCard } from "@/lib/kudos/types";

const { state, mockReplace } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  state: { kudoParam: null as string | null, kudo: undefined as KudoCard | undefined, isLoading: false },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(state.kudoParam ? `kudo=${state.kudoParam}` : ""),
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/sun-kudos",
}));
vi.mock("@/lib/kudos/use-kudo", () => ({
  useKudo: () => ({ data: state.kudo, isLoading: state.isLoading, isError: false }),
}));

function renderModal() {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <KudoDetailModal baseUrl="http://localhost" />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  state.kudoParam = null;
  state.kudo = undefined;
  state.isLoading = false;
  mockReplace.mockReset();
});

describe("KudoDetailModal", () => {
  it("renders nothing when there is no ?kudo param", () => {
    renderModal();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a dialog when ?kudo=<id> is present", () => {
    state.kudoParam = "kudo-1";
    state.isLoading = true;
    renderModal();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
