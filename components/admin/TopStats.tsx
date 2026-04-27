import Link from "next/link";
import type { TopStats as TopStatsType } from "@/lib/dashboard-queries";

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="olive-tile flex flex-col px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-olive-deep/55">
        {label}
      </p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-olive-deep">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-olive-deep/55">{hint}</p>
      ) : null}
    </div>
  );
}

export function TopStats({ stats }: { stats: TopStatsType }) {
  const completionPct = Math.round(stats.completionRate * 100);
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      <StatTile
        label="Quizzes"
        value={stats.totalQuizzes}
        hint={stats.totalQuizzes === 0 ? "Create your first below" : undefined}
      />
      <StatTile
        label="Sessions"
        value={stats.totalSessions}
        hint="Total takes"
      />
      <StatTile
        label="Completion rate"
        value={
          stats.totalSessions === 0 ? (
            <span className="text-olive-deep/40">—</span>
          ) : (
            `${completionPct}%`
          )
        }
        hint={
          stats.totalSessions === 0 ? "Need takes first" : "Across all quizzes"
        }
      />
      {stats.highestIncompletion ? (
        <Link
          href={`/quiz/${stats.highestIncompletion.quizId}/edit`}
          className="olive-tile flex flex-col px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-olive-gold">
            Needs attention
          </p>
          <p className="mt-2 line-clamp-2 text-base font-bold leading-tight text-olive-deep">
            {stats.highestIncompletion.title}
          </p>
          <p className="mt-1 text-xs text-olive-deep/65">
            {Math.round(stats.highestIncompletion.rate * 100)}% incompletion
          </p>
        </Link>
      ) : (
        <StatTile
          label="Needs attention"
          value={<span className="text-olive-deep/40">—</span>}
          hint="Nothing flagged"
        />
      )}
    </div>
  );
}
