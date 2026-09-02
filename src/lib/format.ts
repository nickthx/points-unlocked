import type { RankedResult } from "@/engine";

// Pure display formatters for the results UI (VAL-01, VAL-04) — the ONLY
// sanctioned place UI-adjacent arithmetic lives: the final /100 inside a
// formatter, plus the documented engine-mirroring cashOutValueCents below.
// Everything else on screen is a pre-computed integer field on RankedResult;
// re-computing engine output in the UI layer is the RESEARCH anti-pattern.
//
// House style follows src/engine/valuation.ts: one exported function per
// concept, JSDoc naming the finance rule + requirement, guard clauses
// degrading hostile input to a safe value (T-04-04: never NaN/Infinity in
// rendered strings).
//
// Name-collision hazard: "@/engine" also exports a cashOutValueCents
// (spentSourcePoints, sourceProgram) — consumers importing both modules must
// alias one side. This module's variant takes the raw baseline for framing
// copy; see its JSDoc.

/** Whole-dollar USD formatter, constructed once at module scope (UI-SPEC). */
const dollarFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Thousands-separated integer formatter for point balances/requirements. */
const pointsFormatter = new Intl.NumberFormat("en-US");

/** Three-letter English month abbreviations, indexed by month number − 1. */
const MONTH_ABBREVIATIONS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Integer cents → whole-dollar currency string — "$4,500" (VAL-01).
 * Negative cents render with a leading minus per Intl default.
 *
 * Degrades non-finite input to "$0" (T-04-04 guard).
 */
export function formatDollars(cents: number): string {
  if (!Number.isFinite(cents)) {
    return dollarFormatter.format(0);
  }
  return dollarFormatter.format(cents / 100);
}

/**
 * Integer cppX100 (100 = 1.0¢/pt) → one-decimal cents string — "2.2¢"
 * (VAL-01/VAL-02 side-by-side cpp figures).
 *
 * Degrades non-finite input to "0.0¢" (T-04-04 guard).
 */
export function formatCpp(cppX100: number): string {
  if (!Number.isFinite(cppX100)) {
    return "0.0¢";
  }
  return (cppX100 / 100).toFixed(1) + "¢";
}

/**
 * Whole points → thousands-separated string — "90,000".
 *
 * Degrades non-finite input to "0" (T-04-04 guard).
 */
export function formatPoints(points: number): string {
  if (!Number.isFinite(points)) {
    return pointsFormatter.format(0);
  }
  return pointsFormatter.format(points);
}

/**
 * ISO YYYY-MM-DD → "Sep 1, 2026" verified stamp (VAL-04), by pure string
 * splitting.
 *
 * Pitfall 5: bare ISO dates fed to the Date constructor parse as UTC
 * midnight, so "2026-09-01" renders as Aug 31 in any western-hemisphere
 * timezone. No Date object is used here — verifiedAt is z.iso.date()-validated at the seed boundary, so
 * the split is safe; malformed input degrades to the raw string (T-04-05:
 * seed fields are repo-curated and already public).
 */
export function formatVerifiedDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (year === undefined || month === undefined || day === undefined) {
    return isoDate;
  }
  const monthAbbreviation = MONTH_ABBREVIATIONS[Number.parseInt(month, 10) - 1];
  const dayNumber = Number.parseInt(day, 10);
  if (monthAbbreviation === undefined || Number.isNaN(dayNumber)) {
    return isoDate;
  }
  return `${monthAbbreviation} ${dayNumber}, ${year}`;
}

/**
 * The hero wow-delta figure in integer cents — A2/Pitfall 4: the exact
 * conservative figure the ranking sorted on (`atMax ?? atMin`, identical to
 * the engine's conservativeWow key). Never render the optimistic atMin end
 * as the hero; cards render the hero number ONLY through this helper
 * (T-04-06 mitigation).
 */
export function heroDelta(result: RankedResult): number {
  return result.wowDeltaCents.atMax ?? result.wowDeltaCents.atMin;
}

/**
 * What cashing out `points` at the program's own baseline would yield, in
 * integer cents — for the "vs. ~$X cashing out" framing copy (VAL-01).
 *
 * This mirrors the engine's cash-out definition used inside wowDeltaCents
 * (points × cppX100 ÷ 100 = cents) and exists solely so the framing line is
 * presentation of an engine-consistent figure, not new math. A null baseline
 * is a partner-only currency with no cash-out path — 0 by the ratified
 * "null ⇒ 0" rule. Non-finite or non-positive inputs degrade to 0
 * (T-04-04 guard).
 */
export function cashOutValueCents(
  points: number,
  cashOutBaselineCppX100: number | null,
): number {
  if (
    cashOutBaselineCppX100 === null ||
    !Number.isFinite(points) ||
    !Number.isFinite(cashOutBaselineCppX100) ||
    points <= 0 ||
    cashOutBaselineCppX100 <= 0
  ) {
    return 0;
  }
  return Math.round((points * cashOutBaselineCppX100) / 100);
}
