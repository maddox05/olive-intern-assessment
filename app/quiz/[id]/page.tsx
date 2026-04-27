import { notFound } from "next/navigation";
import { loadQuizFull } from "@/lib/quiz-persistence";
import { QuizRunner } from "./QuizRunner";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await loadQuizFull(id);
  if (!quiz) notFound();
  return <QuizRunner quiz={quiz} />;
}
