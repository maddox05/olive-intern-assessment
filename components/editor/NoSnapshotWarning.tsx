export function NoSnapshotWarning() {
  return (
    <div
      role="note"
      className="flex gap-3 rounded-2xl border border-olive-gold/40 bg-olive-cream p-4 text-sm text-[#6b5316]"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 shrink-0 text-olive-gold"
        aria-hidden
      >
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <div>
        <p className="font-bold text-[#5a4612]">Edits go live immediately</p>
        <p className="mt-1 leading-snug">
          We don&apos;t snapshot quizzes. If you remove a question or option,
          past sessions that referenced it lose those rows (cascade delete) and
          their stats become incomplete. For breaking changes, consider
          creating a new quiz instead.
        </p>
      </div>
    </div>
  );
}
