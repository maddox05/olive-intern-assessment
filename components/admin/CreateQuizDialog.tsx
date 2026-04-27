"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  QUIZ_TYPES,
  QUIZ_TYPE_BLURB,
  QUIZ_TYPE_LABEL,
  type QuizType,
} from "@/lib/constants";

const PROMPT_PLACEHOLDERS: Record<QuizType, string> = {
  score:
    "e.g. Build a quiz that helps someone figure out if they're eating too much ultra-processed food. Ask about breakfast habits, label-reading, cooking at home, and fast food. Score them and recommend whether they should try Olive.",
  card:
    "e.g. Fun 5-question quiz: 'What kind of eater are you?' with playful answers. At the end, give them a badge title like 'The Label Detective' or 'The Blissfully Unaware'.",
  tag:
    "e.g. Onboarding for new Olive users. Ask about health goals (weight loss, cleaner eating, allergy tracking, feeding kids), grocery stores they shop at, and how often they cook. Use tags so we can personalize their first experience.",
};

export function CreateQuizDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [type, setType] = useState<QuizType | null>(null);
  const [prompt, setPrompt] = useState("");
  const [pending, startTransition] = useTransition();

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, pending]);

  const handleGenerate = () => {
    if (!type || prompt.trim().length < 5) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/ai/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, prompt: prompt.trim() }),
        });
        const json = (await res.json()) as { quizId?: string; error?: string };
        if (!res.ok || !json.quizId) {
          alert(json.error ?? "Couldn't generate the quiz. Try a different prompt.");
          return;
        }
        router.push(`/quiz/${json.quizId}/edit`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Network error";
        alert("Couldn't reach the server: " + msg);
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-quiz-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-olive-deep/30 p-4 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (!pending && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="olive-tile relative w-full max-w-2xl px-6 py-7 sm:px-8 sm:py-8">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-2 text-olive-deep/55 transition hover:bg-olive-mint-50 hover:text-olive-deep disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2
          id="create-quiz-title"
          className="text-2xl font-extrabold tracking-tight text-olive-deep"
        >
          {type ? `Generate a ${QUIZ_TYPE_LABEL[type].toLowerCase()} quiz` : "Create a new quiz"}
        </h2>
        <p className="mt-1 text-sm text-olive-deep/65">
          {type
            ? "Describe the quiz you want — Sonnet 4.6 generates the structure and copy."
            : "Pick a quiz type to start. You can edit everything afterwards."}
        </p>

        {!type ? (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {QUIZ_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className="group flex h-full flex-col items-start gap-2 rounded-2xl border border-olive-mint-100 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-olive-deep-soft hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-deep-soft"
              >
                <span className="text-base font-extrabold text-olive-deep">
                  {QUIZ_TYPE_LABEL[t]}
                </span>
                <span className="text-xs leading-snug text-olive-deep/65">
                  {QUIZ_TYPE_BLURB[t]}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <button
              type="button"
              onClick={() => setType(null)}
              disabled={pending}
              className="text-xs font-semibold text-olive-deep/55 transition hover:text-olive-deep disabled:opacity-50"
            >
              ← Change type
            </button>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={pending}
              rows={6}
              placeholder={PROMPT_PLACEHOLDERS[type]}
              className="w-full resize-y rounded-2xl border border-olive-mint-100 bg-white p-4 text-sm text-olive-deep placeholder:text-olive-deep/40 focus:border-olive-deep-soft focus:outline-none focus:ring-2 focus:ring-olive-deep-soft/40 disabled:opacity-60"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-olive-deep/55">
                {prompt.length}/4000 chars
              </p>
              <Button
                size="lg"
                onClick={handleGenerate}
                disabled={pending || prompt.trim().length < 5}
                className="h-11 rounded-full px-6 text-sm font-semibold"
              >
                {pending ? "Generating…" : "Generate quiz"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
