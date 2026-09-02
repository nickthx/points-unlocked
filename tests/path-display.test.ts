import { describe, expect, it } from "vitest";

import { programs, routes } from "../src/data";
import { formatTransferPath } from "../src/lib/path-display";
import type { TransferPath } from "../src/engine/types";

// RANK-04 transfer-path display tests against the REAL seed arrays from
// src/data — not inline route fixtures — so a seed rename or ratio change
// fails these tests exactly like a display regression would. Expected names
// and ratios are pinned from src/data/programs.ts and src/data/transfers.ts:
// amex-mr→hilton-honors is the mandatory 2:1 edge case;
// chase-ur→world-of-hyatt uses the route() defaults (1:1).

function transferPath(
  fromProgramSlug: string,
  routeKey: string,
  requiredSourcePoints: number,
): TransferPath {
  return {
    kind: "transfer",
    fromProgramSlug,
    routeKey,
    requiredSourcePoints,
    activeBonus: null,
  };
}

describe("formatTransferPath (RANK-04 path strings from real seed data)", () => {
  it("renders the amex-mr→hilton-honors 2:1 edge case with full program names", () => {
    const path = transferPath("amex-mr", "amex-mr→hilton-honors", 47_500);
    expect(formatTransferPath(path, routes, programs)).toBe(
      "via Amex Membership Rewards → Hilton Honors 2:1",
    );
  });

  it("renders chase-ur→world-of-hyatt at the route's actual 1:1 ratio", () => {
    const path = transferPath("chase-ur", "chase-ur→world-of-hyatt", 75_000);
    expect(formatTransferPath(path, routes, programs)).toBe(
      "via Chase Ultimate Rewards → World of Hyatt 1:1",
    );
  });

  it("renders a direct path as \"Use your {program name} points directly\"", () => {
    const path: TransferPath = {
      kind: "direct",
      fromProgramSlug: "world-of-hyatt",
      requiredSourcePoints: 75_000,
      activeBonus: null,
    };
    expect(formatTransferPath(path, routes, programs)).toBe(
      "Use your World of Hyatt points directly",
    );
  });

  it("degrades unknown slugs to the raw slug and a missing route to no ratio, without throwing", () => {
    const path = transferPath("made-up", "made-up→also-made-up", 10_000);
    expect(() => formatTransferPath(path, routes, programs)).not.toThrow();
    expect(formatTransferPath(path, routes, programs)).toBe(
      "via made-up → also-made-up",
    );
  });

  it("degrades an unknown direct-path slug to the raw slug without throwing", () => {
    const path: TransferPath = {
      kind: "direct",
      fromProgramSlug: "mystery-program",
      requiredSourcePoints: 1_000,
      activeBonus: null,
    };
    expect(formatTransferPath(path, routes, programs)).toBe(
      "Use your mystery-program points directly",
    );
  });
});
