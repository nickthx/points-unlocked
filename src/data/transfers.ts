import type { TransferBonusSeed, TransferRouteSeed } from "./types";

// Transfer-route graph (DATA-02 structural model) + dated draft promo bonuses
// (DATA-03 manual-override rows). Every quantity is an integer; ratio is
// ratioNumerator partner units per ratioDenominator source points.
// All partner lists, ratios, increments, and transfer times are Claude drafts
// [ASSUMED A1/A2/A5] pending Nick's DATA-04 verification pass — sourceNote and
// notes fields name what to check. Bilt routes reflect the 2026 "Bilt 2.0"
// (Cardless-era) partner reality as best known: mostly 1:1 with exceptions
// (e.g. Accor 3:2, not modeled yet) — verify the live partner list.

// Standard-route helper: 1:1 ratio, 1000-point increment [ASSUMED A2 — Nick
// verifies per route], no block bonus. Edge cases override explicitly below.
function route(
  fromProgramSlug: string,
  toProgramSlug: string,
  overrides: Partial<TransferRouteSeed> = {},
): TransferRouteSeed {
  return {
    fromProgramSlug,
    toProgramSlug,
    ratioNumerator: 1,
    ratioDenominator: 1,
    incrementPoints: 1000,
    bonusMilesPerBlock: null,
    bonusBlockPoints: null,
    transferTimeDays: null,
    active: true,
    notes: null,
    ...overrides,
  };
}

export const routes = [
  // ── Chase Ultimate Rewards ───────────────────────────────────────────────
  route("chase-ur", "world-of-hyatt", { transferTimeDays: 0 }),
  route("chase-ur", "united-mileageplus", { transferTimeDays: 0 }),
  route("chase-ur", "virgin-atlantic", { transferTimeDays: 0 }),
  route("chase-ur", "air-france-flying-blue", { transferTimeDays: 0 }),
  route("chase-ur", "british-airways-avios", { transferTimeDays: 0 }),
  route("chase-ur", "singapore-krisflyer", { transferTimeDays: 1 }),
  route("chase-ur", "emirates-skywards", { transferTimeDays: 0 }),
  route("chase-ur", "air-canada-aeroplan", { transferTimeDays: 0 }),
  route("chase-ur", "marriott-bonvoy", {
    transferTimeDays: 2,
    notes: "UR→Bonvoy is 1:1 but usually poor value; kept for completeness. Verify still offered.",
  }),

  // ── Amex Membership Rewards ──────────────────────────────────────────────
  // MANDATORY edge case (DATA-02): MR→Hilton transfers at 1:2 (2 Hilton
  // points per 1 MR) — modeled as ratioNumerator 2 / ratioDenominator 1.
  route("amex-mr", "hilton-honors", {
    ratioNumerator: 2,
    ratioDenominator: 1,
    incrementPoints: 1000,
    transferTimeDays: 0,
    notes: "1 MR → 2 Hilton points. Verify the 1:2 rate is still current.",
  }),
  route("amex-mr", "ana-mileage-club", {
    transferTimeDays: 2,
    notes: "ANA transfers historically take ~48h and are irreversible. Verify time + 1:1 rate.",
  }),
  route("amex-mr", "virgin-atlantic", { transferTimeDays: 0 }),
  route("amex-mr", "air-france-flying-blue", { transferTimeDays: 0 }),
  route("amex-mr", "british-airways-avios", { transferTimeDays: 0 }),
  route("amex-mr", "delta-skymiles", { transferTimeDays: 0 }),
  route("amex-mr", "singapore-krisflyer", { transferTimeDays: 1 }),
  route("amex-mr", "avianca-lifemiles", { transferTimeDays: 0 }),
  route("amex-mr", "air-canada-aeroplan", { transferTimeDays: 0 }),
  route("amex-mr", "cathay-asia-miles", { transferTimeDays: 1 }),
  route("amex-mr", "emirates-skywards", { transferTimeDays: 0 }),
  route("amex-mr", "marriott-bonvoy", { transferTimeDays: 1 }),

  // ── Capital One Miles ────────────────────────────────────────────────────
  route("capital-one", "air-canada-aeroplan", { transferTimeDays: 0 }),
  route("capital-one", "air-france-flying-blue", { transferTimeDays: 0 }),
  route("capital-one", "british-airways-avios", { transferTimeDays: 0 }),
  route("capital-one", "avianca-lifemiles", { transferTimeDays: 0 }),
  route("capital-one", "singapore-krisflyer", { transferTimeDays: 1 }),
  route("capital-one", "turkish-miles-smiles", { transferTimeDays: 0 }),
  route("capital-one", "cathay-asia-miles", { transferTimeDays: 1 }),
  route("capital-one", "emirates-skywards", { transferTimeDays: 0 }),
  route("capital-one", "virgin-atlantic", {
    transferTimeDays: 1,
    notes: "Capital One reaches Virgin Atlantic via Virgin Red — verify the 2026 path and rate.",
  }),

  // ── Citi ThankYou Points ─────────────────────────────────────────────────
  route("citi-ty", "air-france-flying-blue", { transferTimeDays: 0 }),
  route("citi-ty", "avianca-lifemiles", { transferTimeDays: 0 }),
  route("citi-ty", "cathay-asia-miles", { transferTimeDays: 1 }),
  route("citi-ty", "emirates-skywards", { transferTimeDays: 0 }),
  route("citi-ty", "singapore-krisflyer", { transferTimeDays: 1 }),
  route("citi-ty", "turkish-miles-smiles", { transferTimeDays: 0 }),
  route("citi-ty", "virgin-atlantic", { transferTimeDays: 0 }),

  // ── Bilt Rewards (Bilt 2.0, 2026 — verify live partner list, A5) ─────────
  // MANDATORY edge case (DATA-02): at least one Bilt→airline route at 1:1.
  route("bilt", "alaska-mileage-plan", {
    ratioNumerator: 1,
    ratioDenominator: 1,
    incrementPoints: 1000,
    transferTimeDays: 0,
    notes: "Bilt 2.0 is mostly 1:1 with exceptions (e.g. Accor 3:2, not modeled). Verify Alaska survived the Cardless-era partner changes.",
  }),
  route("bilt", "world-of-hyatt", { transferTimeDays: 0 }),
  route("bilt", "united-mileageplus", {
    transferTimeDays: 0,
    notes: "United joined Bilt in 2024 — verify still a partner post-Bilt 2.0.",
  }),
  route("bilt", "air-france-flying-blue", { transferTimeDays: 0 }),
  route("bilt", "air-canada-aeroplan", { transferTimeDays: 0 }),
  route("bilt", "virgin-atlantic", { transferTimeDays: 0 }),
  route("bilt", "british-airways-avios", { transferTimeDays: 0 }),

  // ── Marriott Bonvoy → airlines ───────────────────────────────────────────
  // MANDATORY edge case (DATA-02): 3 Bonvoy → 1 mile (ratio 1/3), transfers
  // in 3000-point increments [ASSUMED A1 — Nick confirms increment], plus a
  // structural block bonus of 5000 miles per 60000 points transferred.
  route("marriott-bonvoy", "alaska-mileage-plan", {
    ratioNumerator: 1,
    ratioDenominator: 3,
    incrementPoints: 3000,
    bonusMilesPerBlock: 5000,
    bonusBlockPoints: 60000,
    transferTimeDays: 3,
    notes: "3:1 with 5K bonus miles per 60K transferred. Verify increment (A1) and 2026 airline list.",
  }),
  route("marriott-bonvoy", "ana-mileage-club", {
    ratioNumerator: 1,
    ratioDenominator: 3,
    incrementPoints: 3000,
    bonusMilesPerBlock: 5000,
    bonusBlockPoints: 60000,
    transferTimeDays: 7,
    notes: "3:1 with 5K/60K block bonus; ANA transfers are slow. Verify time + eligibility.",
  }),
] satisfies TransferRouteSeed[];

// DATA-03: promotional transfer bonuses are dated manual rows — adding or
// editing one is a data-only change, never a schema change. Per Assumption A4
// (documented in types.ts) a promo bonus multiplies the base-converted amount
// and does not stack with structural block bonuses.
export const bonuses = [
  {
    fromProgramSlug: "amex-mr",
    toProgramSlug: "virgin-atlantic",
    bonusPercent: 30,
    startDate: "2026-08-15",
    endDate: "2026-09-30",
    sourceNote:
      "CLAUDE DRAFT — placeholder promo. Nick: confirm a live Amex→Virgin transfer bonus exists with these dates/percent, or replace with a real current promo before verification.",
  },
  {
    fromProgramSlug: "citi-ty",
    toProgramSlug: "avianca-lifemiles",
    bonusPercent: 25,
    startDate: "2026-08-01",
    endDate: "2026-09-15",
    sourceNote:
      "CLAUDE DRAFT — placeholder promo. Nick: confirm a live Citi→LifeMiles bonus (these run frequently) or replace with a real current promo before verification.",
  },
] satisfies TransferBonusSeed[];
