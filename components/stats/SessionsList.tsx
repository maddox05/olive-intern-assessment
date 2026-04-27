import Link from "next/link";
import { PanelShell } from "./PanelShell";
import type { SessionListItem } from "@/lib/analytics-queries";

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtDur(s: number | null) {
  if (s == null) return "—";
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s - m * 60)}s`;
}

export function SessionsList({
  quizId,
  rows,
  selectedSessionId,
}: {
  quizId: string;
  rows: SessionListItem[];
  selectedSessionId?: string;
}) {
  return (
    <PanelShell
      title="Recent sessions"
      hint={`${rows.length} shown${rows.length === 50 ? " (newest 50)" : ""}`}
    >
      {rows.length === 0 ? (
        <p className="text-sm text-olive-deep/60">No sessions yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-olive-mint-100">
          <table className="w-full text-sm">
            <thead className="bg-olive-mint-50 text-left text-[10px] font-bold uppercase tracking-wider text-olive-deep/60">
              <tr>
                <th className="px-3 py-2">Started</th>
                <th className="px-3 py-2">Duration</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Result</th>
                <th className="px-3 py-2">Device</th>
                <th className="px-3 py-2 text-right">View</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isSelected = selectedSessionId === r.id;
                return (
                  <tr
                    key={r.id}
                    className={
                      "border-t border-olive-mint-100 transition " +
                      (isSelected ? "bg-olive-mint-100" : "hover:bg-olive-mint-50")
                    }
                  >
                    <td className="px-3 py-2 text-olive-deep">{fmtTime(r.startTime)}</td>
                    <td className="px-3 py-2 text-olive-deep/80">{fmtDur(r.durationSec)}</td>
                    <td className="px-3 py-2 font-bold text-olive-deep">{r.totalScore}</td>
                    <td className="px-3 py-2 text-olive-deep/80">
                      <span className="line-clamp-1">{r.resultTitle ?? "—"}</span>
                    </td>
                    <td className="px-3 py-2 text-xs text-olive-deep/65">
                      {[r.device, r.browser].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={
                          isSelected
                            ? `/quiz/${quizId}/stats`
                            : `/quiz/${quizId}/stats?session=${r.id}`
                        }
                        className="text-xs font-bold text-olive-deep hover:underline"
                      >
                        {isSelected ? "Clear" : "Open"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PanelShell>
  );
}
