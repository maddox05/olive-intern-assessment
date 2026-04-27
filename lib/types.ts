import type { QuestionType, QuizType } from "./constants";

export type { QuestionType, QuizType };

export interface QuizRow {
  id: string;
  type: QuizType;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionRow {
  id: string;
  quiz_id: string;
  text: string;
  type: QuestionType;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface OptionRow {
  id: string;
  question_id: string;
  text: string;
  score: number | null;
  tags: string[];
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ResultRow {
  id: string;
  quiz_id: string;
  title_text: string;
  description: string;
  cta_text: string;
  cta_url: string;
  range_lo: number;
  range_hi: number;
  created_at: string;
  updated_at: string;
}

export interface SessionRow {
  id: string;
  quiz_id: string;
  start_time: string;
  end_time: string | null;
  device: string | null;
  browser: string | null;
  referrer: string | null;
  user_agent: string | null;
}

export interface QuestionAnsweredRow {
  id: string;
  session_id: string;
  question_id: string;
  option_chosen_id: string | null;
  numeric_answer: number | null;
  selected_option_ids: string[] | null;
  answered_at: string;
  created_at: string;
  updated_at: string;
}

export interface ResultScreenClickedRow {
  id: string;
  session_id: string;
  result_id: string;
  created_at: string;
}

/**
 * Fat shape used by the AI layer, editor, and taker. Mirrors what the AI
 * returns and what we round-trip through the editor.
 */
export interface QuizFull extends QuizRow {
  questions: (QuestionRow & { options: OptionRow[] })[];
  results: ResultRow[];
}

/**
 * AI-side JSON shape — uses range tuple (matches the spec) instead of
 * range_lo/range_hi columns. Persistence layer translates between this and
 * QuizFull.
 */
export interface AIQuizJson {
  id: string;
  type: QuizType;
  title: string;
  description: string;
  questions: AIQuestionJson[];
  results: AIResultJson[];
}

export interface AIQuestionJson {
  id: string;
  text: string;
  type: QuestionType;
  position: number;
  options: AIOptionJson[];
}

export interface AIOptionJson {
  id: string;
  text: string;
  position: number;
  score?: number; // present for score/card quizzes; absent for tag
  tags?: string[]; // present for tag quizzes; absent for score/card
}

export interface AIResultJson {
  id: string;
  title_text: string;
  description: string;
  cta_text: string;
  cta_url: string;
  range: [number, number];
}
