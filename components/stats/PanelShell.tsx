export function PanelShell({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="olive-tile p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-extrabold tracking-tight text-olive-deep">
          {title}
        </h2>
        {hint ? (
          <p className="text-xs text-olive-deep/55">{hint}</p>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function StatLine({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-olive-deep/55">
        {label}
      </span>
      <span className="text-base font-bold text-olive-deep">{value}</span>
    </div>
  );
}
