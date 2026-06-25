"use client";

/**
 * send-kudo-provider.tsx
 *
 * App-level provider that owns the single "Viết Kudo" send dialog instance and
 * exposes `openSendKudo()` to any descendant. Mounted in the public layout so
 * the floating widget button, the Thể lệ panel, and the board banner can all
 * open the same modal. The dialog only mounts while open, so its data hooks
 * (hashtags / recipients) don't fetch on pages where it's never opened.
 */

import { createContext, useCallback, useContext, useState } from "react";
import { SendKudoDialogContainer } from "../sun-kudos/_components/send-dialog";

interface SendKudoContextValue {
  openSendKudo: () => void;
}

const SendKudoContext = createContext<SendKudoContextValue | null>(null);

export function useSendKudo(): SendKudoContextValue {
  const ctx = useContext(SendKudoContext);
  if (!ctx) {
    throw new Error("useSendKudo must be used within <SendKudoProvider>");
  }
  return ctx;
}

export function SendKudoProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openSendKudo = useCallback(() => setOpen(true), []);
  const closeSendKudo = useCallback(() => setOpen(false), []);

  return (
    <SendKudoContext.Provider value={{ openSendKudo }}>
      {children}
      {open && <SendKudoDialogContainer open onClose={closeSendKudo} />}
    </SendKudoContext.Provider>
  );
}
