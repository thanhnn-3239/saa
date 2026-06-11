"use client";
/**
 * usePanZoom — drag-to-pan + step zoom for the Spotlight word-cloud.
 *
 * Model (matches the production /kudos board):
 *   - `scale` steps 1×→5× via zoomIn/zoomOut; reset returns to 1× centered.
 *   - `pan` is a PRE-scale translate (px). Visible shift = scale × pan, so the
 *     inner surface must be transformed as `scale(s) translate(panX, panY)`
 *     with transform-origin center. Mouse delta is divided by scale so 1px of
 *     cursor travel = 1px of on-screen travel.
 *   - Pan is clamped so the (scaled) surface always covers the viewport.
 *   - Panning is disabled at 1× (nothing overflows to pan).
 *
 * Pointer Events unify mouse + touch; pointer capture keeps the drag alive when
 * the cursor leaves the viewport. `movedRef` lets the caller suppress the word
 * click that would otherwise fire at the end of a drag.
 */
import { useCallback, useRef, useState, type PointerEvent, type RefObject } from "react";

const MIN = 1;
const MAX = 5;
const STEP = 0.5;
const DRAG_THRESHOLD = 4; // px before a press counts as a drag (suppresses click)

export interface PanZoom {
  scale: number;
  pan: { x: number; y: number };
  isDragging: boolean;
  canZoomIn: boolean;
  canZoomOut: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  /** Attach to the clipping viewport element (measured for clamp + capture). */
  viewportRef: RefObject<HTMLDivElement | null>;
  /** True while/after a drag gesture — read in word onClick to skip navigation. */
  movedRef: RefObject<boolean>;
  /** Spread onto the viewport element. */
  bind: {
    onPointerDown: (e: PointerEvent) => void;
    onPointerMove: (e: PointerEvent) => void;
    onPointerUp: (e: PointerEvent) => void;
    onPointerLeave: (e: PointerEvent) => void;
  };
}

export function usePanZoom(): PanZoom {
  const [scale, setScale] = useState(MIN);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setDragging] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const start = useRef({ px: 0, py: 0, ox: 0, oy: 0 });
  const movedRef = useRef(false);

  // Clamp pan so the scaled surface never reveals empty space past its edges.
  const clamp = useCallback((x: number, y: number, s: number) => {
    const vp = viewportRef.current;
    if (!vp || s <= MIN) return { x: 0, y: 0 };
    const maxX = (vp.clientWidth * (s - 1)) / (2 * s);
    const maxY = (vp.clientHeight * (s - 1)) / (2 * s);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, []);

  const zoomIn = useCallback(() => {
    setScale((s) => {
      const ns = Math.min(s + STEP, MAX);
      setPan((p) => clamp(p.x, p.y, ns));
      return ns;
    });
  }, [clamp]);

  const zoomOut = useCallback(() => {
    setScale((s) => {
      const ns = Math.max(s - STEP, MIN);
      setPan((p) => clamp(p.x, p.y, ns));
      return ns;
    });
  }, [clamp]);

  const reset = useCallback(() => {
    setScale(MIN);
    setPan({ x: 0, y: 0 });
  }, []);

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      if (scale <= MIN) return;
      movedRef.current = false;
      setDragging(true);
      start.current = { px: e.clientX, py: e.clientY, ox: pan.x, oy: pan.y };
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [scale, pan],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return;
      const rawDx = e.clientX - start.current.px;
      const rawDy = e.clientY - start.current.py;
      if (Math.abs(rawDx) > DRAG_THRESHOLD || Math.abs(rawDy) > DRAG_THRESHOLD) {
        movedRef.current = true;
      }
      setPan(clamp(start.current.ox + rawDx / scale, start.current.oy + rawDy / scale, scale));
    },
    [isDragging, scale, clamp],
  );

  const endDrag = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return;
      setDragging(false);
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    },
    [isDragging],
  );

  return {
    scale,
    pan,
    isDragging,
    canZoomIn: scale < MAX,
    canZoomOut: scale > MIN,
    zoomIn,
    zoomOut,
    reset,
    viewportRef,
    movedRef,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerLeave: endDrag,
    },
  };
}
