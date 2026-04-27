import { randomUUID } from "node:crypto";
import type { AIQuiz } from "./schemas";

/**
 * Strict UUID-shape check (does NOT enforce v4 version nibble — Postgres
 * accepts any 8-4-4-4-12 hex string).
 */
const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Replace every id in the quiz with a fresh server-generated UUID.
 * Used for AI create — the model's IDs are placeholders we don't trust
 * and don't reference anywhere yet.
 */
export function normalizeIdsForCreate(quiz: AIQuiz): AIQuiz {
  const next = JSON.parse(JSON.stringify(quiz)) as AIQuiz;
  next.id = randomUUID();
  for (const q of next.questions) {
    q.id = randomUUID();
    for (const o of q.options) {
      o.id = randomUUID();
    }
  }
  for (const r of next.results) {
    // results is `never[]` for tag quizzes; the loop simply skips
    (r as { id: string }).id = randomUUID();
  }
  return next;
}

/**
 * Walk the new quiz tree alongside the original. Keep the AI's id IF it
 * matches a known original id at any level (so apply_quiz_diff updates the
 * row in place). Otherwise mint a fresh server-side UUID. Force the
 * top-level quiz id to stay stable.
 */
export function normalizeIdsForEdit(next: AIQuiz, original: AIQuiz): AIQuiz {
  const known = collectIds(original);
  const out = JSON.parse(JSON.stringify(next)) as AIQuiz;

  // Quiz id never changes — apply_quiz_diff matches by it.
  out.id = original.id;

  for (const q of out.questions) {
    q.id = pickId(q.id, known);
    for (const o of q.options) {
      o.id = pickId(o.id, known);
    }
  }
  for (const r of out.results) {
    const cast = r as { id: string };
    cast.id = pickId(cast.id, known);
  }

  return out;
}

function pickId(candidate: string, known: Set<string>): string {
  if (typeof candidate === "string" && UUID_RE.test(candidate) && known.has(candidate)) {
    return candidate;
  }
  return randomUUID();
}

function collectIds(quiz: AIQuiz): Set<string> {
  const ids = new Set<string>();
  ids.add(quiz.id);
  for (const q of quiz.questions) {
    ids.add(q.id);
    for (const o of q.options) ids.add(o.id);
  }
  for (const r of quiz.results) ids.add((r as { id: string }).id);
  return ids;
}
