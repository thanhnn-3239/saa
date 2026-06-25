"use client";
/**
 * kudo-mention-list.tsx
 *
 * Dropdown rendered by the Tiptap mention suggestion plugin.
 * Shows a small floating list of sunner names matching the @query.
 * Keyboard navigation: ArrowUp/ArrowDown to move, Enter to select.
 *
 * Exposed as a forwardRef component so the suggestion render() callbacks
 * can call onKeyDown imperatively via ReactRenderer.ref.
 */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import type { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion";

export interface MentionItem {
  id: string;
  name: string;
}

export interface MentionListHandle {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

export const KudoMentionList = forwardRef<MentionListHandle, SuggestionProps<MentionItem>>(
  function KudoMentionList({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Reset selection when items list changes
    useEffect(() => setSelectedIndex(0), [items]);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) {
        command({ id: item.id, label: item.name });
      }
    };

    useImperativeHandle(ref, () => ({
      onKeyDown({ event }: SuggestionKeyDownProps): boolean {
        if (event.key === "ArrowUp") {
          setSelectedIndex((prev) =>
            prev === 0 ? Math.max(0, items.length - 1) : prev - 1
          );
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((prev) =>
            prev === items.length - 1 ? 0 : prev + 1
          );
          return true;
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    if (!items.length) return null;

    return (
      <div className="bg-white border border-[#998C5F] rounded-lg shadow-lg overflow-hidden min-w-[200px] max-h-48 overflow-y-auto">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectItem(index)}
            className={[
              "w-full text-left px-4 py-2 font-montserrat text-sm font-bold transition-colors duration-150",
              index === selectedIndex
                ? "bg-[rgba(153,140,95,0.12)] text-[#00101A]"
                : "hover:bg-[rgba(153,140,95,0.06)] text-[#333]",
            ].join(" ")}
          >
            @{item.name}
          </button>
        ))}
      </div>
    );
  }
);
