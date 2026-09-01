import type {
  ProgramSeed,
  RedemptionSeed,
  TransferBonusSeed,
  TransferRouteSeed,
} from "../data/types";

// Public contracts for the pure valuation & ranking engine (Phase 3).
// Every later engine module (paths/valuation/ranking/index) implements against
// these shapes; Phase 4 UI and the v2 advisor consume them as plain data.
//
// This module MUST stay framework- and DB-free: the only permitted import is
// the type-only seed-type import above from ../data/types (safe despite that
// file importing zod at runtime — type-only imports erase at compile time).
// No next/react/db/app/node imports, ever — tests/engine-purity.test.ts
// enforces this boundary in CI.
//
// All engine arithmetic is integer-only (cents, points, cppX100 where
// 100 = 1.0¢/pt): these numbers are the product's finance-credibility claim,
// so no float drift is tolerated. The single sanctioned float is
// RankedResult.coverage, which is display-only and never ranked on directly.
//
// Ratified rulings encoded by these contracts (methodology sign-off,
// CONFIRMED by Nick 2026-09-01):
// - A1: "cheapest transfer path" = minimum raw requiredSourcePoints; ties
//   break to direct-use first, then lowest fromProgramSlug alphabetically.
// - A2: bookability and ranking gate on the conservative end
//   (pointsMax ?? pointsMin); valuations are returned at BOTH ends so the UI
//   renders honest ranges.
// - A3: overlapping active promos on one route → apply the highest
//   bonusPercent (no-veto 2026-09-01).
// - A5: the engine itself filters verifiedAt:null drafts and active:false
//   routes — fail-closed, callers never see unshippable rows (no-veto).
// - A7: single-hop transfers only; multi-hop chains (Chase→Marriott→Alaska)
//   are out of scope for v1 path resolution (no-veto).

/**
 * The 8 canonical user-enterable program slugs — the fixed contract frozen by
 * tests/seed-data.test.ts (balance-entry form surface). Do not rename.
 */
export type EnterableProgramSlug =
  | "chase-ur"
  | "amex-mr"
  | "capital-one"
  | "citi-ty"
  | "bilt"
  | "world-of-hyatt"
  | "hilton-honors"
  | "marriott-bonvoy";

/**
 * User-entered point balances, keyed by enterable program slug.
 * Values are whole points (non-negative integers); absent key = no balance.
 */
export type Balances = Partial<Record<EnterableProgramSlug, number>>;

/**
 * The full in-memory dataset the engine ranks against. Mirrors the
 * (non-exported) Dataset shape in src/data/types.ts consumed by
 * validateDataset — same four arrays, same seed types.
 */
export interface EngineDataset {
  programs: ProgramSeed[];
  routes: TransferRouteSeed[];
  bonuses: TransferBonusSeed[];
  redemptions: RedemptionSeed[];
}

/**
 * One way to fund a redemption from a held balance: either direct use of the
 * partner currency ("direct") or a single-hop transfer ("transfer" — A7:
 * multi-hop chains are out of scope).
 */
export interface TransferPath {
  kind: "direct" | "transfer";
  /** The held program whose balance funds this path (RANK-03 tag). */
  fromProgramSlug: string;
  /**
   * Route identity in the existing `${from}→${to}` Unicode-arrow format
   * (e.g. "amex-mr→hilton-honors"); absent for kind "direct" (RANK-04).
   */
  routeKey?: string;
  /**
   * Raw source points needed to fund the redemption via this path —
   * increment-aligned and promo-adjusted. Whole points (integer).
   * A1 (CONFIRMED by Nick 2026-09-01): the chosen path minimizes this raw
   * figure; ties break to direct-use first, then lowest fromProgramSlug
   * alphabetically. (Rejected: opportunity-cost-cheapest — it makes
   * null-baseline programs look "free" and lets path choice inflate the wow
   * delta.)
   */
  requiredSourcePoints: number;
  /**
   * The promo applied to this path, surfaced for display (VAL-05); null when
   * no bonus is active at asOf. A3 (no-veto 2026-09-01): if multiple promos
   * overlap on one route, the highest bonusPercent wins.
   */
  activeBonus: TransferBonusSeed | null;
}

/**
 * A valuation evaluated at both ends of a dynamic award's points range.
 * atMax is null when redemption.pointsMax is null (fixed-price chart —
 * atMin is the only figure). Units are whatever the containing field says
 * (cppX100 or cents); both ends are integers.
 */
export interface ValueRange {
  atMin: number;
  atMax: number | null;
}

/**
 * One ranked redemption with its funding path and valuations.
 */
export interface RankedResult {
  /** Carries availabilityRating, verifiedAt, bookingHint for display. */
  redemption: RedemptionSeed;
  /** The A1-cheapest path (minimum raw requiredSourcePoints). */
  chosenPath: TransferPath;
  /** Every other viable path, for transparency (cheap at ≤46 routes). */
  alternatePaths: TransferPath[];
  /**
   * Partner points required: min = redemption.pointsMin, max =
   * redemption.pointsMax (null for fixed-price charts). Whole points.
   * A2 (CONFIRMED by Nick 2026-09-01): bookability and ranking gate on the
   * conservative end (pointsMax ?? pointsMin) — a dynamic award is
   * "bookable now" only if the balance covers pointsMax. (Rejected:
   * optimistic pointsMin gating — overpromises on exactly the programs
   * where overpromising hurts most.)
   */
  pointsNeeded: { min: number; max: number | null };
  /**
   * Partner-point cents-per-point ×100 (100 = 1.0¢/pt), at both range ends
   * (VAL-02). Integer.
   */
  cppX100: ValueRange;
  /**
   * Source-point cents-per-point ×100 (100 = 1.0¢/pt) through the chosen
   * path — the promo-honest figure (VAL-05). Integer.
   */
  effectiveCppX100: ValueRange;
  /**
   * The wow delta in cents: redemption value minus the cash-out value of the
   * source points spent, at both range ends. Integer cents.
   */
  wowDeltaCents: ValueRange;
  /**
   * balance ÷ conservative requirement (A2 end). The single sanctioned
   * float in the engine — display-only, never used as a ranking key.
   */
  coverage: number;
  /**
   * How many more source points are needed, denominated in the chosen
   * path's source currency. Non-null ONLY for almost-there results; null
   * for bookable-now. Whole points (integer).
   */
  pointsAway: number | null;
}

/**
 * Engine tuning knobs.
 */
export interface EngineOptions {
  /**
   * Minimum coverage (balance ÷ conservative requirement) for a
   * non-bookable result to appear in almostThere. Default 0.75.
   */
  almostThereThreshold?: number;
}

/**
 * The engine's public result: bookable-now results ranked by wow delta,
 * plus the almost-there tier (coverage ≥ threshold but not bookable under
 * the A2 conservative gate).
 */
export interface RankedResults {
  bookableNow: RankedResult[];
  almostThere: RankedResult[];
}

/**
 * The engine's single entry-point input.
 */
export interface RankInput {
  balances: Balances;
  dataset: EngineDataset;
  /**
   * ISO YYYY-MM-DD date string compared lexically against bonus
   * startDate/endDate windows. The engine never reads the clock —
   * determinism is a contract (asOf is always an input).
   */
  asOf: string;
  options?: EngineOptions;
}
