import type { QuizType } from "@/lib/constants";

const SHARED_RULES = `
RULES (apply to every quiz):

1. Every question and option and result row needs a stable UUID v4.
   Generate fresh UUIDs at quiz-creation time. When editing an existing
   quiz, PRESERVE the existing UUIDs for any item you keep — only mint
   new UUIDs for genuinely new items.

2. Question types and their option-count rules:
   - "multiple_choice": exactly one answer per question. Must have AT LEAST 2 options.
   - "select_multiple": user picks zero or more. Must have AT LEAST 2 options.
   - "slider": user picks a number from 0 to the option's score. EXACTLY 1 option;
     its score is the slider max (e.g. score 10 = slider 0–10). The option's text
     becomes the slider label/prompt.

3. "position" is a 0-based integer ordering. Questions are shown to the
   user in ascending position. Options are shown in ascending position.

4. Title and description should be friendly, human, and tonally consistent
   with the quiz's vibe. Avoid corporate boilerplate.

5. Prefer 4–8 questions for most quizzes unless the user asks otherwise.
`;

const SCORE_RULES = `
SCORE QUIZ RULES:

- Every option carries a non-negative integer "score". When the user
  finishes, we sum every chosen option's score (and every selected option's
  score for select_multiple, and the user's slider value for sliders).
- The "results" array is a list of buckets the total score can land in.
  Each result has a "range" tuple [lo, hi] (both inclusive integers).
- Results MUST cover [0, maxPossibleScore] with NO GAPS and NO OVERLAPS.
  Sort by range[0] ascending; the first range must start at 0; each next
  range[0] must equal previous range[1] + 1; the last range[1] must equal
  or exceed the maximum sum of all per-question max-option-scores.
- 3–5 result tiers feels right for most quizzes.
- Each result has a friendly title_text, a 1–2 sentence description,
  cta_text (e.g. "Try Olive"), and a valid cta_url.
`;

const CARD_RULES = `
CARD QUIZ RULES:

- Card quizzes work EXACTLY like score quizzes for scoring and result
  bucketing — every option has a "score", and "results" cover [0, max]
  with no gaps. The score determines which result row matches.
- The DIFFERENCE: each result row's title_text and description should
  read like a shareable badge identity, e.g. "The Label Detective",
  "The Blissfully Unaware". Punchy, fun, screenshottable.
- The badge artwork is a hand-drawn olive icon picked at render time —
  you don't generate art, just the badge's title and copy.
- 3–5 badge tiers is ideal.
`;

const TAG_RULES = `
TAG QUIZ RULES:

- Every option carries a "tags" array (1+ strings). When the user finishes,
  we tally every tag they collected across their answers.
- The result screen shows their tag tallies (e.g. "Wellness Warrior — 3x").
- DO NOT generate any "results" rows — the results array must be empty [].
- DO NOT include "score" on options — only "tags".
- Tags should be short noun phrases, consistent across options
  (e.g. "wellness", "convenience-first", "label-reader" — pick a vocabulary
  and stick to it across the quiz so tallies are meaningful).
`;

function rulesFor(type: QuizType): string {
  switch (type) {
    case "score":
      return SCORE_RULES;
    case "card":
      return CARD_RULES;
    case "tag":
      return TAG_RULES;
  }
}

export function buildCreateSystemPrompt(type: QuizType): string {
  return `You are a quiz funnel designer. The user describes a quiz; you produce a structured spec that a renderer will turn into a live quiz.

Output: a single JSON object that conforms to the provided schema. Nothing else. No prose, no commentary, no code fences.
${SHARED_RULES}
${rulesFor(type)}

QUALITY BAR:
- The result should feel like a real product, not a Google Form.
- Question wording is conversational. Option text is concrete (not "Strongly agree" / "Strongly disagree" unless the user explicitly asks).
- For score/card quizzes, score weights should make the math interesting — not every option is worth 1 point.
- Pick CTA URLs that are plausible (https://olive.app/start, https://olive.app/learn, etc) unless the user gave specific URLs.
`;
}

export function buildCreateUserPrompt(userText: string): string {
  return `Generate a quiz from this description:

${userText}`;
}

const EDIT_RULES = `
EDIT-MODE RULES:

- You are receiving the CURRENT quiz JSON and an EDIT INSTRUCTION.
  Return the FULL updated quiz JSON — not a patch, not a diff.
- PRESERVE existing UUIDs for any question, option, or result you are keeping
  (even if you change its text or copy). Only mint NEW UUIDs for items the
  edit asks you to ADD.
- Items the edit asks you to REMOVE: simply omit them from the output.
- The quiz "type" field MUST stay the same as the current quiz — never
  change a score quiz to a tag quiz or vice versa.
- Re-balance score ranges if needed so they still cover [0, max] with
  no gaps after the edit.
`;

export function buildEditSystemPrompt(type: QuizType): string {
  return `You are a quiz funnel designer editing an existing quiz. The user describes a change; you return the full updated quiz JSON conforming to the schema.

Output: a single JSON object that conforms to the provided schema. Nothing else.
${SHARED_RULES}
${rulesFor(type)}
${EDIT_RULES}
`;
}

export function buildEditUserPrompt(
  currentJson: string,
  userText: string
): string {
  return `CURRENT QUIZ JSON:
${currentJson}

EDIT INSTRUCTION:
${userText}

Return the full updated quiz JSON.`;
}
