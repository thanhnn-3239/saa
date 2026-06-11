"use client";
/**
 * CopyLinkButton — copies a URL to clipboard, shows inline toast feedback.
 * On success: green-ish toast auto-dismisses after 2.5 s.
 * On clipboard API failure: error toast prompting manual copy, dismisses after 3 s.
 *
 * i18n keys (Home.kudosPage.copyLink.*):
 *   success → "Link đã được sao chép — sẵn sàng chia sẻ!"
 *   aria    → "Sao chép liên kết"
 *   error   → "Không thể sao chép — hãy sao chép URL thủ công."
 */
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

interface CopyLinkButtonProps {
  /** URL to copy. Defaults to window.location.href when omitted. */
  url?: string;
  className?: string;
}

export function CopyLinkButton({ url, className = "" }: CopyLinkButtonProps) {
  const t = useTranslations("Home.kudosPage.copyLink");
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function handleCopy() {
    if (state !== "idle") return;
    const target = url ?? window.location.href;
    try {
      await navigator.clipboard.writeText(target);
      setState("copied");
      timer.current = setTimeout(() => setState("idle"), 2500);
    } catch {
      // Clipboard API blocked (e.g. mobile WebView, permissions policy).
      // Show an error toast so users know to copy the URL manually.
      setState("error");
      timer.current = setTimeout(() => setState("idle"), 3000);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={t("aria")}
        className={[
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-base font-semibold",
          // Near-black so it reads on the cream card (design #171717).
          "text-saa-navy-dark hover:text-saa-navy-mid transition-colors duration-200",
          className,
        ].join(" ")}
      >
        {/* Link icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
        <span>{t("label")}</span>
      </button>

      {/* Inline toast — fixed bottom-center, auto-dismiss */}
      {state === "copied" && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] rounded-lg bg-saa-navy-elevated border border-saa-gold-border px-5 py-3 text-sm font-semibold text-saa-gold-accent shadow-saa-glow animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {t("success")}
        </div>
      )}

      {/* Error toast — shown when Clipboard API is blocked */}
      {state === "error" && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] rounded-lg bg-saa-navy-elevated border border-red-500/50 px-5 py-3 text-sm font-semibold text-red-400 shadow-saa-glow animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {t("error")}
        </div>
      )}
    </>
  );
}
