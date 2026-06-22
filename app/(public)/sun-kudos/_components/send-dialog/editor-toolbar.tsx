/**
 * editor-toolbar.tsx
 *
 * Toolbar for the kudo body editor: B/I/S/numbered-list/link/quote buttons
 * + "Tiêu chuẩn cộng đồng" link on the right.
 *
 * Design: mms_C — single bordered bar (border #998C5F, rounded top corners),
 * 6 icon buttons separated by single 1px dividers (border-l, collapsed — NOT a
 * full border per cell, which would double to 2px and read as a grid),
 * community-standards link right-aligned red underlined text.
 *
 * Phase C1: buttons are now active — receives action callbacks + active states
 * from KudoEditor. When no callbacks provided (static usage), buttons are disabled.
 */

import { useTranslations } from "next-intl";

interface EditorToolbarProps {
  /** Called when "Tiêu chuẩn cộng đồng" link is clicked. */
  onCommunityStandards?: () => void;
  // Format action callbacks (wired by KudoEditor in C1)
  onBold?: () => void;
  onItalic?: () => void;
  onStrike?: () => void;
  onOrderedList?: () => void;
  onLink?: () => void;
  onBlockquote?: () => void;
  // Active states for toggled buttons
  boldActive?: boolean;
  italicActive?: boolean;
  strikeActive?: boolean;
  orderedListActive?: boolean;
  blockquoteActive?: boolean;
}

interface ToolbarButtonDef {
  nodeId: string;
  icon: string;
  label: string;
}

const TOOLBAR_BUTTONS: ToolbarButtonDef[] = [
  { nodeId: "bold",         icon: "/viet-kudo/Bold.svg",        label: "Bold" },
  { nodeId: "italic",       icon: "/viet-kudo/Italic.svg",      label: "Italic" },
  { nodeId: "strikethrough",icon: "/viet-kudo/Strikethrough.svg",label: "Gạch ngang" },
  { nodeId: "numbered-list",icon: "/viet-kudo/Number_List.svg", label: "Danh sách" },
  { nodeId: "link",         icon: "/viet-kudo/Link.svg",         label: "Liên kết" },
  { nodeId: "quote",        icon: "/viet-kudo/Quote.svg",        label: "Trích dẫn" },
];

export function EditorToolbar({
  onCommunityStandards,
  onBold,
  onItalic,
  onStrike,
  onOrderedList,
  onLink,
  onBlockquote,
  boldActive = false,
  italicActive = false,
  strikeActive = false,
  orderedListActive = false,
  blockquoteActive = false,
}: EditorToolbarProps) {
  const t = useTranslations("Home.kudosPage.sendDialog");
  const handlers: Record<string, (() => void) | undefined> = {
    bold:          onBold,
    italic:        onItalic,
    strikethrough: onStrike,
    "numbered-list": onOrderedList,
    link:          onLink,
    quote:         onBlockquote,
  };

  const activeStates: Record<string, boolean> = {
    bold:            boldActive,
    italic:          italicActive,
    strikethrough:   strikeActive,
    "numbered-list": orderedListActive,
    link:            false, // link has no simple toggle-active state
    quote:           blockquoteActive,
  };

  return (
    // Single bordered bar; rounded top corners; cells split by 1px dividers
    // (border-l on every cell except the first). overflow-hidden clips the
    // square cell corners to the rounded container.
    <div className="flex flex-row items-stretch w-full h-12 border border-[#998C5F] rounded-t-lg overflow-hidden">
      {/* Icon buttons */}
      {TOOLBAR_BUTTONS.map((btn, i) => {
        const handler = handlers[btn.nodeId];
        const isActive = activeStates[btn.nodeId] ?? false;

        return (
          <button
            key={btn.nodeId}
            type="button"
            aria-label={btn.label}
            aria-pressed={isActive}
            onClick={handler}
            disabled={!handler}
            className={[
              "flex items-center justify-center w-14 shrink-0 transition-colors duration-200",
              i > 0 ? "border-l border-[#998C5F]" : "",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#998C5F]",
              "disabled:pointer-events-none",
              // Active fill = #E0D8BD — the production site's --ToolbarButton-Active
              // (a muted warm beige, NOT a bright gold). Verified against the live
              // saa.sun-asterisk.vn editor; hover is a lighter wash of the same beige.
              isActive
                ? "bg-[#E0D8BD] hover:bg-[#E0D8BD]"
                : "bg-transparent hover:bg-[#E0D8BD]/50",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={btn.icon}
              alt=""
              aria-hidden="true"
              width={24}
              height={24}
            />
          </button>
        );
      })}

      {/* Community standards link — fills remaining width, right-aligned, divided */}
      <button
        type="button"
        onClick={onCommunityStandards}
        className="flex-1 flex items-center justify-end bg-transparent px-4 border-l border-[#998C5F] hover:opacity-80 transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#998C5F]"
        style={{ minWidth: 0 }}
      >
        <span className="font-montserrat font-bold text-base leading-6 tracking-[0.15px] text-[#E46060] text-right truncate underline">
          {t("communityStandardsLink")}
        </span>
      </button>
    </div>
  );
}
