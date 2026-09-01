import { describe, expect, it } from "vitest";

import { redemptions } from "../src/data/redemptions";
import type { RedemptionSeed } from "../src/data/types";
import { cppX100, effectiveCppX100 } from "../src/engine/valuation";

// Every anchor below is asserted twice: once from hand-computed literal inputs
// (the frozen TPG arithmetic) and once against the REAL seed rows from
// src/data — so a data-entry typo in a verified redemption row (e.g. a
// misplaced zero in cashFareCents) fails CI exactly like a math regression
// would (VAL-02). It-titles show the TPG dollars-form check so a reviewer can
// re-derive each number by hand.

function findRedemption(slug: string): RedemptionSeed {
  const row = redemptions.find((r) => r.slug === slug);
  if (!row) {
    throw new Error(
      `expected seed redemption "${slug}" is missing from src/data/redemptions.ts`,
    );
  }
  return row;
}

describe("cppX100 (VAL-02 — TPG cents-per-point in integer cppX100 units)", () => {
  it("ANA business RT: ($9,000 − $600) ÷ 90,000 × 100 = 9.33 cpp → 933", () => {
    expect(cppX100(900_000, 60_000, 90_000)).toBe(933);
  });

  it("rules out the 100× unit bug: 933, not 93_333 (Pitfall 1 — cents-vs-dollars)", () => {
    // Pitfall 1: in cents-form the TPG dollars-form "×100" cancels; the
    // surviving ×100 is the cppX100 scale. A naive double-×100 yields 93_333.
    expect(cppX100(900_000, 60_000, 90_000)).not.toBe(93_333);
  });

  it("ANA First via Virgin: ($14,000 − $400) ÷ 72,500 × 100 = 18.76 cpp → 1876", () => {
    expect(cppX100(1_400_000, 40_000, 72_500)).toBe(1876);
  });

  it("matches the real ana-business-tokyo-roundtrip row's own fields (933 at pointsMax)", () => {
    const row = findRedemption("ana-business-tokyo-roundtrip");
    expect(
      cppX100(row.cashFareCents, row.taxesFeesCents, row.pointsMax ?? row.pointsMin),
    ).toBe(933);
  });

  it("matches the real ana-first-tokyo-via-virgin row's own fields (1876 at pointsMin)", () => {
    const row = findRedemption("ana-first-tokyo-via-virgin");
    expect(cppX100(row.cashFareCents, row.taxesFeesCents, row.pointsMin)).toBe(
      1876,
    );
  });

  it("guards: points ≤ 0 or non-finite inputs return 0, never NaN/Infinity", () => {
    expect(cppX100(900_000, 60_000, 0)).toBe(0);
    expect(cppX100(900_000, 60_000, -1)).toBe(0);
    expect(cppX100(Number.NaN, 60_000, 90_000)).toBe(0);
    expect(cppX100(900_000, Number.POSITIVE_INFINITY, 90_000)).toBe(0);
    expect(cppX100(900_000, 60_000, Number.NaN)).toBe(0);
  });
});

describe("effectiveCppX100 (VAL-05's valuation half — per-source-point cpp)", () => {
  it("identical formula over source points: 90,000 source points on the ANA business fare → 933", () => {
    expect(effectiveCppX100(900_000, 60_000, 90_000)).toBe(933);
  });

  it("an active promo lowers requiredSourcePoints and raises the figure: 77,000 source pts beats 100,000", () => {
    // The VAL-05 mechanism: a transfer bonus means fewer source points fund
    // the same fare, so per-SOURCE-point value rises while partner-point cpp
    // stays fixed.
    const withPromo = effectiveCppX100(900_000, 60_000, 77_000);
    const withoutPromo = effectiveCppX100(900_000, 60_000, 100_000);
    expect(withPromo).toBeGreaterThan(withoutPromo);
  });

  it("guards: source points ≤ 0 or non-finite inputs return 0", () => {
    expect(effectiveCppX100(900_000, 60_000, 0)).toBe(0);
    expect(effectiveCppX100(900_000, 60_000, -5)).toBe(0);
    expect(effectiveCppX100(Number.NaN, 0, 1_000)).toBe(0);
  });
});
