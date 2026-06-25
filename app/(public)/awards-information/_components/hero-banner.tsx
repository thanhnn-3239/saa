import Image from "next/image";

// mm:313:8450 — KV (Root Further Logo decorative banner)
// mm:2789:12915 — MM_MEDIA_Root Further Logo (338×150, inside 1152px frame)
export function HeroBanner() {
  return (
    // mm:313:8450
    <div className="w-full">
      {/* mm:313:8451 */}
      <div className="w-full">
        {/* mm:2789:12915 */}
        <Image
          src="/homepage-saa/Root_Further_Logo.png"
          alt="Keyvisual Sun* Annual Award 2025"
          width={338}
          height={150}
          className="max-w-full h-auto object-contain"
          priority
        />
      </div>
    </div>
  );
}
