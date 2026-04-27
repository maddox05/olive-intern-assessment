"use client";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { QuizCard } from "./QuizCard";
import {
  clickResultCtaAction,
  endSessionAction,
} from "@/app/quiz/[id]/actions";
import type { ResultRow } from "@/lib/types";

export function ResultScore({
  sessionId,
  totalScore,
  matched,
}: {
  sessionId: string;
  totalScore: number;
  matched: ResultRow | null;
}) {
  const ended = useRef(false);
  useEffect(() => {
    if (ended.current) return;
    ended.current = true;
    void endSessionAction(sessionId).catch((e) =>
      console.error("endSession failed", e)
    );
  }, [sessionId]);

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
      <div
        className="mx-auto mt-3 inline-flex h-20 w-20 items-center justify-center rounded-full bg-olive-deep text-3xl font-extrabold text-white shadow"
        aria-label={`Score: ${totalScore}`}
      >
        {totalScore}
      </div>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-olive-deep">
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
