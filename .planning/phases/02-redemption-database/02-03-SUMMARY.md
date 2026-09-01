---
phase: 02-redemption-database
plan: 03
subsystem: engine
tags: [transfer-math, tdd, pure-functions, vitest, integer-math]
requires:
  - "02-01: src/data/types.ts (TransferRouteSeed type)"
  - "02-02: src/data/transfers.ts (real edge-case seed routes)"
provides:
  - "src/engine/transfers.ts: computePartnerPoints + applyPromoBonus — pure integer transfer math, framework/DB-free"
  - "tests/transfers.test.ts: 9 hand-computed edge-case assertions frozen against REAL seed rows"
affects:
  - "Phase 3 (path resolution and ranking build on these exact signatures — no re-implementation)"
  - "02-05 (A1/A4 assumptions labeled in code/tests for Nick's DATA-04 checkpoint review)"
tech-stack:
  added: []
  patterns:
    - "Engine purity boundary: src/engine/* imports only type-only from src/data/types — never next/react/db/app"
    - "Integer-only Math.floor arithmetic everywhere finance numbers flow"
    - "Tests import real seed rows (findRoute helper throws loudly if a route is missing) so data typos fail CI like math bugs"
key-files:
  created:
    - src/engine/transfers.ts
    - tests/transfers.test.ts
  modified: []
decisions:
  - "A1 encoded as frozen spec: Marriott 3000-pt increment floors before conversion; 59,000 → 19,000 with no partial-block bonus — pending Nick's 02-05 confirmation"
  - "A4 encoded in applyPromoBonus doc comment: promo bonuses multiply the base-CONVERTED amount only and never stack with structural block bonuses"
metrics:
  duration: "~6 minutes"
  completed: "2026-09-01"
---

# Phase 2 Plan 03: Pure Transfer-Math Engine Summary

Test-first pure engine module: computePartnerPoints (increment floor → integer ratio → structural block bonus) and applyPromoBonus (floor of base×(100+pct)/100), with all nine hand-computed edge-case expectations frozen against the real Marriott/Amex/Bilt seed rows so a data typo and a math regression both fail CI identically.

## What Was Built

- **src/engine/transfers.ts** — 52 lines, exactly 2 exports, one type-only import (`TransferRouteSeed` from `../data/types`):
  - `computePartnerPoints(route, sourcePoints)`: `transferable = floor(source/increment)×increment`; `base = floor(transferable×num/den)`; block bonus `floor(transferable/bonusBlockPoints)×bonusMilesPerBlock` when both bonus fields set, else 0. Integer math throughout — no floats.
  - `applyPromoBonus(basePartnerPoints, bonusPercent)`: `floor(base×(100+pct)/100)`, with the A4 non-stacking rule documented in the doc comment (promo applies to base conversion only, never source points, never compounded with block bonuses — pending Nick's DATA-04 confirmation).
  - Header comment marks the module as Phase 3's engine foundation with a hard framework/DB-free constraint.
- **tests/transfers.test.ts** — 89 lines, named vitest imports (no globals), routes looked up from `../src/data/transfers` via a `findRoute` helper that throws loudly if a seed row is missing:
  - Marriott 1:3 + 5K/60K (real `marriott-bonvoy→alaska-mileage-plan` row): 120,000 → 50,000; 60,000 → 25,000; 59,000 → 19,000 (A1 comment labels the frozen increment spec)
  - Amex MR→Hilton 1:2 (real row): 60,000 → 120,000
  - Bilt 1:1 (real row): 25,000 → 25,000; sub-increment 900 → 0
  - Promo composition (DATA-03): 10,000 → 13,000 plain; `applyPromoBonus(computePartnerPoints(mrToHilton, 10_000), 30)` → 26,000 (bonus on the base-CONVERTED amount, A4 comment); rounding 1,001 → 1,301

## Verification Results

- `npx vitest run tests/transfers.test.ts` — 9/9 pass; full `npm test` — 10/10 (2 files)
- Purity gate: `grep -vE '^\s*(//|\*)' src/engine/transfers.ts | grep -cE 'from ["'"'"'](next|react|@/db|@/app|\.\./db|\.\./app)'` = **0**
- `grep -c "export function" src/engine/transfers.ts` = **2**
- Real-seed-row link: test imports `../src/data/transfers` (matches the key_link pattern); no inline route fixtures
- `npm run typecheck`, `npm run lint`, `npm run build` — all exit 0

## TDD Gate Compliance

Full RED→GREEN sequence per task, verified in git log:
1. 3a562dc `test(02-03)` — RED: 6 computePartnerPoints tests fail (module missing)
2. 98c55b1 `feat(02-03)` — GREEN: 6/6 pass
3. 24fa0ee `test(02-03)` — RED: 3 applyPromoBonus tests fail (not a function), prior 6 still green
4. e94b760 `feat(02-03)` — GREEN: 9/9 pass

No refactor commits needed — implementations were minimal on first pass.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree had no node_modules**
- **Found during:** Task 1 (before RED run)
- **Issue:** Fresh worktree lacks node_modules; vitest unavailable (known from 02-02's note)
- **Fix:** `npm ci` in the worktree — exact lockfile restore, no new packages installed
- **Files modified:** none (gitignored node_modules only)

No other deviations — plan executed exactly as written. No DATABASE_URL needed (tests are DB-free per the threat model).

## Notes for Downstream Plans

- Phase 3 consumes `computePartnerPoints`/`applyPromoBonus` as-is; callers own the A4 branch choice (pass the base conversion without block bonus when a promo applies — the engine never compounds both).
- If Nick's 02-05 checkpoint changes the Marriott increment rule (A1), the seed row and the 59,000 → 19,000 expectation in tests/transfers.test.ts change together.

## Known Stubs

None — both functions are fully implemented and tested; no placeholders, no hardcoded empty values.

## Threat Flags

None — pure functions over repo-controlled seed data; no new endpoints, env access, DB writes, or installs. T-02-08 (wrong-math integrity) and T-02-09 (boundary erosion) mitigated as specified: frozen hand-computed tests + purity grep gate.

## Commits

- 3a562dc test(02-03): add failing edge-case tests for computePartnerPoints
- 98c55b1 feat(02-03): implement computePartnerPoints pure transfer math
- 24fa0ee test(02-03): add failing promo-bonus composition tests
- e94b760 feat(02-03): implement applyPromoBonus with A4 non-stacking rule

## Self-Check: PASSED

- src/engine/transfers.ts and tests/transfers.test.ts exist
- Commits 3a562dc, 98c55b1, 24fa0ee, e94b760 present on worktree-agent-a7bef7833f59cfe9e
