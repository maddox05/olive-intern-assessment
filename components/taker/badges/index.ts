import { OliveBadgeA } from "./OliveBadgeA";
import { OliveBadgeB } from "./OliveBadgeB";
import { OliveBadgeC } from "./OliveBadgeC";

const BADGES = [OliveBadgeA, OliveBadgeB, OliveBadgeC] as const;

/**
 * Pick one of the 3 olive-gold badges. Stable per session-id (so refreshes
 * show the same badge), but pseudo-random across users — exactly the
 * locked-decision #20 + #9c behavior.
 */
export function pickBadgeForSession(sessionId: string) {
  let h = 0;
  for (let i = 0; i < sessionId.length; i++) {
    h = (h * 31 + sessionId.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(h) % BADGES.length;
  return BADGES[idx];
}

export { OliveBadgeA, OliveBadgeB, OliveBadgeC };
