import { QuizCard } from "./QuizCard";
import { CreateQuizCard } from "./CreateQuizCard";
import type { QuizListItem } from "@/lib/dashboard-queries";

export function QuizGrid({ quizzes }: { quizzes: QuizListItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <CreateQuizCard />
      {quizzes.map((q) => (
        <QuizCard key={q.id} quiz={q} />
      ))}
    </div>
  );
}
