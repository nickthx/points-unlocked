import { requiredSourcePoints, resolvePaths } from "./paths";
import { cppX100, effectiveCppX100, wowDeltaCents } from "./valuation";
import type {
  Balances,
  EngineDataset,
  RankInput,
  RankedResult,
  RankedResults,
  TransferPath,
  ValueRange,
} from "./types";

// The engine orchestrator (filter → resolve → value → partition → sort) —
// the exact function Phase 4's results page renders and the v2 advisor later
// calls as a tool: plain data in, plain data out. This module MUST stay
// framework- and DB-free: the only permitted imports are intra-engine modules.
// No next/react/db/app/node imports, ever — tests/engine-purity.test.ts
// enforces this boundary in CI.
//
// All finance arithmetic is integer-only (cents; cppX100). The single
// sanctioned float is RankedResult.coverage (display-only); the almost-there
// sort avoids even that by comparing coverage via integer cross-multiplication.
// Time never comes from the clock — asOf is an input (determinism contract).

/** A4/Pitfall 8 default: almost-there requires ≥75% coverage. Parameterized
 * via EngineOptions so Phase 4 can tune without engine edits. */
const DEFAULT_ALMOST_THERE_THRESHOLD = 0.75;

/**
 * Defensive balance sanitization (Pitfall 6, T-03-09): zod clamping is Phase
 * 4's boundary job, but the engine degrades gracefully on junk TODAY. Only
 * positive safe integers survive; negative/zero/NaN/Infinity/unsafe-huge
 * values are treated as absent so they can never surface as NaN valuations.
 */
function sanitizeBalances(balances: Balances): Balances {
  const sanitized: Partial<Record<string, number>> = {};
  for (const [slug, value] of Object.entries(balances)) {
    if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
      sanitized[slug] = value;
    }
  }
  return sanitized as Balances;
}

/** Positive sanitized balance backing a path's source program (0 if absent). */
function balanceFor(balances: Balances, programSlug: string): number {
  return (balances as Partial<Record<string, number>>)[programSlug] ?? 0;
}

/**
 * Source points the chosen path needs to fund an arbitrary partner-point
 * amount — used to re-derive the pointsMin end of a range on the SAME
 * route + bonus the conservative end was resolved with. Direct paths spend
 * the partner amount itself. The fallbacks are defensive-only: the route is
 * guaranteed present/active because chosenPath came out of resolvePaths.
 */
function requiredForNeed(
  path: TransferPath,
  partnerProgramSlug: string,
  partnerPointsNeeded: number,
  dataset: EngineDataset,
): number {
  if (path.kind === "direct") {
    return partnerPointsNeeded;
  }
  const route = dataset.routes.find(
    (r) =>
      r.active &&
      r.fromProgramSlug === path.fromProgramSlug &&
      r.toProgramSlug === partnerProgramSlug,
  );
  if (!route) {
    return path.requiredSourcePoints; // defensive — unreachable for real paths
  }
  return (
    requiredSourcePoints(route, path.activeBonus, partnerPointsNeeded) ??
    path.requiredSourcePoints
  );
}

/** Deterministic ASCII slug comparison (no locale machinery). */
function compareSlugs(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** A2 conservative ranking key: wow delta at pointsMax (atMin for fixed charts). */
function conservativeWow(r: RankedResult): number {
  return r.wowDeltaCents.atMax ?? r.wowDeltaCents.atMin;
}

/**
 * Rank every shippable redemption the held balances can (almost) fund.
 *
 * Pipeline per redemption:
 * 1. Filter: verifiedAt !== null (A5, fail-closed — drafts never ship;
 *    inactive routes are already excluded inside resolvePaths).
 * 2. Resolve: conservativeNeed = pointsMax ?? pointsMin (A2, CONFIRMED by
 *    Nick 2026-09-01) → resolvePaths picks the A1-cheapest funding path.
 * 3. Value: cppX100/effectiveCppX100/wowDeltaCents at both range ends
 *    (atMax null for fixed charts).
 * 4. Partition: coverage ≥ 1 → bookableNow; threshold ≤ coverage < 1 →
 *    almostThere (with pointsAway = requiredSourcePoints − balance); else drop.
 * 5. Sort: bookableNow by conservative wow delta desc; almostThere by
 *    coverage desc (integer cross-multiplication); ties by slug ascending.
 */
export function rankRedemptions(input: RankInput): RankedResults {
  const { dataset, asOf } = input;
  const threshold =
    input.options?.almostThereThreshold ?? DEFAULT_ALMOST_THERE_THRESHOLD;
  const balances = sanitizeBalances(input.balances);

  const bookableNow: RankedResult[] = [];
  const almostThere: { result: RankedResult; balance: number }[] = [];

  for (const redemption of dataset.redemptions) {
    if (redemption.verifiedAt === null) {
      continue; // A5: drafts are filtered fail-closed
    }

    const conservativeNeed = redemption.pointsMax ?? redemption.pointsMin; // A2
    const resolved = resolvePaths(
      redemption.partnerProgramSlug,
      conservativeNeed,
      balances,
      dataset,
      asOf,
    );
    if (resolved === null) {
      continue; // no held program reaches this partner
    }
    const { chosenPath, alternatePaths } = resolved;

    const sourceProgram = dataset.programs.find(
      (p) => p.slug === chosenPath.fromProgramSlug,
    );
    if (sourceProgram === undefined) {
      continue; // defensive fail-closed — dataset programs are CI-validated
    }

    const balance = balanceFor(balances, chosenPath.fromProgramSlug);
    const required = chosenPath.requiredSourcePoints;
    // The single sanctioned float; required 0 (need ≤ 0, schema-impossible)
    // degenerates to full coverage.
    const coverage = required === 0 ? 1 : balance / required;

    const fare = redemption.cashFareCents;
    const taxes = redemption.taxesFeesCents;

    let effective: ValueRange;
    let wow: ValueRange;
    if (redemption.pointsMax === null) {
      // Fixed chart: the conservative resolution IS the pointsMin figure.
      effective = {
        atMin: effectiveCppX100(fare, taxes, required),
        atMax: null,
      };
      wow = {
        atMin: wowDeltaCents(fare, taxes, required, sourceProgram),
        atMax: null,
      };
    } else {
      const requiredAtMin = requiredForNeed(
        chosenPath,
        redemption.partnerProgramSlug,
        redemption.pointsMin,
        dataset,
      );
      effective = {
        atMin: effectiveCppX100(fare, taxes, requiredAtMin),
        atMax: effectiveCppX100(fare, taxes, required),
      };
      wow = {
        atMin: wowDeltaCents(fare, taxes, requiredAtMin, sourceProgram),
        atMax: wowDeltaCents(fare, taxes, required, sourceProgram),
      };
    }

    const base = {
      redemption,
      chosenPath,
      alternatePaths,
      pointsNeeded: { min: redemption.pointsMin, max: redemption.pointsMax },
      cppX100: {
        atMin: cppX100(fare, taxes, redemption.pointsMin),
        atMax:
          redemption.pointsMax === null
            ? null
            : cppX100(fare, taxes, redemption.pointsMax),
      },
      effectiveCppX100: effective,
      wowDeltaCents: wow,
      coverage,
    };

    if (coverage >= 1) {
      bookableNow.push({ ...base, pointsAway: null });
    } else if (coverage >= threshold) {
      almostThere.push({
        result: { ...base, pointsAway: required - balance },
        balance,
      });
    }
    // else: below the almost-there floor — dropped (Pitfall 8).
  }

  bookableNow.sort((a, b) => {
    const wowA = conservativeWow(a);
    const wowB = conservativeWow(b);
    if (wowA !== wowB) {
      return wowB - wowA; // wow delta descending
    }
    return compareSlugs(a.redemption.slug, b.redemption.slug);
  });

  almostThere.sort((a, b) => {
    // Coverage descending WITHOUT floats: balA/reqA > balB/reqB ⇔
    // balA × reqB > balB × reqA (all positive integers).
    const crossA = a.balance * b.result.chosenPath.requiredSourcePoints;
    const crossB = b.balance * a.result.chosenPath.requiredSourcePoints;
    if (crossA !== crossB) {
      return crossB - crossA;
    }
    return compareSlugs(a.result.redemption.slug, b.result.redemption.slug);
  });

  return {
    bookableNow,
    almostThere: almostThere.map((entry) => entry.result),
  };
}
