"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuizCard } from "./QuizCard";
import type { OptionRow, QuestionRow } from "@/lib/types";
import type { AnswerPayload } from "@/app/quiz/[id]/actions";

export function QuestionSelectMultiple({
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const submit = () => {
    if (selected.size === 0) return;
    onAnswer({ selectedOptionIds: Array.from(selected) });
  };

  return (
    <QuizCard>
      <h2 className="text-balance text-center text-2xl font-bold tracking-tight text-olive-deep sm:text-[28px]">
        {question.text}
      </h2>
      <p className="mt-2 text-center text-sm text-olive-deep/60">
        Pick all that apply
      </p>
      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const isOn = selected.has(opt.id);
          return (
            <li key={opt.id}>
              <button
                type="button"
                aria-pressed={isOn}
                disabled={pending}
                onClick={() => toggle(opt.id)}
                className={
                  "group flex h-full w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-deep-soft disabled:cursor-not-allowed disabled:opacity-60 " +
                  (isOn
                    ? "border-olive-deep bg-olive-mint-100 shadow-[0_1px_0_rgba(47,93,53,0.04),0_12px_28px_-14px_rgba(47,93,53,0.32)]"
                    : "border-olive-mint-100 bg-white shadow-[0_1px_0_rgba(47,93,53,0.04),0_8px_24px_-16px_rgba(47,93,53,0.18)] hover:-translate-y-0.5 hover:border-olive-deep-soft")
                }
              >
                <span
                  className={
                    "grid size-6 shrink-0 place-items-center rounded-md border-2 transition " +
                    (isOn
                      ? "border-olive-deep bg-olive-deep text-white"
                      : "border-olive-mint-200 bg-white")
                  }
                  aria-hidden
                >
                  {isOn ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : null}
                </span>
                <span className="text-base font-semibold text-olive-deep">
                  {opt.text}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-6 flex justify-center">
        <Button
          size="lg"
          onClick={submit}
          disabled={pending || selected.size === 0}
          className="h-12 rounded-full px-8 text-base font-semibold"
        >
          {pending ? "Saving…" : "Continue"}
        </Button>
      </div>
    </QuizCard>
  );
}
