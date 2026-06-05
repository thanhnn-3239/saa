// Static data for the Thể lệ panel — hero tiers and collection icons.
// Labels/descriptions are i18n keys consumed by the-le-panel.tsx.

export const HERO_TIERS = [
  {
    key: "newHero",
    imageSrc: "/homepage-saa/kudos/New_Hero.png",
    conditionKey: "newHeroCondition",
    descriptionKey: "newHeroDesc",
  },
  {
    key: "risingHero",
    imageSrc: "/homepage-saa/kudos/Rising_Hero.png",
    conditionKey: "risingHeroCondition",
    descriptionKey: "risingHeroDesc",
  },
  {
    key: "superHero",
    imageSrc: "/homepage-saa/kudos/Super_Hero.png",
    conditionKey: "superHeroCondition",
    descriptionKey: "superHeroDesc",
  },
  {
    key: "legendHero",
    imageSrc: "/homepage-saa/kudos/Legend_Hero.png",
    conditionKey: "legendHeroCondition",
    descriptionKey: "legendHeroDesc",
  },
] as const;

export const KUDOS_ICONS = [
  {
    key: "revival",
    labelKey: "iconRevival",
    imageSrc: "/homepage-saa/kudos/Badge_REVIVAL.png",
  },
  {
    key: "touchOfLight",
    labelKey: "iconTouchOfLight",
    imageSrc: "/homepage-saa/kudos/Badge_TOUCH_OF_LIGHT.png",
  },
  {
    key: "stayGold",
    labelKey: "iconStayGold",
    imageSrc: "/homepage-saa/kudos/Badge_STAY_GOLD.png",
  },
  {
    key: "flowToHorizon",
    labelKey: "iconFlowToHorizon",
    imageSrc: "/homepage-saa/kudos/Badge_FLOW_TO_HORIZON.png",
  },
  {
    key: "beyondTheBoundary",
    labelKey: "iconBeyondTheBoundary",
    imageSrc: "/homepage-saa/kudos/Badge_BEYOND_THE_BOUNDARY.png",
  },
  {
    key: "rootFurther",
    labelKey: "iconRootFurther",
    imageSrc: "/homepage-saa/kudos/Badge_ROOT_FURTHER.png",
  },
] as const;
