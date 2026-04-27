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
        {data.histogram.length === 0 || histMax === 0 ? (
          <p className="text-sm text-olive-deep/60">
            Histogram appears once sessions complete.
          </p>
        ) : (
          <div className="flex h-32 items-end gap-1">
            {data.histogram.map((h) => {
              const heightPct = histMax === 0 ? 0 : (h.count / histMax) * 100;
              return (
                <div
                  key={h.score}
                  className="flex flex-1 flex-col items-center justify-end"
                  title={`Score ${h.score} — ${h.count} session${h.count === 1 ? "" : "s"}`}
                >
                  <div
                    className="w-full rounded-t-md bg-olive-deep transition-all"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="mt-1 text-[9px] text-olive-deep/55">
                    {h.score}
                  </span>
                </div>
              );
            })}
          </div>
        )}
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
