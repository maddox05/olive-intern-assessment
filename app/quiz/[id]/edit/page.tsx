import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { loadQuizFull, quizFullToAIShape } from "@/lib/quiz-persistence";
import { EditorClient } from "./EditorClient";

export const dynamic = "force-dynamic";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await loadQuizFull(id);
  if (!quiz) notFound();

  const json = JSON.stringify(quizFullToAIShape(quiz), null, 2);

  // Build the public taker URL using the request's host header so it works
  // in local dev, preview, and production without a hard-coded base.
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const takerUrl = `${proto}://${host}/quiz/${id}`;

  return (
    <EditorClient
      quizId={id}
      quizTitle={quiz.title}
      quizType={quiz.type}
      initialJson={json}
      takerUrl={takerUrl}
    />
  );
}
