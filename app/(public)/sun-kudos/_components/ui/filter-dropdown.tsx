"use client";
/**
 * FilterDropdown — custom accessible dropdown for hashtag / department filters.
 *
 * Design refs:
 *   Hashtag open:    screenId JWpsISMAaM (fileKey 9ypp4enmFmdK3YAFJLIu6C)
 *   Phòng ban open:  screenId WXK5AYB_rG (fileKey 9ypp4enmFmdK3YAFJLIu6C)
 *
 * Visual: dark panel (#00070C), gold border (saa-gold-border), rounded-[12px].
 * Active item: gold-glow bg + saa-gold-accent text.
 * Other items: white text on transparent bg.
 *
 * A11y: button + listbox/option roles, arrow keys + Enter + Esc.
 * Closes on outside-click and Esc.
 * Props are backward-compatible with the previous native <select> version.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  /**
   * Category name, e.g. "Hashtag" or "Phòng ban".
   * Shown as the trigger placeholder when nothing is selected.
   */
  label: string;
  options: FilterOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
  /**
   * Whether to prepend an "All" (clear) option to the list.
   * Defaults to true (existing board behavior is unchanged).
   * Pass false for binary toggles like the profile Sent/Received picker.
   */
  showAll?: boolean;
}

export function FilterDropdown({
  label,
  options,
  value,
  onChange,
  className = "",
  showAll = true,
}: FilterDropdownProps) {
  const t = useTranslations("Home.kudosPage.filter");
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState<number>(-1);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // All items: optionally prepend "All" (clear) option, then provided options.
  // showAll=false: used for binary toggles where there is no "clear" state.
  const allOptions: FilterOption[] = showAll
    ? [{ value: "", label: t("all") }, ...options]
    : options;

  const activeIndex = allOptions.findIndex(
    (opt) => opt.value === (value ?? ""),
  );
  // Trigger shows the selected option's label; with nothing selected it
  // falls back to the category name (`label`) as a placeholder — matching
  // the design's single-pill trigger (no "Category:" prefix).
  const triggerText =
    value != null
      ? (allOptions.find((opt) => opt.value === value)?.label ?? label)
      : label;

  const close = useCallback(() => {
    setOpen(false);
    setFocusIndex(-1);
  }, []);

  const selectOption = useCallback(
    (optValue: string) => {
      onChange(optValue === "" ? null : optValue);
      close();
      buttonRef.current?.focus();
    },
    [onChange, close],
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  // Focus the correct option item when focusIndex changes
  useEffect(() => {
    if (!open || focusIndex < 0) return;
    const items = listRef.current?.querySelectorAll<HTMLElement>("[role='option']");
    items?.[focusIndex]?.focus();
  }, [open, focusIndex]);

  const handleButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      setFocusIndex(activeIndex >= 0 ? activeIndex : 0);
    } else if (e.key === "Escape") {
      close();
    }
  };

  const handleOptionKeyDown = (
    e: React.KeyboardEvent<HTMLLIElement>,
    idx: number,
    optValue: string,
  ) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIndex(Math.min(idx + 1, allOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (idx === 0) {
        close();
        buttonRef.current?.focus();
      } else {
        setFocusIndex(idx - 1);
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectOption(optValue);
    } else if (e.key === "Escape") {
      close();
      buttonRef.current?.focus();
    } else if (e.key === "Tab") {
      close();
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-flex ${className}`}>
      {/* Trigger button — single radius-4px pill (design node 2940:13459) */}
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          if (open) {
            close();
          } else {
            setOpen(true);
            setFocusIndex(activeIndex >= 0 ? activeIndex : 0);
          }
        }}
        onKeyDown={handleButtonKeyDown}
        className={[
          "flex items-center pl-4 pr-10 py-4 rounded-[4px] font-montserrat text-sm font-semibold",
          "border border-saa-gold-border bg-saa-gold-glass text-saa-text-primary",
          "focus:outline-none focus:ring-2 focus:ring-saa-gold-accent/50",
          "hover:bg-white/10 transition-colors relative whitespace-nowrap",
        ].join(" ")}
      >
        {triggerText}
        {/* Chevron icon */}
        <svg
          className={[
            "absolute right-3 top-1/2 -translate-y-1/2 text-saa-text-muted transition-transform duration-150",
            open ? "rotate-180" : "",
          ].join(" ")}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={label}
          aria-activedescendant={
            focusIndex >= 0 ? `${listboxId}-opt-${focusIndex}` : undefined
          }
          className={[
            "absolute top-full left-0 mt-2 z-50 min-w-[160px] rounded-[12px]",
            "border border-saa-gold-border overflow-hidden",
            "flex flex-col",
          ].join(" ")}
          style={{ background: "#00070C" }}
        >
          {allOptions.map((opt, idx) => {
            const isActive = opt.value === (value ?? "");
            return (
              <li
                key={opt.value}
                id={`${listboxId}-opt-${idx}`}
                role="option"
                aria-selected={isActive}
                tabIndex={-1}
                onKeyDown={(e) => handleOptionKeyDown(e, idx, opt.value)}
                onClick={() => selectOption(opt.value)}
                className={[
                  "px-5 py-3 font-montserrat font-bold text-sm cursor-pointer",
                  "focus:outline-none transition-colors",
                  isActive
                    ? "text-saa-gold-accent"
                    : "text-white hover:bg-white/5",
                ].join(" ")}
                style={
                  isActive
                    ? {
                        background:
                          "linear-gradient(90deg, rgba(255,234,158,0.12) 0%, rgba(255,234,158,0.06) 100%)",
                        boxShadow: "inset 0 0 0 1px rgba(255,234,158,0.15)",
                      }
                    : undefined
                }
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
