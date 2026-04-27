import { TopStats } from "@/components/admin/TopStats";
import { QuizGrid } from "@/components/admin/QuizGrid";
import { getTopStats, listQuizzes } from "@/lib/dashboard-queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [stats, quizzes] = await Promise.all([getTopStats(), listQuizzes()]);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mt-4 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive-deep/55">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-olive-deep sm:text-4xl">
          Your quizzes
        </h1>
        <p className="mt-2 text-base text-olive-deep/70">
          Generate a new quiz from a single prompt, or jump into stats and
          edits for what&apos;s already running.
        </p>
      </header>

      <section className="mt-7">
        <TopStats stats={stats} />
      </section>

      <section className="mt-8 pb-8">
        <QuizGrid quizzes={quizzes} />
      </section>
    </div>
  );
}
