"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { loadQuizJsonAction } from "@/app/quiz/[id]/edit/actions";
import { AiLoadingOverlay } from "@/components/AiLoadingOverlay";

export function AiEditPanel({
  quizId,
  onApplied,
}: {
  quizId: string;
  onApplied: (json: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [pending, startTransition] = useTransition();
  const [lastApplied, setLastApplied] = useState<string | null>(null);

  const handleApply = () => {
    if (prompt.trim().length < 3) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/ai/edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizId, prompt: prompt.trim() }),
        });
        const json = (await res.json()) as { quizId?: string; error?: string };
        if (!res.ok || !json.quizId) {
          alert(json.error ?? "Couldn't apply the edit.");
          return;
        }
        // Pull the freshly persisted quiz back to refresh the editor pane
        const reload = await loadQuizJsonAction(quizId);
        if (reload.ok && reload.json) {
          onApplied(reload.json);
          setLastApplied(prompt.trim());
          setPrompt("");
        } else {
          alert(reload.error ?? "Edit applied but couldn't reload the JSON.");
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Network error";
        alert("Couldn't reach the server: " + msg);
      }
    });
  };

  return (
    <section className="olive-tile relative p-5">
      <AiLoadingOverlay visible={pending} variant="edit" />
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-extrabold tracking-tight text-olive-deep">
          Edit with AI
        </h2>
        <span className="rounded-full bg-olive-mint-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-olive-deep">
          Sonnet 4.6
        </span>
      </div>
      <p className="mt-1 text-xs text-olive-deep/60">
        Describe the change. The AI returns a full updated quiz; we diff it
        against current rows so question IDs stay stable wherever possible.
      </p>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={pending}
        rows={4}
        placeholder="e.g. Add a question about how often they read nutrition labels."
        className="mt-3 w-full resize-y rounded-2xl border border-olive-mint-100 bg-white p-3 text-sm text-olive-deep placeholder:text-olive-deep/40 focus:border-olive-deep-soft focus:outline-none focus:ring-2 focus:ring-olive-deep-soft/30 disabled:opacity-60"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        {lastApplied ? (
          <p className="line-clamp-1 text-xs text-olive-deep/55" title={lastApplied}>
            Last: &quot;{lastApplied}&quot;
          </p>
        ) : (
          <span />
        )}
        <Button
          onClick={handleApply}
          disabled={pending || prompt.trim().length < 3}
          className="h-9 rounded-full px-5 text-sm font-semibold"
        >
          {pending ? "Applying…" : "Apply edit"}
        </Button>
      </div>
    </section>
  );
}
