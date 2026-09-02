import { describe, expect, it } from "vitest";

import {
  cashOutValueCents,
  formatCpp,
  formatDollars,
  formatPoints,
  formatVerifiedDate,
  heroDelta,
} from "../src/lib/format";
import type { RankedResult, ValueRange } from "../src/engine/types";

// Exact-string display-formatter tests (VAL-01 dual-valuation hero figures,
// VAL-04 verified stamp). Every "hard" number on screen flows through these
// pure helpers — the only sanctioned UI-adjacent arithmetic is the final /100
// inside them, so the expected strings here are pinned literally.

/**
 * heroDelta only reads wowDeltaCents; a minimal literal cast keeps these
 * tests independent of the full engine pipeline (the shape is type-only).
 */
function resultWith(wowDeltaCents: ValueRange): RankedResult {
  return { wowDeltaCents } as RankedResult;
}

describe("formatDollars (VAL-01 hero/side-by-side dollar figures)", () => {
  it("formats 450_000 cents as the whole-dollar string \"$4,500\"", () => {
    expect(formatDollars(450_000)).toBe("$4,500");
  });

  it("formats 0 cents as \"$0\"", () => {
    expect(formatDollars(0)).toBe("$0");
  });

  it("renders negative cents with a leading minus per Intl default (-123_456 → \"-$1,235\")", () => {
    expect(formatDollars(-123_456)).toBe("-$1,235");
  });

  it("degrades non-finite input to \"$0\" (T-04-04 guard)", () => {
    expect(formatDollars(Number.NaN)).toBe("$0");
    expect(formatDollars(Number.POSITIVE_INFINITY)).toBe("$0");
  });
});

describe("formatCpp (VAL-01/VAL-02 cents-per-point display)", () => {
  it("formats cppX100 220 as \"2.2¢\"", () => {
    expect(formatCpp(220)).toBe("2.2¢");
  });

  it("formats cppX100 105 as \"1.1¢\" (toFixed(1) rounding)", () => {
    expect(formatCpp(105)).toBe("1.1¢");
  });

  it("formats cppX100 0 as \"0.0¢\"", () => {
    expect(formatCpp(0)).toBe("0.0¢");
  });

  it("degrades non-finite input to \"0.0¢\" (T-04-04 guard)", () => {
    expect(formatCpp(Number.NaN)).toBe("0.0¢");
    expect(formatCpp(Number.POSITIVE_INFINITY)).toBe("0.0¢");
  });
});

describe("formatPoints", () => {
  it("formats 90_000 points as \"90,000\"", () => {
    expect(formatPoints(90_000)).toBe("90,000");
  });

  it("degrades non-finite input to \"0\" (T-04-04 guard)", () => {
    expect(formatPoints(Number.NaN)).toBe("0");
  });
});

describe("formatVerifiedDate (VAL-04 verified stamp — Pitfall 5, no Date object)", () => {
  it("formats \"2026-09-01\" as \"Sep 1, 2026\" with no leading zero on the day", () => {
    expect(formatVerifiedDate("2026-09-01")).toBe("Sep 1, 2026");
  });

  it("formats \"2026-10-14\" as \"Oct 14, 2026\"", () => {
    expect(formatVerifiedDate("2026-10-14")).toBe("Oct 14, 2026");
  });
});

describe("heroDelta (A2 / Pitfall 4 — the exact conservative figure the ranking sorted on)", () => {
  it("returns the conservative atMax end when present ({ atMin: 500_000, atMax: 350_000 } → 350_000)", () => {
    expect(heroDelta(resultWith({ atMin: 500_000, atMax: 350_000 }))).toBe(
      350_000,
    );
  });

  it("falls back to atMin for fixed-price charts ({ atMin: 400_000, atMax: null } → 400_000)", () => {
    expect(heroDelta(resultWith({ atMin: 400_000, atMax: null }))).toBe(
      400_000,
    );
  });
});

describe("cashOutValueCents (engine-consistent cash-out framing figure)", () => {
  it("values 90_000 points at baseline 100 (1.0¢/pt) as 90_000 cents ($900)", () => {
    expect(cashOutValueCents(90_000, 100)).toBe(90_000);
  });

  it("values 90_000 points at baseline 60 (Amex MR 0.6¢/pt) as 54_000 cents", () => {
    expect(cashOutValueCents(90_000, 60)).toBe(54_000);
  });

  it("returns 0 for a null baseline (partner-only currency — ratified null ⇒ 0 rule)", () => {
    expect(cashOutValueCents(90_000, null)).toBe(0);
  });

  it("degrades non-finite or non-positive inputs to 0", () => {
    expect(cashOutValueCents(Number.NaN, 100)).toBe(0);
    expect(cashOutValueCents(-5, 100)).toBe(0);
    expect(cashOutValueCents(90_000, Number.POSITIVE_INFINITY)).toBe(0);
    expect(cashOutValueCents(90_000, 0)).toBe(0);
  });
});
