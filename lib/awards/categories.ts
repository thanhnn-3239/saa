/**
 * Static SAA 2025 award categories dataset.
 * Each entry carries a slug (used as hash anchor on /awards-information),
 * i18n key references (under the Home.awards namespace), and the image
 * path relative to /public.
 */

export interface AwardCategory {
  /** URL-safe slug — used as hash anchor: /awards-information#<slug> */
  slug: string;
  /** i18n key for the award title (under Home.awards namespace). */
  titleKey: string;
  /** i18n key for the award description (under Home.awards namespace). */
  descKey: string;
  /** Path to the category overlay image (relative to /public). */
  imageSrc: string;
}

export const AWARD_CATEGORIES: AwardCategory[] = [
  {
    slug: "top-talent",
    titleKey: "topTalentTitle",
    descKey: "topTalentDesc",
    imageSrc: "/homepage-saa/Top_Talent.png",
  },
  {
    slug: "top-project",
    titleKey: "topProjectTitle",
    descKey: "topProjectDesc",
    imageSrc: "/homepage-saa/Top_Project.png",
  },
  {
    slug: "top-project-leader",
    titleKey: "topProjectLeaderTitle",
    descKey: "topProjectLeaderDesc",
    imageSrc: "/homepage-saa/Top_Project_Leader.png",
  },
  {
    slug: "best-manager",
    titleKey: "bestManagerTitle",
    descKey: "bestManagerDesc",
    imageSrc: "/homepage-saa/Best_Manager.png",
  },
  {
    slug: "signature-2025-creator",
    titleKey: "signature2025CreatorTitle",
    descKey: "signature2025CreatorDesc",
    imageSrc: "/homepage-saa/Signature_2025_Creator.png",
  },
  {
    slug: "mvp",
    titleKey: "mvpTitle",
    descKey: "mvpDesc",
    imageSrc: "/homepage-saa/MVP.png",
  },
];
