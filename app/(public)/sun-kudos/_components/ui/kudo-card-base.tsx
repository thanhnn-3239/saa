"use client";
/**
 * KudoCardBase — shared base for the feed (C.3) and highlight (B.3) kudo cards.
 *
 * Design ref: both are the same Figma component family (256:5231):
 *   feed = C.3_KUDO Post (3127:21871), highlight = B.3_KUDO - Highlight (2940:13465).
 *
 * Shared Content order (column, gap 16px), below the sender/divider:
 *   Time → Body-in-box → [Images] → Hashtags
 *
 * Body box (Frame 425): border saa-gold-accent, bg gold-glass 40%,
 * radius 12px, padding 16/24.
 *
 * Variant differences are passed as props (the cards stay thin wrappers):
 *   - feed:      images, body clamp 5, all hashtags, no "Xem chi tiết"
 *   - highlight: no images, body clamp 3, ≤5 hashtags (+N), "Xem chi tiết",
 *                carousel center/side scaling via `active`
 *
 * NOTE: the "IDOL GIỎI TRẺ" title from the design is intentionally omitted —
 * `kudos` has no title/category column (deferred; see plan open questions).
 */

import { useTranslations } from "next-intl";
import { Avatar } from "./avatar";
import { HeartButton } from "./heart-button";
import { HashtagChip } from "./hashtag-chip";
import { kudoImageUrl } from "@/lib/kudos/kudo-image-url";
import { StarsIndicator } from "./stars-indicator";
import { CopyLinkButton } from "./copy-link-button";
import { HeroTitlePill } from "./hero-title-pill";
import { getHeroTier } from "@/lib/kudos/hero-title";
import { sanitizeKudoHtml } from "@/lib/kudos/sanitize-html";
import type { KudoCard } from "@/lib/kudos/types";

interface KudoCardBaseProps {
  card: KudoCard;
  /** Server-injected origin (e.g. https://saa.sun-asterisk.com) for copy-link URL. */
  baseUrl: string;
  /** Render the image gallery (feed variant). */
  showImages?: boolean;
  /** Render the "Xem chi tiết" action (highlight variant). */
  showViewDetail?: boolean;
  /** Render the owner edit pencil on the title row (feed; temp UI only). */
  showEdit?: boolean;
  /** Body line-clamp — 3 (highlight) or 5 (feed). */
  bodyClamp?: 3 | 5;
  /** Cap hashtags and show a "+N" overflow (highlight). Omit to show all (feed). */
  maxHashtags?: number;
  /** Carousel center/side state (highlight). Omit for feed → always full opacity. */
  active?: boolean;
  onLike?: (id: string) => void;
  onViewDetail?: (id: string) => void;
  /** Owner edit handler — unwired for now (temp UI). */
  onEdit?: (id: string) => void;
  onOpenProfile?: (profileId: string) => void;
  onOpenImage?: (kudoId: string, index: number) => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  const mo = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${hh}:${mm} - ${mo}/${dd}/${yyyy}`;
}

const MAX_IMAGES = 5;

export function KudoCardBase({
  card,
  baseUrl,
  showImages = false,
  showViewDetail = false,
  showEdit = false,
  bodyClamp = 3,
  maxHashtags,
  active,
  onLike,
  onViewDetail,
  onEdit,
  onOpenProfile,
  onOpenImage,
}: KudoCardBaseProps) {
  const t = useTranslations("Home.kudosPage");
  const senderTier = getHeroTier(card.sender.kudosReceived);
  const recipientTier = getHeroTier(card.recipient.kudosReceived);

  const visibleTags =
    maxHashtags != null ? card.hashtags.slice(0, maxHashtags) : card.hashtags;
  const extraTags =
    maxHashtags != null ? card.hashtags.length - maxHashtags : 0;
  const visibleImages = card.images.slice(0, MAX_IMAGES);

  // `active` is only passed by the highlight carousel; feed leaves it undefined.
  const isHighlight = active !== undefined;
  const shellClass = [
    "flex flex-col rounded-[16px] bg-[rgba(255,248,225,1)]",
    // Reference: feed = 40px padding + 32px gap; highlight = 16px padding + 16px gap.
    isHighlight ? "gap-4 p-4" : "gap-8 p-10",
    isHighlight ? "transition-all duration-300 select-none" : "",
    active === true ? "opacity-100 scale-100" : "",
    active === false ? "opacity-50 scale-95 pointer-events-none" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const senderName = card.isAnonymous
    ? (card.anonymousName?.trim() || t("card.anonymous"))
    : card.sender.fullName;

  return (
    <article
      className={shellClass}
      aria-label={`Kudo từ ${senderName} tới ${card.recipient.fullName}`}
      aria-current={active ? "true" : undefined}
    >
      {/* Info user row — sender → arrow → receiver */}
      <div className="flex items-start gap-6 justify-between">
        <button
          type="button"
          onClick={() => {
            // Do not open profile for anonymous senders (id is masked to "")
            if (!card.isAnonymous && card.sender.id) onOpenProfile?.(card.sender.id);
          }}
          className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity min-w-0"
          aria-label={t("leaderboard.profileAria", { name: senderName })}
        >
          <Avatar src={card.sender.avatarUrl} alt={senderName} size={62} />
          <div className="flex flex-col min-w-0">
            <span className="font-montserrat font-bold text-sm text-saa-navy-dark leading-5 truncate">
              {senderName}
            </span>
            <div className="flex items-center gap-1.5">
              {card.sender.departmentName ? (
                <span className="font-montserrat font-semibold text-[11px] text-gray-500">
                  {card.sender.departmentName}
                </span>
              ) : (
                <StarsIndicator stars={card.sender.stars} size={12} />
              )}
              {senderTier && <HeroTitlePill tierKey={senderTier.key} label={senderTier.label} />}
            </div>
          </div>
        </button>

        {/* Arrow icon */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-saa-navy-mid mt-3"
          aria-label={t("card.sentTo")}
        >
          {/* Paper-plane "send" icon (design) */}
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>

        <button
          type="button"
          onClick={() => onOpenProfile?.(card.recipient.id)}
          className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity min-w-0"
          aria-label={t("leaderboard.profileAria", { name: card.recipient.fullName })}
        >
          <Avatar src={card.recipient.avatarUrl} alt={card.recipient.fullName} size={62} />
          <div className="flex flex-col min-w-0">
            <span className="font-montserrat font-bold text-sm text-saa-navy-dark leading-5 truncate">
              {card.recipient.fullName}
            </span>
            <div className="flex items-center gap-1.5">
              {card.recipient.departmentName ? (
                <span className="font-montserrat font-semibold text-[11px] text-gray-500">
                  {card.recipient.departmentName}
                </span>
              ) : (
                <StarsIndicator stars={card.recipient.stars} size={12} />
              )}
              {recipientTier && <HeroTitlePill tierKey={recipientTier.key} label={recipientTier.label} />}
            </div>
          </div>
        </button>
      </div>

      {/* Gold divider */}
      <div className="h-px bg-saa-gold-accent" />

      {/* Content — Time → Body-in-box → [Images] → Hashtags */}
      <div className="flex flex-col gap-4">
        <time dateTime={card.createdAt} className="text-xs text-gray-500 font-montserrat">
          {formatTime(card.createdAt)}
        </time>

        {/* Award/category title (design "IDOL GIỎI TRẺ") — fixed text for now;
            `card.title` overrides once a data source exists. Optional owner
            edit pencil sits at the right (temp UI — handler unwired). */}
        <div className="relative flex items-center justify-center">
          <p className="text-center font-montserrat font-bold text-base text-saa-navy-dark uppercase">
            {card.title ?? t("card.idolTitle")}
          </p>
          {showEdit && (
            <button
              type="button"
              onClick={() => onEdit?.(card.id)}
              aria-label={t("card.edit")}
              className="absolute right-0 text-saa-navy-dark hover:text-saa-navy-mid transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
            </button>
          )}
        </div>

        {/* Body box — Frame 425 (gold-glass 40% on cream) */}
        <div className="rounded-[12px] border border-saa-gold-accent bg-[rgba(255,234,158,0.40)] px-6 py-4">
          <div
            dangerouslySetInnerHTML={{ __html: sanitizeKudoHtml(card.body) }}
            className={[
              "kudo-body font-sans text-sm text-saa-navy-dark leading-6",
              bodyClamp === 5 ? "line-clamp-5" : "line-clamp-3",
            ].join(" ")}
          />
        </div>

        {/* Image gallery — feed variant only (≤5 thumbnails) */}
        {showImages && visibleImages.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {visibleImages.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onOpenImage?.(card.id, i)}
                aria-label={`${t("card.imageAlt")} ${i + 1}`}
                className="w-20 h-20 rounded-lg overflow-hidden bg-saa-navy-elevated hover:opacity-90 transition-opacity shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={kudoImageUrl(src)}
                  alt={`${t("card.imageAlt")} ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}

        {/* Hashtags */}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <HashtagChip key={tag} tag={`#${tag}`} />
            ))}
            {extraTags > 0 && (
              <span className="text-xs text-gray-400 self-center">+{extraTags}</span>
            )}
          </div>
        )}
      </div>

      {/* Gold divider */}
      <div className="h-px bg-saa-gold-accent" />

      {/* Action bar — always space-between.
          Highlight: [heart + copy] left, "Xem chi tiết" right.
          Feed: heart left, Copy Link right (design). */}
      <div className="flex items-center justify-between gap-4">
        {showViewDetail ? (
          <>
            <div className="flex items-center gap-1">
              <HeartButton
                liked={card.liked}
                count={card.heartTotal}
                disabled={card.ownedByViewer}
                onClick={() => onLike?.(card.id)}
              />
              <CopyLinkButton url={`${baseUrl}/sun-kudos?kudo=${card.id}`} />
            </div>
            <button
              type="button"
              onClick={() => onViewDetail?.(card.id)}
              className="font-montserrat font-bold text-sm text-saa-navy-dark hover:underline transition-colors whitespace-nowrap"
            >
              {t("card.viewDetail")}
            </button>
          </>
        ) : (
          <>
            <HeartButton
              liked={card.liked}
              count={card.heartTotal}
              disabled={card.ownedByViewer}
              onClick={() => onLike?.(card.id)}
            />
            <CopyLinkButton url={`${baseUrl}/sun-kudos?kudo=${card.id}`} />
          </>
        )}
      </div>
    </article>
  );
}
