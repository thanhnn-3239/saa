import React from "react";

// mm:2167:9037
interface CountdownTimerProps {
  days: number;
  hours: number;
  minutes: number;
  showComingSoon: boolean;
  /** i18n label for the days unit. Defaults to "DAYS". */
  labelDays?: string;
  /** i18n label for the hours unit. Defaults to "HOURS". */
  labelHours?: string;
  /** i18n label for the minutes unit. Defaults to "MINUTES". */
  labelMinutes?: string;
  /** i18n label for the coming-soon text. Defaults to "Coming soon". */
  labelComingSoon?: string;
}

/**
 * DigitTile — responsive tile.
 * Mobile: ~38×62px, 32px font.
 * Desktop (lg): 51×82px, 49px font — matches Figma exactly.
 */
function DigitTile({ digit }: { digit: string }) {
  return (
    // mm:2167:9040 — Group 5: glass rectangle (186:2616) + digit text (186:2617)
    <div className="relative flex items-center justify-center flex-shrink-0 w-[38px] h-[62px] lg:w-[51px] lg:h-[82px]">
      {/* mm:I2167:9040;186:2616 — glass tile: opacity applies to the BACKGROUND ONLY */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          borderRadius: "8px",
          border: "0.5px solid #FFEA9E",
          background:
            "linear-gradient(180deg, #FFF 0%, rgba(255, 255, 255, 0.10) 100%)",
          opacity: 0.5,
          backdropFilter: "blur(16.64px)",
          WebkitBackdropFilter: "blur(16.64px)",
        }}
      />
      {/* mm:I2167:9040;186:2617 — digit: full-opacity white, 7-segment "Digital Numbers" */}
      <span
        className="relative text-[26px] lg:text-[36px]"
        style={{
          fontFamily: "'Digital Numbers', monospace",
          fontWeight: 400,
          lineHeight: 1,
          color: "#fff",
          letterSpacing: 0,
        }}
      >
        {digit}
      </span>
    </div>
  );
}

function TimerUnit({
  value,
  label,
  minDigits = 2,
}: {
  value: number;
  label: string;
  /** Minimum number of digit tiles to render (default 2). Days use dynamic width for ≥100. */
  minDigits?: number;
}) {
  const digits = String(value).padStart(minDigits, "0").split("");
  return (
    // mm:2167:9038 — column: tiles row + label
    <div className="flex flex-col items-start gap-2 lg:gap-[14px]">
      {/* tiles row — renders all digits, so 3-digit days show correctly */}
      <div className="flex flex-row items-center gap-1.5 lg:gap-[14px]">
        {digits.map((digit, i) => (
          <DigitTile key={i} digit={digit} />
        ))}
      </div>
      {/* label */}
      {/* mm:2167:9042 */}
      <span
        className="text-sm lg:text-[24px] lg:leading-8"
        style={{
          fontFamily: "Montserrat, sans-serif",
          fontWeight: 700,
          color: "#fff",
          letterSpacing: 0,
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer({
  days,
  hours,
  minutes,
  showComingSoon,
  labelDays = "DAYS",
  labelHours = "HOURS",
  labelMinutes = "MINUTES",
  labelComingSoon = "Coming soon",
}: CountdownTimerProps) {
  return (
    // mm:2167:9035
    <div className="flex flex-col gap-4 w-full">
      {/* mm:2167:9036 */}
      {showComingSoon && (
        <span
          className="text-sm lg:text-[24px] lg:leading-8"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            color: "#fff",
            letterSpacing: 0,
          }}
        >
          {labelComingSoon}
        </span>
      )}
      {/* mm:2167:9037 — units row: mobile gap-5 (20px), desktop gap-10 (40px) */}
      <div className="flex flex-row flex-wrap gap-5 lg:gap-10 items-center">
        <TimerUnit value={days} label={labelDays} />
        <TimerUnit value={hours} label={labelHours} />
        <TimerUnit value={minutes} label={labelMinutes} />
      </div>
    </div>
  );
}
