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
          // Vertical bars per score bin. ALL colors and dimensions are
          // inline-styled with raw CSS variables so the chart can't be
          // accidentally invisible from a missing Tailwind utility.
          return (
            <div
              // pt-5 reserves 20px above the bar area so the count labels,
              // which are positioned just above each bar's top edge, stay
              // inside the panel even when the bar fills 100%.
              className="relative flex h-36 items-end gap-1.5 rounded-lg p-2 pt-5"
              style={{
                background:
                  "linear-gradient(to top, color-mix(in oklab, var(--olive-mint-100) 70%, white) 0%, transparent 100%)",
                borderBottom: "2px solid var(--olive-mint-200)",
              }}
            >
              {bins.map((b, i) => {
                const heightPct = binMax === 0 ? 0 : (b.count / binMax) * 100;
                const label = b.from === b.to ? `${b.from}` : `${b.from}–${b.to}`;
                const populated = b.count > 0;
                return (
                  <div
                    key={i}
                    className="relative flex h-full flex-1 flex-col items-center justify-end"
                    title={`Scores ${label} — ${b.count} session${b.count === 1 ? "" : "s"}`}
                  >
                    {/* Bar wrapper holds both the bar and the floating count
                        label. The label is absolutely positioned just above
                        the wrapper's top edge — which IS the bar's top, so
                        the label always hovers on the bar regardless of
                        height. */}
                    <div
                      className="relative w-full"
                      style={{
                        // Bars are at LEAST 12px so even single-sample bins
                        // are obviously visible. Empty bins render a 6px
                        // mint-200 tick so the chart looks like a chart.
                        height: populated
                          ? `max(12px, ${heightPct}%)`
                          : "6px",
                        minWidth: "8px",
                      }}
                    >
                      {populated ? (
                        <span
                          className="absolute left-1/2 -translate-x-1/2 text-[10px] font-bold leading-none"
                          style={{
                            color: "var(--olive-deep)",
                            // 4px above the bar's top edge — moves with the bar.
                            bottom: "calc(100% + 4px)",
                          }}
                        >
                          {b.count}
                        </span>
                      ) : null}
                      <div
                        className="h-full w-full rounded-t-md transition-all"
                        style={{
                          backgroundColor: populated
                            ? "var(--olive-deep)"
                            : "var(--olive-mint-200)",
                        }}
                      />
                    </div>
                    <span
                      className="mt-1 text-[10px] font-medium"
                      style={{ color: "color-mix(in oklab, var(--olive-deep) 65%, transparent)" }}
                    >
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
