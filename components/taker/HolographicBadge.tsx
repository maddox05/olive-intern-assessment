"use client";
import { useRef, useState, type ReactNode, type PointerEvent } from "react";

/**
 * Wraps a badge SVG in a Pokemon-card / YC-ticket style holographic
 * surface. The user grabs the badge with mouse or finger and can tilt it
 * around — the iridescent sheen and the glossy specular highlight
 * follow the pointer in real time.
 *
 * Layered effects:
 *   1. 3D tilt on the wrapper via perspective + rotateX/rotateY.
 *   2. Iridescent rainbow gradient overlay using mix-blend-mode:
 *      color-dodge — colors and angle keyed to pointer position.
 *   3. Glossy radial-gradient highlight following the pointer with
 *      mix-blend-mode: overlay.
 *   4. Subtle resting auto-shimmer when idle so users see it's interactive.
 */
export function HolographicBadge({
  children,
  width = 280,
  height = 168,
  onTap,
}: {
  children: ReactNode;
  width?: number;
  height?: number;
  /** Fires on a true click/tap (no significant drag movement). */
  onTap?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const downAt = useRef<{ x: number; y: number } | null>(null);
  const [tilt, setTilt] = useState({
    x: 0,
    y: 0,
    mouseX: 0.5,
    mouseY: 0.5,
    active: false,
  });

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const cx = Math.max(0, Math.min(1, x));
    const cy = Math.max(0, Math.min(1, y));
    setTilt({
      x: (cy - 0.5) * -22, // rotateX: tilt forward when cursor is high
      y: (cx - 0.5) * 22,  // rotateY: tilt right when cursor is right
      mouseX: cx,
      mouseY: cy,
      active: true,
    });
  };

  const onLeave = () => {
    setTilt({ x: 0, y: 0, mouseX: 0.5, mouseY: 0.5, active: false });
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    downAt.current = { x: e.clientX, y: e.clientY };
  };

  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const start = downAt.current;
    downAt.current = null;
    if (!start || !onTap) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    // <8px total motion = tap, otherwise treat as a drag (don't fire onTap).
    if (Math.hypot(dx, dy) < 8) onTap();
  };

  const sizeStyle = { width, height } as const;

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerCancel={onLeave}
      onPointerDown={onDown}
      onPointerUp={onUp}
      role={onTap ? "button" : "img"}
      tabIndex={onTap ? 0 : undefined}
      onKeyDown={(e) => {
        if (onTap && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onTap();
        }
      }}
      aria-label={
        onTap
          ? "Your badge — tap to enlarge, drag to tilt"
          : "Your badge — drag to tilt"
      }
      className={
        "relative touch-none select-none " +
        (onTap
          ? "cursor-pointer active:cursor-grabbing"
          : "cursor-grab active:cursor-grabbing")
      }
      style={{
        ...sizeStyle,
        perspective: "1200px",
      }}
    >
      <div
        className="relative h-full w-full transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${
            tilt.active ? 1.05 : 1
          })`,
          transformStyle: "preserve-3d",
          filter: tilt.active
            ? "drop-shadow(0 18px 30px rgba(163,123,28,0.45))"
            : "drop-shadow(0 10px 22px rgba(163,123,28,0.32))",
          transition:
            "transform 200ms ease-out, filter 250ms ease-out",
        }}
      >
        {/* Soft gold halo behind the badge */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              "radial-gradient(circle, rgba(247, 213, 124, 0.55) 0%, rgba(247, 213, 124, 0) 70%)",
            filter: "blur(10px)",
            transform: "translateZ(-30px)",
          }}
        />

        {/* Badge SVG itself */}
        <div className="relative h-full w-full" style={{ transform: "translateZ(0)" }}>
          {children}
        </div>

        {/* SINGLE bright white sheen sweep — the YC-ticket / golden-foil
            signature. The band's center position is keyed to the cursor X,
            so as you drag left↔right the highlight sweeps across the face.
            soft-light blend keeps the gold base color underneath visible. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            mixBlendMode: "soft-light",
            // Reading from a horizontal angle so the sheen reads as a
            // diagonal "light reflection" sweeping across the foil.
            background: `linear-gradient(115deg,
              transparent 0%,
              transparent ${Math.max(0, tilt.mouseX * 100 - 35)}%,
              rgba(255, 255, 255, 0.95) ${tilt.mouseX * 100}%,
              transparent ${Math.min(100, tilt.mouseX * 100 + 35)}%,
              transparent 100%
            )`,
          }}
        />

        {/* Subtle foil grain — same direction as the sheen, very low
            opacity, just enough to read as metallic film */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            opacity: 0.08,
            mixBlendMode: "overlay",
            backgroundImage:
              "repeating-linear-gradient(115deg, rgba(255, 245, 209, 0.6) 0px, rgba(255, 245, 209, 0.6) 1px, transparent 1px, transparent 5px)",
          }}
        />

        {/* Rim highlight to read as "foil card edge" */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,0.35), inset 0 0 12px rgba(212, 168, 75, 0.25)",
          }}
        />
      </div>

      {/* "Drag me" hint while idle */}
      <p
        aria-hidden
        className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.16em] text-olive-deep/45 transition-opacity"
        style={{ opacity: tilt.active ? 0 : 1 }}
      >
        ✦ drag to tilt ✦
      </p>
    </div>
  );
}
