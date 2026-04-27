import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { quizSchemaFor, type AIQuiz } from "./schemas";
import { validateAIQuiz } from "./validators";
import { buildCreateSystemPrompt, buildCreateUserPrompt } from "./prompts";
import { env } from "@/lib/env";
import { ANTHROPIC_MODEL, type QuizType } from "@/lib/constants";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  // maxRetries: 0 — locked decision #8: fast-fail on any AI failure (parse,
  // validation, or network) so the user reprompts. Retries hide bad prompts.
  if (!client)
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0 });
  return client;
}

export async function createQuizFromPrompt(
  type: QuizType,
  userText: string
): Promise<AIQuiz> {
  const schema = quizSchemaFor(type);
  const message = await getClient().messages.parse({
    model: ANTHROPIC_MODEL,
    max_tokens: 4096,
    system: buildCreateSystemPrompt(type),
    messages: [{ role: "user", content: buildCreateUserPrompt(userText) }],
    output_config: { format: zodOutputFormat(schema) },
  });

  if (!message.parsed_output) {
    throw new Error(
      "AI returned no parseable output. Try rephrasing your prompt."
    );
  }

  const quiz = message.parsed_output as AIQuiz;
  validateAIQuiz(quiz);
  return quiz;
}
