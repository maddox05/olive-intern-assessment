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

export async function startSessionAction(
  quizId: string,
  meta: ClientMeta
): Promise<{ sessionId: string }> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("session")
    .insert({
      quiz_id: quizId,
      device: meta.device,
      browser: meta.browser,
      referrer: meta.referrer,
      user_agent: meta.user_agent,
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
  const { error } = await supabase
    .from("result_screen_clicked")
    .insert({ session_id: sessionId, result_id: resultId });
  if (error) throw new Error("clickResultCta: " + error.message);
}
