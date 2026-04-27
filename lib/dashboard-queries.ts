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

/**
 * Pull every (quiz_id, end_time) row in one query and aggregate in JS.
 * Replaces what used to be 2N+1 sub-queries with two flat selects, both
 * bounded by total session count (not quiz count × queries-per-quiz).
 */
async function getQuizSessionCounts(): Promise<
  Map<string, { started: number; completed: number }>
> {
  const supabase = getServerClient();
  const counts = new Map<string, { started: number; completed: number }>();
  // Page through in case there are many sessions; cap at 100k for safety.
  const PAGE = 1000;
  for (let from = 0; from < 100_000; from += PAGE) {
    const { data, error } = await supabase
      .from("session")
      .select("quiz_id, end_time")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    for (const row of data) {
      const cur = counts.get(row.quiz_id) ?? { started: 0, completed: 0 };
      cur.started += 1;
      if (row.end_time != null) cur.completed += 1;
      counts.set(row.quiz_id, cur);
    }
    if (data.length < PAGE) break;
  }
  return counts;
}

async function getQuizQuestionCounts(): Promise<Map<string, number>> {
  const supabase = getServerClient();
  const counts = new Map<string, number>();
  const PAGE = 1000;
  for (let from = 0; from < 100_000; from += PAGE) {
    const { data, error } = await supabase
      .from("question")
      .select("quiz_id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    for (const row of data) {
      counts.set(row.quiz_id, (counts.get(row.quiz_id) ?? 0) + 1);
    }
    if (data.length < PAGE) break;
  }
  return counts;
}

export async function getTopStats(): Promise<TopStats> {
  const supabase = getServerClient();

  const [{ count: totalQuizzes }, sessionCounts, { data: quizzes }] =
    await Promise.all([
      supabase.from("quiz").select("id", { count: "exact", head: true }),
      getQuizSessionCounts(),
      supabase.from("quiz").select("id, title"),
    ]);

  let totalSessions = 0;
  let totalCompleted = 0;
  for (const { started, completed } of sessionCounts.values()) {
    totalSessions += started;
    totalCompleted += completed;
  }
  const completionRate =
    totalSessions === 0 ? 0 : totalCompleted / totalSessions;

  // Highest incompletion-rate quiz — live calc, no minimum-N threshold
  // per locked decision #16.
  let highest: TopStats["highestIncompletion"] = null;
  for (const q of quizzes ?? []) {
    const c = sessionCounts.get(q.id);
    if (!c || c.started === 0) continue;
    const rate = 1 - c.completed / c.started;
    if (rate > 0 && (!highest || rate > highest.rate)) {
      highest = { quizId: q.id, title: q.title, rate };
    }
  }

  return {
    totalQuizzes: totalQuizzes ?? 0,
    totalSessions,
    completionRate,
    highestIncompletion: highest,
  };
}

export async function listQuizzes(): Promise<QuizListItem[]> {
  const supabase = getServerClient();
  const [{ data: quizzes, error }, sessionCounts, questionCounts] =
    await Promise.all([
      supabase.from("quiz").select("*").order("created_at", { ascending: false }),
      getQuizSessionCounts(),
      getQuizQuestionCounts(),
    ]);
  if (error) throw new Error(error.message);
  if (!quizzes) return [];

  return quizzes.map((q) => {
    const c = sessionCounts.get(q.id);
    return {
      ...(q as QuizRow & { type: QuizType }),
      sessionsStarted: c?.started ?? 0,
      sessionsCompleted: c?.completed ?? 0,
      questionCount: questionCounts.get(q.id) ?? 0,
    };
  });
}
