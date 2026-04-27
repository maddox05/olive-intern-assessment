import { cn } from "@/lib/utils";

export function QuizCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "olive-tile mx-auto w-full max-w-xl px-6 py-8 sm:px-8 sm:py-10",
        className
      )}
    >
      {children}
    </div>
  );
}
