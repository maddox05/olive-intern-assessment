import "server-only";
import { getServerClient } from "@/lib/supabase/server";
import type { QuizRow, QuizType } from "@/lib/types";

export interface TopStats {
  totalQuizzes: number;
  totalSessions: number;
  completionRate: number; // 0..1
  highestIncompletion: { quizId: string; title: string; rate: number } | null;
}

export interface QuizListItem extends QuizRow {
  sessionsStarted: number;
  sessionsCompleted: number;
  questionCount: number;
}

export async function getTopStats(): Promise<TopStats> {
  const supabase = getServerClient();

  const [{ count: totalQuizzes }, { count: totalSessions }, { count: completed }] =
    await Promise.all([
      supabase.from("quiz").select("id", { count: "exact", head: true }),
      supabase.from("session").select("id", { count: "exact", head: true }),
      supabase
        .from("session")
        .select("id", { count: "exact", head: true })
        .not("end_time", "is", null),
    ]);

  const totalSess = totalSessions ?? 0;
  const completionRate = totalSess === 0 ? 0 : (completed ?? 0) / totalSess;

  // Highest incompletion-rate quiz — live calc, no minimum-N threshold per
  // locked decision #16. Pull all quizzes + their session counts, compute
  // rate in JS (small N is fine for the demo).
  const { data: quizzes } = await supabase.from("quiz").select("id, title");
  let highest: TopStats["highestIncompletion"] = null;
  if (quizzes && quizzes.length > 0) {
    for (const q of quizzes) {
      const [{ count: started }, { count: ended }] = await Promise.all([
        supabase
          .from("session")
          .select("id", { count: "exact", head: true })
          .eq("quiz_id", q.id),
        supabase
          .from("session")
          .select("id", { count: "exact", head: true })
          .eq("quiz_id", q.id)
          .not("end_time", "is", null),
      ]);
      const s = started ?? 0;
      if (s === 0) continue;
      const rate = 1 - (ended ?? 0) / s;
      if (rate > 0 && (!highest || rate > highest.rate)) {
        highest = { quizId: q.id, title: q.title, rate };
      }
    }
  }

  return {
    totalQuizzes: totalQuizzes ?? 0,
    totalSessions: totalSess,
    completionRate,
    highestIncompletion: highest,
  };
}

export async function listQuizzes(): Promise<QuizListItem[]> {
  const supabase = getServerClient();
  const { data: quizzes, error } = await supabase
    .from("quiz")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  if (!quizzes) return [];

  // Fetch counts in parallel
  const enriched = await Promise.all(
    quizzes.map(async (q) => {
      const [
        { count: sessionsStarted },
        { count: sessionsCompleted },
        { count: questionCount },
      ] = await Promise.all([
        supabase
          .from("session")
          .select("id", { count: "exact", head: true })
          .eq("quiz_id", q.id),
        supabase
          .from("session")
          .select("id", { count: "exact", head: true })
          .eq("quiz_id", q.id)
          .not("end_time", "is", null),
        supabase
          .from("question")
          .select("id", { count: "exact", head: true })
          .eq("quiz_id", q.id),
      ]);
      return {
        ...(q as QuizRow & { type: QuizType }),
        sessionsStarted: sessionsStarted ?? 0,
        sessionsCompleted: sessionsCompleted ?? 0,
        questionCount: questionCount ?? 0,
      };
    })
  );

  return enriched;
}
