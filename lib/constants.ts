export const QUIZ_TYPES = ["score", "card", "tag"] as const;
export type QuizType = (typeof QUIZ_TYPES)[number];

export const QUESTION_TYPES = [
  "multiple_choice",
  "select_multiple",
  "slider",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const ANTHROPIC_MODEL = "claude-sonnet-4-6";

export const QUIZ_TYPE_LABEL: Record<QuizType, string> = {
  score: "Score",
  card: "Card",
  tag: "Tag",
};

export const QUIZ_TYPE_BLURB: Record<QuizType, string> = {
  score: "Each answer adds to a total score. Show a result based on which range they land in.",
  card: "Same as score, but the result is presented as a shareable badge with a hand-drawn olive icon.",
  tag: "Each answer carries tags. The result tallies which tags they collected — great for personalization.",
};
