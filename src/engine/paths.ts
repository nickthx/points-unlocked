import type { TransferBonusSeed, TransferRouteSeed } from "../data/types";
import { applyPromoBonus, computePartnerPoints } from "./transfers";

// Pure path-resolution engine — composes the frozen Phase 2 transfer
// primitives into promo-aware effective conversion, exact inverse transfer
// math, and A1 cheapest-path selection. This module MUST stay framework- and
// DB-free: the only permitted imports are intra-engine modules and type-only
// seed types from ../data/types. No next/react/db/app/node imports, ever —
// tests/engine-purity.test.ts enforces this boundary in CI.
//
// All arithmetic is integer-only via Math.floor/Math.ceil on integers: these
// numbers are the product's finance-credibility claim, so no float drift is
// tolerated. Time never comes from the clock — bonus windows compare an
// asOf ISO date string lexically (determinism is a contract).

/**
 * Find the promo bonus active on a route at a given date, if any.
 *
 * Date windows are inclusive on both ends and compared LEXICALLY as ISO
 * YYYY-MM-DD strings — the engine never parses Dates (no timezone drift,
 * no clock reads).
 *
 * A3 (no-veto 2026-09-01): if multiple promos overlap on one route at asOf,
 * the highest bonusPercent wins.
 */
export function activeBonusFor(
  route: TransferRouteSeed,
  bonuses: TransferBonusSeed[],
  asOf: string,
): TransferBonusSeed | null {
  let best: TransferBonusSeed | null = null;
  for (const b of bonuses) {
    if (
      b.fromProgramSlug === route.fromProgramSlug &&
      b.toProgramSlug === route.toProgramSlug &&
      b.startDate <= asOf &&
      asOf <= b.endDate
    ) {
      if (best === null || b.bonusPercent > best.bonusPercent) {
        best = b;
      }
    }
  }
  return best;
}

/**
 * Convert source points to partner points along a route, honoring an active
 * promo bonus when present.
 *
 * A4 (CONFIRMED by Nick 2026-09-01): promotional bonuses multiply the
 * base-converted amount ONLY and never stack with structural block bonuses
 * (e.g. Marriott's 5K per 60K). When a promo applies, the block-bonus fields
 * are stripped before conversion so applyPromoBonus composes on the base
 * ratio alone — 150,000 Bonvoy under a 20% promo yields floor(50,000 × 1.20)
 * = 60,000 miles, never (50,000 + 10,000) × 1.20 = 72,000.
 */
export function effectivePartnerPoints(
  route: TransferRouteSeed,
  bonus: TransferBonusSeed | null,
  sourcePoints: number,
): number {
  if (bonus === null) {
    return computePartnerPoints(route, sourcePoints);
  }
  const baseOnly = computePartnerPoints(
    { ...route, bonusMilesPerBlock: null, bonusBlockPoints: null },
    sourcePoints,
  );
  return applyPromoBonus(baseOnly, bonus.bonusPercent);
}
