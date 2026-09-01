// Pure valuation math — the product's finance-credibility claim (VAL-02).
// This module MUST stay framework- and DB-free: no next/react/db/app/node
// imports, ever — tests/engine-purity.test.ts enforces this boundary in CI.
//
// All arithmetic is integer-only (cents; cppX100 where 100 = 1.0¢/pt):
// these numbers are what Phase 4 displays and what the Phase 5 methodology
// page defends, so no float drift is tolerated. Non-finite or non-positive
// inputs degrade to 0 — the engine never emits NaN or Infinity.

/**
 * Cents-per-point of a redemption in partner points, as integer cppX100
 * (100 = 1.0 cents/pt) — VAL-02.
 *
 * TPG convention, verbatim: cpp = (cash fare − taxes/fees) ÷ points × 100.
 * Unit mapping: with money already in cents, the "×100" of the dollars-form
 * cancels against the cents conversion; the surviving ×100 here is the
 * cppX100 scale — same scale as ProgramSeed.cashOutBaselineCppX100.
 * (Pitfall 1: applying ×100 twice yields 93_333 instead of 933 for the ANA
 * business anchor — pinned by tests/engine-valuation.test.ts.)
 *
 * Returns 0 when partnerPoints ≤ 0 or any input is non-finite.
 */
export function cppX100(
  cashFareCents: number,
  taxesFeesCents: number,
  partnerPoints: number,
): number {
  if (
    !Number.isFinite(cashFareCents) ||
    !Number.isFinite(taxesFeesCents) ||
    !Number.isFinite(partnerPoints) ||
    partnerPoints <= 0
  ) {
    return 0;
  }
  return Math.round(((cashFareCents - taxesFeesCents) * 100) / partnerPoints);
}

/**
 * Cents-per-point of a redemption per SOURCE point spent through a transfer
 * path, as integer cppX100 — the identical TPG formula over
 * requiredSourcePoints instead of partner points.
 *
 * This is the number an active transfer bonus improves (VAL-05): a promo
 * lowers the source points needed to fund the same fare, so per-source-point
 * value rises while partner-point cpp stays fixed. Both figures are returned
 * to callers deliberately — cppX100 is redemption-intrinsic; effectiveCppX100
 * is path-dependent.
 *
 * Returns 0 when requiredSourcePoints ≤ 0 or any input is non-finite.
 */
export function effectiveCppX100(
  cashFareCents: number,
  taxesFeesCents: number,
  requiredSourcePoints: number,
): number {
  return cppX100(cashFareCents, taxesFeesCents, requiredSourcePoints);
}
