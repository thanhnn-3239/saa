/**
 * kudo-editor-suggestion.ts
 *
 * Tiptap Mention suggestion config for @-mentioning sunners in the kudo body.
 * Visual-only in v1 — inserts a styled mention node, no notification fired.
 *
 * Fetches from /api/kudos/spotlight?search=<query> (no excludeSelf — mentions
 * may reference anyone, including the sender themselves).
 */

import { ReactRenderer } from "@tiptap/react";
import type { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion";
import type { MentionListHandle, MentionItem } from "./kudo-mention-list";

async function fetchMentionItems(query: string): Promise<MentionItem[]> {
  if (!query.trim()) return [];
  try {
    const params = new URLSearchParams({ search: query });
    const res = await fetch(`/api/kudos/spotlight?${params.toString()}`);
    if (!res.ok) return [];
    // The spotlight search endpoint returns ProfileBrief (field is `fullName`, not `name`).
    const body = (await res.json()) as { results: Array<{ id: string; fullName: string }> };
    return (body.results ?? []).map((r) => ({ id: r.id, name: r.fullName }));
  } catch {
    return [];
  }
}

export const mentionSuggestion = {
  char: "@",
  allowSpaces: false,

  items: async ({ query }: { query: string }): Promise<MentionItem[]> => {
    return fetchMentionItems(query);
  },

  render: () => {
    // Instance variable scoped to each suggestion lifecycle — avoids stale refs
    // when the dialog is closed/reopened while the dropdown is active.
    let rendererInstance: ReactRenderer<MentionListHandle> | null = null;

    // Lazy import to avoid SSR issues
    return {
      onStart: (props: SuggestionProps<MentionItem>) => {
        import("./kudo-mention-list").then(({ KudoMentionList }) => {
          rendererInstance = new ReactRenderer(KudoMentionList, {
            props,
            editor: props.editor,
          });

          if (!props.clientRect) return;
          const el = rendererInstance.element as HTMLElement;
          el.style.position = "fixed";
          el.style.zIndex = "9999";
          const rect = props.clientRect();
          if (rect) {
            el.style.top = `${rect.bottom + 4}px`;
            el.style.left = `${rect.left}px`;
          }
          document.body.appendChild(el);
        });
      },

      onUpdate: (props: SuggestionProps<MentionItem>) => {
        if (!rendererInstance) return;
        rendererInstance.updateProps(props);

        if (!props.clientRect) return;
        const el = rendererInstance.element as HTMLElement;
        const rect = props.clientRect();
        if (rect) {
          el.style.top = `${rect.bottom + 4}px`;
          el.style.left = `${rect.left}px`;
        }
      },

      onKeyDown: (props: SuggestionKeyDownProps): boolean => {
        if (!rendererInstance?.ref) return false;
        return (rendererInstance.ref as MentionListHandle).onKeyDown(props);
      },

      onExit: () => {
        if (rendererInstance) {
          rendererInstance.element?.parentNode?.removeChild(rendererInstance.element);
          rendererInstance.destroy();
          rendererInstance = null;
        }
      },
    };
  },
};
