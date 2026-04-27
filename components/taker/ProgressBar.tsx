export function ProgressBar({
  current,
  total,
  onBack,
}: {
  current: number;
  total: number;
  onBack?: () => void;
}) {
  // 0..1 fill. The start-screen passes current=0; result-screen passes current=total.
  const pct = total === 0 ? 0 : Math.min(1, Math.max(0, current / total));
  return (
    <div className="mx-auto mb-6 flex w-full max-w-xl items-center gap-3 px-2">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="-ml-1 rounded-full p-1 text-olive-deep/70 transition hover:bg-white/60 hover:text-olive-deep"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      ) : (
        <span className="-ml-1 inline-block w-[22px]" />
      )}
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/60">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-olive-deep transition-[width] duration-500 ease-out"
          style={{ width: `${Math.round(pct * 100)}%` }}
        />
      </div>
    </div>
  );
}
