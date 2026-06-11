"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query/query-client";

/**
 * Client-side providers for the Kudos Live Board.
 *
 * Wraps children in React Query's QueryClientProvider.
 * The QueryClient is created once per component mount via useState so it is
 * stable across re-renders but not shared across server requests (SSR-safe).
 *
 * Mount this at the lowest layout that needs React Query — currently app/layout.tsx
 * so the board and any future pages share a single cache.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures each browser session gets its own QueryClient instance.
  // Do NOT use a module-level singleton — that would leak state across SSR requests.
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
