import { PanelShell } from "./PanelShell";
import type { MetaBreakdown as Meta } from "@/lib/analytics-queries";

function MiniList({
  rows,
  emptyMsg,
}: {
  rows: { label: string; count: number }[];
  emptyMsg: string;
}) {
  if (rows.length === 0) return <p className="text-xs text-olive-deep/55">{emptyMsg}</p>;
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0);
  return (
    <ul className="space-y-2">
      {rows.map((r) => {
        const widthPct = max === 0 ? 0 : (r.count / max) * 100;
        return (
          <li key={r.label}>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="line-clamp-1 font-semibold text-olive-deep">
                {r.label || "(unknown)"}
              </span>
              <span className="shrink-0 font-bold text-olive-deep/80">{r.count}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-olive-mint-100">
              <div
                className="h-full rounded-full bg-olive-deep-soft"
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function MetaBreakdown({ data }: { data: Meta }) {
  return (
    <PanelShell title="Where they came from">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div>
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-olive-deep/55">
            Device
          </h3>
          <MiniList rows={data.device} emptyMsg="No data" />
        </div>
        <div>
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-olive-deep/55">
            Browser
          </h3>
          <MiniList rows={data.browser} emptyMsg="No data" />
        </div>
        <div>
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-olive-deep/55">
            Referrer
          </h3>
          <MiniList rows={data.referrer} emptyMsg="No data" />
        </div>
      </div>
    </PanelShell>
  );
}
