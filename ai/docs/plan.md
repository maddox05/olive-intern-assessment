# Olive Text-to-Quiz — Implementation Plan

Working reference for the build. Locked decisions live at the bottom.

## Build shape (one paragraph)

A single Next.js 16 app that lets an admin generate quiz funnels from natural-language prompts (Anthropic Sonnet 4.6 → Zod-validated JSON), persists them to Supabase as normalized rows, serves the live quizzes at `/quiz/[id]` to anonymous takers with per-answer telemetry, and surfaces an analytics dashboard at `/quiz/[id]/stats` with funnel drop-off, time-per-question, device/browser/referrer breakdowns, distribution charts, and a per-session deep-dive. Three quiz types — `score`, `card`, `tag` — share question-rendering components but diverge at the result screen and AI schema. The whole UI is dressed in the screenshot's sky-cloud-rolling-hills aesthetic with rounded white tiles, dark olive type, and sage cream accents.

## Cost per generated quiz

Sonnet 4.6 pricing: $3 / MTok input, $15 / MTok output.

- **Create**: ~1,650 tok in + ~2,200 tok out ≈ **$0.038/call**
- **Edit**: ~3,800 tok in + ~2,300 tok out ≈ **$0.046/call**
- **Round number for DECISIONS**: ~4¢ per generation, ~5¢ per edit.

## Risk register

1. **Next.js 16 async params** — type pages as `{ params: Promise<{ id: string }> }`, always `await`.
2. **Supabase-js has no real transactions** — write `apply_quiz_diff(jsonb)` plpgsql so the edit is atomic.
3. **Score-range gaps/overlaps** — post-parse validator rejects with 422; client `alert()`s.
4. **Hard-delete cascade nukes historical answers** — locked decision; warning banner + DECISIONS entry; ID-stable diff means most edits update-in-place.
5. **`useActionState` (React 19) signature** — one shared pattern in `lib/forms.ts`.
6. **Tailwind v4 + shadcn token clash** — extend `--color-*` rather than overwrite shadcn neutrals; namespace `--color-olive-*`.
7. **`alert()` UX is jarring** — prefix message with "AI returned an invalid spec —".

---

## Phase 1 — Foundation (1.0 h)

**Goal:** typed runtime — env validation, two supabase clients, design tokens, sky/cloud layout shell, shared types.

1. `chore: env validation + shared constants` — `lib/env.ts`, `lib/constants.ts`
2. `chore: supabase clients (server + browser)` — `lib/supabase/{server,browser,types}.ts`
3. `ui: olive design tokens in globals.css + typography` — `app/globals.css`, `app/layout.tsx`
4. `ui: shared layout shell + SkyHillsBackground component` — `components/layout/{SkyHillsBackground,AppShell}.tsx`
5. `feat: shared quiz types module` — `lib/types.ts`

**Gate:** `pnpm dev` boots, `/` renders the new shell with sky/cloud bg, no console errors. `pnpm build` succeeds.

---

## Phase 2 — Database Schema (1.5 h)

**Goal:** all tables, triggers, `apply_quiz_diff` plpgsql, optional analytics view, applied to local Supabase.

1. `db: enums for quiz_type and question_type` — `supabase/schemas/10_enums/00_quiz_enums.sql`
2. `db: updated_at trigger function` — `supabase/schemas/20_functions/00_set_updated_at.sql`
3. `db: core tables (quiz, question, option, result)` — `supabase/schemas/30_tables/{00_quiz,10_question,20_option,30_result}.sql`
4. `db: telemetry tables (session, questions_answered, result_screen_clicked)` — `supabase/schemas/30_tables/{40_session,50_questions_answered,60_result_screen_clicked}.sql`
5. `db: updated_at triggers wired up` — `supabase/schemas/35_triggers/00_updated_at_triggers.sql`
6. `db: analytics view for session outcomes` — `supabase/schemas/40_views/00_session_outcome.sql`
7. `db: apply_quiz_diff plpgsql function (transactional edit)` — `supabase/schemas/20_functions/10_apply_quiz_diff.sql`
8. `db: generate + apply migration` — `supabase/migrations/<ts>_initial_schema.sql`, then regen types

**Gate:** all 7 tables + view + 2 functions in DB. `apply_quiz_diff` callable with a small jsonb fixture.

---

## Phase 3 — AI Layer (2.0 h)

**Goal:** 3 Zod schemas (one per type), `create.ts` + `edit.ts`, post-parse validators, prompts (committed), 2 route handlers, `quiz-persistence` row-diff calling `apply_quiz_diff`.

1. `feat: AI Zod schemas per quiz type` — `lib/ai/schemas.ts`
2. `feat: post-parse validators (option count, range coverage, urls)` — `lib/ai/validators.ts`
3. `feat: prompt strings (committed to repo per spec)` — `lib/ai/prompts.ts`
4. `feat: AI create caller` — `lib/ai/create.ts`
5. `feat: AI edit caller` — `lib/ai/edit.ts`
6. `feat: quiz persistence — DB↔JSON helpers and apply_quiz_diff caller` — `lib/quiz-persistence.ts`
7. `feat: /api/ai/create route handler` — `app/api/ai/create/route.ts`
8. `feat: /api/ai/edit route handler` — `app/api/ai/edit/route.ts`

**Gate:** curl create endpoint → quiz row + children. Bad prompt → 422. Edit endpoint round-trips with same UUIDs preserved.

---

## Phase 4 — Quiz Taker (2.5 h)

**Goal:** live quiz at `/quiz/[id]` with progress bar, 3 question + 3 result components (incl. 3 random olive-gold badges), session start/answer/end Server Actions, CTA-click tracking.

1. `ui: progress bar + start screen + shared taker chrome` — `components/taker/{ProgressBar,StartScreen,QuizCard}.tsx`
2. `feat: session Server Actions (start/answer/end/cta)` — `app/quiz/[id]/actions.ts`
3. `feat: device/browser/referrer capture util` — `lib/client-meta.ts`
4. `ui: question components (multiple choice, select multiple, slider)` — `components/taker/Question{MultipleChoice,SelectMultiple,Slider}.tsx`
5. `ui: result components (Score, Card, Tags) + 3 olive badge SVGs` — `components/taker/Result{Score,Card,Tags}.tsx`, `components/taker/badges/{OliveBadgeA,OliveBadgeB,OliveBadgeC}.tsx`, `index.ts`
6. `ui: /quiz/[id] page wiring it all together` — `app/quiz/[id]/{page,QuizRunner}.tsx`

**Gate:** end-to-end quiz take for all 3 types; DB has correct session + answers + cta-click rows.

---

## Phase 5 — Admin Dashboard (1.5 h)

**Goal:** `/` with top stats + plus-card-first quiz grid + create dialog.

1. `feat: dashboard data loaders` — `lib/dashboard-queries.ts`
2. `ui: top stats bar` — `components/admin/TopStats.tsx`
3. `ui: quiz grid with plus card` — `components/admin/{QuizGrid,QuizCard,CreateQuizCard}.tsx`
4. `ui: CreateQuizDialog with type picker + prompt box` — `components/admin/CreateQuizDialog.tsx`
5. `ui: dashboard page` — `app/page.tsx` (replaces existing scaffold)

**Gate:** `/` renders with real DB data; create flow lands on `/quiz/<id>/edit`; bad prompt → alert.

---

## Phase 6 — Editor (1.5 h)

**Goal:** `/quiz/[id]/edit` with JSON editor + AI prompt + schema docs panel + warning banner.

1. `feat: editor data loader + save action` — `app/quiz/[id]/edit/actions.ts`
2. `ui: schema docs panel` — `components/editor/SchemaDocs.tsx`
3. `ui: no-snapshot warning banner` — `components/editor/NoSnapshotWarning.tsx`
4. `ui: JSON editor + AI prompt panel + page` — `components/editor/{JsonEditor,AiEditPanel}.tsx`, `app/quiz/[id]/edit/{page,EditorClient}.tsx`

**Gate:** manual JSON edit persists. AI edit round-trips. Bad JSON triggers alert without touching DB.

---

## Phase 7 — Stats / Analytics (2.5 h)

**Goal:** `/quiz/[id]/stats` with funnel SVG, time-per-question, per-type panels, sessions list, `?session=` deep-dive.

1. `feat: analytics queries` — `lib/analytics-queries.ts`
2. `ui: funnel SVG` — `components/stats/FunnelSvg.tsx`
3. `ui: time-per-question bar chart` — `components/stats/TimePerQuestionBars.tsx`
4. `ui: per-type stats panels (shared shell)` — `components/stats/{PanelShell,ScorePanel,CardPanel,TagPanel}.tsx`
5. `ui: device/browser/referrer panel` — `components/stats/MetaBreakdown.tsx`
6. `ui: sessions list + deep-dive` — `components/stats/{SessionsList,SessionDeepDive}.tsx`
7. `ui: stats page wiring` — `app/quiz/[id]/stats/page.tsx`

**Gate:** real numbers match DB; `?session=` filters every chart.

---

## Phase 8 — Polish + DECISIONS.md + 3 Examples (1.5 h)

**Goal:** assignment deliverables checklist.

1. `docs: DECISIONS.md (the assessment's primary deliverable)` — `DECISIONS.md`
2. `chore: seed 3 example quizzes (one per type)` — `supabase/seed.sql` or `scripts/seed-examples.ts`
3. `docs: README with setup, env, run, deploy, screenshots` — `README.md`
4. `ui: end-to-end smoke + visual polish pass` — any
5. `docs: capture final screenshots into ai/screenshots/` — `ai/screenshots/{admin,taker-question,result-card,stats-funnel}.png`

**Gate:** full E2E for all 3 quiz types; `DECISIONS.md` covers every locked decision.

---

## Locked decisions (paraphrased from convo)

1. **No `session_outcomes` table.** Compute on read via the `session_outcome` view.
2. **`questions_answered`** has 3 mutually exclusive answer columns + CHECK constraint.
3. **`result_screen_clicked`** = `(id, session_id, result_id, created_at)` only.
4. **`position int`** column on questions (override the spec's `created_at` ordering).
5. **HARD delete with `ON DELETE CASCADE`** everywhere — no soft-delete. Documented trade-off.
6. **`quiz.type` only switches** result renderer + AI prompt + AI Zod schema variant. Card == score under the hood; SVG is decoration only. Tag-quiz options have no `score` field in AI schema.
7. **Session columns**: `device, browser, referrer, user_agent` directly on `session`.
8. **No retries on validation failure — just `alert()`.** SDK HTTP retries stay; `messages.parse` `max_retries: 0`.
9. **Validators**: option count, slider has 1, score-range coverage no gaps no overlaps, valid URLs.
10. **AI edit contract**: input = current JSON + prompt; output = full updated JSON; persistence = row-level diff using stable client-supplied UUIDs; card SVG random at render time.
11. **Quiz type chosen explicitly** before prompting (3-tile picker → prompt box).
12. **Session insert on Start button click** (not page load).
13. **Routes**: `/`, `/quiz/[id]`, `/quiz/[id]/edit`, `/quiz/[id]/stats?session=`, `/api/ai/{create,edit}`.
14. **Individual responses UI**: paginated list (50) at bottom of stats; click → `?session=`.
15. **Edit page schema docs**: hand-written nice HTML, not auto-gen.
16. **Highest incompletion**: live calc, no minimum-N threshold (documented).
17. **Time-per-question edges**: q1 from session.start_time; final from session.end_time; abandon excluded.
18. **Per-type stats panels**: score = histogram + bucket distribution; card = same + CTA + completion; tag = per-tag + drop-off-by-tag.
19. **Sky/cloud aesthetic everywhere** (admin, editor, taker, results).
20. **3 olive-gold badge SVGs**: hand-illustrated inline JSX, random pick at render time.

## Kill list (NOT in MVP)

Auth/RLS, versioning, soft-delete, branching, weighted questions, free-text/image questions, mid-quiz resume, A/B, tag co-occurrence heatmap, embeddable widget, per-quiz custom theming, unit tests, i18n.

## If time permits

1. Prompt-cache the create system prompt (~90% input cost savings)
2. OG images for shareable result links
3. "Why this result?" score breakdown on result screen
4. CSV export from stats
5. Inline taker preview in editor
