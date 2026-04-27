"use client";
import type { ClientMeta } from "@/app/quiz/[id]/actions";

/**
 * Lightweight UA parsing, no extra dependency. Just enough to bucket
 * sessions on the analytics page. Falls back to "Other" for unknowns.
 */
function parseDevice(ua: string): string {
  // iPadOS 13+ Safari sends a Mac UA without "iPad" — disambiguate via
  // touchPoints. (https://stackoverflow.com/a/58065241)
  if (
    typeof navigator !== "undefined" &&
    /Mac/.test(ua) &&
    (navigator.maxTouchPoints ?? 0) > 1
  ) {
    return "Tablet";
  }
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "Mobile";
  if (/iPad|Tablet/i.test(ua)) return "Tablet";
  if (/Mac|Win|Linux|X11/i.test(ua)) return "Desktop";
  return "Other";
}

function parseBrowser(ua: string): string {
  // Order matters — Edge contains "Chrome", Chrome contains "Safari" UA tokens
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  return "Other";
}

function parseReferrer(raw: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    // Drop our own domain — those aren't really referrers
    if (typeof window !== "undefined" && u.host === window.location.host) {
      return null;
    }
    return u.host;
  } catch {
    // Don't leak the raw URL (may contain UTM, session tokens, PII).
    return "(other)";
  }
}

export function getClientMeta(): ClientMeta {
  if (typeof navigator === "undefined") {
    return { device: null, browser: null, referrer: null, user_agent: null };
  }
  const ua = navigator.userAgent ?? "";
  return {
    device: parseDevice(ua),
    browser: parseBrowser(ua),
    referrer:
      typeof document !== "undefined" ? parseReferrer(document.referrer) : null,
    user_agent: ua,
  };
}
