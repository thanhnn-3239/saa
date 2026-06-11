/**
 * EmptyState — centered placeholder displayed when a list has no items.
 * i18n: message prop is a literal; callers should pass translated string.
 */

interface EmptyStateProps {
  /** Localizable message, e.g. "Hiện tại chưa có Kudos nào." */
  message: string;
  className?: string;
}

export function EmptyState({ message, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 gap-4 text-saa-text-muted ${className}`}
    >
      {/* Inbox icon */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <p className="font-montserrat text-base font-semibold text-center max-w-xs">{message}</p>
    </div>
  );
}
