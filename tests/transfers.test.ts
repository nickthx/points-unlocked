import { describe, expect, it } from "vitest";

import { routes } from "../src/data/transfers";
import type { TransferRouteSeed } from "../src/data/types";
import { applyPromoBonus, computePartnerPoints } from "../src/engine/transfers";

// Every expectation below runs against REAL rows from src/data/transfers.ts —
// not inline fixtures — so a data-entry typo in a seed row (e.g. the Marriott
// bonusBlockPoints) fails CI exactly like a math regression would (DATA-02).
//
// NOTE (Assumption A1 — CONFIRMED by Nick 2026-09-01 at the DATA-04
// checkpoint): the Marriott increment of 3000 and the 59,000 → 19,000
// expectation encode the confirmed rule — points floor to the 3000-point
// increment before conversion, and only full 60K blocks earn the 5K bonus.
// This is the frozen spec.

function findRoute(from: string, to: string): TransferRouteSeed {
  const route = routes.find(
    (r) => r.fromProgramSlug === from && r.toProgramSlug === to,
  );
  if (!route) {
    throw new Error(
      `expected seed route ${from}→${to} is missing from src/data/transfers.ts`,
    );
  }
  return route;
}

describe("computePartnerPoints", () => {
  describe("Marriott Bonvoy → airline (1:3, 3000-pt increment, 5K per 60K block)", () => {
    const marriott = findRoute("marriott-bonvoy", "alaska-mileage-plan");

    it("120,000 Bonvoy → 50,000 miles (base 40,000 + 2×5,000 block bonus)", () => {
      expect(computePartnerPoints(marriott, 120_000)).toBe(50_000);
    });

    it("60,000 Bonvoy → 25,000 miles (base 20,000 + 1×5,000 block bonus)", () => {
      expect(computePartnerPoints(marriott, 60_000)).toBe(25_000);
    });

    it("59,000 Bonvoy → 19,000 miles (floors to 57,000 transferable; no full 60K block)", () => {
      // A1: 59,000 floors to 57,000 (19 × 3,000) → base 19,000; 57,000 < 60,000
      // so zero block bonus.
      expect(computePartnerPoints(marriott, 59_000)).toBe(19_000);
    });
  });

  describe("Amex MR → Hilton Honors (1:2)", () => {
    const mrToHilton = findRoute("amex-mr", "hilton-honors");

    it("60,000 MR → 120,000 Hilton", () => {
      expect(computePartnerPoints(mrToHilton, 60_000)).toBe(120_000);
    });
  });

  describe("Bilt → airline (1:1)", () => {
    const bilt = findRoute("bilt", "alaska-mileage-plan");

    it("25,000 Bilt → 25,000 miles", () => {
      expect(computePartnerPoints(bilt, 25_000)).toBe(25_000);
    });

    it("900 points on a 1000-increment route → 0 (below minimum transfer)", () => {
      expect(computePartnerPoints(bilt, 900)).toBe(0);
    });
  });
});

describe("applyPromoBonus (DATA-03 composition rule)", () => {
  const mrToHilton = findRoute("amex-mr", "hilton-honors");

  it("plain 30% on a 1:1-equivalent base: 10,000 → 13,000", () => {
    expect(applyPromoBonus(10_000, 30)).toBe(13_000);
  });

  it("composes on the base-CONVERTED amount, never source points: 10,000 MR → 20,000 Hilton → 26,000", () => {
    // A4 (confirmed 2026-09-01): the promo multiplies the converted 20,000
    // Hilton points (→ 26,000), not the 10,000 source MR points. Structural
    // block bonuses never stack with promo bonuses.
    expect(applyPromoBonus(computePartnerPoints(mrToHilton, 10_000), 30)).toBe(
      26_000,
    );
  });

  it("floors fractional results: applyPromoBonus(1,001, 30) → 1,301", () => {
    expect(applyPromoBonus(1_001, 30)).toBe(1_301);
  });
});
