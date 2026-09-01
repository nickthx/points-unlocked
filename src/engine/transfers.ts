import type { TransferRouteSeed } from "../data/types";

// Pure transfer-math engine — Phase 3's foundation (path resolution and the
// v2 advisor build on these exact signatures). This module MUST stay
// framework- and DB-free: the only permitted import is the TransferRouteSeed
// type (type-only) from ../data/types. No next/react/db/app imports, ever —
// the purity gate in tests enforces this boundary.
//
// All arithmetic is integer-only via Math.floor: these numbers are the
// product's finance-credibility claim, so no float drift is tolerated.

/**
 * Convert source-program points into partner points along a transfer route.
 *
 * Semantics (frozen by tests/transfers.test.ts against real seed rows):
 * 1. Floor the source balance to the route's transfer increment
 *    (A1, confirmed 2026-09-01 — e.g. Marriott moves in 3000-point blocks).
 * 2. Apply the integer ratio: floor(transferable × numerator / denominator).
 * 3. Add the structural block bonus (e.g. Marriott's 5000 miles per full
 *    60000 points transferred) when both bonus fields are set.
 */
export function computePartnerPoints(
  route: TransferRouteSeed,
  sourcePoints: number,
): number {
  const transferable =
    Math.floor(sourcePoints / route.incrementPoints) * route.incrementPoints;
  const base = Math.floor(
    (transferable * route.ratioNumerator) / route.ratioDenominator,
  );
  const bonus =
    route.bonusMilesPerBlock !== null && route.bonusBlockPoints !== null
      ? Math.floor(transferable / route.bonusBlockPoints) *
        route.bonusMilesPerBlock
      : 0;
  return base + bonus;
}

/**
 * Apply a promotional transfer bonus to a base-CONVERTED partner amount.
 *
 * Assumption A4 (CONFIRMED by Nick 2026-09-01): promotional bonuses
 * multiply the base-converted amount only — never the source points — and do
 * NOT stack with structural block bonuses. Callers pass the base conversion
 * (without block bonus) when a promo applies; the engine never compounds both.
 */
export function applyPromoBonus(
  basePartnerPoints: number,
  bonusPercent: number,
): number {
  return Math.floor((basePartnerPoints * (100 + bonusPercent)) / 100);
}
