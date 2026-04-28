import { NextResponse } from "next/server";
import { z } from "zod";
import { editQuizFromPrompt } from "@/lib/ai/edit";
import {
  loadQuizFull,
  persistAIQuiz,
  quizFullToAIShape,
} from "@/lib/quiz-persistence";
import { QuizValidationError } from "@/lib/ai/validators";
import type { AIQuiz } from "@/lib/ai/schemas";

// Edit calls send the full current quiz JSON in addition to the prompt
// — typically 20–50s. Same Vercel timeout treatment as the create route.
export const maxDuration = 60;

const bodySchema = z.object({
  quizId: z.uuid(),
  prompt: z.string().min(3).max(4000),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bad request: " + parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  try {
    const current = await loadQuizFull(parsed.data.quizId);
    if (!current) {
      return NextResponse.json(
        { error: "Quiz not found." },
        { status: 404 }
      );
    }
    const currentAi = quizFullToAIShape(current) as unknown as AIQuiz;
    const next = await editQuizFromPrompt(currentAi, parsed.data.prompt);
    const quizId = await persistAIQuiz(next);
    return NextResponse.json({ quizId });
  } catch (err) {
    if (err instanceof QuizValidationError) {
      return NextResponse.json(
        { error: "AI returned an invalid spec — " + err.message },
        { status: 422 }
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error:
            "AI returned an invalid spec — " +
            err.issues.map((i) => i.message).join("; "),
        },
        { status: 422 }
      );
    }
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "AI request failed — " + msg },
      { status: 500 }
    );
  }
}
