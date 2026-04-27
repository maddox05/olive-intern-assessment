export { OliveBadgeA } from "./OliveBadgeA";
export { OliveBadgeB } from "./OliveBadgeB";
export { OliveBadgeC } from "./OliveBadgeC";

export const BADGE_COUNT = 3;

/**
 * Pick a stable index 0..2 for one of the 3 olive-gold badges. Stable per
 * session-id (so refreshes show the same badge), but pseudo-random across
 * users. The renderer renders the matching badge component statically —
 * returning a component type from a hook trips React's static-components
 * lint rule.
 */
export function pickBadgeIndexForSession(sessionId: string): number {
  let h = 0;
  for (let i = 0; i < sessionId.length; i++) {
    h = (h * 31 + sessionId.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % BADGE_COUNT;
}
