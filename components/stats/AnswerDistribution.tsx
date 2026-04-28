import { PanelShell } from "./PanelShell";
import type { AnswerDistributionQuestion } from "@/lib/analytics-queries";

const TYPE_LABEL: Record<string, string> = {
  multiple_choice: "Multiple choice",
  select_multiple: "Select multiple",
  slider: "Slider",
};

export function AnswerDistribution({
  rows,
}: {
  rows: AnswerDistributionQuestion[];
}) {
  if (rows.length === 0) {
    return (
      <PanelShell title="Answer distribution">
        <p className="text-sm text-olive-deep/60">No questions to break down.</p>
      </PanelShell>
    );
  }

  return (
    <PanelShell
      title="Answer distribution"
      hint="Per-question pick counts — spot the never-selected"
    >
      <ol className="space-y-5">
        {rows.map((q) => (
          <li key={q.questionId}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="line-clamp-2 text-sm font-bold text-olive-deep">
                Q{q.position + 1}: {q.text}
              </p>
              <span className="shrink-0 rounded-full bg-olive-mint-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-olive-deep">
                {TYPE_LABEL[q.type] ?? q.type}
              </span>
            </div>

            {q.type === "slider" ? (
              <div className="mt-2 rounded-xl bg-olive-mint-50 p-3">
                {q.sliderSamples === 0 ? (
                  <p className="text-xs text-olive-deep/60">No answers yet.</p>
                ) : (
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-olive-deep/80">
                      Avg value:{" "}
                      <span className="font-bold text-olive-deep">
                        {q.sliderAvg == null
                          ? "—"
                          : q.sliderAvg.toFixed(1)}
                      </span>
                      {q.sliderMax != null ? (
                        <span className="text-olive-deep/55"> / {q.sliderMax}</span>
                      ) : null}
                    </span>
                    <span className="text-xs text-olive-deep/55">
                      n = {q.sliderSamples}
                    </span>
                  </div>
                )}
              </div>
            ) : q.totalAnswers === 0 ? (
              <p className="mt-2 text-xs text-olive-deep/60">
                No answers yet for this question.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {q.options.map((o) => (
                  <li key={o.id}>
                    <div className="flex items-baseline justify-between gap-3 text-xs">
                      <span className="line-clamp-1 font-semibold text-olive-deep">
                        {o.text}
                      </span>
                      <span className="shrink-0 font-bold text-olive-deep/80">
                        {o.count}{" "}
                        <span className="text-olive-deep/55">
                          ({Math.round(o.pct)}%)
                        </span>
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-olive-mint-100">
                      <div
                        className={
                          "h-full rounded-full " +
                          (o.count === 0
                            ? "bg-olive-mint-200"
                            : "bg-olive-deep")
                        }
                        style={{ width: `${Math.max(2, Math.round(o.pct))}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {q.neverPicked.length > 0 ? (
              <p className="mt-1.5 text-[11px] font-semibold text-olive-gold">
                {q.neverPicked.length} option
                {q.neverPicked.length === 1 ? "" : "s"} never picked
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </PanelShell>
  );
}
