import Link from "next/link";
import { notFound } from "next/navigation";
import { loadQuizFull } from "@/lib/quiz-persistence";
import { getServerClient } from "@/lib/supabase/server";
import {
  getFunnelDropoff,
  getMetaBreakdown,
  getScoreDistribution,
  getSessionTrace,
  getTagAnalytics,
  getTimePerQuestion,
  listRecentSessions,
} from "@/lib/analytics-queries";
import { FunnelSvg } from "@/components/stats/FunnelSvg";
import { TimePerQuestionBars } from "@/components/stats/TimePerQuestionBars";
import { ScorePanel } from "@/components/stats/ScorePanel";
import { CardPanel } from "@/components/stats/CardPanel";
import { TagPanel } from "@/components/stats/TagPanel";
import { MetaBreakdown } from "@/components/stats/MetaBreakdown";
import { SessionsList } from "@/components/stats/SessionsList";
import { SessionDeepDive } from "@/components/stats/SessionDeepDive";
import { PanelShell } from "@/components/stats/PanelShell";

export const dynamic = "force-dynamic";

export default async function StatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const { id } = await params;
  const { session: sessionFilter } = await searchParams;

  const quiz = await loadQuizFull(id);
  if (!quiz) notFound();

  const supabase = getServerClient();
  // Started/Completed counts (both filtered to the session if applicable)
  const startedQuery = sessionFilter
    ? supabase
        .from("session")
        .select("id", { count: "exact", head: true })
        .eq("quiz_id", id)
        .eq("id", sessionFilter)
    : supabase
        .from("session")
        .select("id", { count: "exact", head: true })
        .eq("quiz_id", id);
  const completedQuery = sessionFilter
    ? supabase
        .from("session")
        .select("id", { count: "exact", head: true })
        .eq("quiz_id", id)
        .eq("id", sessionFilter)
        .not("end_time", "is", null)
    : supabase
        .from("session")
        .select("id", { count: "exact", head: true })
        .eq("quiz_id", id)
        .not("end_time", "is", null);

  const [
    funnel,
    timePerQ,
    meta,
    sessions,
    { count: started },
    { count: completed },
  ] = await Promise.all([
    getFunnelDropoff(id, sessionFilter),
    getTimePerQuestion(id, sessionFilter),
    getMetaBreakdown(id, sessionFilter),
    listRecentSessions(id, 50),
    startedQuery,
    completedQuery,
  ]);

  const startedCount = started ?? 0;
  const completedCount = completed ?? 0;
  const completionPct =
    startedCount === 0 ? 0 : Math.round((completedCount / startedCount) * 100);

  // Per-type analytics
  const scoreData =
    quiz.type === "score" || quiz.type === "card"
      ? await getScoreDistribution(id, sessionFilter)
      : null;
  const tagData = quiz.type === "tag" ? await getTagAnalytics(id, sessionFilter) : null;
  // Defense-in-depth: a UNIQUE(session_id, result_id) constraint on
  // result_screen_clicked already prevents double-counting, but clamp at
  // 100% in case any pre-constraint rows ever sneaked in.
  const ctaClickRatePct =
    scoreData == null
      ? null
      : completedCount === 0
        ? null
        : Math.min(
            100,
            Math.round((scoreData.ctaClicks / completedCount) * 100)
          );

  const trace = sessionFilter ? await getSessionTrace(sessionFilter) : null;

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <header className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/"
            className="text-xs font-semibold text-olive-deep/55 transition hover:text-olive-deep"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-olive-deep sm:text-3xl">
            {quiz.title}
          </h1>
          <p className="mt-1 text-sm text-olive-deep/65">
            {sessionFilter
              ? "Filtered to one session — pick Clear in the row to see everyone."
              : `Stats for the ${quiz.type} quiz.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/quiz/${id}/edit`}
            className="rounded-full border border-olive-mint-200 bg-white px-3 py-1.5 text-xs font-semibold text-olive-deep transition hover:bg-olive-mint-50"
          >
            Edit
          </Link>
          <Link
            href={`/quiz/${id}`}
            target="_blank"
            rel="noopener"
            className="rounded-full bg-olive-deep px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-olive-deep-soft"
          >
            Take it ↗
          </Link>
          {sessionFilter ? (
            <Link
              href={`/quiz/${id}/stats`}
              className="rounded-full border border-olive-gold/50 bg-olive-cream px-3 py-1.5 text-xs font-semibold text-[#6b5316]"
            >
              Clear filter
            </Link>
          ) : null}
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PanelShell title="Started">
          <p className="text-3xl font-extrabold text-olive-deep">{startedCount}</p>
        </PanelShell>
        <PanelShell title="Completed">
          <p className="text-3xl font-extrabold text-olive-deep">{completedCount}</p>
        </PanelShell>
        <PanelShell title="Completion">
          <p className="text-3xl font-extrabold text-olive-deep">
            {startedCount === 0 ? "—" : `${completionPct}%`}
          </p>
        </PanelShell>
        <PanelShell title="Questions">
          <p className="text-3xl font-extrabold text-olive-deep">
            {quiz.questions.length}
          </p>
        </PanelShell>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <PanelShell title="Funnel" hint="By question reached">
          <FunnelSvg steps={funnel} startedCount={startedCount} />
        </PanelShell>
        <PanelShell title="Avg time per question" hint="Across all sessions">
          <TimePerQuestionBars rows={timePerQ} />
        </PanelShell>
      </section>

      <section className="mt-6">
        {quiz.type === "score" && scoreData ? (
          <ScorePanel data={scoreData} variant="score" ctaClickRatePct={ctaClickRatePct} />
        ) : quiz.type === "card" && scoreData ? (
          <CardPanel data={scoreData} ctaClickRatePct={ctaClickRatePct} />
        ) : tagData ? (
          <TagPanel data={tagData} />
        ) : null}
      </section>

      <section className="mt-6">
        <MetaBreakdown data={meta} />
      </section>

      {trace ? (
        <section className="mt-6">
          <SessionDeepDive sessionId={sessionFilter as string} trace={trace} />
        </section>
      ) : null}

      <section className="mt-6">
        <SessionsList
          quizId={id}
          rows={sessions}
          selectedSessionId={sessionFilter}
        />
      </section>
    </div>
  );
}
