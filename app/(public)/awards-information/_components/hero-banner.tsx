import Image from "next/image";

// mm:313:8437 (mms_3_Keyvisual / image 20) + mm:313:8450 (KV + Root Further Logo)
// Full-bleed colourful key visual band behind the ROOT FURTHER logo. Breaks out
// of the page's px/py gutter (negative margins) so it spans edge-to-edge under
// the fixed header, matching the design's full-width keyvisual.
export function HeroBanner() {
  return (
    <div className="relative -mt-24 -mx-4 sm:-mx-8 lg:-mx-[144px] overflow-hidden">
      {/* mm:313:8437 — colourful key visual (shared with the homepage hero) */}
      <div className="absolute inset-0">
        <Image
          src="/homepage-saa/Keyvisual_BG.png"
          alt=""
          fill
          className="object-cover object-right"
          priority
        />
        {/* Legibility: darken the left (behind ROOT FURTHER) and the bottom edge. */}
        <div className="absolute inset-0 bg-gradient-to-r from-saa-navy-darkest via-saa-navy-darkest/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-saa-navy-darkest/40 via-transparent to-saa-navy-darkest" />
      </div>

      {/* mm:2789:12915 — ROOT FURTHER logo, left-aligned at the content gutter. */}
      <div className="relative px-4 sm:px-8 lg:px-[144px] pt-[120px] pb-16 md:pb-24">
        <Image
          src="/homepage-saa/Root_Further_Logo.png"
          alt="Sun* Annual Award 2025 — Root Further"
          width={451}
          height={200}
          className="w-[280px] md:w-[451px] max-w-full h-auto object-contain"
          priority
        />
      </div>
    </div>
  );
}
