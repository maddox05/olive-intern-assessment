import { z } from "zod";
import type { QuizType } from "@/lib/constants";

// We don't constrain id format at the AI schema level. The Zod regex never
// reaches Anthropic's structured-output validator (it strips down to bare
// `{type: "string"}`), so the model generates inconsistent UUID-ish strings.
// Instead we accept any non-empty string and rewrite IDs server-side via
// normalizeIdsForCreate / normalizeIdsForEdit. This guarantees Postgres-valid
// UUIDs without making the AI a UUID-generation specialist.
const uuidShape = z.string().min(1);

const baseQuestionFields = {
  id: uuidShape,
  text: z.string().min(1),
  type: z.enum(["multiple_choice", "select_multiple", "slider"]),
  position: z.number().int().min(0),
};

// Every option carries BOTH a score AND tags, regardless of quiz type.
// This is the dual-dimension model: the quiz type only switches WHICH
// dimension drives the result screen, but stats surface both.
const dualOption = z.object({
  id: uuidShape,
  text: z.string().min(1),
  position: z.number().int().min(0),
  score: z.number().int().min(0),
  tags: z.array(z.string().min(1)).min(1),
});

const result = z.object({
  id: uuidShape,
  title_text: z.string().min(1),
  description: z.string(),
  cta_text: z.string(),
  cta_url: z.url(),
  range: z.tuple([z.number().int().min(0), z.number().int().min(0)]),
});

const baseQuiz = {
  id: uuidShape,
  title: z.string().min(1),
  description: z.string(),
};

export const scoreQuizSchema = z.object({
  ...baseQuiz,
  type: z.literal("score"),
  questions: z
    .array(
      z.object({
        ...baseQuestionFields,
        options: z.array(dualOption).min(1),
      })
    )
    .min(1),
  results: z.array(result).min(1),
});

export const cardQuizSchema = z.object({
  ...baseQuiz,
  type: z.literal("card"),
  questions: z
    .array(
      z.object({
        ...baseQuestionFields,
        options: z.array(dualOption).min(1),
      })
    )
    .min(1),
  results: z.array(result).min(1),
});

export const tagQuizSchema = z.object({
  ...baseQuiz,
  type: z.literal("tag"),
  questions: z
    .array(
      z.object({
        ...baseQuestionFields,
        options: z.array(dualOption).min(1),
      })
    )
    .min(1),
  // Tag quizzes don't use results. Schema accepts a strict empty-object array
  // capped at length 0 so the JSON Schema exposed to Anthropic still has a
  // typed item shape (z.never() emits a type-less schema that the API rejects).
  results: z
    .array(z.object({}).strict())
    .max(0)
    .default([]),
});

export type AIScoreQuiz = z.infer<typeof scoreQuizSchema>;
export type AICardQuiz = z.infer<typeof cardQuizSchema>;
export type AITagQuiz = z.infer<typeof tagQuizSchema>;
export type AIQuiz = AIScoreQuiz | AICardQuiz | AITagQuiz;

export function quizSchemaFor(t: QuizType) {
  switch (t) {
    case "score":
      return scoreQuizSchema;
    case "card":
      return cardQuizSchema;
    case "tag":
      return tagQuizSchema;
  }
}
