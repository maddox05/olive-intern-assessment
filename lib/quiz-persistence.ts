import "server-only";
import { getServerClient } from "@/lib/supabase/server";
import type {
  AIQuizJson,
  OptionRow,
  QuestionRow,
  QuizFull,
  ResultRow,
} from "@/lib/types";
import type { AIQuiz } from "@/lib/ai/schemas";

/**
 * Fetch a quiz with all its questions/options/results, ordered by position.
 */
export async function loadQuizFull(quizId: string): Promise<QuizFull | null> {
  const supabase = getServerClient();

  const { data: quiz, error: quizErr } = await supabase
    .from("quiz")
    .select("*")
    .eq("id", quizId)
    .maybeSingle();
  if (quizErr) throw new Error(`loadQuizFull: ${quizErr.message}`);
  if (!quiz) return null;

  const [questionsRes, optionsRes, resultsRes] = await Promise.all([
    supabase
      .from("question")
      .select("*")
      .eq("quiz_id", quizId)
      .order("position", { ascending: true }),
    supabase
      .from("option")
      .select("*, question:question!inner(quiz_id)")
      .eq("question.quiz_id", quizId)
      .order("position", { ascending: true }),
    supabase
      .from("result")
      .select("*")
      .eq("quiz_id", quizId)
      .order("range_lo", { ascending: true }),
  ]);

  if (questionsRes.error) throw new Error(questionsRes.error.message);
  if (optionsRes.error) throw new Error(optionsRes.error.message);
  if (resultsRes.error) throw new Error(resultsRes.error.message);

  const questionRows = (questionsRes.data ?? []) as QuestionRow[];
  const optionRowsRaw = (optionsRes.data ?? []) as Array<
    OptionRow & { question?: unknown }
  >;
  const resultRows = (resultsRes.data ?? []) as ResultRow[];

  const optionsByQuestion = new Map<string, OptionRow[]>();
  for (const o of optionRowsRaw) {
    // strip the embedded question pointer used only for the join filter
    const { question: _drop, ...row } = o;
    void _drop;
    const arr = optionsByQuestion.get(row.question_id) ?? [];
    arr.push(row as OptionRow);
    optionsByQuestion.set(row.question_id, arr);
  }

  return {
    ...(quiz as QuizFull),
    questions: questionRows.map((q) => ({
      ...q,
      options: optionsByQuestion.get(q.id) ?? [],
    })),
    results: resultRows,
  };
}

/**
 * Convert a DB-shaped QuizFull into the AI-side JSON shape (uses range tuples
 * instead of range_lo/range_hi). Used by the editor for round-tripping and
 * by the AI edit prompt as input.
 */
export function quizFullToAIShape(q: QuizFull): AIQuizJson {
  return {
    id: q.id,
    type: q.type,
    title: q.title,
    description: q.description,
    questions: q.questions.map((qq) => ({
      id: qq.id,
      text: qq.text,
      type: qq.type,
      position: qq.position,
      options: qq.options.map((o) => ({
        id: o.id,
        text: o.text,
        position: o.position,
        ...(q.type === "tag"
          ? { tags: o.tags }
          : { score: o.score ?? 0 }),
      })),
    })),
    results: q.results.map((r) => ({
      id: r.id,
      title_text: r.title_text,
      description: r.description,
      cta_text: r.cta_text,
      cta_url: r.cta_url,
      range: [r.range_lo, r.range_hi],
    })),
  };
}

/**
 * Atomically upsert a full quiz via the apply_quiz_diff plpgsql function.
 * Returns the quiz id (which is just the input id since the function preserves it).
 */
export async function persistAIQuiz(quiz: AIQuiz): Promise<string> {
  const supabase = getServerClient();
  // The schema's "results" array on tag quizzes is `never[]`; coerce for jsonb.
  const payload = quiz as unknown as AIQuizJson;
  const { data, error } = await supabase.rpc("apply_quiz_diff", {
    p_quiz: payload as unknown as never,
  });
  if (error) throw new Error(`persistAIQuiz: ${error.message}`);
  return data as unknown as string;
}
