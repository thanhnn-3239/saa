/**
 * word-cloud-layout.ts
 *
 * Deterministic word-cloud placement algorithm.
 * No Math.random — seeds from node index and name chars so layout is
 * stable across SSR + hydration.
 *
 * Strategy: Archimedean spiral search starting from a candidate position
 * derived from the node's index (deterministic "hint"). For each candidate
 * step we check AABB overlap against already-placed boxes. After MAX_STEPS
 * we fall back to the next free grid slot.
 *
 * Font-size tiers are derived from weight [0,1] → 4 discrete CSS sizes.
 * This matches the design's 4 observed tiers (11.3, 10.2, 7.9, 6.7 relative
 * to 548px Figma frame → scaled to real DOM sizes 24–14px range).
 */

export interface CloudBox {
  /** node identifier — used as React key */
  id: string;
  label: string;
  /** font-size in px */
  fontSize: number;
  /** isHighlighted → accent colour (top-ranked or first search match) */
  highlighted: boolean;
  /** 0–100 percentage from container left */
  left: number;
  /** 0–100 percentage from container top */
  top: number;
  /** approximate width in % for collision detection */
  widthPct: number;
  /** approximate height in % for collision detection */
  heightPct: number;
}

interface LayoutNode {
  id: string;
  label: string;
  weight: number; // 0–1
  highlighted: boolean;
}

/** Simple deterministic hash of string + int seed → unsigned int32 */
function hash32(s: string, seed = 0): number {
  let h = (seed * 2654435761) >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 2654435761) >>> 0;
  }
  return h;
}

/** hash → float [0, 1) */
function hashFrac(s: string, seed = 0): number {
  return (hash32(s, seed) % 10000) / 10000;
}

/** Weight [0,1] → 4-tier font size: 24 | 20 | 17 | 14 px */
export function fontSizeFromWeight(weight: number): number {
  if (weight >= 0.75) return 24;
  if (weight >= 0.5) return 20;
  if (weight >= 0.25) return 17;
  return 14;
}

/**
 * Estimate text width in % of container.
 * Assumes ~0.6 char-width/em ratio (monospace-safe upper bound for Montserrat).
 * containerWidth in px is needed for accurate %; pass 0 to get character estimate.
 */
function estimateWidthPct(
  label: string,
  fontSize: number,
  containerWidth: number,
): number {
  if (containerWidth <= 0) return 10;
  const charWidthPx = fontSize * 0.62;
  const textWidthPx = label.length * charWidthPx;
  return (textWidthPx / containerWidth) * 100;
}

function estimateHeightPct(fontSize: number, containerHeight: number): number {
  if (containerHeight <= 0) return 5;
  return ((fontSize * 1.3) / containerHeight) * 100;
}

/** Check if two AABB boxes overlap. Adds a 1.5% padding to each box. */
const PAD = 1.5;
function overlaps(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return (
    ax - PAD < bx + bw + PAD &&
    ax + aw + PAD > bx - PAD &&
    ay - PAD < by + bh + PAD &&
    ay + ah + PAD > by - PAD
  );
}

const MAX_SPIRAL_STEPS = 200;
const SPIRAL_STEP = 0.15; // radians per step
const SPIRAL_GROWTH = 0.035; // radius growth per radian

/**
 * Compute a fully placed cloud layout given a list of nodes.
 *
 * @param nodes    sorted by weight descending (heaviest placed first, harder to displace)
 * @param containerWidth  in pixels (for width estimation); can be 0 to skip
 * @param containerHeight in pixels; can be 0 to skip
 */
export function computeCloudLayout(
  nodes: LayoutNode[],
  containerWidth = 0,
  containerHeight = 0,
): CloudBox[] {
  const placed: CloudBox[] = [];

  // Sort heaviest first so largest names get prime placement
  const sorted = [...nodes].sort((a, b) => b.weight - a.weight);

  for (let i = 0; i < sorted.length; i++) {
    const node = sorted[i];
    const fs = fontSizeFromWeight(node.weight);
    const wPct = estimateWidthPct(node.label, fs, containerWidth);
    const hPct = estimateHeightPct(fs, containerHeight);

    // Deterministic starting angle & radius based on name + index
    const startAngle = hashFrac(node.label, 0) * Math.PI * 2;
    // Candidate center hint: divide area into a grid, pick cell by index
    const cols = Math.max(3, Math.ceil(Math.sqrt(sorted.length * 1.5)));
    const rows = Math.ceil(sorted.length / cols);
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellW = 90 / cols;
    const cellH = 85 / rows;
    const cx = 5 + col * cellW + cellW / 2 + (hashFrac(node.label, 1) - 0.5) * cellW * 0.3;
    const cy = 8 + row * cellH + cellH / 2 + (hashFrac(node.label, 2) - 0.5) * cellH * 0.3;

    let placed_this = false;

    for (let step = 0; step < MAX_SPIRAL_STEPS; step++) {
      const angle = startAngle + step * SPIRAL_STEP;
      const radius = step * SPIRAL_GROWTH * 6;
      // Convert radius from % units (relative to container)
      const tryX = cx + radius * Math.cos(angle) - wPct / 2;
      const tryY = cy + radius * Math.sin(angle) - hPct / 2;

      // Clamp to safe area [2%, 96%] so names don't bleed
      const clampedX = Math.min(98 - wPct, Math.max(2, tryX));
      const clampedY = Math.min(95 - hPct, Math.max(5, tryY));

      // Check collision against all already-placed boxes
      let collision = false;
      for (const p of placed) {
        if (overlaps(clampedX, clampedY, wPct, hPct, p.left, p.top, p.widthPct, p.heightPct)) {
          collision = true;
          break;
        }
      }

      if (!collision) {
        placed.push({
          id: node.id,
          label: node.label,
          fontSize: fs,
          highlighted: node.highlighted,
          left: clampedX,
          top: clampedY,
          widthPct: wPct,
          heightPct: hPct,
        });
        placed_this = true;
        break;
      }
    }

    if (!placed_this) {
      // Fallback: place in a far-right column to stay visible
      const fallbackX = Math.min(95 - wPct, 5 + ((i * 17) % 85));
      const fallbackY = Math.min(92 - hPct, 5 + ((i * 13) % 80));
      placed.push({
        id: node.id,
        label: node.label,
        fontSize: fs,
        highlighted: node.highlighted,
        left: fallbackX,
        top: fallbackY,
        widthPct: wPct,
        heightPct: hPct,
      });
    }
  }

  return placed;
}
