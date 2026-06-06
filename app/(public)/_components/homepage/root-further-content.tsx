import Image from "next/image";
import { getTranslations } from "next-intl/server";

// mm:3204:10152 — Root Further content section
export async function RootFurtherContent() {
  const t = await getTranslations("Home.about");

  return (
    // mm:3204:10152
    <section
      className="mx-auto w-full px-4 sm:px-12 lg:px-[104px] py-16 lg:py-[120px]"
      style={{
        maxWidth: "1152px",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "32px",
      }}
    >
      {/* ROOT / FURTHER decorative text images */}
      {/* mm:3204:10153 */}
      <div
        style={{
          position: "relative",
          width: "290px",
          height: "134px",
          flexShrink: 0,
        }}
      >
        {/* mm:3204:10155 — ROOT (centered over FURTHER: (290-189)/2 ≈ 51px offset per design) */}
        <Image
          src="/homepage-saa/Root_Text.png"
          alt="ROOT"
          width={189}
          height={67}
          style={{
            position: "absolute",
            top: 0,
            left: "51px",
            objectFit: "contain",
          }}
        />
        {/* mm:3204:10154 — FURTHER */}
        <Image
          src="/homepage-saa/Further_Text.png"
          alt="FURTHER"
          width={290}
          height={67}
          style={{
            position: "absolute",
            top: 67,
            left: 0,
            objectFit: "contain",
          }}
        />
      </div>

      {/* mm:5001:14827 — text content group */}
      <div className="flex flex-col" style={{ gap: "32px", width: "100%" }}>
        {/* mm:3204:10156 — first paragraph */}
        <p
          className="text-base sm:text-xl lg:text-2xl"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            lineHeight: "1.333",
            color: "#fff",
            letterSpacing: 0,
            textAlign: "justify",
            margin: 0,
            whiteSpace: "pre-line",
          }}
        >
          {t("heroParagraph1")}
        </p>

        {/* mm:3204:10161 — quote */}
        <p
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            fontSize: "20px",
            lineHeight: "32px",
            color: "#fff",
            textAlign: "center",
            fontStyle: "normal",
            margin: 0,
          }}
        >
          {t("quote")}
        </p>

        {/* mm:3204:10162 — second paragraph */}
        <p
          className="text-base sm:text-xl lg:text-2xl"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            lineHeight: "1.333",
            color: "#fff",
            letterSpacing: 0,
            textAlign: "justify",
            margin: 0,
            whiteSpace: "pre-line",
          }}
        >
          {t("heroParagraph2")}
        </p>
      </div>
    </section>
  );
}
