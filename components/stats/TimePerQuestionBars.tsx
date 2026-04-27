import type { TimePerQuestion } from "@/lib/analytics-queries";

function fmtSeconds(s: number | null) {
  if (s == null) return "—";
  if (s < 1) return "<1s";
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const sec = Math.round(s - m * 60);
  return `${m}m ${sec}s`;
}

export function TimePerQuestionBars({ rows }: { rows: TimePerQuestion[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-olive-deep/60">No data yet.</p>
    );
  }
  const max = rows.reduce((m, r) => Math.max(m, r.avgSeconds ?? 0), 0);
  if (max === 0) {
    return (
      <p className="text-sm text-olive-deep/60">
        Not enough completed sessions to estimate timing yet.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const widthPct =
          r.avgSeconds == null ? 0 : Math.min(100, (r.avgSeconds / max) * 100);
        return (
          <li key={r.questionId}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="line-clamp-1 text-sm font-semibold text-olive-deep">
                Q{r.position + 1}: {r.text}
              </span>
              <span className="shrink-0 text-sm font-bold text-olive-deep/80">
                {fmtSeconds(r.avgSeconds)}
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-olive-mint-100">
              <div
                className="h-full rounded-full bg-olive-deep"
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <p className="mt-0.5 text-[10px] text-olive-deep/45">
              avg over {r.sampleSize} answer{r.sampleSize === 1 ? "" : "s"}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
