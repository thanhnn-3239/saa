"use client";
/**
 * ParticleNetwork — lightweight canvas "neural-network" / constellation backdrop.
 *
 * Reproduces the production /kudos tsParticles "links" preset, dependency-free:
 *   - drifting dots (count scales with area, ~60 per 800×800), colors
 *     white / #e0e0e0 / #cccccc, radius 1–3px, opacity 0.5
 *   - dots move at ~0.5px/frame in a random direction and BOUNCE off edges
 *   - any two dots within 150px are joined by a white line whose opacity
 *     fades 0.3 → 0 with distance, width 1
 *
 * Rendered behind the word-cloud names (pointer-events-none, aria-hidden).
 * Sizes itself to its parent via ResizeObserver (retina-aware) and honours
 * prefers-reduced-motion by painting a single static frame.
 */
import { useEffect, useRef } from "react";

interface ParticleNetworkProps {
  className?: string;
}

// ── tsParticles config mirror ───────────────────────────────────────────────
const COLORS = ["#ffffff", "#e0e0e0", "#cccccc"];
const LINK_DISTANCE = 150;
const LINK_OPACITY = 0.3;
const DOT_OPACITY = 0.5;
const SPEED = 0.5;
const BASE_COUNT = 60; // dots per DENSITY_AREA (matches number.value:60 @ 800×800)
const DENSITY_AREA = 800 * 800;
const MIN_DOTS = 24;
const MAX_DOTS = 120;

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
}

export function ParticleNetwork({ className = "" }: ParticleNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    let dots: Dot[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const seed = () => {
      const target = Math.round(BASE_COUNT * ((w * h) / DENSITY_AREA));
      const count = Math.max(MIN_DOTS, Math.min(MAX_DOTS, target));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: rand(-SPEED, SPEED),
        vy: rand(-SPEED, SPEED),
        r: rand(1, 3),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // Links first so dots paint on top.
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#ffffff";
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DISTANCE) {
            ctx.globalAlpha = LINK_OPACITY * (1 - dist / LINK_DISTANCE);
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }
      for (const d of dots) {
        ctx.globalAlpha = DOT_OPACITY;
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const tick = () => {
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x <= 0 || d.x >= w) d.vx = -d.vx;
        if (d.y <= 0 || d.y >= h) d.vy = -d.vy;
        d.x = Math.max(0, Math.min(w, d.x));
        d.y = Math.max(0, Math.min(h, d.y));
      }
      draw();
      raf = requestAnimationFrame(tick);
    };

    const resize = () => {
      // A <canvas> is a replaced element — `absolute inset-0` won't stretch it,
      // so measure the PARENT and set the canvas size explicitly (CSS + buffer).
      const host = canvas.parentElement ?? canvas;
      const rect = host.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      if (w === 0 || h === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduceMotion) draw(); // single static frame
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement ?? canvas);
    resize();
    if (!reduceMotion) raf = requestAnimationFrame(tick);

    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className={`block ${className}`} aria-hidden="true" />;
}
