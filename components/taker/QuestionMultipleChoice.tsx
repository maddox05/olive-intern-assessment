"use client";
import { QuizCard } from "./QuizCard";
import type { OptionRow, QuestionRow } from "@/lib/types";
import type { AnswerPayload } from "@/app/quiz/[id]/actions";

export function QuestionMultipleChoice({
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
  return (
    <QuizCard>
      <h2 className="text-balance text-center text-2xl font-bold tracking-tight text-olive-deep sm:text-[28px]">
        {question.text}
      </h2>
      <p className="mt-2 text-center text-sm text-olive-deep/60">
        Pick one
      </p>
      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((opt) => (
          <li key={opt.id}>
            <button
              type="button"
              disabled={pending}
              onClick={() => onAnswer({ optionId: opt.id })}
              className="group flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border border-olive-mint-100 bg-white px-4 py-5 text-center shadow-[0_1px_0_rgba(47,93,53,0.04),0_8px_24px_-16px_rgba(47,93,53,0.18)] transition-all hover:-translate-y-0.5 hover:border-olive-deep-soft hover:bg-olive-mint-50 hover:shadow-[0_1px_0_rgba(47,93,53,0.04),0_12px_28px_-14px_rgba(47,93,53,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-deep-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="text-base font-semibold text-olive-deep">
                {opt.text}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </QuizCard>
  );
}
