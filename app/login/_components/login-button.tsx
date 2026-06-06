"use client";

import { useTranslations } from "next-intl";

/**
 * B.3 — Google Login Button (presentational only).
 * Design: 305×60px, bg #FFEA9E (rgba(255,234,158,1)), border-radius 8px,
 *         padding 16px 24px, gap 8px (row).
 * Text: "Đăng nhập bằng Google" (Montserrat Bold 22px, color #00101A).
 * Google icon: 24×24px inline SVG (right side per Figma layout).
 *
 * Integration contract (props wired by orchestrator in phase-04):
 *   onClick?  — called when user clicks (triggers Supabase OAuth)
 *   loading?  — shows spinner + disables button
 *   disabled? — disables button without spinner
 */
export interface LoginButtonProps {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function LoginButton({ onClick, loading = false, disabled = false }: LoginButtonProps) {
  const t = useTranslations("Login");
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className="w-full max-w-xs sm:w-auto sm:max-w-none flex items-center justify-start py-4 px-4 sm:px-6 border-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      style={{
        /* On desktop: auto width (fits text); on mobile: full width via className.
           Horizontal padding is responsive (px-4 mobile / sm:px-6) so the label + icon
           fit inside the width-capped mobile button. */
        height: "60px",
        gap: "8px",
        borderRadius: "8px",
        backgroundColor: isDisabled ? "rgba(255, 234, 158, 0.5)" : "rgba(255, 234, 158, 1)",
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "box-shadow 200ms ease, transform 200ms ease",
      }}
      aria-label={t("loginButton")}
      aria-busy={loading}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 4px 16px rgba(255, 234, 158, 0.4)";
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
    >
      {/* Text area — Frame 483. Width is flex so text doesn't clip. */}
      <span className="flex flex-1 items-center min-w-0" style={{ gap: "4px", height: "28px" }}>
        {loading ? (
          <Spinner />
        ) : (
          <span
            /* Responsive label: 16px on mobile so the label + Google icon fit inside the
               width-capped button; full 22px (design) from the sm breakpoint up.
               `truncate` is a guard — if a longer locale string ever exceeds the box it
               ellipsizes instead of shoving the icon outside the button (the original bug). */
            className="text-base leading-7 sm:text-[22px] truncate"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 700,
              letterSpacing: "0px",
              color: "rgba(0, 16, 26, 1)",
            }}
          >
            {t("loginButton")}
          </span>
        )}
      </span>

      {/* Google icon 24×24 — right side */}
      {!loading && <GoogleIcon />}
    </button>
  );
}

/** Loading spinner */
function Spinner() {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-transparent"
      style={{
        width: "22px",
        height: "22px",
        borderTopColor: "rgba(0, 16, 26, 1)",
        borderRightColor: "rgba(0, 16, 26, 0.3)",
      }}
      aria-hidden="true"
    />
  );
}

/** Inline Google icon SVG (from Figma MM_MEDIA_Google asset) */
function GoogleIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M20.8245 12.2073C20.8245 11.5955 20.7748 10.9804 20.669 10.3785H12.1799V13.8443H17.0412C16.8395 14.962 16.1913 15.9508 15.2422 16.5792V18.8279H18.1425C19.8456 17.2604 20.8245 14.9455 20.8245 12.2073Z"
        fill="#4285F4"
      />
      <path
        d="M12.1799 21.0006C14.6073 21.0006 16.6543 20.2036 18.1458 18.8279L15.2455 16.5792C14.4386 17.1281 13.3969 17.439 12.1832 17.439C9.83527 17.439 7.84445 15.8549 7.13014 13.7252H4.1373V16.0434C5.66514 19.0826 8.77703 21.0006 12.1799 21.0006Z"
        fill="#34A853"
      />
      <path
        d="M7.12684 13.7252C6.74984 12.6074 6.74984 11.3971 7.12684 10.2793V7.96112H4.13731C2.86081 10.5042 2.8608 13.5003 4.1373 16.0434L7.12684 13.7252Z"
        fill="#FBBC04"
      />
      <path
        d="M12.1799 6.56224C13.463 6.5424 14.7032 7.02523 15.6324 7.9115L18.202 5.34196C16.5749 3.81413 14.4155 2.97415 12.1799 3.00061C8.77702 3.00061 5.66515 4.91868 4.13731 7.96112L7.12684 10.2793C7.83785 8.14631 9.83196 6.56224 12.1799 6.56224Z"
        fill="#EA4335"
      />
    </svg>
  );
}
