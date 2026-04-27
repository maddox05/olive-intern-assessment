"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuizCard } from "./QuizCard";
import type { OptionRow, QuestionRow } from "@/lib/types";
import type { AnswerPayload } from "@/app/quiz/[id]/actions";

export function QuestionSlider({
  question,
  options,
  onAnswer,
  pending,
}: {
  question: QuestionRow;
  options: OptionRow[];
  onAnswer: (payload: AnswerPayload) => void;
  pending: boolean;
}) {
  const opt = options[0];
  // Per spec line 16: slider's max is the option's score; min is 0
  const max = Math.max(1, opt?.score ?? 10);
  const [val, setVal] = useState<number>(Math.round(max / 2));

  return (
    <QuizCard>
      <h2 className="text-balance text-center text-2xl font-bold tracking-tight text-olive-deep sm:text-[28px]">
        {question.text}
      </h2>
      {opt?.text ? (
        <p className="mt-2 text-center text-sm text-olive-deep/60">{opt.text}</p>
      ) : null}
      <div className="mt-10">
        <div className="relative mb-3 flex items-center justify-center">
          <span
            className="rounded-full bg-olive-deep px-4 py-1.5 text-lg font-bold text-white shadow"
            aria-live="polite"
          >
            {val}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={val}
          onChange={(e) => setVal(Number(e.target.value))}
          disabled={pending}
          aria-label={question.text}
          className="olive-slider h-2 w-full appearance-none rounded-full bg-olive-mint-100 accent-olive-deep"
        />
        <div className="mt-2 flex justify-between text-xs font-medium text-olive-deep/60">
          <span>0</span>
          <span>{max}</span>
        </div>
      </div>
      <div className="mt-8 flex justify-center">
        <Button
          size="lg"
          onClick={() => onAnswer({ numeric: val })}
          disabled={pending}
          className="h-12 rounded-full px-8 text-base font-semibold"
        >
          {pending ? "Saving…" : "Continue"}
        </Button>
      </div>
    </QuizCard>
  );
}
