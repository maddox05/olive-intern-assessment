"use client";
import { Button } from "@/components/ui/button";
import { QuizCard } from "./QuizCard";
import type { QuizFull } from "@/lib/types";

export function StartScreen({
  quiz,
  onStart,
  pending,
}: {
  quiz: QuizFull;
  onStart: () => void;
  pending: boolean;
}) {
  return (
    <QuizCard className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive-deep/60">
        {quiz.questions.length} {quiz.questions.length === 1 ? "question" : "questions"}
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-olive-deep sm:text-4xl">
        {quiz.title}
      </h1>
      {quiz.description ? (
        <p className="mt-3 text-base text-olive-deep/70">{quiz.description}</p>
      ) : null}
      <div className="mt-8 flex justify-center">
        <Button
          size="lg"
          onClick={onStart}
          disabled={pending}
          className="h-12 rounded-full px-8 text-base font-semibold"
        >
          {pending ? "Starting…" : "Start"}
        </Button>
      </div>
    </QuizCard>
  );
}
