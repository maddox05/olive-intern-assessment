"use client";
import { useEffect, useState } from "react";

const STEPS = [
  "Asking Claude to draft the quiz…",
  "Generating questions and options…",
  "Wiring up scoring and tag vocabulary…",
  "Validating the schema…",
  "Saving to your dashboard…",
];

const EDIT_STEPS = [
  "Reading the current quiz…",
  "Asking Claude to apply your edit…",
  "Preserving question IDs where possible…",
  "Validating the updated schema…",
  "Saving changes…",
];

/**
 * Friendly loading overlay for AI calls (10–60s typical). Cycles through
 * a few "what's happening" messages so users know we're not stuck.
 * Doesn't lie about progress — no fake percent bar.
 */
export function AiLoadingOverlay({
  visible,
  variant = "create",
}: {
  visible: boolean;
  variant?: "create" | "edit";
}) {
  const steps = variant === "edit" ? EDIT_STEPS : STEPS;
  const [idx, setIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!visible) return;
    // Reset counters at the START of each visible run via timeouts (calling
    // setState directly here trips React 19's set-state-in-effect rule
    // because that's a sync render-blocking write — queueMicrotask defers
    // it past the current render).
    queueMicrotask(() => {
      setIdx(0);
      setElapsed(0);
    });
    const stepTimer = setInterval(() => {
      setIdx((i) => (i < steps.length - 1 ? i + 1 : i));
    }, 4000);
    const sec = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      clearInterval(stepTimer);
      clearInterval(sec);
    };
  }, [visible, steps.length]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl backdrop-blur-sm"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(244,250,245,0.92) 100%)",
      }}
    >
      {/* Pulsing olive-deep dot */}
      <div className="relative">
        <div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background: "var(--olive-deep)",
            animation: "olive-ping 1.4s ease-out infinite",
          }}
        />
        <div
          className="relative size-3 rounded-full"
          style={{ backgroundColor: "var(--olive-deep)" }}
        />
        <style>{`
          @keyframes olive-ping {
            0%   { transform: scale(1);   opacity: 0.55; }
            80%  { transform: scale(2.6); opacity: 0; }
            100% { transform: scale(2.6); opacity: 0; }
          }
        `}</style>
      </div>

      <div className="px-6 text-center">
        <p
          key={idx}
          className="text-sm font-semibold text-olive-deep"
          style={{ animation: "olive-fade 380ms ease-out" }}
        >
          {steps[idx]}
        </p>
        <style>{`
          @keyframes olive-fade {
            from { opacity: 0; transform: translateY(4px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <p className="mt-1.5 text-[11px] font-medium text-olive-deep/55">
          ~{elapsed}s · usually 15–60s
        </p>
      </div>

      {/* Indeterminate progress bar */}
      <div
        className="h-1 w-44 overflow-hidden rounded-full"
        style={{ backgroundColor: "var(--olive-mint-100)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: "40%",
            background:
              "linear-gradient(to right, transparent, var(--olive-deep), transparent)",
            animation: "olive-slide 1.6s ease-in-out infinite",
          }}
        />
        <style>{`
          @keyframes olive-slide {
            0%   { transform: translateX(-110%); }
            100% { transform: translateX(280%); }
          }
        `}</style>
      </div>
    </div>
  );
}
