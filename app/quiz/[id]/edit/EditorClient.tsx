"use client";
import { useState } from "react";
import Link from "next/link";
import { JsonCodeEditor } from "@/components/editor/JsonCodeEditor";
import { AiEditPanel } from "@/components/editor/AiEditPanel";
import { NoSnapshotWarning } from "@/components/editor/NoSnapshotWarning";
import { SchemaDocs } from "@/components/editor/SchemaDocs";
import type { QuizType } from "@/lib/constants";

export function EditorClient({
  quizId,
  quizTitle,
  quizType,
  initialJson,
  takerUrl,
}: {
  quizId: string;
  quizTitle: string;
  quizType: QuizType;
  initialJson: string;
  takerUrl: string;
}) {
  const [currentJson, setCurrentJson] = useState(initialJson);
  // Bump key to force JsonEditor to remount with the new initialJson when
  // the AI applies an edit. Cleaner than threading a controlled-text prop.
  const [editorKey, setEditorKey] = useState(0);

  const refresh = (json: string) => {
    setCurrentJson(json);
    setEditorKey((k) => k + 1);
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(takerUrl);
      alert("Copied: " + takerUrl);
    } catch {
      alert(takerUrl);
    }
  };

  return (
    <div className="mx-auto max-w-7xl pb-10">
      <header className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/"
            className="text-xs font-semibold text-olive-deep/55 transition hover:text-olive-deep"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-olive-deep sm:text-3xl">
            {quizTitle}
          </h1>
          <p className="mt-1 text-sm text-olive-deep/65">
            Editing the {quizType} quiz.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyUrl}
            className="rounded-full border border-olive-mint-200 bg-white px-3 py-1.5 text-xs font-semibold text-olive-deep transition hover:bg-olive-mint-50"
          >
            Copy taker URL
          </button>
          <Link
            href={`/quiz/${quizId}`}
            target="_blank"
            rel="noopener"
            className="rounded-full border border-olive-mint-200 bg-white px-3 py-1.5 text-xs font-semibold text-olive-deep transition hover:bg-olive-mint-50"
          >
            Take it ↗
          </Link>
          <Link
            href={`/quiz/${quizId}/stats`}
            className="rounded-full bg-olive-deep px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-olive-deep-soft"
          >
            View stats
          </Link>
        </div>
      </header>

      <div className="mt-5">
        <NoSnapshotWarning />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <section className="olive-tile p-5">
            <JsonCodeEditor
              key={editorKey}
              quizId={quizId}
              initialJson={currentJson}
              onAfterSave={refresh}
            />
          </section>
          <AiEditPanel quizId={quizId} onApplied={refresh} />
        </div>
        <SchemaDocs type={quizType} />
      </div>
    </div>
  );
}
