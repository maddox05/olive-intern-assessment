"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { saveManualEditAction } from "@/app/quiz/[id]/edit/actions";

export function JsonEditor({
  quizId,
  initialJson,
  onAfterSave,
}: {
  quizId: string;
  initialJson: string;
  onAfterSave: (json: string) => void;
}) {
  const [text, setText] = useState(initialJson);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const dirty = text !== initialJson;

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveManualEditAction(quizId, text);
      if (!res.ok) {
        alert(res.error ?? "Couldn't save.");
        return;
      }
      setSavedAt(new Date().toLocaleTimeString());
      onAfterSave(text);
    });
  };

  const handleReset = () => {
    if (!dirty) return;
    if (
      window.confirm(
        "Discard your unsaved changes and reload from the server?"
      )
    ) {
      setText(initialJson);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3 pb-2">
        <h2 className="text-base font-extrabold tracking-tight text-olive-deep">
          Quiz JSON
        </h2>
        <div className="flex items-center gap-2 text-xs text-olive-deep/55">
          {savedAt && !dirty ? <span>Saved at {savedAt}</span> : null}
          {dirty ? <span className="font-semibold text-olive-gold">Unsaved changes</span> : null}
        </div>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        className="min-h-[460px] w-full flex-1 resize-y rounded-2xl border border-olive-mint-100 bg-white p-4 font-mono text-[12px] leading-snug text-olive-deep shadow-inner focus:border-olive-deep-soft focus:outline-none focus:ring-2 focus:ring-olive-deep-soft/30"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-olive-deep/55">
          Validates against the schema on save. Errors surface as alerts.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!dirty || pending}
            className="h-9 rounded-full px-4 text-sm font-semibold"
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!dirty || pending}
            className="h-9 rounded-full px-5 text-sm font-semibold"
          >
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
