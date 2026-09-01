---
phase: 03-valuation-ranking-engine
plan: 02
subsystem: engine
tags: [paths, inverse-transfer-math, binary-search, promo-bonus, tdd]
requires:
  - "03-01 (engine type contracts, purity gate, ratified A1/A3/A4/A5/A7 rulings)"
  - "Phase 2 frozen primitives (src/engine/transfers.ts computePartnerPoints/applyPromoBonus)"
provides:
  - "src/engine/paths.ts — activeBonusFor, effectivePartnerPoints, requiredSourcePoints, resolvePaths"
  - "tests/engine-paths.test.ts — 25 hand-computed tests against real seed rows (SC-2, SC-4)"
affects:
  - "03-03 valuation (effectiveCppX100 divides by requiredSourcePoints)"
  - "03-04 ranking (bookability/points-away hang off resolvePaths)"
  - "Phase 5 methodology page (requiredSourcePoints JSDoc documents the 180K-vs-150K trap)"
tech-stack:
  added: []
  patterns:
    - "Binary search over increment multiples inverts monotonic conversion exactly"
    - "Integer cross-multiplication replaces float division in coverage comparison"
    - "Synthetic fixtures only where real data lacks the case (A4 route+promo pair)"
key-files:
  created:
    - src/engine/paths.ts
    - tests/engine-paths.test.ts
  modified: []
decisions:
  - "A4 implemented by stripping bonusMilesPerBlock/bonusBlockPoints via spread before base-only conversion — reuses the frozen primitive instead of duplicating ratio math"
  - "Unaffordable-pool coverage comparison uses integer cross-multiplication (balA × reqB vs balB × reqA) so no float is ever stored, honoring the integer-only contract"
  - "requiredSourcePoints(route, bonus, 0) returns 0 (short-circuit) — also the T-03-05 hostile-input guard alongside the finite base-ratio ceiling bound"
metrics:
  duration: "~5min"
  completed: "2026-09-01"
---

# Phase 3 Plan 02: Transfer-Path Resolution Summary

Binary-search inverse transfer math + A1 cheapest-path selection in src/engine/paths.ts, frozen by 25 hand-computed tests against real seed rows — 60K Alaska via Marriott costs exactly 150,000 Bonvoy (never naive 180,000), and 200K Hilton via Amex costs 77,000 MR during the live +30% window.

## Task Commits

| Task | Name | Commits | Files |
| ---- | ---- | ------- | ----- |
| 1 | activeBonusFor + effectivePartnerPoints (A4 branch) | 9a7d817 (RED), 9de9258 (GREEN) | tests/engine-paths.test.ts, src/engine/paths.ts |
| 2 | requiredSourcePoints — binary-search inverse math | 39ef366 (RED), 2de3cfa (GREEN) | tests/engine-paths.test.ts, src/engine/paths.ts |
| 3 | resolvePaths — A1 cheapest-path selection | 4eaa3c0 (RED), 5f465de (GREEN) | tests/engine-paths.test.ts, src/engine/paths.ts |

## What Was Built

- **`activeBonusFor(route, bonuses, asOf)`** — lexical ISO-date window matching, inclusive on both boundaries ("2026-09-01" and "2026-10-14" hit the live Amex→Hilton row; "2026-08-31"/"2026-10-15" return null). Never parses Dates, never reads the clock. A3: overlapping promos on one route resolve to the highest bonusPercent (pinned with a synthetic 20%/30% pair).
- **`effectivePartnerPoints(route, bonus, sourcePoints)`** — delegates to frozen `computePartnerPoints` when no promo; under a promo, strips the block-bonus fields via spread so `applyPromoBonus` composes on the BASE conversion only. The A4 non-stacking test uses a synthetic Marriott-route + 20%-promo fixture (no real row has both yet): 150,000 Bonvoy → 60,000 miles (50,000 × 1.20), with the compounded 72,000 explicitly ruled out by assertion.
- **`requiredSourcePoints(route, bonus, partnerPointsNeeded)`** — exact inverse via binary search over increment multiples: upper bound = base-ratio ceiling rounded up to the increment (valid because bonuses only ADD partner points), monotonic predicate makes the search exact. Frozen fixtures: Marriott 60,000 → 150,000 (with the 147,000 → 59,000 minimality counter-case), Amex+promo 200,000 → 77,000, Amex no-promo → 100,000, Bilt 1:1 → 60,000, needed ≤ 0 → 0. A property-style spread of 12 needed values proves increment alignment, coverage, and minimality by construction. JSDoc documents WHY naive division is wrong (feeds the Phase 5 methodology page).
- **`resolvePaths(partnerProgramSlug, partnerPointsNeeded, balances, dataset, asOf)`** — candidates are direct-use (positive partner balance) plus every active single-hop route from a positively-held program (A5 fail-closed, A7 single-hop). Affordable pool: minimum raw requiredSourcePoints wins, ties direct-first then lowest fromProgramSlug (A1, CONFIRMED 2026-09-01). Nothing affordable: max coverage chosen via integer cross-multiplication. Alternates sorted cost-then-slug; null when the partner is unreachable. Both real multi-path fixtures pass: Bilt 60,000 beats Marriott 150,000 for Alaska; Amex 77,000 (activeBonus.bonusPercent 30) beats direct Hilton 200,000 in-window and still wins at 100,000 with null bonus after 2026-10-14.

## TDD Gate Compliance

All three tasks followed strict RED → GREEN with commits in sequence (test → feat × 3, verified in git log above). Each RED run was observed failing (module-not-found, then 6 and 9 assertion/undefined failures respectively) before implementation. No REFACTOR commits — implementations landed clean.

## Verification

- `npx vitest run tests/engine-paths.test.ts` — 25 passed
- `npx vitest run tests/engine-purity.test.ts` — passed (paths.ts auto-covered by the wave-1 dynamic gate)
- `npm test` — 57 passed (5 files; all Phase 2 suites untouched)
- `npm run typecheck` — exit 0
- `npm run lint` — exit 0

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. All four functions are complete pure implementations; no placeholder values or unwired data paths.

## Threat Flags

None — no new network endpoints, auth paths, file access, or schema changes. T-03-03 mitigated by the 150K/77K/147K frozen fixtures; T-03-04 by the synthetic A4 non-stacking test; T-03-05 by the finite base-ratio ceiling bound plus the needed ≤ 0 short-circuit.

## Self-Check: PASSED

- src/engine/paths.ts — FOUND
- tests/engine-paths.test.ts — FOUND (320 lines ≥ 80 min)
- Commits 9a7d817, 9de9258, 39ef366, 2de3cfa, 4eaa3c0, 5f465de — FOUND
