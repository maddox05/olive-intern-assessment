import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { quizSchemaFor, type AIQuiz } from "./schemas";
import { validateAIQuiz } from "./validators";
import { normalizeIdsForEdit } from "./normalize";
import { buildEditSystemPrompt, buildEditUserPrompt } from "./prompts";
import { env } from "@/lib/env";
import { ANTHROPIC_MODEL } from "@/lib/constants";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  // maxRetries: 0 — locked decision #8: fast-fail on any AI failure.
  if (!client)
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0 });
  return client;
}

export async function editQuizFromPrompt(
  currentQuiz: AIQuiz,
  userText: string
): Promise<AIQuiz> {
  const schema = quizSchemaFor(currentQuiz.type);
  const currentJson = JSON.stringify(currentQuiz, null, 2);

  const message = await getClient().messages.parse({
    model: ANTHROPIC_MODEL,
    max_tokens: 4096,
    system: buildEditSystemPrompt(currentQuiz.type),
    messages: [
      { role: "user", content: buildEditUserPrompt(currentJson, userText) },
    ],
    output_config: { format: zodOutputFormat(schema) },
  });

  if (!message.parsed_output) {
    throw new Error(
      "AI returned no parseable output. Try rephrasing your edit instruction."
    );
  }

  const raw = message.parsed_output as AIQuiz;

  if (raw.type !== currentQuiz.type) {
    throw new Error(
      `AI tried to change quiz type from ${currentQuiz.type} to ${raw.type}. Quiz types are immutable.`
    );
  }

  // Walk the new quiz alongside the original. Keep AI ids that match an
  // existing row (so apply_quiz_diff updates in place) and mint fresh UUIDs
  // for genuinely new items. Forces the quiz id to stay stable.
  const next = normalizeIdsForEdit(raw, currentQuiz);

  validateAIQuiz(next);
  return next;
}
