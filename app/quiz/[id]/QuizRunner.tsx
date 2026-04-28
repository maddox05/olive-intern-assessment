"use client";
import { useCallback, useMemo, useState, useTransition } from "react";
import {
  type AnswerPayload,
  answerQuestionAction,
  startSessionAction,
} from "./actions";
import { getClientMeta } from "@/lib/client-meta";
import { ProgressBar } from "@/components/taker/ProgressBar";
import { StartScreen } from "@/components/taker/StartScreen";
import { QuestionMultipleChoice } from "@/components/taker/QuestionMultipleChoice";
import { QuestionSelectMultiple } from "@/components/taker/QuestionSelectMultiple";
import { QuestionSlider } from "@/components/taker/QuestionSlider";
import { ResultScore } from "@/components/taker/ResultScore";
import { ResultCard } from "@/components/taker/ResultCard";
import { ResultTags } from "@/components/taker/ResultTags";
import type { OptionRow, QuizFull, ResultRow } from "@/lib/types";

type Phase = "start" | "question" | "result";

interface RecordedAnswer extends AnswerPayload {
  questionId: string;
}

function scoreOf(
  answer: RecordedAnswer,
  optionsByQuestion: Map<string, OptionRow[]>
): number {
  if (answer.numeric != null) return answer.numeric;
  const options = optionsByQuestion.get(answer.questionId) ?? [];
  if (answer.optionId) {
    const o = options.find((x) => x.id === answer.optionId);
    return o?.score ?? 0;
  }
  if (answer.selectedOptionIds) {
    return answer.selectedOptionIds.reduce((sum, id) => {
      const o = options.find((x) => x.id === id);
      return sum + (o?.score ?? 0);
    }, 0);
  }
  return 0;
}

function tagsOf(
  answer: RecordedAnswer,
  optionsByQuestion: Map<string, OptionRow[]>
): string[] {
  const options = optionsByQuestion.get(answer.questionId) ?? [];
  if (answer.optionId) {
    const o = options.find((x) => x.id === answer.optionId);
    return o?.tags ?? [];
  }
  if (answer.selectedOptionIds) {
    return answer.selectedOptionIds.flatMap((id) => {
      const o = options.find((x) => x.id === id);
      return o?.tags ?? [];
    });
  }
  return [];
}

function maxScoreOf(quiz: QuizFull): number {
  // Sum across questions of the max contributing score per question.
  // - multiple_choice: max of option.score (single pick)
  // - select_multiple: SUM of option scores (user can pick all)
  // - slider:          option.score (the slider's max value)
  let total = 0;
  for (const q of quiz.questions) {
    if (q.options.length === 0) continue;
    if (q.type === "select_multiple") {
      total += q.options.reduce((s, o) => s + (o.score ?? 0), 0);
    } else if (q.type === "slider") {
      total += q.options[0]?.score ?? 0;
    } else {
      total += q.options.reduce(
        (m, o) => Math.max(m, o.score ?? 0),
        0
      );
    }
  }
  return total;
}

function pickResult(
  results: ResultRow[],
  totalScore: number
): ResultRow | null {
  if (results.length === 0) return null;
  const sorted = [...results].sort((a, b) => a.range_lo - b.range_lo);
  const match = sorted.find(
    (r) => totalScore >= r.range_lo && totalScore <= r.range_hi
  );
  if (match) return match;
  // Fallback: closest by clamping (shouldn't happen if validators ran, but
  // protects the UI if a quiz pre-dates the validator changes).
  if (totalScore < sorted[0].range_lo) return sorted[0];
  return sorted[sorted.length - 1];
}

export function QuizRunner({ quiz }: { quiz: QuizFull }) {
  const [phase, setPhase] = useState<Phase>("start");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<RecordedAnswer[]>([]);
  const [pending, startTransition] = useTransition();

  const optionsByQuestion = useMemo(() => {
    const m = new Map<string, OptionRow[]>();
    for (const q of quiz.questions) m.set(q.id, q.options);
    return m;
  }, [quiz]);

  const total = quiz.questions.length;
  const currentQ = quiz.questions[idx];
  const maxScore = useMemo(() => maxScoreOf(quiz), [quiz]);

  const handleStart = useCallback(() => {
    startTransition(async () => {
      try {
        const { sessionId: id } = await startSessionAction(
          quiz.id,
          getClientMeta()
        );
        setSessionId(id);
        setPhase("question");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Couldn't start session";
        alert(msg);
      }
    });
  }, [quiz.id]);

  const handleAnswer = useCallback(
    (payload: AnswerPayload) => {
      if (!sessionId || !currentQ) return;
      startTransition(async () => {
        try {
          await answerQuestionAction(sessionId, currentQ.id, payload);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Couldn't save answer";
          alert(msg);
          return;
        }
        const recorded: RecordedAnswer = { ...payload, questionId: currentQ.id };
        const nextAnswers = [...answers, recorded];
        setAnswers(nextAnswers);
        if (idx + 1 >= total) {
          setPhase("result");
        } else {
          setIdx(idx + 1);
        }
      });
    },
    [answers, currentQ, idx, sessionId, total]
  );

  const handleBack = useCallback(() => {
    if (phase === "question" && idx > 0) {
      // Note: we don't undo the previous DB answer (kept for analytics).
      setIdx(idx - 1);
      setAnswers(answers.slice(0, -1));
    }
  }, [answers, idx, phase]);

  if (phase === "start") {
    return (
      <div className="mt-8">
        <ProgressBar current={0} total={total} />
        <StartScreen quiz={quiz} onStart={handleStart} pending={pending} />
      </div>
    );
  }

  if (phase === "question" && currentQ) {
    return (
      <div className="mt-8">
        <ProgressBar
          current={idx}
          total={total}
          onBack={idx > 0 ? handleBack : undefined}
        />
        {currentQ.type === "multiple_choice" ? (
          <QuestionMultipleChoice
            question={currentQ}
            options={currentQ.options}
            onAnswer={handleAnswer}
            pending={pending}
          />
        ) : currentQ.type === "select_multiple" ? (
          <QuestionSelectMultiple
            question={currentQ}
            options={currentQ.options}
            onAnswer={handleAnswer}
            pending={pending}
          />
        ) : (
          <QuestionSlider
            question={currentQ}
            options={currentQ.options}
            onAnswer={handleAnswer}
            pending={pending}
          />
        )}
      </div>
    );
  }

  // phase === "result"
  if (!sessionId) return null;

  const totalScore = answers.reduce(
    (sum, a) => sum + scoreOf(a, optionsByQuestion),
    0
  );

  return (
    <div className="mt-8">
      <ProgressBar current={total} total={total} />
      {quiz.type === "score" ? (
        <ResultScore
          sessionId={sessionId}
          totalScore={totalScore}
          maxScore={maxScore}
          matched={pickResult(quiz.results, totalScore)}
        />
      ) : quiz.type === "card" ? (
        <ResultCard
          sessionId={sessionId}
          matched={pickResult(quiz.results, totalScore)}
          quizTitle={quiz.title}
        />
      ) : (
        <ResultTags
          sessionId={sessionId}
          tagCounts={(() => {
            const counts: Record<string, number> = {};
            for (const a of answers) {
              for (const t of tagsOf(a, optionsByQuestion)) {
                counts[t] = (counts[t] ?? 0) + 1;
              }
            }
            return counts;
          })()}
        />
      )}
    </div>
  );
}
