"use client";

import Image from "next/image";
import { LanguageSwitcher } from "./language-switcher";

/**
 * A Header — full-width dark translucent bar at top of Login screen.
 * Design: 1440×80px, bg rgba(11,15,18,0.8), padding 12px 144px.
 * A.1 SAA logo (left), A.2 language switcher (right).
 */
export function LoginHeader() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-8 lg:px-36"
      style={{
        height: "80px",
        backgroundColor: "rgba(11, 15, 18, 0.8)",
        paddingTop: "12px",
        paddingBottom: "12px",
      }}
    >
      {/* A.1 — SAA Logo */}
      <div className="flex items-center" style={{ width: "52px", height: "56px" }}>
        <Image
          src="/login/Logo.png"
          alt="SAA Logo"
          width={52}
          height={48}
          className="object-cover"
          priority
        />
      </div>

      {/* A.2 — VN/EN Language Switcher */}
      <LanguageSwitcher />
    </header>
  );
}
