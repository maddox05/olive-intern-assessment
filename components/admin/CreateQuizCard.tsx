"use client";
import { CreateQuizDialog } from "./CreateQuizDialog";
import { useState } from "react";

export function CreateQuizCard() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex h-full min-h-[260px] w-full flex-col items-center justify-center gap-3 rounded-[1.25rem] border-2 border-dashed border-olive-deep/25 bg-white/40 p-6 text-olive-deep transition hover:-translate-y-0.5 hover:border-olive-deep hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-deep-soft"
      >
        <span className="grid size-12 place-items-center rounded-full bg-olive-deep text-white shadow transition group-hover:scale-105">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
        <p className="text-base font-bold">Create a new quiz</p>
        <p className="max-w-[18ch] text-center text-xs text-olive-deep/60">
          Pick a type, describe what you want, and we&apos;ll generate it.
        </p>
      </button>
      {open ? <CreateQuizDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}
