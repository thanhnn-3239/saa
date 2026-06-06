import Image from "next/image";
import { getTranslations } from "next-intl/server";

// mm:3204:10152 — Root Further content section
export async function RootFurtherContent() {
  const t = await getTranslations("Home.about");

  return (
    // mm:3204:10152
    <section
      className="mx-auto w-full px-4 sm:px-12 lg:px-[104px] py-16 lg:py-[120px] max-w-[1152px] rounded-saa-button flex flex-col items-center gap-8"
    >
      {/* ROOT / FURTHER decorative text images */}
      {/* mm:3204:10153 */}
      <div className="relative w-[290px] h-[134px] shrink-0">
        {/* mm:3204:10155 — ROOT (centered over FURTHER: (290-189)/2 ≈ 51px offset per design) */}
        <Image
          src="/homepage-saa/Root_Text.png"
          alt="ROOT"
          width={189}
          height={67}
          className="absolute top-0 left-[51px] object-contain"
        />
        {/* mm:3204:10154 — FURTHER */}
        <Image
          src="/homepage-saa/Further_Text.png"
          alt="FURTHER"
          width={290}
          height={67}
          className="absolute top-[67px] left-0 object-contain"
        />
      </div>

      {/* mm:5001:14827 — text content group */}
      <div className="flex flex-col gap-8 w-full">
        {/* mm:3204:10156 — first paragraph */}
        <p
          className="text-base sm:text-xl lg:text-2xl font-montserrat font-bold leading-[1.333] text-white tracking-[0] text-justify m-0 whitespace-pre-line"
        >
          {t("heroParagraph1")}
        </p>

        {/* mm:3204:10161 — quote */}
        <p className="font-montserrat font-bold text-xl leading-8 text-white text-center m-0">
          {t("quote")}
        </p>

        {/* mm:3204:10162 — second paragraph */}
        <p
          className="text-base sm:text-xl lg:text-2xl font-montserrat font-bold leading-[1.333] text-white tracking-[0] text-justify m-0 whitespace-pre-line"
        >
          {t("heroParagraph2")}
        </p>
      </div>
    </section>
  );
}
