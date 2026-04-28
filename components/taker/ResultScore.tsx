"use client";
import { useEffect, useRef, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { QuizCard } from "./QuizCard";
import {
  clickResultCtaAction,
  endSessionAction,
} from "@/app/quiz/[id]/actions";
import { fireConfettiAt, fireFinishConfetti } from "@/lib/confetti";
import type { ResultRow } from "@/lib/types";

export function ResultScore({
  sessionId,
  totalScore,
  maxScore,
  matched,
}: {
  sessionId: string;
  totalScore: number;
  maxScore: number;
  matched: ResultRow | null;
}) {
  const ended = useRef(false);
  const fired = useRef(false);

  useEffect(() => {
    if (ended.current) return;
    ended.current = true;
    void endSessionAction(sessionId).catch((e) =>
      console.error("endSession failed", e)
    );
  }, [sessionId]);

  // Confetti on mount — once per visit. The setTimeout lets the page paint
  // before the burst so the user sees it appear, not start mid-load.
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    // Fire on the next two animation frames so the page has painted before
    // the burst (otherwise it can render "off-screen" while React is still
    // hydrating). NO cleanup: in React StrictMode dev double-invoke,
    // returning a cleanup that cancels the timer would silently eat the
    // confetti. The fired ref guards against re-firing on remount.
    requestAnimationFrame(() => requestAnimationFrame(fireFinishConfetti));
  }, []);

  const handleScoreClick = (e: MouseEvent<HTMLButtonElement>) => {
    fireConfettiAt(e.clientX, e.clientY);
  };

  const handleCta = async () => {
    if (!matched) return;
    try {
      await clickResultCtaAction(sessionId, matched.id);
    } catch (e) {
      console.error("clickResultCta failed", e);
    }
    if (matched.cta_url) window.open(matched.cta_url, "_blank", "noopener");
  };

  return (
    <QuizCard className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive-deep/60">
        Your score
      </p>

      {/* Big gradient score puck. Click it for more confetti. */}
      <div className="relative mx-auto mt-4 h-32 w-32">
        {/* soft halo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(127, 184, 136, 0.55) 0%, rgba(127, 184, 136, 0) 70%)",
            filter: "blur(10px)",
          }}
        />
        <button
          type="button"
          onClick={handleScoreClick}
          aria-label={`Score: ${totalScore} out of ${maxScore}. Click for confetti.`}
          className="relative inline-flex h-32 w-32 flex-col items-center justify-center rounded-full text-white shadow-[0_10px_24px_-8px_rgba(47,93,53,0.55)] transition-transform duration-200 ease-out hover:scale-[1.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive-deep-soft/40"
          style={{
            background:
              "radial-gradient(circle at 30% 25%, #4d8a55 0%, #2f5d35 55%, #1f4124 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -8px 18px rgba(0,0,0,0.18), 0 10px 24px -8px rgba(47,93,53,0.55)",
          }}
        >
          <span className="text-5xl font-extrabold leading-none tracking-tight">
            {totalScore}
          </span>
          <span className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
            / {maxScore}
          </span>
        </button>
      </div>

      <h1 className="mt-7 text-3xl font-extrabold tracking-tight text-olive-deep">
        {matched?.title_text ?? "Thanks for playing"}
      </h1>
      {matched?.description ? (
        <p className="mt-3 text-base text-olive-deep/75">{matched.description}</p>
      ) : null}
      {matched?.cta_text && matched?.cta_url ? (
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            onClick={handleCta}
            className="h-12 rounded-full px-8 text-base font-semibold"
          >
            {matched.cta_text}
          </Button>
        </div>
      ) : null}
    </QuizCard>
  );
}
