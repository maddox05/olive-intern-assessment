import type { QuizType } from "@/lib/constants";

const TYPE_NOTE: Record<QuizType, string> = {
  score:
    "Result screen is a score: we sum option scores and show the matched result-bucket title + CTA. (Tags are also tracked and shown in stats.)",
  card:
    "Same scoring as a score quiz, but the result is presented as a shareable badge. The olive icon on the badge is randomly chosen at render — only the title and description come from the matched result row. (Tags are also tracked and shown in stats.)",
  tag:
    "Result screen is a tag tally — the tags the user collected, sorted by count. No result-bucket rows. (Scores are also tracked and shown in stats.)",
};

function Field({
  name,
  required,
  children,
}: {
  name: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="leading-snug">
      <code className="rounded bg-olive-mint-100 px-1.5 py-0.5 font-mono text-[0.75rem] text-olive-deep">
        {name}
      </code>
      {required ? (
        <span className="ml-1.5 align-middle text-[0.6rem] font-bold uppercase tracking-wider text-olive-gold">
          required
        </span>
      ) : null}
      <span className="block pt-0.5 text-olive-deep/75">{children}</span>
    </li>
  );
}

export function SchemaDocs({ type }: { type: QuizType }) {
  return (
    <aside className="olive-tile h-full p-5 text-sm">
      <h2 className="text-base font-extrabold tracking-tight text-olive-deep">
        Quiz schema
      </h2>
      <p className="mt-1 text-xs text-olive-deep/60">
        Edits validate against this shape before saving.
      </p>

      <div className="mt-4 rounded-xl bg-olive-mint-50 p-3 text-xs leading-snug text-olive-deep">
        <p className="font-bold uppercase tracking-wider text-olive-deep/70">
          This quiz: {type}
        </p>
        <p className="mt-1">{TYPE_NOTE[type]}</p>
      </div>

      <details open className="group mt-5">
        <summary className="cursor-pointer list-none text-sm font-bold text-olive-deep transition group-open:mb-2">
          <span className="inline-block w-4 transition group-open:rotate-90">›</span>{" "}
          Top-level
        </summary>
        <ul className="space-y-2.5 pl-5 text-xs">
          <Field name="id" required>UUID. Don&apos;t change it — must stay stable.</Field>
          <Field name="type" required>
            <code>score</code>, <code>card</code>, or <code>tag</code>. Immutable
            for an existing quiz.
          </Field>
          <Field name="title" required>1+ chars.</Field>
          <Field name="description">Optional. Shown on the start screen.</Field>
          <Field name="questions" required>Array of question objects.</Field>
          <Field name="results">
            For <code>score</code>/<code>card</code>: at least 1 row. For{" "}
            <code>tag</code>: must be empty <code>[]</code>.
          </Field>
        </ul>
      </details>

      <details open className="group mt-4">
        <summary className="cursor-pointer list-none text-sm font-bold text-olive-deep transition group-open:mb-2">
          <span className="inline-block w-4 transition group-open:rotate-90">›</span>{" "}
          Question
        </summary>
        <ul className="space-y-2.5 pl-5 text-xs">
          <Field name="id" required>UUID. Preserve to keep historical answers linked.</Field>
          <Field name="text" required>1+ chars.</Field>
          <Field name="type" required>
            <code>multiple_choice</code> (≥2 options, pick one),{" "}
            <code>select_multiple</code> (≥2 options, pick any), or{" "}
            <code>slider</code> (exactly 1 option; the option&apos;s{" "}
            <code>score</code> is the slider max).
          </Field>
          <Field name="position" required>0-based integer. Lower = earlier.</Field>
          <Field name="options" required>Array of option objects.</Field>
        </ul>
      </details>

      <details className="group mt-4">
        <summary className="cursor-pointer list-none text-sm font-bold text-olive-deep transition group-open:mb-2">
          <span className="inline-block w-4 transition group-open:rotate-90">›</span>{" "}
          Option
        </summary>
        <ul className="space-y-2.5 pl-5 text-xs">
          <Field name="id" required>UUID.</Field>
          <Field name="text" required>What the user sees on the answer tile.</Field>
          <Field name="position" required>0-based ordering.</Field>
          <Field name="score" required>
            Non-negative integer. For sliders, this is the max value.
            Used by the score histogram (and, for score/card quizzes, to
            pick the result bucket).
          </Field>
          <Field name="tags" required>
            Array of strings, at least 1. Used by the tag tally (and, for
            tag quizzes, drives the result screen).
          </Field>
        </ul>
        <p className="mt-2 pl-5 text-[11px] text-olive-deep/60">
          Every option carries BOTH dimensions regardless of quiz type — the
          stats page surfaces score and tag analytics for every quiz.
        </p>
      </details>

      {type !== "tag" ? (
        <details className="group mt-4">
          <summary className="cursor-pointer list-none text-sm font-bold text-olive-deep transition group-open:mb-2">
            <span className="inline-block w-4 transition group-open:rotate-90">›</span>{" "}
            Result
          </summary>
          <ul className="space-y-2.5 pl-5 text-xs">
            <Field name="id" required>UUID.</Field>
            <Field name="title_text" required>Headline shown when this bucket matches.</Field>
            <Field name="description">1–2 sentences.</Field>
            <Field name="cta_text">Button label, e.g. &quot;Try Olive&quot;.</Field>
            <Field name="cta_url">Valid URL.</Field>
            <Field name="range" required>
              Tuple <code>[lo, hi]</code>, both integers. Together all
              ranges must cover <code>[0, max possible score]</code> with
              no gaps and no overlaps.
            </Field>
          </ul>
        </details>
      ) : null}
    </aside>
  );
}
