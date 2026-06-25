"use client";

import { useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useKudo } from "@/lib/kudos/use-kudo";
import { KudoCardBase } from "./ui/kudo-card-base";

/**
 * Renders a kudo detail dialog when the URL has ?kudo=<id> (deep-linked from a
 * notification). Closing strips the param via router.replace so the board URL
 * returns to clean state without a history entry.
 */
export function KudoDetailModal({ baseUrl }: { baseUrl: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const kudoId = params.get("kudo");

  const { data: kudo, isLoading, isError } = useKudo(kudoId);

  const close = useCallback(() => {
    const next = new URLSearchParams(params.toString());
    next.delete("kudo");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [params, pathname, router]);

  useEffect(() => {
    if (!kudoId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [kudoId, close]);

  if (!kudoId) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Kudo detail"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60" onClick={close} aria-hidden="true" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/80 hover:text-white"
        >
          ✕
        </button>
        {isLoading && <div className="rounded-xl bg-[#1a2a35] p-8 text-center text-white/60">…</div>}
        {isError && <div className="rounded-xl bg-[#1a2a35] p-8 text-center text-white/60">Not found</div>}
        {kudo && <KudoCardBase card={kudo} baseUrl={baseUrl} showImages />}
      </div>
    </div>
  );
}
