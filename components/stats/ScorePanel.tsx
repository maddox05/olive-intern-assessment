import { PanelShell, StatLine } from "./PanelShell";
import type { ScoreDistribution } from "@/lib/analytics-queries";

export function ScorePanel({
  data,
  variant = "score",
  ctaClickRatePct,
}: {
  data: ScoreDistribution;
  variant?: "score" | "card";
  ctaClickRatePct?: number | null;
}) {
  const histMax = data.histogram.reduce((m, h) => Math.max(m, h.count), 0);
  const bucketMax = data.buckets.reduce((m, b) => Math.max(m, b.count), 0);

  return (
    <div className="space-y-5">
      <PanelShell
        title={variant === "card" ? "Badge distribution" : "Result distribution"}
        hint={`${data.totalCompleted} completed`}
      >
        {data.buckets.length === 0 ? (
          <p className="text-sm text-olive-deep/60">No result rows configured.</p>
        ) : (
          <ul className="space-y-3">
            {data.buckets.map((b) => {
              const widthPct = bucketMax === 0 ? 0 : (b.count / bucketMax) * 100;
              return (
                <li key={b.resultId}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="line-clamp-1 text-sm font-semibold text-olive-deep">
                      {b.resultTitle ?? `(${b.range})`}
                    </span>
                    <span className="shrink-0 text-sm font-bold text-olive-deep/80">
                      {b.count}
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-olive-mint-100">
                    <div
                      className="h-full rounded-full bg-olive-deep"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-[10px] text-olive-deep/45">
                    Score range {b.range}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </PanelShell>

      <PanelShell
        title="Score histogram"
        hint={
          data.averageScore == null
            ? "—"
            : `avg ${data.averageScore.toFixed(1)}`
        }
      >
        {(() => {
          // Bin per-score counts into ~10 wider buckets so individual bars
          // are visible even on a 0..50 score range. Was: 1 column per score
          // (1/49 of width = ~12px each — populated bars looked invisible
          // when only a few sessions contribute, e.g. single-session view).
          if (data.histogram.length === 0 || histMax === 0) {
            return (
              <p className="text-sm text-olive-deep/60">
                Histogram appears once sessions complete.
              </p>
            );
          }
          const maxScore = data.histogram[data.histogram.length - 1].score;
          const TARGET_BINS = 10;
          // Bin size at least 1; rounds up so we get at most TARGET_BINS bins.
          const binSize = Math.max(1, Math.ceil((maxScore + 1) / TARGET_BINS));
          const bins: { from: number; to: number; count: number }[] = [];
          for (let from = 0; from <= maxScore; from += binSize) {
            const to = Math.min(maxScore, from + binSize - 1);
            const count = data.histogram
              .filter((h) => h.score >= from && h.score <= to)
              .reduce((s, h) => s + h.count, 0);
            bins.push({ from, to, count });
          }
          const binMax = bins.reduce((m, b) => Math.max(m, b.count), 0);
          return (
            <div className="flex h-32 items-end gap-1.5">
              {bins.map((b, i) => {
                const heightPct = binMax === 0 ? 0 : (b.count / binMax) * 100;
                const label = b.from === b.to ? `${b.from}` : `${b.from}–${b.to}`;
                const populated = b.count > 0;
                return (
                  <div
                    key={i}
                    className="relative flex flex-1 flex-col items-center justify-end"
                    title={`Scores ${label} — ${b.count} session${b.count === 1 ? "" : "s"}`}
                  >
                    {populated ? (
                      <span className="absolute -top-1 text-[10px] font-bold text-olive-deep">
                        {b.count}
                      </span>
                    ) : null}
                    <div
                      className={
                        "w-full rounded-t-md transition-all " +
                        (populated ? "bg-olive-deep" : "bg-olive-mint-100")
                      }
                      style={{ height: populated ? `${heightPct}%` : "4px" }}
                    />
                    <span className="mt-1 text-[10px] text-olive-deep/55">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </PanelShell>

      <PanelShell title="Headline numbers">
        <StatLine
          label={variant === "card" ? "Badges awarded" : "Completed sessions"}
          value={data.totalCompleted}
        />
        <StatLine
          label="Average score"
          value={data.averageScore == null ? "—" : data.averageScore.toFixed(1)}
        />
        <StatLine
          label="CTA clicks"
          value={
            ctaClickRatePct == null
              ? data.ctaClicks
              : `${data.ctaClicks} (${ctaClickRatePct}%)`
          }
        />
      </PanelShell>
    </div>
  );
}
