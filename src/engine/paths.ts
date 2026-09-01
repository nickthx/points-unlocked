import type { TransferBonusSeed, TransferRouteSeed } from "../data/types";
import { applyPromoBonus, computePartnerPoints } from "./transfers";
import type { Balances, EngineDataset, TransferPath } from "./types";

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

/** Positive held balance for a program, or null when absent/non-positive. */
function heldBalance(balances: Balances, programSlug: string): number | null {
  const balance = (balances as Partial<Record<string, number>>)[programSlug];
  return typeof balance === "number" && balance > 0 ? balance : null;
}

/**
 * Preference order between two candidate paths with equal affordability
 * status (A1, CONFIRMED by Nick 2026-09-01): fewer raw source points wins;
 * ties break to direct-use first, then lowest fromProgramSlug (plain < on
 * ASCII slugs — no locale machinery).
 */
function prefersByCost(a: TransferPath, b: TransferPath): boolean {
  if (a.requiredSourcePoints !== b.requiredSourcePoints) {
    return a.requiredSourcePoints < b.requiredSourcePoints;
  }
  if (a.kind !== b.kind) {
    return a.kind === "direct";
  }
  return a.fromProgramSlug < b.fromProgramSlug;
}

/**
 * Resolve every way the held balances can fund partnerPointsNeeded in the
 * partner program, and pick the A1-cheapest.
 *
 * Candidates are direct use of the partner currency (when held) plus every
 * ACTIVE single-hop route into the partner from a positively-held program
 * (A5 fail-closed: active:false routes never surface; A7: multi-hop chains
 * like Chase→Marriott→Alaska are out of scope for v1).
 *
 * Selection (A1, CONFIRMED by Nick 2026-09-01): among AFFORDABLE candidates
 * (balance covers requiredSourcePoints) the minimum raw requiredSourcePoints
 * wins — ties break to direct-use first, then lowest fromProgramSlug. When
 * nothing is affordable, the maximum-coverage candidate (balance ÷ required,
 * compared by integer cross-multiplication — no float is stored) is chosen so
 * callers can compute an honest points-away figure. Returns null when no held
 * program reaches the partner at all.
 */
export function resolvePaths(
  partnerProgramSlug: string,
  partnerPointsNeeded: number,
  balances: Balances,
  dataset: EngineDataset,
  asOf: string,
): { chosenPath: TransferPath; alternatePaths: TransferPath[] } | null {
  const candidates: TransferPath[] = [];

  const directBalance = heldBalance(balances, partnerProgramSlug);
  if (directBalance !== null) {
    candidates.push({
      kind: "direct",
      fromProgramSlug: partnerProgramSlug,
      requiredSourcePoints: partnerPointsNeeded,
      activeBonus: null,
    });
  }

  for (const route of dataset.routes) {
    if (route.toProgramSlug !== partnerProgramSlug || !route.active) {
      continue; // A5: inactive routes are filtered fail-closed
    }
    const balance = heldBalance(balances, route.fromProgramSlug);
    if (balance === null) {
      continue;
    }
    const bonus = activeBonusFor(route, dataset.bonuses, asOf);
    const required = requiredSourcePoints(route, bonus, partnerPointsNeeded);
    if (required === null) {
      continue;
    }
    candidates.push({
      kind: "transfer",
      fromProgramSlug: route.fromProgramSlug,
      routeKey: `${route.fromProgramSlug}→${route.toProgramSlug}`,
      requiredSourcePoints: required,
      activeBonus: bonus,
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  const isAffordable = (p: TransferPath): boolean =>
    (heldBalance(balances, p.fromProgramSlug) ?? 0) >= p.requiredSourcePoints;

  // Coverage comparison without floats: balA/reqA > balB/reqB ⇔
  // balA × reqB > balB × reqA (all positive integers).
  const prefersByCoverage = (a: TransferPath, b: TransferPath): boolean => {
    const balA = heldBalance(balances, a.fromProgramSlug) ?? 0;
    const balB = heldBalance(balances, b.fromProgramSlug) ?? 0;
    const crossA = balA * b.requiredSourcePoints;
    const crossB = balB * a.requiredSourcePoints;
    if (crossA !== crossB) {
      return crossA > crossB;
    }
    if (a.kind !== b.kind) {
      return a.kind === "direct";
    }
    return a.fromProgramSlug < b.fromProgramSlug;
  };

  const affordable = candidates.filter(isAffordable);
  const pool = affordable.length > 0 ? affordable : candidates;
  const prefers = affordable.length > 0 ? prefersByCost : prefersByCoverage;

  let chosen = pool[0];
  for (const candidate of pool.slice(1)) {
    if (prefers(candidate, chosen)) {
      chosen = candidate;
    }
  }

  const alternatePaths = candidates
    .filter((p) => p !== chosen)
    .sort((a, b) => {
      if (a.requiredSourcePoints !== b.requiredSourcePoints) {
        return a.requiredSourcePoints - b.requiredSourcePoints;
      }
      return a.fromProgramSlug < b.fromProgramSlug ? -1 : 1;
    });

  return { chosenPath: chosen, alternatePaths };
}
