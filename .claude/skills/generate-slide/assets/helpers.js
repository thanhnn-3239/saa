/**
 * Sun* Presentation Helpers
 * 
 * Reusable functions for building Sun*-branded PowerPoint slides with pptxgenjs.
 * 
 * Usage (option 1 — require):
 *   const helpers = require("./helpers.js");
 *   const { COLORS, FONTS, addFooter, addTitle, makeCover, makeSectionDivider } = helpers.bind(pres, logoPath);
 * 
 * Usage (option 2 — copy/paste): just copy the constants and functions inline into your generator script.
 *   This is often simpler for one-off decks.
 * 
 * The helpers expect:
 *   - pptxgenjs LAYOUT_WIDE (13.333 × 7.5 inches, 16:9)
 *   - A Sun* red-version logo PNG accessible via filesystem path
 */

// ============================================================
// Brand Constants — keep in sync with assets/brand_regulation.md
// ============================================================

const COLORS = {
  SUN_RED: "FF2200",        // Main brand color — use sparingly as accent
  SUN_DARK_RED: "AD0C00",   // Sub
  SUN_GOLD: "B69256",       // Sub
  SUN_YELLOW: "FDBA05",     // Sub
  LIGHT_GREY: "F7F7F7",     // Card backgrounds
  BORDER_GREY: "DDDDDD",    // Separators
  TEXT_DARK: "1A1A1A",      // Body text
  TEXT_GREY: "666666",      // Secondary text
  WHITE: "FFFFFF",
  // Tints for callout backgrounds (derived, semi-transparent feel)
  TINT_RED: "FFEEEC",
  TINT_DARK_RED: "FFF0EE",
  TINT_GOLD: "FAF5EC",
};

const FONTS = {
  JP: "Noto Sans JP",   // Body / multilingual default
  EN: "Eina03",          // English headers (graceful fallback)
};

const SLIDE = {
  W: 13.333,
  H: 7.5,
};

// ============================================================
// Helper Functions
// ============================================================

/**
 * Bind helpers to a pptxgenjs presentation instance and a logo path.
 * Returns an object with all the helper functions pre-configured.
 * 
 * @param {pptxgen} pres - pptxgenjs presentation instance
 * @param {string} logoPath - filesystem path to logo_sun.png
 * @returns {object} helper functions
 */
function bind(pres, logoPath) {
  /**
   * Add the standard footer to a body slide.
   * - page number (left)
   * - © YEAR Sun* Inc. (center)
   * - mini Sun* logo (right)
   * - thin red separator line at top of content area
   * - faint grey separator at bottom
   */
  function addFooter(slide, pageNum, year = new Date().getFullYear()) {
    // Top thin red separator (under header title)
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0.95, w: SLIDE.W, h: 0.025,
      fill: { color: COLORS.SUN_RED }, line: { type: "none" },
    });
    // Bottom thin grey separator (above footer)
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 6.98, w: SLIDE.W, h: 0.015,
      fill: { color: COLORS.BORDER_GREY }, line: { type: "none" },
    });
    // Page number
    slide.addText(String(pageNum), {
      x: 0.4, y: 7.05, w: 0.6, h: 0.35,
      fontSize: 10, fontFace: FONTS.EN, color: COLORS.TEXT_GREY,
      align: "left", valign: "middle", margin: 0,
    });
    // Copyright
    slide.addText(`©${year} Sun* Inc.`, {
      x: 5.5, y: 7.05, w: 2.5, h: 0.35,
      fontSize: 9, fontFace: FONTS.EN, color: COLORS.TEXT_GREY,
      align: "center", valign: "middle", margin: 0,
    });
    // Mini Sun* logo (red on white)
    slide.addImage({
      path: logoPath,
      x: 12.55, y: 7.0, w: 0.55, h: 0.27,
    });
  }

  /**
   * Add a body slide title (top-left, no decoration beyond the implicit red line from addFooter).
   */
  function addTitle(slide, title) {
    slide.addText(title, {
      x: 0.5, y: 0.3, w: 12.3, h: 0.6,
      fontSize: 22, fontFace: FONTS.JP, color: COLORS.TEXT_DARK,
      bold: true, align: "left", valign: "middle", margin: 0,
    });
  }

  /**
   * Build a cover slide (red background, white "Sun*" text + title + subtitle + presenter).
   * Returns the created slide for further customization.
   */
  function makeCover(title, subtitle, presenter, year = new Date().getFullYear()) {
    const slide = pres.addSlide();
    slide.background = { color: COLORS.SUN_RED };

    // White "Sun*" text (used instead of logo because red logo would disappear on red bg)
    slide.addText("Sun*", {
      x: 0.7, y: 0.6, w: 2.5, h: 0.8,
      fontSize: 36, fontFace: FONTS.EN, color: COLORS.WHITE,
      bold: true, align: "left", valign: "middle", margin: 0,
    });

    // Big title
    slide.addText(title, {
      x: 0.7, y: 2.6, w: 11.9, h: 1.5,
      fontSize: 48, fontFace: FONTS.JP, color: COLORS.WHITE,
      bold: true, align: "left", valign: "middle", margin: 0,
    });

    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.7, y: 4.1, w: 11.9, h: 0.7,
        fontSize: 22, fontFace: FONTS.JP, color: COLORS.WHITE,
        align: "left", valign: "middle", margin: 0,
      });
    }

    if (presenter) {
      slide.addText(presenter, {
        x: 0.7, y: 6.3, w: 11.9, h: 0.5,
        fontSize: 14, fontFace: FONTS.JP, color: COLORS.WHITE,
        align: "left", valign: "middle", margin: 0,
      });
    }

    // Bottom-right copyright
    slide.addText(`©${year} Sun* Inc.`, {
      x: 10.5, y: 7.1, w: 2.5, h: 0.3,
      fontSize: 9, fontFace: FONTS.EN, color: COLORS.WHITE,
      align: "right", valign: "middle", margin: 0,
    });

    return slide;
  }

  /**
   * Build a section divider slide (red background, "PART NN" label + big white title + subtitle).
   * Returns the created slide.
   */
  function makeSectionDivider(sectionNum, title, subtitle) {
    const slide = pres.addSlide();
    slide.background = { color: COLORS.SUN_RED };

    // PART NN label (top, char-spaced)
    slide.addText(`PART ${sectionNum}`, {
      x: 0.7, y: 2.5, w: 11.9, h: 0.6,
      fontSize: 18, fontFace: FONTS.EN, color: COLORS.WHITE,
      bold: false, align: "left", valign: "middle", margin: 0,
      charSpacing: 6,
    });

    // Big title
    slide.addText(title, {
      x: 0.7, y: 3.1, w: 11.9, h: 1.4,
      fontSize: 44, fontFace: FONTS.JP, color: COLORS.WHITE,
      bold: true, align: "left", valign: "middle", margin: 0,
    });

    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.7, y: 4.5, w: 11.9, h: 0.7,
        fontSize: 18, fontFace: FONTS.JP, color: COLORS.WHITE,
        align: "left", valign: "middle", margin: 0,
      });
    }

    // Bottom-right Sun* mark (white)
    slide.addText("Sun*", {
      x: 11.5, y: 6.9, w: 1.5, h: 0.4,
      fontSize: 18, fontFace: FONTS.EN, color: COLORS.WHITE,
      bold: true, align: "right", valign: "middle", margin: 0,
    });

    return slide;
  }

  /**
   * Build a closing/Q&A slide (red background, like a cover but for the end).
   * Pass a `content` callback to populate the body — it receives the slide and can add custom content.
   */
  function makeClosing(title, subtitle, contentCallback, year = new Date().getFullYear()) {
    const slide = pres.addSlide();
    slide.background = { color: COLORS.SUN_RED };

    slide.addText("Sun*", {
      x: 0.7, y: 0.6, w: 2.5, h: 0.8,
      fontSize: 36, fontFace: FONTS.EN, color: COLORS.WHITE,
      bold: true, align: "left", valign: "middle", margin: 0,
    });

    slide.addText(title, {
      x: 0.7, y: 1.8, w: 11.9, h: 1.0,
      fontSize: 44, fontFace: FONTS.JP, color: COLORS.WHITE,
      bold: true, align: "left", valign: "middle", margin: 0,
    });

    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.7, y: 2.85, w: 11.9, h: 0.5,
        fontSize: 18, fontFace: FONTS.JP, color: COLORS.WHITE,
        align: "left", valign: "middle", margin: 0,
      });
    }

    if (contentCallback) {
      contentCallback(slide);
    }

    slide.addText(`©${year} Sun* Inc.`, {
      x: 10.5, y: 7.1, w: 2.5, h: 0.3,
      fontSize: 9, fontFace: FONTS.EN, color: COLORS.WHITE,
      align: "right", valign: "middle", margin: 0,
    });

    return slide;
  }

  /**
   * Helper: Create a "key message" red callout — a thin red bar on the left + grey-tinted background + bold quote.
   * Use for emphasized closing thoughts on a slide.
   */
  function addKeyMessage(slide, text, x, y, w, h) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h,
      fill: { color: COLORS.LIGHT_GREY }, line: { type: "none" },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.08, h,
      fill: { color: COLORS.SUN_RED }, line: { type: "none" },
    });
    slide.addText(text, {
      x: x + 0.25, y, w: w - 0.4, h,
      fontSize: 13, fontFace: FONTS.JP, color: COLORS.TEXT_DARK,
      italic: true, align: "left", valign: "middle", margin: 0,
    });
  }

  return {
    COLORS,
    FONTS,
    SLIDE,
    addFooter,
    addTitle,
    makeCover,
    makeSectionDivider,
    makeClosing,
    addKeyMessage,
  };
}

module.exports = { bind, COLORS, FONTS, SLIDE };
