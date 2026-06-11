/**
 * Skeleton — animated shimmer placeholder used in card loading states.
 * KudoCardSkeleton is the full card variant used by infinite scroll.
 */

interface SkeletonProps {
  className?: string;
}

/** Base shimmer block */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-white/10 ${className}`}
      aria-hidden="true"
    />
  );
}

/** Full kudo-post card skeleton (matches C.3 card dimensions) */
export function KudoCardSkeleton() {
  return (
    <div
      className="rounded-[24px] bg-[rgba(255,248,225,0.05)] p-10 flex flex-col gap-4"
      aria-busy="true"
      aria-label="Đang tải..."
    >
      {/* Sender/receiver row */}
      <div className="flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      {/* Divider */}
      <Skeleton className="h-px w-full" />
      {/* Body */}
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
      {/* Tags */}
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}
