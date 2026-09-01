import type { ProgramSeed } from "../data/types";

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

/**
 * What the spent source points would have been worth cashed out, in integer
 * cents, using the source program's OWN baseline — never a flat 1¢/pt.
 * (Pitfall: a flat baseline is the attackable-methodology failure — it
 * overstates Amex deltas and understates Chase/Citi ones.)
 *
 * cashOutBaselineCppX100 === null means a partner-only currency with no
 * cash-out path (hotel programs): the cash-out value is 0 by the ratified
 * "null ⇒ 0" rule, so the wow delta is the full net cash value.
 */
export function cashOutValueCents(
  spentSourcePoints: number,
  sourceProgram: ProgramSeed,
): number {
  return sourceProgram.cashOutBaselineCppX100 === null
    ? 0
    : Math.floor(
        (spentSourcePoints * sourceProgram.cashOutBaselineCppX100) / 100,
      );
}

/**
 * The wow delta in integer cents — RANK-01's definition: transfer-partner
 * value minus the cash-out value of the source points spent.
 *
 * Taxes are subtracted on the value side to stay consistent with the cpp
 * numerator: you pay taxes/fees in cash whether you book with points or
 * dollars, so they are not part of what the points buy.
 *
 * spentSourcePoints is the chosen path's increment-aligned
 * requiredSourcePoints — NOT the user's full balance (spending 90K of a
 * 200K balance forgoes only 90K points' worth of cash-out).
 */
export function wowDeltaCents(
  cashFareCents: number,
  taxesFeesCents: number,
  spentSourcePoints: number,
  sourceProgram: ProgramSeed,
): number {
  return (
    cashFareCents -
    taxesFeesCents -
    cashOutValueCents(spentSourcePoints, sourceProgram)
  );
}
