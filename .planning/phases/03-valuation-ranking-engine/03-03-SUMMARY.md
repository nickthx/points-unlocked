---
phase: 03-valuation-ranking-engine
plan: 03
subsystem: engine
tags: [valuation, tdd, integer-math, val-02, rank-01]
requires:
  - "03-01 (engine type contracts, purity gate, ratified rulings)"
provides:
  - "src/engine/valuation.ts — cppX100, effectiveCppX100, cashOutValueCents, wowDeltaCents (all integer-only)"
  - "tests/engine-valuation.test.ts — hand-computed TPG anchors (933/1876) pinned against real seed rows"
affects:
  - "03-04 (ranking wires effectiveCppX100 + wowDeltaCents into RankedResult)"
  - "Phase 4 UI (every displayed valuation number originates here)"
  - "Phase 5 methodology page (defends exactly these formulas)"
tech-stack:
  added: []
  patterns:
    - "Dual-anchor tests: literal hand-computed inputs AND the same expectation fed from real seed rows, so seed typos fail CI like math bugs"
    - "Guard-to-zero: non-finite / non-positive-divisor inputs return 0, never NaN/Infinity"
key-files:
  created:
    - src/engine/valuation.ts
    - tests/engine-valuation.test.ts
  modified: []
decisions:
  - "effectiveCppX100 delegates to cppX100 (identical formula, different denominator) — one formula site, zero drift risk between the two figures"
  - "Bilt test reads the ratified baseline off the real seed row (with a 6_000-cent assertion at the current value 10), so a future re-ratification updates the expectation automatically while still pinning today's number"
metrics:
  duration: "~4min"
  completed: "2026-09-01"
---

# Phase 3 Plan 03: Valuation Math (VAL-02) Summary

TPG cents-per-point formula in exact integer cppX100 units plus per-program wow-delta math, TDD-built and frozen against hand-computed anchors (933 / 1876) from real verified seed rows so the 100× cents-vs-dollars bug can never ship.

## Task Commits

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 (RED) | Failing TPG cpp anchor tests | d341fb2 | tests/engine-valuation.test.ts |
| 1 (GREEN) | cppX100 + effectiveCppX100 | c01cabc | src/engine/valuation.ts |
| 2 (RED) | Failing wow-delta + baseline tests | e3b43b9 | tests/engine-valuation.test.ts |
| 2 (GREEN) | cashOutValueCents + wowDeltaCents | 10af823 | src/engine/valuation.ts |

## What Was Built

- **src/engine/valuation.ts** — pure, framework-free (sole import: `import type { ProgramSeed } from "../data/types"`; auto-covered by the 03-01 purity gate). Four exports:
  - `cppX100(cashFareCents, taxesFeesCents, partnerPoints)` — `Math.round(((cash − taxes) × 100) / points)`. JSDoc states the TPG convention verbatim, the cents-unit mapping (the dollars-form ×100 cancels; the surviving ×100 is the cppX100 scale), and cites VAL-02 + Pitfall 1. Returns 0 on `points ≤ 0` or any non-finite input.
  - `effectiveCppX100(...)` — identical formula over `requiredSourcePoints`; the figure an active transfer bonus improves (VAL-05). Delegates to `cppX100` so there is exactly one formula site.
  - `cashOutValueCents(spentSourcePoints, sourceProgram)` — `floor(points × baseline / 100)`; `null` baseline ⇒ 0 (partner-only currency, no cash-out path). JSDoc names the flat-baseline attackable-methodology pitfall.
  - `wowDeltaCents(cashFare, taxes, spentSourcePoints, sourceProgram)` — `(fare − taxes) − cashOut` (RANK-01). Taxes subtracted on the value side to match the cpp numerator; `spentSourcePoints` is the chosen path's increment-aligned requirement, not the full balance.
- **tests/engine-valuation.test.ts** (15 tests) — transfers.test.ts structure with throwing `findRedemption`/`findProgram` helpers over real seed arrays:
  - Anchors 933 (ANA business RT: ($9,000 − $600) ÷ 90,000 × 100 = 9.33 cpp) and 1876 (ANA First via Virgin) asserted BOTH from literals and from the real rows' own `cashFareCents`/`taxesFeesCents`/points fields.
  - Explicit `not.toBe(93_333)` assertion pins the 100× unit bug (T-03-06).
  - Promo mechanism: 77,000 source points beats 100,000 for the same fare (VAL-05).
  - Baselines: chase-ur 90K → 90,000 cents; Bilt reads the ratified baseline (10) off the real row; world-of-hyatt null ⇒ 0 cash-out / full-net-value delta (T-03-07).
  - Chase-ur wow-delta anchor: 750,000 cents ($7,500) on the flagship ANA fare.
  - Guards: zero/negative/NaN/Infinity inputs all return 0 (T-03-08).

## Verification

- `npx vitest run tests/engine-valuation.test.ts` — 15 passed
- `npx vitest run tests/engine-purity.test.ts` — passed (valuation.ts auto-covered by the dynamic gate)
- `npm test` — 47 passed (32 pre-existing + 15 new)
- `npm run typecheck` — exit 0
- `npm run lint` — exit 0

## TDD Gate Compliance

Both tasks followed RED → GREEN with commits in order (test d341fb2 → feat c01cabc; test e3b43b9 → feat 10af823). Both RED runs demonstrably failed before implementation (module-not-found, then 6 failing tests). No refactor commits needed — GREEN implementations were already minimal.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. All four functions are complete implementations; no hardcoded empty values or placeholder data.

## Threat Flags

None — no new network endpoints, auth paths, file access, or schema changes. Plan-scoped threats T-03-06 (100× unit bug), T-03-07 (flat/wrong baselines), and T-03-08 (NaN propagation) are each mitigated and pinned by named tests.

## Self-Check: PASSED

- src/engine/valuation.ts — FOUND
- tests/engine-valuation.test.ts — FOUND (142 lines ≥ 60 min_lines)
- Commits d341fb2, c01cabc, e3b43b9, 10af823 — FOUND
- `export function cppX100(` present — FOUND
