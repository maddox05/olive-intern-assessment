# Olive Quiz Studio — Text-to-Quiz

A working prototype of an AI quiz funnel generator. You describe a quiz in plain text, Sonnet 4.6 produces a structured spec, the spec gets persisted to Supabase as normalized rows, and the quiz goes live at `/quiz/[id]`. Anonymous takers fill it out, every answer is captured, and the dashboard shows you funnel drop-off, time per question, device/browser/referrer breakdowns, distribution charts, and a per-session deep-dive.

Read [`DECISIONS.md`](./DECISIONS.md) for the trade-off log; read [`ai/docs/plan.md`](./ai/docs/plan.md) for the phased build plan that produced this code.

---

## Quick start

```bash
# 1. Install
pnpm install

# 2. Env (Anthropic key is required; Supabase keys are filled by `pnpm supabase status`)
cp .env.example .env.local
# edit .env.local — paste an ANTHROPIC_API_KEY

# 3. Start the local Supabase stack (Postgres + Studio + REST + auth)
pnpm supabase start
# Copy the printed Publishable + Secret keys into .env.local
# (NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY)

# 4. Apply migrations + seed the 3 example quizzes
pnpm supabase db reset

# 5. Run
pnpm dev
```

Open http://localhost:3000. Supabase Studio is at http://127.0.0.1:54323.

The seed populates 3 example quizzes (one per type) with simulated takes so the dashboard and stats pages have data immediately.

---

## What's implemented

### `/` — Admin dashboard
- Top stats: total quizzes, total sessions, completion rate, the worst-performing quiz (by incompletion rate, live calc with no minimum-N gate).
- Plus-card-first quiz grid with type pill, question count, sessions started/completed, Take/Stats/Edit buttons.
- "Create a new quiz" dialog — pick a type (score / card / tag), describe what you want, generate. Lands you on the editor.

### `/quiz/[id]` — Public quiz taker
- Sky / cloud / rolling-hills aesthetic that matches the screenshot in `ai/screenshots/1.jpeg`.
- Three question components (multiple_choice tile-grid, select_multiple with checkbox affordance, slider with value bubble).
- Three result components (Score with score circle, Card with random olive-gold badge SVG + share button, Tags with tally bars).
- Session/answer/end captured via Server Actions. Device, browser, referrer, user-agent captured client-side from `navigator.userAgent` + `document.referrer`.

### `/quiz/[id]/edit` — Editor
- Two simultaneous editing paths: a JSON pane (validates against the same Zod + post-parse validators as the AI path) and an AI prompt panel.
- Schema-docs side panel with collapsible sections per quiz type.
- "Edits go live immediately" warning banner — locked design decision: no snapshots, hard delete + cascade.

### `/quiz/[id]/stats` — Analytics
- 4-tile top stats (Started/Completed/Completion%/Q count).
- Funnel by question reached (with inter-rung drop-off labels).
- Average time per question (q1 measured from session.start_time; final measured to session.end_time on completion; abandoned-final excluded).
- Per-type panel: score = histogram + result-bucket distribution + averages + CTA click rate; card = same; tag = per-tag counts + drop-off-by-tag.
- Device / browser / referrer breakdown.
- Recent sessions table — click any row to deep-dive (`?session=<uuid>`); every chart on the page filters to that one session and a per-answer trace appears.

### `/api/ai/create` and `/api/ai/edit`
- `POST` route handlers. Sonnet 4.6 with `client.messages.parse({ output_config: { format: zodOutputFormat(schema) } })`.
- `maxRetries: 0` — fast fail, surface validator errors as 422 with a human-readable message that the client `alert()`s. (See DECISIONS for the rationale.)

---

## Project layout

```
app/
├── page.tsx                       # Admin dashboard
├── api/ai/{create,edit}/route.ts  # AI route handlers
└── quiz/[id]/
    ├── page.tsx + QuizRunner.tsx  # Taker
    ├── actions.ts                 # Session lifecycle Server Actions
    ├── edit/page.tsx + EditorClient.tsx + actions.ts
    └── stats/page.tsx
components/
├── layout/   # SkyHillsBackground, AppShell, OliveLogo
├── taker/    # ProgressBar, StartScreen, QuizCard, Question*, Result*, badges/
├── admin/    # TopStats, QuizGrid, QuizCard, CreateQuizCard, CreateQuizDialog
├── editor/   # JsonEditor, AiEditPanel, SchemaDocs, NoSnapshotWarning
├── stats/    # FunnelSvg, TimePerQuestionBars, {Score,Card,Tag}Panel, MetaBreakdown, SessionsList, SessionDeepDive, PanelShell
└── ui/       # shadcn (Button)
lib/
├── ai/       # schemas (3 variants), validators, prompts, create, edit, normalize
├── supabase/ # server.ts, browser.ts, types.ts (auto-generated)
├── analytics-queries.ts
├── dashboard-queries.ts
├── quiz-persistence.ts
├── client-meta.ts
├── constants.ts, env.ts, types.ts, utils.ts
supabase/
├── config.toml
├── schemas/   # Declarative DDL (source of truth) — 7 tables, 2 fns, view, triggers
├── migrations/
└── seed.sql   # 3 example quizzes + simulated takes
ai/
├── docs/{my_spec.md, given_spec.md, plan.md}
└── screenshots/
```

---

## Schema diff workflow

```bash
# Edit a CREATE TABLE in supabase/schemas/30_tables/...
pnpm supabase db diff -f your_change_name
pnpm supabase db reset    # applies migrations + replays seed
pnpm supabase gen types typescript --local > lib/supabase/types.ts
```

---

## Stack

- **Next.js 16.2.4** (App Router, async params, Server Actions, Route Handlers)
- **React 19.2** (`useActionState`, `useTransition`)
- **Tailwind v4** + **shadcn/ui** (base-nova) + custom olive palette in `globals.css`
- **Anthropic SDK 0.90** with the `zodOutputFormat` helper for structured generation
- **Supabase JS 2.104** (service-role on server, anon on browser; no `@supabase/ssr` for MVP)
- **Zod 4** for schemas
- **Postgres 17** (local Supabase) with a plpgsql `apply_quiz_diff(jsonb)` for atomic create+edit persistence

---

## What's not in the box

Per the kill list in the build plan: no auth/RLS, no quiz versioning, no soft-delete, no branching logic, no free-text or image questions, no mid-quiz resume across sessions, no A/B, no embeddable widget, no per-quiz custom theming, no unit tests (manual smoke only). See [`DECISIONS.md`](./DECISIONS.md) for "what I'd do differently with more time."

---

## A note on the build process

This repo was built phase-by-phase in collaboration with Claude. Every commit is atomic and self-explanatory; the message bodies double as a build journal. The build plan is checked in at [`ai/docs/plan.md`](./ai/docs/plan.md).
