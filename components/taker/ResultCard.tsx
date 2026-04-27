"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { QuizCard } from "./QuizCard";
import { pickBadgeForSession } from "./badges";
import {
  clickResultCtaAction,
  endSessionAction,
} from "@/app/quiz/[id]/actions";
import type { ResultRow } from "@/lib/types";

export function ResultCard({
  sessionId,
  matched,
  quizTitle,
}: {
  sessionId: string;
  matched: ResultRow | null;
  quizTitle: string;
}) {
  const Badge = useMemo(() => pickBadgeForSession(sessionId), [sessionId]);
  const ended = useRef(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

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

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `I got "${matched?.title_text ?? "a result"}" on ${quizTitle}!`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: quizTitle, text, url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShareNote("Copied to clipboard");
      setTimeout(() => setShareNote(null), 2500);
    }
  };

  return (
    <QuizCard className="text-center">
      <div className="relative mx-auto mt-1 flex h-44 w-44 items-center justify-center">
        <div
          aria-hidden
          className="absolute inset-0 -z-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(247, 213, 124, 0.55) 0%, rgba(247, 213, 124, 0) 70%)",
            filter: "blur(8px)",
          }}
        />
        <Badge className="relative h-44 w-44 drop-shadow-[0_8px_18px_rgba(163,123,28,0.35)]" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-olive-deep/60">
        Your badge
      </p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-olive-deep">
        {matched?.title_text ?? "Thanks for playing"}
      </h1>
      {matched?.description ? (
        <p className="mt-3 text-base text-olive-deep/75">{matched.description}</p>
      ) : null}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        {matched?.cta_text && matched?.cta_url ? (
          <Button
            size="lg"
            onClick={handleCta}
            className="h-12 rounded-full px-8 text-base font-semibold"
          >
            {matched.cta_text}
          </Button>
        ) : null}
        <Button
          size="lg"
          variant="outline"
          onClick={handleShare}
          className="h-12 rounded-full px-6 text-base font-semibold"
        >
          Share
        </Button>
      </div>
      {shareNote ? (
        <p className="mt-3 text-sm text-olive-deep/60">{shareNote}</p>
      ) : null}
    </QuizCard>
  );
}
