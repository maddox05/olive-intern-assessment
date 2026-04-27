# DECISIONS.md

A short, honest log of the choices made while building Text-to-Quiz. Read top-down; the "I'd do this differently with more time" list at the bottom is the most useful section for thinking about scale-up.

---

## Quiz spec schema

The AI emits a single JSON object that validates against a Zod schema variant chosen per quiz type. Three variants share a base; they differ at the option and result level.

```ts
{
  id: uuid,                          // stable across edits
  type: "score" | "card" | "tag",    // immutable for an existing quiz
  title: string,
  description: string,
  questions: [{
    id: uuid,
    text: string,
    type: "multiple_choice" | "select_multiple" | "slider",
    position: number,                // explicit ordering, NOT created_at
    options: [{
      id: uuid,
      text: string,
      position: number,
      score?: number,                // present for score/card; absent for tag
      tags?: string[],               // present for tag; absent for score/card
    }]
  }],
  results: [{
    id: uuid,
    title_text: string,
    description: string,
    cta_text: string,
    cta_url: string (URL),
    range: [number, number],         // [lo, hi] inclusive
  }]   // empty for tag quizzes
}
```

**Why these fields, not others:**

- **Three quiz types instead of one polymorphic shape**: the result-screen logic and the AI's prompt vary so meaningfully across "score with bucketed results", "shareable badge", and "tag tally" that a single mega-schema would have given the model too many ways to be wrong. Three small schemas → three smaller prompt surfaces → fewer retries.
- **`position` int instead of "ordered by `created_at`"**: the original spec ordered questions by created_at, but that fights you the second the user reorders during an edit (you'd have to fake timestamps). Explicit position means edits are obvious and `created_at` keeps meaning "when this row was made."
- **`range_lo` / `range_hi` columns instead of `range numeric[2]`**: makes `score BETWEEN range_lo AND range_hi` index-friendly and lets Postgres enforce `range_lo <= range_hi` as a CHECK.
- **No branching**: scope-cut. Branching needs a graph schema and a runtime that can choose-your-own-adventure; given the time budget I went additive-scoring-only.

**Deliberately left out:**

- Question types beyond MC / select-multiple / slider (no free-text, no image, no rating-scale).
- Per-option weighting beyond a flat `score` integer. (Equivalent to "every question contributes equally"; weighted questions can be encoded by giving heavier questions higher option scores.)
- Multiple result dimensions per quiz (e.g. axes like Big Five). One axis only — score or tags.
- Branching, conditional questions, randomized question order at runtime.

## LLM choice

**Provider:** Anthropic. **Model:** `claude-sonnet-4-6` for both create and edit, no escalation on retry.

**Why Sonnet 4.6 specifically:**

- The structured-output surface (`messages.parse` + `zodOutputFormat`) is a native helper in the Anthropic SDK 0.90 — single function call, automatic Zod validation, no manual JSON-extraction or `tool_use`-shaped boilerplate.
- Sonnet 4.6 is the right cost/quality tradeoff for "follow a tightly-defined schema and write friendly copy." Opus 4.7 would be ~5× more per quiz with no schema-compliance gain on this task — generating quiz copy isn't reasoning-bound. I considered Opus-on-retry but that disappears once you decide not to retry at all (see Prompt reliability below).
- The `output_config: { format: zodOutputFormat(schema) }` integration produces typed `parsed_output` directly — no second-pass parsing.

**Cost per quiz** (Sonnet 4.6 list pricing: $3 / MTok input, $15 / MTok output):

- **Create**: ~1,650 in + ~2,200 out → **$0.038/call**
- **Edit**: ~3,800 in + ~2,300 out → **$0.046/call**
- **Round number**: ~4¢ per generation, ~5¢ per edit. A creator iterating 5 times to land a quiz spends ~$0.25.

System prompt is ~1,500 tokens. The biggest cost lever I'd pull next is prompt caching the system prompt (it's identical for every create call) — Anthropic supports `cache_control` and would save ~90% of input cost.

## Question type vocabulary

Three components, all share `(question, options, onAnswer, pending)` props:

- **`multiple_choice`** — tile grid, single click advances. Stored as `option_chosen_id`.
- **`select_multiple`** — tile grid with checkbox affordance, Continue button enables when ≥1 selected. Sums scores / unions tags. Stored as `selected_option_ids uuid[]`.
- **`slider`** — native range input styled olive, value bubble above thumb, 0 → max(option.score). Stored as `numeric_answer int`.

A CHECK constraint on `questions_answered` enforces exactly one of those three columns is non-null per row.

**Skipped:**

- **Free-text input** — no good way to score it without another LLM call at take time, which is expensive and slow.
- **Image-pick** — needs an asset pipeline; out of scope.
- **Yes/no** — degenerate case of multiple_choice.
- **Rating scale** — slider covers it.

## Scoring & results logic

**Score quizzes**: every chosen option's `score` (or every selected option's score for select-multiple, or the slider's numeric value) sums into a total. The total is bucketed against the `results` table's `range_lo .. range_hi` to pick the title/description/CTA shown.

**Card quizzes**: identical math under the hood. The result text comes from the matched bucket; the *visual* is a randomly chosen olive-gold badge SVG (3 hand-drawn variants, picked by hashing the session ID so refreshes are stable). Decision #6/9c/20 in the convo: "card quiz will basically be the same as score, but depending on the score it shows a certain card. note this in decisions as a simplicity measure."

**Tag quizzes**: every option carries `tags string[]`. We tally tags across the user's answers; the result screen shows the top tags with counts. No `results` table rows.

**Validators that go beyond Zod shape** (post-parse, throw `QuizValidationError`):

- non-slider questions have ≥2 options; slider questions have exactly 1
- score/card result ranges cover `[0, max_possible_score]` with no gaps and no overlaps (sorted, first range starts at 0, each next `range[0] === prev[1] + 1`, last `range[1] >= maxScore`)
- card needs ≥1 result; tag needs 0 results; all CTA URLs parse via `new URL()`
- IDs are unique within a quiz

These checks run server-side in `lib/ai/validators.ts` and surface as 422 on the route handlers.

**Out of scope** (deliberate):

- Weighted questions (you can simulate by raising option scores).
- Multi-axis results (e.g. one tag-axis + one score-axis on the same quiz).
- Branching: question N depends on answer to question N-1.
- Adaptive scoring (e.g. confidence-weighted).

## Edit loop

The user has **two simultaneous editors** on `/quiz/[id]/edit`:

1. **Direct JSON editing** in a textarea. Save validates against the same Zod + post-parse validators as the AI path before persisting. Bad JSON → `alert()` per locked decision #8.
2. **AI editing** in a prompt box ("add a question about X", "make the results funnier"). Sonnet 4.6 receives the *current quiz JSON* + the user's instruction and returns a **full updated quiz JSON** — not a patch. We then diff it against the current rows server-side using a plpgsql function called `apply_quiz_diff(jsonb)`.

**Why full-replacement instead of JSON patches:**

- Anthropic's structured output is a sweet spot for "produce a complete object that matches a schema." Asking for a JSON Patch ("op": "add", "path": "...") is doable but doubles the prompt complexity and gives the model more ways to be wrong. Net cost is similar (the new quiz JSON is roughly the same size as a patch + context).
- The diff is computed *server-side* via `apply_quiz_diff` (one Postgres function call) — UPSERTs by id, hard-deletes children whose ids are absent. The model just has to emit the full new state.

**Why this preserves IDs across edits:**

- The system prompt explicitly tells the model to **preserve UUIDs for items it kept**. We then back this up server-side: `normalizeIdsForEdit` walks the new quiz alongside the original, keeps any AI-supplied id that matches a known original, and mints a fresh `crypto.randomUUID()` for genuinely new items. So even when the model invents bad IDs for new items, the persistence layer always passes Postgres-valid UUIDs to `apply_quiz_diff` and stable rows update in place instead of being deleted-and-reinserted.

**No snapshots:** the editor shows a warning banner — edits that remove a question cascade-delete the historical answers for that question. This was a locked decision (the trade-off for keeping the schema simple). For breaking changes, the recommendation in the banner is "create a new quiz."

## Prompt reliability

Three layers of validation, in this order:

1. **Anthropic structured output** (`messages.parse` + `zodOutputFormat(schema)`) — the model is constrained to JSON conforming to the Zod-derived JSON Schema. The SDK auto-validates and throws if parse fails.
2. **Post-parse semantic validators** (`lib/ai/validators.ts`) — option counts, score-range coverage, URL validity, ID uniqueness. These can't be expressed in JSON Schema and run after parse succeeds.
3. **Postgres constraints** — UUID format, FK integrity, the `exactly_one_answer` CHECK on `questions_answered`, the `result_range_valid` CHECK.

**On failure: no retries, just `alert()`.** Locked decision #8 in the convo. The reasoning: in the demo audience (a technical user playing with the tool), a fast failure with a specific error message ("AI returned an invalid spec — Result ranges have a gap between [0,5] and [7,10]") is more actionable than silently retrying 3× and either delivering inconsistent results or wasting 30s on the wheel. The Anthropic SDK is configured with `maxRetries: 0` to make this explicit.

For a production audience with non-technical users, you'd want at least one transparent retry — preferably *with the prior error appended to the prompt* so the model has context on what to fix. That's the obvious next move.

## Data model

Seven tables, all FK-cascaded:

```
quiz (id, type, title, description, created_at, updated_at)
  └── question (id, quiz_id, text, type, position, ...)
        └── option (id, question_id, text, score?, tags[], position, ...)
  └── result (id, quiz_id, title_text, description, cta_text, cta_url,
              range_lo, range_hi, ...)

session (id, quiz_id, start_time, end_time?, device, browser, referrer, user_agent)
  └── questions_answered (id, session_id, question_id,
                          option_chosen_id? | numeric_answer? | selected_option_ids[]?,
                          answered_at, ...)
  └── result_screen_clicked (id, session_id, result_id, created_at)
```

**The CHECK on `questions_answered`** enforces that *exactly one* of `option_chosen_id`, `numeric_answer`, `selected_option_ids` is set per row — so the renderer, the analytics queries, and the type system all agree on what kind of answer they're looking at.

**`session_outcome` view** computes `total_score` and `tag_counts (jsonb)` per session by joining session → questions_answered → option (and unioning slider numeric values). This is the "compute on read" approach (locked decision #1) — no derived `session_outcomes` table to keep in sync. The view caught a real bug during smoke testing: a naive `lateral unnest(tags)` cross-joined with score contributions, dropping every score row when tags were empty arrays. The fix splits score and tag aggregations into separate CTEs and joins them at the top level.

**`apply_quiz_diff(p_quiz jsonb)`** is the single SQL function used for both create and edit persistence: UPSERT by id, then delete child rows whose ids aren't in the input. This gives true atomicity in one round-trip — supabase-js doesn't expose Postgres transactions, so without this function an edit could half-apply on network failure.

**Tracking** per locked decision #7: `device`, `browser`, `referrer`, `user_agent` columns directly on `session`. Captured client-side in `lib/client-meta.ts` from `navigator.userAgent` (lightweight regex, no UA-parser dependency) and `document.referrer` (with same-origin filtering so internal navigation doesn't pollute traffic stats), passed to the `startSession` Server Action.

**The dashboard shows:**

- Top stats: total quizzes, total sessions, completion rate (across all quizzes), the worst-performing quiz by incompletion rate (live calc, no minimum-N threshold per locked decision #16 — for the demo we want the data point even on tiny samples).
- Quiz grid with type-pill, question count, sessions started/completed, Take/Stats/Edit links.
- Per-quiz stats: 4-tile top stats (Started/Completed/Completion%/Q count), funnel by question reached, avg time per question, type-specific panel (score = histogram + bucket distribution; card = same; tag = per-tag counts + drop-off-by-tag), device/browser/referrer breakdown, recent sessions list with `?session=` deep-dive that filters every chart to a single session and shows the per-answer trace.

## Cost

Sonnet 4.6 list pricing as of April 2026: **$3 / MTok input**, **$15 / MTok output**.

**Per-create breakdown:**

- System prompt: ~1,500 input tokens (shared rules + per-type rules + 1-2 few-shot examples)
- User prompt: ~150 input tokens (the description)
- Schema definition (sent as part of the structured-output config): minimal; included in system overhead
- Output: 8-question quiz with 4 options each + 4 result tiers ≈ 2,200 output tokens

→ **0.00165 × $3 + 0.0022 × $15 ≈ $0.0379 per create**, call it **~$0.04**.

**Per-edit breakdown:**

- System prompt: ~1,500
- Current quiz JSON: ~2,200
- Edit instruction: ~80
- Output: ~2,300

→ **0.0038 × $3 + 0.0023 × $15 ≈ $0.0459 per edit**, call it **~$0.05**.

A creator iterating 5 times to land a quiz: ~25¢. Generating 1,000 quizzes: $40 in tokens. Cheapest improvement at scale: **prompt-cache the system prompt** (saves ~90% of input cost since the system block is identical across calls) — Anthropic SDK supports `cache_control: { type: 'ephemeral' }` on the system block. Not implemented in this MVP because cost wasn't a constraint at this stage.

## What I'd do differently with more time

- **Prompt caching on the system block** (90% input cost savings, ~5 minutes to add).
- **Retries with error-feedback** instead of fast-fail: when the validators throw, send the error message back to the model and ask it to fix. Better UX for non-technical users; slightly more cost. The current fast-fail is right for a demo, not for prod.
- **Versioned quizzes** (`quiz_version` row, sessions FK to a version): solves the "edits invalidate historical stats" trade-off cleanly. Not in this MVP because it doubles the data-model size.
- **Shareable result OG images** via `next/og`: a per-session PNG that previews the matched result so social shares aren't just naked URLs.
- **"Why this result?" expandable** on the result screen: show the score breakdown per question. Builds trust; exposes scoring bugs faster.
- **Tag co-occurrence heatmap** in the tag panel: which tags tend to appear together? Useful for personalization features that need orthogonal axes.
- **Branching support**: question N+1 depends on answer to question N. Needs a graph model and a runtime that can route — bigger lift but unlocks lead-gen funnels.
- **CSV export from the stats page** (one button, dump completed sessions with answers). 30 minutes of work that pays off the moment a marketer wants to slice the data in a spreadsheet.
- **Inline taker preview in the editor**: split the editor pane to show the live taker rendered from the current JSON without saving. Round-trips iteration time.
- **Auth + multi-tenancy**: the current build is open — anyone with the URL can see admin/stats. RLS + a real auth provider would gate edits and per-org data.
- **Better UA parsing**: today it's a 30-line regex. Swap for `ua-parser-js` if/when device/browser breakdowns become load-bearing.
- **Streaming AI responses** for create: a 30s wait on the dialog feels slow. Anthropic SDK streams `parsed_output` incrementally; you could show the title appear, then questions one by one.
- **A real chart library** (or hand-rolled SVG with axes/tooltips) for the score histogram. The current stacked-bar approach is fine for the demo but doesn't scale past ~30 score values.

## Why-this-not-that footnotes

- **Why Anthropic SDK 0.90 over the OpenAI SDK + structured outputs?** Both are good. I went Anthropic because (a) the assignment ships both keys and (b) `messages.parse` + `zodOutputFormat` is the cleanest API I've used for structured generation — no `response_format: { type: 'json_schema' }` boilerplate, no manual reparse, typed return.
- **Why Server Actions for session lifecycle, route handlers for AI calls?** The dialog-based AI invocation needs a fetch() with handle-able errors and a router.push on success — that's a Route Handler. Session start/answer/end happen inside a `useTransition` and don't return data the client needs to render — Server Actions are the right tool.
- **Why no `@supabase/ssr`?** No auth in MVP; service-role on server, anon on client is enough. Adding `@supabase/ssr` would be three extra files for zero present-day value.
- **Why hand-rolled SVG funnel + bars instead of Recharts?** Funnel + simple horizontal bars need ~50 lines each. Recharts adds ~200kb to the bundle for one page. Worth it the moment we add a histogram with axes/legends/tooltips.
- **Why a single olive aesthetic across admin AND taker?** Locked decision #19 — the screenshot is the visual north star for the whole app. The screenshot's sky/clouds/rolling-hills feel translates surprisingly well to a dashboard once the chart density stays low. If the dashboard had to show 20 widgets per row I'd revisit.
- **Why does the editor have a JSON textarea, not a structured form?** Power users reach for JSON; the structured-form alternative is much more code. The schema-docs panel beside the editor explains the shape so the JSON path stays approachable.
