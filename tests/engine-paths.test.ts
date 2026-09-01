import { describe, expect, it } from "vitest";

import { bonuses, routes } from "../src/data/transfers";
import type { TransferBonusSeed, TransferRouteSeed } from "../src/data/types";
import {
  activeBonusFor,
  effectivePartnerPoints,
  requiredSourcePoints,
  resolvePaths,
} from "../src/engine/paths";
import type { EngineDataset } from "../src/engine/types";

// Every expectation below runs against REAL rows from src/data/transfers.ts —
// not inline fixtures — so a data-entry typo in a seed row (e.g. the live
// Amex→Hilton bonus window) fails CI exactly like a math regression would.
// The ONE deliberate exception: the A4 non-stacking case uses a SYNTHETIC
// route+promo pair, because no real row carries both a block bonus and a live
// promo yet — that absence is exactly why the test must exist (Pitfall 3).

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

function findBonus(from: string, to: string): TransferBonusSeed {
  const bonus = bonuses.find(
    (b) => b.fromProgramSlug === from && b.toProgramSlug === to,
  );
  if (!bonus) {
    throw new Error(
      `expected seed bonus ${from}→${to} is missing from src/data/transfers.ts`,
    );
  }
  return bonus;
}

const marriottAlaska = findRoute("marriott-bonvoy", "alaska-mileage-plan");
const amexHilton = findRoute("amex-mr", "hilton-honors");
const liveAmexHiltonBonus = findBonus("amex-mr", "hilton-honors");

// Synthetic A4 fixture: a promo riding the Marriott route (which carries the
// 5K/60K structural block bonus). No real data has this pairing yet.
const syntheticMarriottBonus20 = {
  fromProgramSlug: "marriott-bonvoy",
  toProgramSlug: "alaska-mileage-plan",
  bonusPercent: 20,
  startDate: "2026-09-01",
  endDate: "2026-12-31",
  sourceNote: "synthetic test fixture — pins A4 non-stacking",
} satisfies TransferBonusSeed;

const syntheticMarriottBonus30 = {
  ...syntheticMarriottBonus20,
  bonusPercent: 30,
  sourceNote: "synthetic test fixture — A3 overlapping-promo winner",
} satisfies TransferBonusSeed;

describe("activeBonusFor (lexical date-window matching)", () => {
  it('returns the live Amex→Hilton 30% bonus on the start boundary "2026-09-01"', () => {
    expect(activeBonusFor(amexHilton, bonuses, "2026-09-01")).toBe(
      liveAmexHiltonBonus,
    );
  });

  it('returns the live bonus on the end boundary "2026-10-14" (inclusive)', () => {
    expect(activeBonusFor(amexHilton, bonuses, "2026-10-14")).toBe(
      liveAmexHiltonBonus,
    );
  });

  it('returns null the day before the window opens ("2026-08-31")', () => {
    expect(activeBonusFor(amexHilton, bonuses, "2026-08-31")).toBeNull();
  });

  it('returns null the day after the window closes ("2026-10-15")', () => {
    expect(activeBonusFor(amexHilton, bonuses, "2026-10-15")).toBeNull();
  });

  it("returns null for a route with no bonus rows at all", () => {
    expect(activeBonusFor(marriottAlaska, bonuses, "2026-09-15")).toBeNull();
  });

  it("picks the highest bonusPercent when two promos overlap on one route (A3)", () => {
    const overlapping = [syntheticMarriottBonus20, syntheticMarriottBonus30];
    expect(
      activeBonusFor(marriottAlaska, overlapping, "2026-10-01"),
    ).toBe(syntheticMarriottBonus30);
  });
});

describe("effectivePartnerPoints (A4-safe conversion)", () => {
  it("no promo: 150,000 Bonvoy → 60,000 miles (base 50,000 + 2×5,000 block bonus)", () => {
    expect(effectivePartnerPoints(marriottAlaska, null, 150_000)).toBe(60_000);
  });

  it("A4 non-stacking: 150,000 Bonvoy under a 20% promo → 60,000 (base-ONLY 50,000 × 1.20), NOT 72,000", () => {
    // A4 (CONFIRMED by Nick 2026-09-01): a promo multiplies the base-converted
    // amount ONLY and never stacks with the structural block bonus. The wrong
    // compounded figure would be (50,000 + 10,000) × 1.20 = 72,000.
    const result = effectivePartnerPoints(
      marriottAlaska,
      syntheticMarriottBonus20,
      150_000,
    );
    expect(result).toBe(60_000);
    expect(result).not.toBe(72_000);
  });

  it("live promo composition: 10,000 MR → 26,000 Hilton (base 20,000 × 1.30 — matches the frozen Phase 2 test)", () => {
    expect(
      effectivePartnerPoints(amexHilton, liveAmexHiltonBonus, 10_000),
    ).toBe(26_000);
  });
});

describe("requiredSourcePoints (binary-search inverse transfer math)", () => {
  const biltAlaska = findRoute("bilt", "alaska-mileage-plan");

  it("60,000 Alaska miles via Marriott → 150,000 Bonvoy (base 50,000 + 2×5,000 blocks), NOT naive 180,000", () => {
    expect(requiredSourcePoints(marriottAlaska, null, 60_000)).toBe(150_000);
  });

  it("150,000 is minimal: one increment less (147,000 Bonvoy) only yields 59,000 miles", () => {
    // Companion minimality proof — 147,000 → base 49,000 + 2×5,000 = 59,000 < 60,000.
    expect(effectivePartnerPoints(marriottAlaska, null, 147_000)).toBe(59_000);
  });

  it("200,000 Hilton via Amex under the live 30% promo → 77,000 MR (154,000 × 1.30 = 200,200; 76,000 → 197,600 fails)", () => {
    expect(
      requiredSourcePoints(amexHilton, liveAmexHiltonBonus, 200_000),
    ).toBe(77_000);
  });

  it("200,000 Hilton via Amex with no promo → 100,000 MR (plain 1:2)", () => {
    expect(requiredSourcePoints(amexHilton, null, 200_000)).toBe(100_000);
  });

  it("60,000 Alaska via Bilt 1:1 → 60,000 Bilt (increment 1,000)", () => {
    expect(requiredSourcePoints(biltAlaska, null, 60_000)).toBe(60_000);
  });

  it("needing 0 partner points costs 0 source points", () => {
    expect(requiredSourcePoints(marriottAlaska, null, 0)).toBe(0);
    expect(requiredSourcePoints(amexHilton, liveAmexHiltonBonus, 0)).toBe(0);
  });

  it("results are increment-aligned by construction across a spread of needed values (Marriott, 3,000-pt increment)", () => {
    const neededSpread = [
      1, 500, 2_999, 3_000, 19_000, 25_000, 59_999, 60_000, 60_001, 85_000,
      100_000, 123_456,
    ];
    for (const needed of neededSpread) {
      const required = requiredSourcePoints(marriottAlaska, null, needed);
      expect(required).not.toBeNull();
      expect(required! % marriottAlaska.incrementPoints).toBe(0);
      // The returned amount actually covers the need…
      expect(
        effectivePartnerPoints(marriottAlaska, null, required!),
      ).toBeGreaterThanOrEqual(needed);
      // …and is minimal: one increment less does not.
      if (required! > 0) {
        expect(
          effectivePartnerPoints(
            marriottAlaska,
            null,
            required! - marriottAlaska.incrementPoints,
          ),
        ).toBeLessThan(needed);
      }
    }
  });
});

describe("resolvePaths (A1 cheapest-path selection)", () => {
  // resolvePaths only reads routes + bonuses; programs/redemptions ride along
  // to satisfy the EngineDataset contract.
  function makeDataset(overrides: Partial<EngineDataset> = {}): EngineDataset {
    return { programs: [], routes, bonuses, redemptions: [], ...overrides };
  }

  it("Bilt 60,000 beats Marriott 150,000 for 60,000 Alaska miles (A1: minimum raw source points)", () => {
    const result = resolvePaths(
      "alaska-mileage-plan",
      60_000,
      { bilt: 70_000, "marriott-bonvoy": 200_000 },
      makeDataset(),
      "2026-09-15",
    );
    expect(result).not.toBeNull();
    expect(result!.chosenPath.fromProgramSlug).toBe("bilt");
    expect(result!.chosenPath.kind).toBe("transfer");
    expect(result!.chosenPath.requiredSourcePoints).toBe(60_000);
    expect(result!.chosenPath.routeKey).toBe("bilt→alaska-mileage-plan");
    const marriottAlt = result!.alternatePaths.find(
      (p) => p.fromProgramSlug === "marriott-bonvoy",
    );
    expect(marriottAlt).toBeDefined();
    expect(marriottAlt!.requiredSourcePoints).toBe(150_000);
  });

  it("Amex transfer (77,000 under the live 30% promo) beats direct Hilton use (200,000) at 2026-09-15", () => {
    const result = resolvePaths(
      "hilton-honors",
      200_000,
      { "hilton-honors": 250_000, "amex-mr": 300_000 },
      makeDataset(),
      "2026-09-15",
    );
    expect(result).not.toBeNull();
    expect(result!.chosenPath.fromProgramSlug).toBe("amex-mr");
    expect(result!.chosenPath.kind).toBe("transfer");
    expect(result!.chosenPath.requiredSourcePoints).toBe(77_000);
    expect(result!.chosenPath.routeKey).toBe("amex-mr→hilton-honors");
    expect(result!.chosenPath.activeBonus).not.toBeNull();
    expect(result!.chosenPath.activeBonus!.bonusPercent).toBe(30);
  });

  it("after the promo window (2026-10-15) Amex still wins at 100,000 but activeBonus is null", () => {
    const result = resolvePaths(
      "hilton-honors",
      200_000,
      { "hilton-honors": 250_000, "amex-mr": 300_000 },
      makeDataset(),
      "2026-10-15",
    );
    expect(result).not.toBeNull();
    expect(result!.chosenPath.fromProgramSlug).toBe("amex-mr");
    expect(result!.chosenPath.requiredSourcePoints).toBe(100_000);
    expect(result!.chosenPath.activeBonus).toBeNull();
  });

  it("tie-break: direct use wins over equal-cost transfers (50,000 Hyatt, all paths cost 50,000)", () => {
    // chase-ur→world-of-hyatt and bilt→world-of-hyatt are both real 1:1 routes,
    // so direct, chase, and bilt all need exactly 50,000 — direct wins (A1).
    const result = resolvePaths(
      "world-of-hyatt",
      50_000,
      { "world-of-hyatt": 60_000, "chase-ur": 60_000, bilt: 60_000 },
      makeDataset(),
      "2026-09-15",
    );
    expect(result).not.toBeNull();
    expect(result!.chosenPath.kind).toBe("direct");
    expect(result!.chosenPath.fromProgramSlug).toBe("world-of-hyatt");
    expect(result!.chosenPath.requiredSourcePoints).toBe(50_000);
    expect(result!.chosenPath.routeKey).toBeUndefined();
  });

  it('tie-break: among equal transfer paths the lowest fromProgramSlug wins ("bilt" < "chase-ur")', () => {
    const result = resolvePaths(
      "world-of-hyatt",
      50_000,
      { "chase-ur": 60_000, bilt: 60_000 },
      makeDataset(),
      "2026-09-15",
    );
    expect(result).not.toBeNull();
    expect(result!.chosenPath.fromProgramSlug).toBe("bilt");
    expect(result!.alternatePaths.map((p) => p.fromProgramSlug)).toEqual([
      "chase-ur",
    ]);
  });

  it("no affordable path: the max-coverage candidate is still chosen (Marriott 150,000 vs 100,000 held)", () => {
    const result = resolvePaths(
      "alaska-mileage-plan",
      60_000,
      { "marriott-bonvoy": 100_000 },
      makeDataset(),
      "2026-09-15",
    );
    expect(result).not.toBeNull();
    expect(result!.chosenPath.fromProgramSlug).toBe("marriott-bonvoy");
    expect(result!.chosenPath.requiredSourcePoints).toBe(150_000);
  });

  it("inactive routes never become candidates (A5 fail-closed)", () => {
    const inactiveBiltAlaska = {
      ...findRoute("bilt", "alaska-mileage-plan"),
      active: false,
    } satisfies TransferRouteSeed;
    const result = resolvePaths(
      "alaska-mileage-plan",
      60_000,
      { bilt: 100_000 },
      makeDataset({ routes: [inactiveBiltAlaska] }),
      "2026-09-15",
    );
    expect(result).toBeNull();
  });

  it("zero or absent balances never become candidates", () => {
    const result = resolvePaths(
      "alaska-mileage-plan",
      60_000,
      { bilt: 0 },
      makeDataset(),
      "2026-09-15",
    );
    expect(result).toBeNull();
  });

  it("returns null when no held program reaches the partner at all", () => {
    const result = resolvePaths(
      "alaska-mileage-plan",
      60_000,
      { "chase-ur": 500_000 },
      makeDataset(),
      "2026-09-15",
    );
    expect(result).toBeNull();
  });
});
