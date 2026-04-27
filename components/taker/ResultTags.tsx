"use client";
import { useEffect, useRef } from "react";
import { QuizCard } from "./QuizCard";
import { endSessionAction } from "@/app/quiz/[id]/actions";

export function ResultTags({
  sessionId,
  tagCounts,
}: {
  sessionId: string;
  tagCounts: Record<string, number>;
}) {
  const ended = useRef(false);
  useEffect(() => {
    if (ended.current) return;
    ended.current = true;
    void endSessionAction(sessionId).catch((e) =>
      console.error("endSession failed", e)
    );
  }, [sessionId]);

  const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] ?? 1;

  return (
    <QuizCard>
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive-deep/60">
          Your profile
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-olive-deep">
          Here&apos;s what we picked up
        </h1>
        <p className="mt-2 text-sm text-olive-deep/65">
          We&apos;ll use these tags to personalize your experience.
        </p>
      </div>
      {sorted.length === 0 ? (
        <p className="mt-8 text-center text-olive-deep/70">
          No tags collected — that&apos;s an unusual run.
        </p>
      ) : (
        <ul className="mt-7 space-y-3">
          {sorted.map(([tag, count]) => (
            <li key={tag}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-base font-semibold capitalize text-olive-deep">
                  {tag.replace(/[-_]/g, " ")}
                </span>
                <span className="text-sm font-bold text-olive-deep/80">
                  {count}×
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-olive-mint-100">
                <div
                  className="h-full rounded-full bg-olive-deep"
                  style={{ width: `${Math.round((count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </QuizCard>
  );
}
