import { ComingSoon } from "@/components/coming-soon";
import { AWARD_CATEGORIES } from "@/lib/awards/categories";

/**
 * Awards Information stub page.
 * Renders the shared ComingSoon placeholder plus invisible anchor targets
 * for each of the 6 award category slugs, so hash-navigation from award
 * cards resolves correctly (ID-47–52, ID-62 — missing hash = no scroll,
 * no error).
 */
export default function AwardsInformationPage() {
  return (
    <>
      {/* Invisible anchor sections — one per award category slug.
          These allow /awards-information#<slug> to land without error even
          before the full page is built. Position absolute so they don't
          affect layout. */}
      {AWARD_CATEGORIES.map((category) => (
        <section
          key={category.slug}
          id={category.slug}
          aria-hidden="true"
          style={{ position: "absolute", top: 0, height: 0, overflow: "hidden" }}
        />
      ))}

      <ComingSoon />
    </>
  );
}
