import type { FunnelStep } from "@/lib/analytics-queries";

export function FunnelSvg({
  steps,
  startedCount,
}: {
  steps: FunnelStep[];
  startedCount: number;
}) {
  if (steps.length === 0) {
    return (
      <p className="text-sm text-olive-deep/60">
        No questions yet — funnel will appear after the first answer.
      </p>
    );
  }
  const maxN = Math.max(startedCount, ...steps.map((s) => s.reached));
  if (maxN === 0) {
    return (
      <p className="text-sm text-olive-deep/60">
        No takes yet — share the quiz URL to start collecting data.
      </p>
    );
  }

  // Layout: top "Started" bar + one bar per question. Drop-off label between rungs.
  const rungs: { label: string; n: number; pctOfStart: number }[] = [
    {
      label: "Started",
      n: startedCount,
      pctOfStart: startedCount > 0 ? 1 : 0,
    },
    ...steps.map((s) => ({
      label: `Q${s.position + 1}: ${s.text}`,
      n: s.reached,
      pctOfStart: startedCount > 0 ? s.reached / startedCount : 0,
    })),
  ];

  return (
    <div className="space-y-1.5">
      {rungs.map((r, i) => {
        const widthPct = Math.max(0, Math.min(1, r.pctOfStart)) * 100;
        const dropFromPrev =
          i === 0 ? null : rungs[i - 1].n - r.n;
        return (
          <div key={i}>
            {i > 0 && dropFromPrev != null && dropFromPrev > 0 ? (
              <div className="ml-4 -mt-1 text-[10px] font-semibold text-olive-gold">
                ↓ {dropFromPrev} dropped (
                {Math.round((dropFromPrev / Math.max(1, rungs[i - 1].n)) * 100)}
                %)
              </div>
            ) : null}
            <div className="flex items-center gap-3">
              <div className="relative h-9 flex-1 overflow-hidden rounded-xl bg-white/60">
                <div
                  className="absolute inset-y-0 left-0 rounded-xl bg-gradient-to-r from-olive-deep to-olive-deep-soft transition-[width] duration-300"
                  style={{ width: `${widthPct}%` }}
                />
                <span className="relative z-10 line-clamp-1 flex h-full items-center px-3 text-xs font-semibold text-white mix-blend-normal">
                  {r.label}
                </span>
              </div>
              <div className="w-20 shrink-0 text-right">
                <div className="text-sm font-bold text-olive-deep">{r.n}</div>
                <div className="text-[10px] text-olive-deep/55">
                  {Math.round(widthPct)}%
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
