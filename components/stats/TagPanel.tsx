import { PanelShell } from "./PanelShell";
import type { TagAnalytics } from "@/lib/analytics-queries";

export function TagPanel({ data }: { data: TagAnalytics }) {
  const max = data.tagCounts.reduce((m, t) => Math.max(m, t.count), 0);

  return (
    <div className="space-y-5">
      <PanelShell
        title="Tags collected"
        hint={`${data.tagCounts.length} unique tags`}
      >
        {data.tagCounts.length === 0 ? (
          <p className="text-sm text-olive-deep/60">No tags collected yet.</p>
        ) : (
          <ul className="space-y-3">
            {data.tagCounts.map((t) => {
              const widthPct = max === 0 ? 0 : (t.count / max) * 100;
              return (
                <li key={t.tag}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold capitalize text-olive-deep">
                      {t.tag.replace(/[-_]/g, " ")}
                    </span>
                    <span className="shrink-0 text-sm font-bold text-olive-deep/80">
                      {t.count}
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-olive-mint-100">
                    <div
                      className="h-full rounded-full bg-olive-deep"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PanelShell>

      <PanelShell
        title="Drop-off by tag"
        hint="Which tag-bearing sessions abandon"
      >
        {data.dropoffByTag.length === 0 ? (
          <p className="text-sm text-olive-deep/60">No data yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-olive-deep/55">
                <th className="py-1">Tag</th>
                <th className="py-1 text-right">Abandoned</th>
                <th className="py-1 text-right">Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.dropoffByTag.slice(0, 12).map((row) => (
                <tr key={row.tag} className="border-t border-olive-mint-100">
                  <td className="py-1.5 font-semibold capitalize text-olive-deep">
                    {row.tag.replace(/[-_]/g, " ")}
                  </td>
                  <td className="py-1.5 text-right text-olive-deep/80">
                    {row.abandoned} / {row.total}
                  </td>
                  <td className="py-1.5 text-right font-bold text-olive-deep">
                    {Math.round(row.rate * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PanelShell>
    </div>
  );
}
