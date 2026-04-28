"use client";
import { useMemo, useState, useTransition } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { lintGutter, linter } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import { Button } from "@/components/ui/button";
import { saveManualEditAction } from "@/app/quiz/[id]/edit/actions";

export function JsonCodeEditor({
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

  // Olive-tinted CodeMirror theme: warm cream gutter, olive-deep text,
  // soft mint selection, gold cursor.
  const theme = useMemo(
    () =>
      EditorView.theme(
        {
          "&": {
            backgroundColor: "transparent",
            color: "var(--olive-deep)",
            fontSize: "12px",
          },
          ".cm-content": {
            padding: "12px 0",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            caretColor: "var(--olive-deep)",
          },
          ".cm-gutters": {
            backgroundColor: "color-mix(in oklab, var(--olive-mint-50) 70%, white)",
            color: "color-mix(in oklab, var(--olive-deep) 50%, transparent)",
            border: "none",
            paddingRight: "8px",
          },
          ".cm-activeLine": {
            backgroundColor:
              "color-mix(in oklab, var(--olive-mint-50) 50%, transparent)",
          },
          ".cm-activeLineGutter": {
            backgroundColor:
              "color-mix(in oklab, var(--olive-mint-100) 60%, transparent)",
            color: "var(--olive-deep)",
          },
          ".cm-selectionBackground, ::selection": {
            backgroundColor:
              "color-mix(in oklab, var(--olive-mint-200) 60%, transparent) !important",
          },
          ".cm-cursor": {
            borderLeft: "1.6px solid var(--olive-deep)",
          },
          ".cm-lintRange-error": {
            backgroundImage: "none",
            borderBottom: "2px wavy #c84d3b",
          },
        },
        { dark: false }
      ),
    []
  );

  const extensions = useMemo(
    () => [json(), linter(jsonParseLinter()), lintGutter(), theme],
    [theme]
  );

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
    if (window.confirm("Discard unsaved changes and reload from the server?")) {
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
          {dirty ? (
            <span className="font-semibold text-olive-gold">Unsaved changes</span>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-olive-mint-100 bg-white shadow-inner focus-within:border-olive-deep-soft focus-within:ring-2 focus-within:ring-olive-deep-soft/30">
        <CodeMirror
          value={text}
          onChange={setText}
          extensions={extensions}
          height="460px"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            highlightActiveLineGutter: true,
            foldGutter: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: false,
            indentOnInput: true,
            tabSize: 2,
          }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-olive-deep/55">
          Live JSON syntax highlighting + parse-error gutters. Validates
          against the schema on save.
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
