import { NextResponse } from "next/server";
import { z } from "zod";
import { createQuizFromPrompt } from "@/lib/ai/create";
import { persistAIQuiz } from "@/lib/quiz-persistence";
import { QuizValidationError } from "@/lib/ai/validators";
import { QUIZ_TYPES } from "@/lib/constants";

const bodySchema = z.object({
  type: z.enum(QUIZ_TYPES),
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
    const quiz = await createQuizFromPrompt(parsed.data.type, parsed.data.prompt);
    const quizId = await persistAIQuiz(quiz);
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
