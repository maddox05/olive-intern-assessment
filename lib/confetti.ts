"use client";
import confetti from "canvas-confetti";

const PALETTE = [
  "#2f5d35", // olive-deep
  "#3b6e42", // olive-deep-soft
  "#7fb888", // hill-mid (from SkyHillsBackground)
  "#d4a84b", // olive-gold
  "#e8c66e", // olive-gold-soft
  "#fff5d1", // gold cream
];

/** Big celebratory burst at center + two side cannons. Used on result mount. */
export function fireFinishConfetti() {
  if (typeof window === "undefined") return;
  confetti({
    particleCount: 90,
    spread: 100,
    origin: { y: 0.4 },
    colors: PALETTE,
    ticks: 220,
    scalar: 1.0,
    startVelocity: 35,
  });
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 65,
      origin: { x: 0, y: 0.65 },
      colors: PALETTE,
      ticks: 200,
    });
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 65,
      origin: { x: 1, y: 0.65 },
      colors: PALETTE,
      ticks: 200,
    });
  }, 220);
}

/** Smaller burst from a specific viewport point — for click-on-element. */
export function fireConfettiAt(clientX: number, clientY: number) {
  if (typeof window === "undefined") return;
  const x = clientX / window.innerWidth;
  const y = clientY / window.innerHeight;
  confetti({
    particleCount: 60,
    spread: 80,
    origin: { x, y },
    colors: PALETTE,
    ticks: 180,
    scalar: 0.95,
    startVelocity: 30,
  });
}
