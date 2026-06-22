/**
 * Shared types for the Sun* Kudos Live Board.
 * Consumed by B2 (queries), B3 (mutations/stats), B4 (spotlight), and A1 (UI).
 */

// ---------------------------------------------------------------------------
// Profile / identity
// ---------------------------------------------------------------------------

/** Minimal profile shape used inside kudo cards and leaderboard tiles. */
export interface ProfileBrief {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  /** Computed star tier: 0–3. See lib/kudos/stars.ts. */
  stars: 0 | 1 | 2 | 3;
  /** Raw kudos-received count — drives stars + hero-title pill. 0 when unknown. */
  kudosReceived: number;
  departmentId: number | null;
  /**
   * Department display name (e.g. "CEVC10"), joined from `departments`.
   * Optional — only the kudo-card query populates it; the card sub-line shows
   * it in place of the star icons when present (design C.3/B.3).
   */
  departmentName?: string | null;
}

// ---------------------------------------------------------------------------
// Kudo card
// ---------------------------------------------------------------------------

/** A fully-hydrated kudo as rendered by the board feed and highlight carousel. */
export interface KudoCard {
  id: string;
  sender: ProfileBrief;
  recipient: ProfileBrief;
  /**
   * Sender-written title ("Danh hiệu") shown centered above the body
   * (design "IDOL GIỎI TRẺ"). Backed by `kudos.title`; nullable in the DB so
   * rows created before the send-dialog feature have none.
   */
  title?: string | null;
  /** Sanitized-on-render HTML from the send-dialog rich editor (plain text for legacy rows). */
  body: string;
  isAnonymous: boolean;
  /**
   * Sender-chosen alias for anonymous kudos. Only meaningful when isAnonymous;
   * null/absent → UI shows the generic "Ẩn danh" label.
   */
  anonymousName?: string | null;
  /** ISO timestamp string from Postgres. */
  createdAt: string;
  /** Σ hearts across all likes on this kudo. */
  heartTotal: number;
  /** Number of distinct users who liked this kudo. */
  likeCount: number;
  /** Whether the current viewer has liked this kudo. */
  liked: boolean;
  hashtags: string[];
  /** Storage paths (use Supabase storage URL helper to render). */
  images: string[];
}

/** Input for the create-kudo mutation (send dialog → use-create-kudo). */
export interface CreateKudoInput {
  recipientId: string;
  title: string;
  /** HTML emitted by the Tiptap editor (sanitized again on render). */
  bodyHtml: string;
  /** 1..5 ids from the `hashtags` table. */
  hashtagIds: number[];
  /** Up to 5 images; uploaded to storage before the RPC call. */
  imageFiles: File[];
  isAnonymous: boolean;
  /** Optional alias, only sent when isAnonymous. */
  anonymousName: string;
}

// ---------------------------------------------------------------------------
// Hearts / likes
// ---------------------------------------------------------------------------

/** Local optimistic state for the heart toggle button. */
export interface HeartState {
  liked: boolean;
  heartTotal: number;
  /** Pending = optimistic update not yet confirmed by server. */
  pending: boolean;
}

// ---------------------------------------------------------------------------
// Sidebar stats (current viewer)
// ---------------------------------------------------------------------------

/** Aggregated stats shown in the sidebar for the authenticated user. */
export interface SidebarStats {
  kudosSent: number;
  kudosReceived: number;
  /** Hearts credited to the sender per spec C.4.1. */
  heartsReceived: number;
  badgesCount: number;
  secretBoxes: {
    unopened: number;
    total: number;
  };
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

/** A single entry in the Top-5 hearts or kudos leaderboard. */
export interface LeaderboardItem {
  rank: number;
  profile: ProfileBrief;
  /** The metric being ranked (hearts or kudos received, depending on list). */
  score: number;
}

// ---------------------------------------------------------------------------
// Spotlight word-cloud
// ---------------------------------------------------------------------------

/** A node in the simplified spotlight word-cloud (sized by kudos received). */
export interface SpotlightNode {
  profile: ProfileBrief;
  kudosReceived: number;
  /** Normalised size weight 0–1 for CSS font-size scaling. */
  weight: number;
}

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------

/**
 * Active filter applied to both Highlight carousel and All Kudos feed.
 * A selected filter resets feed pagination to page 1 per clarification 2026-06-06.
 */
export interface KudosFilter {
  hashtag: string | null;
  departmentId: number | null;
}
