import type { AIQuiz } from "./schemas";

/**
 * Thrown by validateAIQuiz when the AI's output passes Zod shape
 * validation but fails a semantic check (option count, range coverage,
 * etc). Route handler maps to 422; client surfaces via alert().
 */
export class QuizValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuizValidationError";
  }
}

export function validateAIQuiz(quiz: AIQuiz): void {
  // Per-question option count rules
  for (const q of quiz.questions) {
    if (q.type === "slider") {
      if (q.options.length !== 1) {
        throw new QuizValidationError(
          `Question "${q.text}" is a slider but has ${q.options.length} options. Sliders must have exactly 1 option (its score is the slider max).`
        );
      }
    } else {
      if (q.options.length < 2) {
        throw new QuizValidationError(
          `Question "${q.text}" has ${q.options.length} option(s). Multiple-choice and select-multiple questions need at least 2 options.`
        );
      }
    }
  }

  // For score and card quizzes: result ranges must cover [0, maxPossibleScore]
  // with no gaps, no overlaps.
  if (quiz.type === "score" || quiz.type === "card") {
    const maxScore = quiz.questions.reduce((sum, q) => {
      const optionMax = Math.max(
        ...q.options.map((o) => ("score" in o ? (o.score ?? 0) : 0))
      );
      return sum + (Number.isFinite(optionMax) ? optionMax : 0);
    }, 0);

    const sorted = [...quiz.results].sort((a, b) => a.range[0] - b.range[0]);

    for (const r of sorted) {
      if (r.range[1] < r.range[0]) {
        throw new QuizValidationError(
          `Result "${r.title_text}" has an invalid range [${r.range[0]}, ${r.range[1]}] — high must be ≥ low.`
        );
      }
    }

    if (sorted[0].range[0] !== 0) {
      throw new QuizValidationError(
        `Result ranges must start at 0. The lowest range starts at ${sorted[0].range[0]}.`
      );
    }
    const last = sorted[sorted.length - 1];
    if (last.range[1] < maxScore) {
      throw new QuizValidationError(
        `Result ranges must cover up to the maximum possible score (${maxScore}). The highest range ends at ${last.range[1]}.`
      );
    }
    for (let i = 0; i < sorted.length - 1; i++) {
      const cur = sorted[i];
      const next = sorted[i + 1];
      if (next.range[0] !== cur.range[1] + 1) {
        throw new QuizValidationError(
          `Result ranges have a gap or overlap between [${cur.range[0]}, ${cur.range[1]}] and [${next.range[0]}, ${next.range[1]}]. Ranges must be contiguous and non-overlapping.`
        );
      }
    }
  }

  // Card quizzes need at least one result row (Zod also enforces .min(1))
  if (quiz.type === "card" && quiz.results.length < 1) {
    throw new QuizValidationError(
      "Card quizzes need at least one result row to anchor the badge title and description."
    );
  }

  // Tag quizzes have no result rows — Zod enforces .max(0); double-check here
  if (quiz.type === "tag" && quiz.results.length !== 0) {
    throw new QuizValidationError(
      `Tag quizzes don't use the results table; got ${quiz.results.length} result row(s). Remove them.`
    );
  }

  // Validate CTA URLs (Zod already does, but redundant try is cheap insurance)
  for (const r of quiz.results) {
    try {
      new URL(r.cta_url);
    } catch {
      throw new QuizValidationError(
        `Result "${r.title_text}" has an invalid CTA URL: ${r.cta_url}`
      );
    }
  }

  // Validate UUIDs are unique within the quiz
  const seen = new Set<string>();
  const allIds = [
    quiz.id,
    ...quiz.questions.map((q) => q.id),
    ...quiz.questions.flatMap((q) => q.options.map((o) => o.id)),
    ...quiz.results.map((r) => r.id),
  ];
  for (const id of allIds) {
    if (seen.has(id)) {
      throw new QuizValidationError(
        `Duplicate UUID in the quiz: ${id}. Every question, option, and result needs a unique id.`
      );
    }
    seen.add(id);
  }
}
