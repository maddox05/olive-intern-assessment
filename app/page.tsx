export default function Home() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center pt-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-olive-deep/60">
        Olive Quiz Studio
      </p>
      <h1 className="mt-4 text-5xl font-extrabold text-olive-deep">
        Type a quiz. Ship a quiz.
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-olive-deep/70">
        Describe the funnel you want — a score quiz, a shareable card quiz, or a
        personality tag quiz — and we'll generate it, host it, and tell you
        exactly where people drop off.
      </p>
      <div className="mt-10 olive-tile w-full max-w-md p-6">
        <p className="text-sm text-olive-deep/70">
          Phase 1 is live. The dashboard, taker, editor, and stats land in the
          next phases.
        </p>
      </div>
    </div>
  );
}
