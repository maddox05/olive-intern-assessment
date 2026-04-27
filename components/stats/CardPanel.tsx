import { ScorePanel } from "./ScorePanel";
import type { ScoreDistribution } from "@/lib/analytics-queries";

/**
 * Card quizzes use the same data path as score quizzes (per locked decision
 * #6 + #18). The panel renders identically — the badge SVG randomness is
 * decoration-only and isn't analytic data.
 */
export function CardPanel({
  data,
  ctaClickRatePct,
}: {
  data: ScoreDistribution;
  ctaClickRatePct: number | null;
}) {
  return (
    <ScorePanel data={data} variant="card" ctaClickRatePct={ctaClickRatePct} />
  );
}
