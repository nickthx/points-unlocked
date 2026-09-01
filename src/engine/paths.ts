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

/**
 * The minimum increment-multiple source amount whose effective conversion
 * covers partnerPointsNeeded — the exact INVERSE of effectivePartnerPoints.
 *
 * WHY not naive ratio division: block bonuses make the naive figure wrong by
 * up to 30,000 points on the route experts check first. Needing 60,000 Alaska
 * miles via Marriott (1:3), naive division says 60,000 × 3 = 180,000 Bonvoy —
 * but 150,000 already yields 60,000 (base 50,000 + two 5K/60K block bonuses).
 * Promos shift the answer the same way (200,000 Hilton via Amex costs 77,000
 * MR during the +30% window, 100,000 MR after it). This rationale feeds the
 * Phase 5 methodology page.
 *
 * Algorithm (RESEARCH Pattern 3): effectivePartnerPoints is monotonically
 * non-decreasing in sourcePoints (floors of non-decreasing functions), so
 * binary search over increment multiples is exact. Upper bound = the
 * base-ratio ceiling ceil(needed × den / num) rounded UP to the increment —
 * valid because block bonuses and promos only ADD partner points, so the
 * base-ratio ceiling always suffices. Search k ∈ [0, upper/increment] for the
 * smallest k with effectivePartnerPoints(k × increment) ≥ needed; the finite
 * ceiling also bounds the loop against hostile inputs (T-03-05).
 *
 * Integer-only math throughout. Returns null if even the upper bound fails —
 * defensive and unreachable for valid routes, kept as a guard branch.
 */
export function requiredSourcePoints(
  route: TransferRouteSeed,
  bonus: TransferBonusSeed | null,
  partnerPointsNeeded: number,
): number | null {
  if (partnerPointsNeeded <= 0) {
    return 0;
  }
  const increment = route.incrementPoints;
  const baseCeiling = Math.ceil(
    (partnerPointsNeeded * route.ratioDenominator) / route.ratioNumerator,
  );
  const upperK = Math.ceil(baseCeiling / increment);
  if (effectivePartnerPoints(route, bonus, upperK * increment) < partnerPointsNeeded) {
    return null; // defensive — unreachable for valid routes
  }
  let lo = 0;
  let hi = upperK;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (
      effectivePartnerPoints(route, bonus, mid * increment) >=
      partnerPointsNeeded
    ) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  return lo * increment;
}
