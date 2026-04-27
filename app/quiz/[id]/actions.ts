"use server";
import { getServerClient } from "@/lib/supabase/server";

export interface ClientMeta {
  device: string | null;
  browser: string | null;
  referrer: string | null;
  user_agent: string | null;
}

export interface AnswerPayload {
  optionId?: string;
  numeric?: number;
  selectedOptionIds?: string[];
}

// Cap user-supplied client metadata so a malicious client can't write
// 100KB strings into the analytics columns.
const META_MAX = 500;
function clip(v: string | null): string | null {
  if (v == null) return null;
  return v.length > META_MAX ? v.slice(0, META_MAX) : v;
}

export async function startSessionAction(
  quizId: string,
  meta: ClientMeta
): Promise<{ sessionId: string }> {
  const supabase = getServerClient();
  // Verify the quiz exists before opening a session for it. Cheap, prevents
  // garbage rows for non-existent quizzes.
  const { data: quizRow, error: quizErr } = await supabase
    .from("quiz")
    .select("id")
    .eq("id", quizId)
    .maybeSingle();
  if (quizErr) throw new Error("startSession: " + quizErr.message);
  if (!quizRow) throw new Error("startSession: quiz not found");

  const { data, error } = await supabase
    .from("session")
    .insert({
      quiz_id: quizId,
      device: clip(meta.device),
      browser: clip(meta.browser),
      referrer: clip(meta.referrer),
      user_agent: clip(meta.user_agent),
    })
    .select("id")
    .single();
  if (error) throw new Error("startSession: " + error.message);
  return { sessionId: data.id };
}

export async function answerQuestionAction(
  sessionId: string,
  questionId: string,
  payload: AnswerPayload
): Promise<void> {
  const supabase = getServerClient();
  // Authorization: confirm the question belongs to the same quiz as the
  // session — without this, anyone with a session id can write answers
  // for any question in any quiz, poisoning analytics.
  const [{ data: sess }, { data: q }] = await Promise.all([
    supabase.from("session").select("quiz_id").eq("id", sessionId).maybeSingle(),
    supabase.from("question").select("quiz_id").eq("id", questionId).maybeSingle(),
  ]);
  if (!sess) throw new Error("answerQuestion: session not found");
  if (!q) throw new Error("answerQuestion: question not found");
  if (sess.quiz_id !== q.quiz_id) {
    throw new Error("answerQuestion: question does not belong to this quiz");
  }

  const row = {
    session_id: sessionId,
    question_id: questionId,
    option_chosen_id: payload.optionId ?? null,
    numeric_answer: payload.numeric ?? null,
    selected_option_ids: payload.selectedOptionIds ?? null,
  };
  const { error } = await supabase.from("questions_answered").insert(row);
  if (error) throw new Error("answerQuestion: " + error.message);
}

export async function endSessionAction(sessionId: string): Promise<void> {
  const supabase = getServerClient();
  const { error } = await supabase
    .from("session")
    .update({ end_time: new Date().toISOString() })
    .eq("id", sessionId)
    .is("end_time", null);
  if (error) throw new Error("endSession: " + error.message);
}

export async function clickResultCtaAction(
  sessionId: string,
  resultId: string
): Promise<void> {
  const supabase = getServerClient();
  // Authorization: confirm the result belongs to the same quiz as the
  // session. Without this, anyone could inflate any quiz's CTA click rate.
  const [{ data: sess }, { data: r }] = await Promise.all([
    supabase.from("session").select("quiz_id").eq("id", sessionId).maybeSingle(),
    supabase.from("result").select("quiz_id").eq("id", resultId).maybeSingle(),
  ]);
  if (!sess) throw new Error("clickResultCta: session not found");
  if (!r) throw new Error("clickResultCta: result not found");
  if (sess.quiz_id !== r.quiz_id) {
    throw new Error("clickResultCta: result does not belong to this quiz");
  }

  const { error } = await supabase
    .from("result_screen_clicked")
    .insert({ session_id: sessionId, result_id: resultId });
  if (error) {
    // UNIQUE(session_id, result_id) makes re-clicks an idempotent no-op
    // rather than an error the user sees. Postgres error code 23505 =
    // unique_violation; supabase-js exposes it as `code`.
    const code = (error as { code?: string }).code;
    if (code === "23505") return;
    throw new Error("clickResultCta: " + error.message);
  }
}
