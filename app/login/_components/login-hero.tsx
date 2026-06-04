import Image from "next/image";

/**
 * mms_B_Bìa — Main content area (B.1 key visual + B.2 welcome text + B.3 login button slot).
 * Design: 1440×845px, padding 96px 144px, gap 120px (column).
 * Inner frame 487: 1152×653px, gap 80px (column), centered vertically.
 * This component renders B.1 and B.2 layout; B.3 is injected as children.
 * Responsive: side padding collapses on smaller viewports.
 */
interface LoginHeroProps {
  welcomeLine1: string;
  welcomeLine2: string;
  children: React.ReactNode; // B.3 login button area
}

export function LoginHero({
  welcomeLine1,
  welcomeLine2,
  children,
}: LoginHeroProps) {
  return (
    <section
      className="relative z-10 flex w-full flex-col px-4 py-16 sm:px-8 sm:py-20 lg:px-36 lg:py-24"
    >
      {/* Frame 487 — inner content column */}
      <div
        className="flex w-full max-w-5xl flex-col justify-center"
        style={{ gap: "80px" }}
      >
        {/* B.1 — "ROOT FURTHER" key visual (451×200px image, scales down on mobile) */}
        <div className="flex w-full flex-col">
          <Image
            src="/login/Root_Further_Logo.png"
            alt="ROOT FURTHER"
            width={451}
            height={200}
            className="h-auto w-auto max-w-full object-contain"
            priority
            style={{ aspectRatio: "115/51", maxWidth: "451px" }}
          />
        </div>

        {/* Frame 550 — welcome text + login button */}
        <div
          className="flex flex-col"
          style={{
            gap: "24px",
            paddingLeft: "16px",
          }}
        >
          {/* B.2 — Welcome text (responsive: smaller font on mobile) */}
          <p
            className="text-base sm:text-lg lg:text-xl"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 700,
              lineHeight: "40px",
              letterSpacing: "0.5px",
              color: "rgba(255, 255, 255, 1)",
              maxWidth: "480px",
              margin: 0,
            }}
          >
            {welcomeLine1}
            <br />
            {welcomeLine2}
          </p>

          {/* B.3 — Login button slot */}
          <div className="w-full" style={{ maxWidth: "480px" }}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
