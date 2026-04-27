import Link from "next/link";
import type { QuizListItem } from "@/lib/dashboard-queries";

const TYPE_PILL: Record<QuizListItem["type"], { label: string; cls: string }> = {
  score: {
    label: "Score",
    cls: "bg-olive-mint-100 text-olive-deep",
  },
  card: {
    label: "Card",
    cls: "bg-[color-mix(in_oklab,var(--olive-gold)_25%,white)] text-[#7a5712]",
  },
  tag: {
    label: "Tag",
    cls: "bg-[color-mix(in_oklab,var(--olive-deep)_18%,white)] text-olive-deep",
  },
};

export function QuizCard({ quiz }: { quiz: QuizListItem }) {
  const pill = TYPE_PILL[quiz.type];
  const completionPct =
    quiz.sessionsStarted === 0
      ? null
      : Math.round((quiz.sessionsCompleted / quiz.sessionsStarted) * 100);

  return (
    <article className="olive-tile group flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${pill.cls}`}
        >
          {pill.label}
        </span>
        <Link
          href={`/quiz/${quiz.id}`}
          target="_blank"
          rel="noopener"
          className="text-xs font-semibold text-olive-deep/55 transition hover:text-olive-deep"
        >
          Take ↗
        </Link>
      </div>
      <h3 className="mt-3 line-clamp-2 text-lg font-bold leading-snug tracking-tight text-olive-deep">
        {quiz.title}
      </h3>
      {quiz.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-olive-deep/65">
          {quiz.description}
        </p>
      ) : null}
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-olive-deep/50">
            Qs
          </dt>
          <dd className="mt-0.5 text-base font-bold text-olive-deep">
            {quiz.questionCount}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-olive-deep/50">
            Started
          </dt>
          <dd className="mt-0.5 text-base font-bold text-olive-deep">
            {quiz.sessionsStarted}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-olive-deep/50">
            Done
          </dt>
          <dd className="mt-0.5 text-base font-bold text-olive-deep">
            {completionPct === null ? "—" : `${completionPct}%`}
          </dd>
        </div>
      </dl>
      <div className="mt-5 flex flex-1 items-end gap-2">
        <Link
          href={`/quiz/${quiz.id}/stats`}
          className="flex-1 rounded-full border border-olive-mint-200 bg-white px-3 py-2 text-center text-sm font-semibold text-olive-deep transition hover:border-olive-deep-soft hover:bg-olive-mint-50"
        >
          Stats
        </Link>
        <Link
          href={`/quiz/${quiz.id}/edit`}
          className="flex-1 rounded-full bg-olive-deep px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-olive-deep-soft"
        >
          Edit
        </Link>
      </div>
    </article>
  );
}
