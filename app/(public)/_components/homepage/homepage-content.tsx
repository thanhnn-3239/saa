import { HeroSection } from "./hero-section";
import { RootFurtherContent } from "./root-further-content";
import { AwardsSection } from "./awards-section";
import { KudosSection } from "./kudos-section";

/**
 * Assembles the full homepage — all sections top-to-bottom.
 * Server component; all content is driven by i18n keys via next-intl (Home.*).
 */
export function HomepageContent() {
  return (
    <main
      className="w-full min-h-screen"
      style={{ backgroundColor: "#101417" }}
    >
      {/* Hero: keyvisual bg + ROOT FURTHER + countdown + event info + CTAs */}
      <HeroSection />

      {/* Root Further content: decorative text + paragraphs + quote */}
      {/* mm:3204:10152 */}
      <div className="w-full flex justify-center px-4 sm:px-8 lg:px-[144px]">
        <RootFurtherContent />
      </div>

      {/* Awards section: C1 header + 6-card grid */}
      {/* mm:2167:9068 */}
      <div className="w-full flex justify-center px-4 sm:px-8 lg:px-[144px] py-16 lg:py-[96px]">
        <AwardsSection />
      </div>

      {/* Sun* Kudos section */}
      {/* mm:3390:10349 */}
      <div className="w-full flex justify-center px-4 sm:px-8 lg:px-[144px] pb-16 lg:pb-[96px]">
        <KudosSection />
      </div>
    </main>
  );
}
