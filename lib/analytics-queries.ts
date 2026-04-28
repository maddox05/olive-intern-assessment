import "server-only";
import { getServerClient } from "@/lib/supabase/server";

export interface FunnelStep {
  questionId: string;
  position: number;
  text: string;
  reached: number;
}

export interface TimePerQuestion {
  questionId: string;
  position: number;
  text: string;
  avgSeconds: number | null;
  sampleSize: number;
}

export interface MetaBreakdown {
  device: { label: string; count: number }[];
  browser: { label: string; count: number }[];
  referrer: { label: string; count: number }[];
}

export interface ScoreDistribution {
  buckets: { range: string; count: number; resultId: string | null; resultTitle: string | null }[];
  histogram: { score: number; count: number }[];
  averageScore: number | null;
  totalCompleted: number;
  ctaClicks: number;
}

export interface TagAnalytics {
  tagCounts: { tag: string; count: number }[];
  dropoffByTag: { tag: string; abandoned: number; total: number; rate: number }[];
}

export interface SessionListItem {
  id: string;
  startTime: string;
  endTime: string | null;
  durationSec: number | null;
  totalScore: number;
  resultTitle: string | null;
  device: string | null;
  browser: string | null;
}

export interface AnswerDistributionQuestion {
  questionId: string;
  position: number;
  text: string;
  type: string;
  totalAnswers: number;
  // For multiple_choice + select_multiple: per-option pick counts.
  // For slider: empty (sliders are tracked via numeric_answer, not options).
  options: { id: string; text: string; count: number; pct: number }[];
  neverPicked: { id: string; text: string }[];
  // For slider: the avg numeric value picked (so the panel still has data).
  sliderAvg: number | null;
  sliderSamples: number;
  sliderMax: number | null;
}

export interface SessionTraceItem {
  questionId: string;
  questionText: string;
  questionType: string;
  position: number;
  optionTexts: string[];
  numericAnswer: number | null;
  contributedScore: number;
  contributedTags: string[];
  answeredAt: string;
}

interface SessionRow {
  id: string;
  start_time: string;
  end_time: string | null;
}

interface QuestionRow {
  id: string;
  position: number;
  text: string;
  type: string;
}

async function listSessionIds(quizId: string, sessionFilter?: string) {
  const supabase = getServerClient();
  if (sessionFilter) {
    const { data } = await supabase
      .from("session")
      .select("id, start_time, end_time")
      .eq("quiz_id", quizId)
      .eq("id", sessionFilter);
    return (data ?? []) as SessionRow[];
  }
  const { data } = await supabase
    .from("session")
    .select("id, start_time, end_time")
    .eq("quiz_id", quizId);
  return (data ?? []) as SessionRow[];
}

async function listQuestions(quizId: string): Promise<QuestionRow[]> {
  const supabase = getServerClient();
  const { data } = await supabase
    .from("question")
    .select("id, position, text, type")
    .eq("quiz_id", quizId)
    .order("position", { ascending: true });
  return (data ?? []) as QuestionRow[];
}

export async function getFunnelDropoff(
  quizId: string,
  sessionFilter?: string
): Promise<FunnelStep[]> {
  const supabase = getServerClient();
  const [questions, sessions] = await Promise.all([
    listQuestions(quizId),
    listSessionIds(quizId, sessionFilter),
  ]);
  const sessionIds = sessions.map((s) => s.id);
  if (questions.length === 0 || sessionIds.length === 0) {
    return questions.map((q) => ({
      questionId: q.id,
      position: q.position,
      text: q.text,
      reached: 0,
    }));
  }
  // For each question, count distinct sessions that have at least one answer row.
  const out: FunnelStep[] = [];
  for (const q of questions) {
    const { data } = await supabase
      .from("questions_answered")
      .select("session_id")
      .in("session_id", sessionIds)
      .eq("question_id", q.id);
    const reached = new Set((data ?? []).map((r) => r.session_id)).size;
    out.push({ questionId: q.id, position: q.position, text: q.text, reached });
  }
  return out;
}

export async function getTimePerQuestion(
  quizId: string,
  sessionFilter?: string
): Promise<TimePerQuestion[]> {
  const supabase = getServerClient();
  const [questions, sessions] = await Promise.all([
    listQuestions(quizId),
    listSessionIds(quizId, sessionFilter),
  ]);
  if (questions.length === 0 || sessions.length === 0) {
    return questions.map((q) => ({
      questionId: q.id,
      position: q.position,
      text: q.text,
      avgSeconds: null,
      sampleSize: 0,
    }));
  }
  const sessionMap = new Map<string, SessionRow>();
  for (const s of sessions) sessionMap.set(s.id, s);
  const sessionIds = sessions.map((s) => s.id);

  const { data: answersRaw } = await supabase
    .from("questions_answered")
    .select("session_id, question_id, answered_at")
    .in("session_id", sessionIds)
    .order("answered_at", { ascending: true });
  const answers = answersRaw ?? [];

  // Group answers by session, ordered by answered_at
  const bySession = new Map<
    string,
    { questionId: string; answeredAt: string }[]
  >();
  for (const a of answers) {
    const arr = bySession.get(a.session_id) ?? [];
    arr.push({ questionId: a.question_id, answeredAt: a.answered_at });
    bySession.set(a.session_id, arr);
  }

  // For each question, collect the per-session time spent on it.
  // Locked decision #17:
  //   - Q1 time: q1.answered - session.start
  //   - Middle: q[i].answered - q[i-1].answered
  //   - Final question of the QUIZ when this session completed: end - q.answered
  //   - Final question of the QUIZ when this session abandoned: excluded
  // A session's last *answered* question is only treated as the "final" question
  // when arr.length === questions.length AND end_time is set. For abandoned
  // sessions, every answered question still gets the normal cur-prev measurement.
  const buckets = new Map<string, number[]>();
  const totalQuestions = questions.length;
  for (const [sid, arr] of bySession) {
    const sess = sessionMap.get(sid);
    if (!sess) continue;
    const startMs = new Date(sess.start_time).getTime();
    const endMs = sess.end_time ? new Date(sess.end_time).getTime() : null;
    const completed = arr.length === totalQuestions && endMs != null;
    for (let i = 0; i < arr.length; i++) {
      const cur = arr[i];
      const curMs = new Date(cur.answeredAt).getTime();
      let secs: number;
      if (i === 0) {
        secs = (curMs - startMs) / 1000;
      } else if (completed && i === arr.length - 1) {
        // end_time is non-null when completed === true
        secs = ((endMs as number) - curMs) / 1000;
      } else {
        const prevMs = new Date(arr[i - 1].answeredAt).getTime();
        secs = (curMs - prevMs) / 1000;
      }
      if (!Number.isFinite(secs) || secs < 0) continue;
      const list = buckets.get(cur.questionId) ?? [];
      list.push(secs);
      buckets.set(cur.questionId, list);
    }
  }

  return questions.map((q) => {
    const list = buckets.get(q.id) ?? [];
    const avg = list.length === 0 ? null : list.reduce((s, n) => s + n, 0) / list.length;
    return {
      questionId: q.id,
      position: q.position,
      text: q.text,
      avgSeconds: avg,
      sampleSize: list.length,
    };
  });
}

function topN(
  pairs: { label: string; count: number }[],
  n: number
): { label: string; count: number }[] {
  return [...pairs].sort((a, b) => b.count - a.count).slice(0, n);
}

/**
 * Per-option pick distribution per question — answers spec line 69:
 * "Track answer distribution for every question so admin can see which
 * options users pick most and whether some answers are never selected."
 *
 * For multiple_choice + select_multiple: counts how many sessions chose
 * each option. For slider: returns the avg numeric answer + sample size
 * (sliders have only one option, scoring isn't a "pick").
 */
export async function getAnswerDistribution(
  quizId: string,
  sessionFilter?: string
): Promise<AnswerDistributionQuestion[]> {
  const supabase = getServerClient();
  const [questions, sessions] = await Promise.all([
    listQuestions(quizId),
    listSessionIds(quizId, sessionFilter),
  ]);
  const sessionIds = new Set(sessions.map((s) => s.id));
  if (questions.length === 0) return [];

  // Pull every option for these questions in one query
  const questionIds = questions.map((q) => q.id);
  const [{ data: optionRows }, { data: answerRows }] = await Promise.all([
    supabase
      .from("option")
      .select("id, question_id, text, score, position")
      .in("question_id", questionIds)
      .order("position", { ascending: true }),
    sessionIds.size === 0
      ? Promise.resolve({ data: [] as Array<{ session_id: string; question_id: string; option_chosen_id: string | null; selected_option_ids: string[] | null; numeric_answer: number | null }> })
      : supabase
          .from("questions_answered")
          .select(
            "session_id, question_id, option_chosen_id, selected_option_ids, numeric_answer"
          )
          .in("question_id", questionIds),
  ]);

  const opts = optionRows ?? [];
  const answers = (answerRows ?? []).filter((a) => sessionIds.has(a.session_id));

  // Group options by question
  const optsByQ = new Map<string, typeof opts>();
  for (const o of opts) {
    const arr = optsByQ.get(o.question_id) ?? [];
    arr.push(o);
    optsByQ.set(o.question_id, arr);
  }

  // Tally per option-id
  const pickCount = new Map<string, number>();
  // Slider averages — keyed by question id
  const sliderSum = new Map<string, number>();
  const sliderN = new Map<string, number>();

  for (const a of answers) {
    if (a.option_chosen_id) {
      pickCount.set(a.option_chosen_id, (pickCount.get(a.option_chosen_id) ?? 0) + 1);
    } else if (a.selected_option_ids) {
      for (const id of a.selected_option_ids) {
        pickCount.set(id, (pickCount.get(id) ?? 0) + 1);
      }
    } else if (a.numeric_answer != null) {
      sliderSum.set(a.question_id, (sliderSum.get(a.question_id) ?? 0) + a.numeric_answer);
      sliderN.set(a.question_id, (sliderN.get(a.question_id) ?? 0) + 1);
    }
  }

  return questions.map((q) => {
    const qOpts = optsByQ.get(q.id) ?? [];
    const totalAnswers = answers.filter((a) => a.question_id === q.id).length;
    if (q.type === "slider") {
      const sum = sliderSum.get(q.id) ?? 0;
      const n = sliderN.get(q.id) ?? 0;
      return {
        questionId: q.id,
        position: q.position,
        text: q.text,
        type: q.type,
        totalAnswers,
        options: [],
        neverPicked: [],
        sliderAvg: n === 0 ? null : sum / n,
        sliderSamples: n,
        sliderMax: qOpts[0]?.score ?? null,
      };
    }
    // For pick-based questions, denominator is total picks for this question
    // (sums to >totalAnswers for select_multiple, == totalAnswers for MC).
    const totalPicks = qOpts.reduce(
      (s, o) => s + (pickCount.get(o.id) ?? 0),
      0
    );
    return {
      questionId: q.id,
      position: q.position,
      text: q.text,
      type: q.type,
      totalAnswers,
      options: qOpts.map((o) => {
        const count = pickCount.get(o.id) ?? 0;
        return {
          id: o.id,
          text: o.text,
          count,
          pct: totalPicks === 0 ? 0 : (count / totalPicks) * 100,
        };
      }),
      neverPicked: qOpts
        .filter((o) => (pickCount.get(o.id) ?? 0) === 0 && totalAnswers > 0)
        .map((o) => ({ id: o.id, text: o.text })),
      sliderAvg: null,
      sliderSamples: 0,
      sliderMax: null,
    };
  });
}

export async function getMetaBreakdown(
  quizId: string,
  sessionFilter?: string
): Promise<MetaBreakdown> {
  const supabase = getServerClient();
  let q = supabase
    .from("session")
    .select("device, browser, referrer")
    .eq("quiz_id", quizId);
  if (sessionFilter) q = q.eq("id", sessionFilter);
  const { data } = await q;
  const rows = data ?? [];

  const tally = (key: "device" | "browser" | "referrer") => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const v = (r as Record<string, string | null>)[key] ?? "Unknown";
      m.set(v, (m.get(v) ?? 0) + 1);
    }
    return Array.from(m.entries()).map(([label, count]) => ({ label, count }));
  };

  return {
    device: topN(tally("device"), 6),
    browser: topN(tally("browser"), 6),
    referrer: topN(tally("referrer"), 6),
  };
}

export async function getScoreDistribution(
  quizId: string,
  sessionFilter?: string
): Promise<ScoreDistribution> {
  const supabase = getServerClient();
  let q = supabase
    .from("session_outcome")
    .select("session_id, total_score, end_time")
    .eq("quiz_id", quizId)
    .not("end_time", "is", null);
  if (sessionFilter) q = q.eq("session_id", sessionFilter);
  const { data: outcomes } = await q;
  // session_outcome is a view — Supabase types every column as nullable.
  // Coerce total_score to a non-null number once at the boundary.
  const rows = (outcomes ?? []).map((o) => ({
    session_id: o.session_id,
    total_score: o.total_score ?? 0,
  }));

  const { data: results } = await supabase
    .from("result")
    .select("id, title_text, range_lo, range_hi")
    .eq("quiz_id", quizId)
    .order("range_lo", { ascending: true });

  const buckets = (results ?? []).map((r) => {
    const inBucket = rows.filter(
      (o) => o.total_score >= r.range_lo && o.total_score <= r.range_hi
    );
    return {
      range: `${r.range_lo}–${r.range_hi}`,
      count: inBucket.length,
      resultId: r.id,
      resultTitle: r.title_text,
    };
  });

  // Score histogram (cap to 0..max range for the chart)
  const maxScore = (results ?? []).reduce((m, r) => Math.max(m, r.range_hi), 0);
  const histogram: { score: number; count: number }[] = [];
  for (let s = 0; s <= maxScore; s++) {
    histogram.push({
      score: s,
      count: rows.filter((r) => r.total_score === s).length,
    });
  }

  const averageScore =
    rows.length === 0 ? null : rows.reduce((sum, r) => sum + r.total_score, 0) / rows.length;

  // CTA click count for the same set of sessions
  let cta = supabase
    .from("result_screen_clicked")
    .select("session_id, session:session!inner(quiz_id)", { count: "exact", head: true })
    .eq("session.quiz_id", quizId);
  if (sessionFilter) cta = cta.eq("session_id", sessionFilter);
  const { count: ctaClicks } = await cta;

  return {
    buckets,
    histogram,
    averageScore,
    totalCompleted: rows.length,
    ctaClicks: ctaClicks ?? 0,
  };
}

export async function getTagAnalytics(
  quizId: string,
  sessionFilter?: string
): Promise<TagAnalytics> {
  const supabase = getServerClient();
  let q = supabase
    .from("session_outcome")
    .select("session_id, tag_counts, end_time")
    .eq("quiz_id", quizId);
  if (sessionFilter) q = q.eq("session_id", sessionFilter);
  const { data } = await q;
  const rows = data ?? [];

  const tagCounts = new Map<string, number>();
  const tagAbandoned = new Map<string, number>();
  const tagTotal = new Map<string, number>();
  for (const row of rows) {
    const tc = (row.tag_counts ?? {}) as Record<string, number>;
    const abandoned = row.end_time == null;
    for (const [tag, n] of Object.entries(tc)) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + n);
      tagTotal.set(tag, (tagTotal.get(tag) ?? 0) + 1);
      if (abandoned) tagAbandoned.set(tag, (tagAbandoned.get(tag) ?? 0) + 1);
    }
  }
  return {
    tagCounts: Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count),
    dropoffByTag: Array.from(tagTotal.entries())
      .map(([tag, total]) => {
        const abandoned = tagAbandoned.get(tag) ?? 0;
        return { tag, abandoned, total, rate: total === 0 ? 0 : abandoned / total };
      })
      .sort((a, b) => b.rate - a.rate),
  };
}

export async function listRecentSessions(
  quizId: string,
  limit = 50
): Promise<SessionListItem[]> {
  const supabase = getServerClient();
  const { data: sessions } = await supabase
    .from("session")
    .select("id, start_time, end_time, device, browser")
    .eq("quiz_id", quizId)
    .order("start_time", { ascending: false })
    .limit(limit);

  if (!sessions || sessions.length === 0) return [];
  const ids = sessions.map((s) => s.id);

  const [{ data: outcomes }, { data: results }] = await Promise.all([
    supabase
      .from("session_outcome")
      .select("session_id, total_score")
      .in("session_id", ids),
    supabase
      .from("result")
      .select("id, title_text, range_lo, range_hi")
      .eq("quiz_id", quizId)
      .order("range_lo", { ascending: true }),
  ]);
  const outcomeMap = new Map(
    (outcomes ?? []).map((o) => [o.session_id, o.total_score])
  );
  const sortedResults = results ?? [];

  return sessions.map((s) => {
    const score = outcomeMap.get(s.id) ?? 0;
    const matched =
      sortedResults.find((r) => score >= r.range_lo && score <= r.range_hi) ?? null;
    const dur =
      s.end_time == null
        ? null
        : (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 1000;
    return {
      id: s.id,
      startTime: s.start_time,
      endTime: s.end_time,
      durationSec: dur,
      totalScore: score,
      resultTitle: matched?.title_text ?? null,
      device: s.device,
      browser: s.browser,
    };
  });
}

export async function getSessionTrace(
  sessionId: string
): Promise<SessionTraceItem[]> {
  const supabase = getServerClient();
  const { data: answers } = await supabase
    .from("questions_answered")
    .select(
      "question_id, option_chosen_id, numeric_answer, selected_option_ids, answered_at"
    )
    .eq("session_id", sessionId)
    .order("answered_at", { ascending: true });
  if (!answers || answers.length === 0) return [];

  const questionIds = Array.from(new Set(answers.map((a) => a.question_id)));
  const optionIds = Array.from(
    new Set(
      answers.flatMap((a) => [
        a.option_chosen_id,
        ...((a.selected_option_ids ?? []) as string[]),
      ])
    )
  ).filter((x): x is string => typeof x === "string");

  const [{ data: questionsRaw }, { data: optionsRaw }] = await Promise.all([
    supabase
      .from("question")
      .select("id, text, type, position")
      .in("id", questionIds),
    optionIds.length > 0
      ? supabase.from("option").select("id, text, score, tags").in("id", optionIds)
      : Promise.resolve({ data: [] as Array<{ id: string; text: string; score: number | null; tags: string[] }> }),
  ]);
  const questions = questionsRaw ?? [];
  const options = optionsRaw ?? [];
  const qMap = new Map(questions.map((q) => [q.id, q]));
  const oMap = new Map(options.map((o) => [o.id, o]));

  return answers.map((a) => {
    const q = qMap.get(a.question_id);
    const ids = a.option_chosen_id
      ? [a.option_chosen_id]
      : ((a.selected_option_ids ?? []) as string[]);
    const opts = ids.map((id) => oMap.get(id)).filter(Boolean) as Array<{
      id: string;
      text: string;
      score: number | null;
      tags: string[];
    }>;
    const contributedScore =
      a.numeric_answer != null
        ? a.numeric_answer
        : opts.reduce((s, o) => s + (o.score ?? 0), 0);
    const contributedTags = opts.flatMap((o) => o.tags);
    return {
      questionId: a.question_id,
      questionText: q?.text ?? "(deleted question)",
      questionType: q?.type ?? "",
      position: q?.position ?? 0,
      optionTexts: opts.map((o) => o.text),
      numericAnswer: a.numeric_answer,
      contributedScore,
      contributedTags,
      answeredAt: a.answered_at,
    };
  });
}
