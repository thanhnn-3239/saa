/**
 * Static SAA 2025 award categories dataset.
 * Each entry carries a slug (used as hash anchor on /he-thong-giai),
 * i18n key references (under the Home.awards namespace for title/desc, and
 * HeThongGiai.awards namespace for quantity/value), and the image path
 * relative to /public.
 */

export interface AwardCategory {
  /** URL-safe slug — used as hash anchor: /he-thong-giai#<slug> */
  slug: string;
  /** i18n key for the award title (under Home.awards namespace). */
  titleKey: string;
  /** i18n key for the award description (under Home.awards namespace). */
  descKey: string;
  /** Path to the category overlay image (relative to /public). */
  imageSrc: string;
  /**
   * i18n key path for the award quantity string (under HeThongGiai namespace).
   * e.g. "awards.top-talent.quantity"
   */
  quantityKey: string;
  /**
   * i18n key path for the award value/prize string (under HeThongGiai namespace).
   * e.g. "awards.top-talent.value"
   */
  valueKey: string;
  /**
   * i18n key for the nav label (under HeThongGiai.nav namespace).
   * e.g. "topTalent" → t("nav.topTalent")
   */
  navKey: string;
  /** Whether the image renders on the right side (alternating layout). */
  imageRight: boolean;
}

export const AWARD_CATEGORIES: AwardCategory[] = [
  {
    slug: "top-talent",
    titleKey: "topTalentTitle",
    descKey: "topTalentDesc",
    imageSrc: "/homepage-saa/Top_Talent.png",
    quantityKey: "awards.top-talent.quantity",
    valueKey: "awards.top-talent.value",
    navKey: "topTalent",
    imageRight: false,
  },
  {
    slug: "top-project",
    titleKey: "topProjectTitle",
    descKey: "topProjectDesc",
    imageSrc: "/homepage-saa/Top_Project.png",
    quantityKey: "awards.top-project.quantity",
    valueKey: "awards.top-project.value",
    navKey: "topProject",
    imageRight: true,
  },
  {
    slug: "top-project-leader",
    titleKey: "topProjectLeaderTitle",
    descKey: "topProjectLeaderDesc",
    imageSrc: "/homepage-saa/Top_Project_Leader.png",
    quantityKey: "awards.top-project-leader.quantity",
    valueKey: "awards.top-project-leader.value",
    navKey: "topProjectLeader",
    imageRight: false,
  },
  {
    slug: "best-manager",
    titleKey: "bestManagerTitle",
    descKey: "bestManagerDesc",
    imageSrc: "/homepage-saa/Best_Manager.png",
    quantityKey: "awards.best-manager.quantity",
    valueKey: "awards.best-manager.value",
    navKey: "bestManager",
    imageRight: true,
  },
  {
    slug: "signature-2025-creator",
    titleKey: "signature2025CreatorTitle",
    descKey: "signature2025CreatorDesc",
    imageSrc: "/homepage-saa/Signature_2025_Creator.png",
    quantityKey: "awards.signature-2025-creator.quantity",
    valueKey: "awards.signature-2025-creator.value",
    navKey: "signature2025Creator",
    imageRight: false,
  },
  {
    slug: "mvp",
    titleKey: "mvpTitle",
    descKey: "mvpDesc",
    imageSrc: "/homepage-saa/MVP.png",
    quantityKey: "awards.mvp.quantity",
    valueKey: "awards.mvp.value",
    navKey: "mvp",
    imageRight: true,
  },
];
