import { PanelShell } from "./PanelShell";
import type { SessionTraceItem } from "@/lib/analytics-queries";

const TYPE_LABEL: Record<string, string> = {
  multiple_choice: "Multiple choice",
  select_multiple: "Select multiple",
  slider: "Slider",
};

export function SessionDeepDive({
  sessionId,
  trace,
}: {
  sessionId: string;
  trace: SessionTraceItem[];
}) {
  return (
    <PanelShell
      title={`Session ${sessionId.slice(0, 8)}…`}
      hint="Charts above are filtered to this session"
    >
      {trace.length === 0 ? (
        <p className="text-sm text-olive-deep/60">No answers recorded.</p>
      ) : (
        <ol className="space-y-3">
          {trace.map((t) => (
            <li
              key={t.questionId + t.answeredAt}
              className="rounded-xl border border-olive-mint-100 bg-white p-3"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="line-clamp-2 text-sm font-bold text-olive-deep">
                  Q{t.position + 1}: {t.questionText}
                </p>
                <span className="shrink-0 rounded-full bg-olive-mint-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-olive-deep">
                  {TYPE_LABEL[t.questionType] ?? t.questionType}
                </span>
              </div>
              <div className="mt-1.5 text-sm text-olive-deep/85">
                {t.numericAnswer != null ? (
                  <>Answered: <span className="font-bold">{t.numericAnswer}</span></>
                ) : t.optionTexts.length === 0 ? (
                  <span className="text-olive-deep/55">(no option recorded)</span>
                ) : (
                  <>
                    Picked:{" "}
                    {t.optionTexts.map((o, i) => (
                      <span key={i}>
                        <span className="rounded-md bg-olive-mint-50 px-1.5 py-0.5 text-xs font-semibold">
                          {o}
                        </span>
                        {i < t.optionTexts.length - 1 ? " " : ""}
                      </span>
                    ))}
                  </>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-olive-deep/55">
                <span>+{t.contributedScore} score</span>
                {t.contributedTags.length > 0 ? (
                  <span>tags: {t.contributedTags.join(", ")}</span>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </PanelShell>
  );
}
