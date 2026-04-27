"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { quizSchemaFor } from "@/lib/ai/schemas";
import { QuizValidationError, validateAIQuiz } from "@/lib/ai/validators";
import {
  loadQuizFull,
  persistAIQuiz,
  quizFullToAIShape,
} from "@/lib/quiz-persistence";
import type { AIQuiz } from "@/lib/ai/schemas";

interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function saveManualEditAction(
  quizId: string,
  jsonText: string
): Promise<ActionResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    return { ok: false, error: "Invalid JSON: " + (e instanceof Error ? e.message : String(e)) };
  }

  const current = await loadQuizFull(quizId);
  if (!current) return { ok: false, error: "Quiz not found." };

  const schema = quizSchemaFor(current.type);
  const result = schema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      error:
        "Schema mismatch — " +
        result.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
    };
  }

  const next = result.data as AIQuiz;
  if (next.id !== current.id) {
    return { ok: false, error: "Quiz id mismatch — don't change the top-level id." };
  }
  if (next.type !== current.type) {
    return {
      ok: false,
      error: `Quiz type can't change (was ${current.type}, got ${next.type}).`,
    };
  }

  try {
    validateAIQuiz(next);
  } catch (e) {
    if (e instanceof QuizValidationError) {
      return { ok: false, error: e.message };
    }
    if (e instanceof z.ZodError) {
      return { ok: false, error: e.issues.map((i) => i.message).join("; ") };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Validation failed" };
  }

  try {
    await persistAIQuiz(next);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed" };
  }

  revalidatePath(`/quiz/${quizId}`);
  revalidatePath(`/quiz/${quizId}/edit`);
  revalidatePath(`/quiz/${quizId}/stats`);
  revalidatePath(`/`);
  return { ok: true };
}

/**
 * Reload the quiz after an AI edit and return the fresh JSON to the editor.
 * Used by AiEditPanel after a successful /api/ai/edit POST.
 */
export async function loadQuizJsonAction(quizId: string): Promise<{
  ok: boolean;
  json?: string;
  error?: string;
}> {
  const q = await loadQuizFull(quizId);
  if (!q) return { ok: false, error: "Quiz not found." };
  return { ok: true, json: JSON.stringify(quizFullToAIShape(q), null, 2) };
}
