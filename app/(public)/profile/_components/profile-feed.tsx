/**
 * ProfileFeed — region D: vertical list of kudo post cards.
 *
 * Presentational only — no data fetching. Integration will replace mock cards
 * with real data via useInfiniteQuery in the parent (profile-content).
 *
 * Design ref: 362:5091 mms_D_Post all — flex col, gap 24px.
 * Each card is a KudoPostCard (feed variant: images, body clamp 5, all hashtags).
 */

import { KudoPostCard } from "@/app/(public)/sun-kudos/_components/feed/kudo-post-card";
import type { KudoCard } from "@/lib/kudos/types";

interface ProfileFeedProps {
  cards: KudoCard[];
  /** Server-injected origin for copy-link URLs (e.g. https://saa.sun-asterisk.com). */
  baseUrl: string;
}

export function ProfileFeed({ cards, baseUrl }: ProfileFeedProps) {
  // Empty/loading state is owned by the caller (ProfileContent) so the message
  // is i18n-aware; this component only renders the list it is given.
  return (
    <div className="flex flex-col gap-6 w-full">
      {cards.map((card) => (
        <KudoPostCard key={card.id} card={card} baseUrl={baseUrl} />
      ))}
    </div>
  );
}
