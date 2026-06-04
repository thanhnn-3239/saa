"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * LoginErrorBanner — dismissible inline error banner shown above the login button.
 * Renders nothing when `code` is absent/undefined.
 *
 * Props (integration contract):
 *   code? — error code from the ?error= query param set by /auth/callback:
 *           "domain" | "oauth" | "access_denied" (others fall back to a generic message)
 */
export interface LoginErrorBannerProps {
  code?: string;
}

/** Error codes that have a dedicated translation; others fall back to `error.generic`. */
const KNOWN_ERROR_CODES = ["domain", "oauth", "access_denied"] as const;
function isKnownErrorCode(
  code: string,
): code is (typeof KNOWN_ERROR_CODES)[number] {
  return (KNOWN_ERROR_CODES as readonly string[]).includes(code);
}

export function LoginErrorBanner({ code }: LoginErrorBannerProps) {
  const t = useTranslations("Login");
  const [dismissed, setDismissed] = useState(false);

  // Render nothing if no error code or already dismissed
  if (!code || dismissed) return null;

  // Map the code to a translated message; unknown codes fall back to a generic one.
  const message = isKnownErrorCode(code)
    ? t(`error.${code}`)
    : t("error.generic");

  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 rounded"
      style={{
        backgroundColor: "rgba(227, 29, 28, 0.15)",
        border: "1px solid rgba(227, 29, 28, 0.6)",
        padding: "12px 16px",
        maxWidth: "480px",
        marginBottom: "0",
      }}
    >
      <span
        style={{
          fontFamily: "Montserrat, sans-serif",
          fontWeight: 500,
          fontSize: "14px",
          lineHeight: "20px",
          color: "rgba(255, 200, 200, 1)",
          flex: 1,
        }}
      >
        {message}
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 transition-opacity hover:opacity-70 focus:outline-none"
        aria-label={t("closeError")}
        style={{ color: "rgba(255, 200, 200, 1)", lineHeight: 1 }}
      >
        <CloseIcon />
      </button>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
