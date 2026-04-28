"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { QuizCard } from "./QuizCard";
import {
  OliveBadgeA,
  OliveBadgeB,
  OliveBadgeC,
  pickBadgeIndexForSession,
} from "./badges";
import { HolographicBadge } from "./HolographicBadge";
import {
  clickResultCtaAction,
  endSessionAction,
} from "@/app/quiz/[id]/actions";
import type { ResultRow } from "@/lib/types";

export function ResultCard({
  sessionId,
  matched,
  quizTitle,
}: {
  sessionId: string;
  matched: ResultRow | null;
  quizTitle: string;
}) {
  const badgeIdx = useMemo(() => pickBadgeIndexForSession(sessionId), [sessionId]);
  const ended = useRef(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Esc to close fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    // Lock background scroll while fullscreen
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  const renderBadge = (className?: string) =>
    badgeIdx === 0 ? (
      <OliveBadgeA className={className} />
    ) : badgeIdx === 1 ? (
      <OliveBadgeB className={className} />
    ) : (
      <OliveBadgeC className={className} />
    );

  useEffect(() => {
    if (ended.current) return;
    ended.current = true;
    void endSessionAction(sessionId).catch((e) =>
      console.error("endSession failed", e)
    );
  }, [sessionId]);

  const handleCta = async () => {
    if (!matched) return;
    try {
      await clickResultCtaAction(sessionId, matched.id);
    } catch (e) {
      console.error("clickResultCta failed", e);
    }
    if (matched.cta_url) window.open(matched.cta_url, "_blank", "noopener");
  };

  const flashShareNote = (msg: string) => {
    setShareNote(msg);
    setTimeout(() => setShareNote(null), 2500);
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `I got "${matched?.title_text ?? "a result"}" on ${quizTitle}!`;
    // Prefer native share when available (mobile, modern browsers).
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: quizTitle, text, url });
        flashShareNote("Shared!");
        return;
      } catch (e) {
        // User canceled the share sheet — DOMException name "AbortError".
        // Don't fall back to clipboard in that case.
        if ((e as Error).name === "AbortError") return;
        // Any other failure (e.g. share unsupported in iframe) → fall through.
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        flashShareNote("Copied to clipboard");
        return;
      } catch {
        // Clipboard blocked — fall through to error message.
      }
    }
    flashShareNote("Couldn't share — copy the URL manually");
  };

  return (
    <QuizCard className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive-deep/60">
        Your badge
      </p>
      {/* Holographic badge — drag/tilt to see the foil sheen shift,
          tap to enlarge fullscreen. */}
      <div className="mx-auto mb-4 mt-3 flex justify-center pb-6">
        <HolographicBadge
          width={280}
          height={168}
          onTap={() => setFullscreen(true)}
        >
          {renderBadge("h-full w-full")}
        </HolographicBadge>
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-olive-deep">
        {matched?.title_text ?? "Thanks for playing"}
      </h1>
      {matched?.description ? (
        <p className="mt-3 text-base text-olive-deep/75">{matched.description}</p>
      ) : null}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        {matched?.cta_text && matched?.cta_url ? (
          <Button
            size="lg"
            onClick={handleCta}
            className="h-12 rounded-full px-8 text-base font-semibold"
          >
            {matched.cta_text}
          </Button>
        ) : null}
        <Button
          size="lg"
          variant="outline"
          onClick={handleShare}
          className="h-12 rounded-full px-6 text-base font-semibold"
        >
          Share
        </Button>
      </div>
      {shareNote ? (
        <p className="mt-3 text-sm text-olive-deep/60">{shareNote}</p>
      ) : null}

      {/* Fullscreen badge overlay — opens on tap, Esc / backdrop / X to close */}
      {fullscreen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Badge — fullscreen"
          onClick={(e) => {
            // Close on backdrop click (not when clicking the badge itself)
            if (e.target === e.currentTarget) setFullscreen(false);
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6 backdrop-blur-md"
          style={{
            background:
              "radial-gradient(circle at center, rgba(20, 32, 22, 0.85) 0%, rgba(10, 16, 11, 0.95) 100%)",
            animation: "olive-fade-in 180ms ease-out",
          }}
        >
          <style>{`
            @keyframes olive-fade-in { from { opacity: 0; } to { opacity: 1; } }
          `}</style>

          <button
            type="button"
            onClick={() => setFullscreen(false)}
            aria-label="Close fullscreen"
            className="absolute right-5 top-5 grid size-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
            {matched?.title_text ?? "Your badge"}
          </p>

          {/* Same HolographicBadge, much bigger. Width capped to viewport. */}
          <div className="w-full max-w-[640px]" style={{ aspectRatio: "5 / 3" }}>
            <div className="h-full w-full">
              <HolographicBadge
                width={Math.min(640, typeof window === "undefined" ? 640 : window.innerWidth - 48)}
                height={Math.round(Math.min(640, typeof window === "undefined" ? 640 : window.innerWidth - 48) * 3 / 5)}
              >
                {renderBadge("h-full w-full")}
              </HolographicBadge>
            </div>
          </div>

          <p className="text-xs font-medium text-white/55">
            ✦ drag to tilt · tap outside or press Esc to close ✦
          </p>
        </div>
      ) : null}
    </QuizCard>
  );
}
