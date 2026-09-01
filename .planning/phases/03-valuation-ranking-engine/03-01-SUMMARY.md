---
phase: 03-valuation-ranking-engine
plan: 01
subsystem: engine
tags: [types, purity-gate, methodology-signoff, tdd]
requires: []
provides:
  - "src/engine/types.ts — full engine contract surface (Balances, EngineDataset, TransferPath, ValueRange, RankedResult, EngineOptions, RankedResults, RankInput)"
  - "tests/engine-purity.test.ts — executable CI purity gate over src/engine/"
  - "Ratified rulings A1/A2/Bilt recorded in code comments with dates"
affects:
  - "03-02+ (wave 2/3 plans implement against these contracts)"
  - "Phase 4 UI and v2 advisor (consume RankedResults as plain data)"
tech-stack:
  added: []
  patterns:
    - "Interface-first: contracts land before implementations"
    - "Purity boundary enforced by executable test, not convention"
key-files:
  created:
    - src/engine/types.ts
    - tests/engine-purity.test.ts
  modified:
    - src/data/programs.ts
decisions:
  - "A1 ratified (Nick 2026-09-01): cheapest transfer path = minimum raw requiredSourcePoints; ties break direct-use first, then lowest fromProgramSlug alphabetically"
  - "A2 ratified (Nick 2026-09-01): bookability/ranking gate on conservative pointsMax ?? pointsMin; valuations returned at both range ends"
  - "Bilt cash-out baseline ratified (Nick 2026-09-01): cashOutBaselineCppX100 = 10 (0.1 cents/pt stand-in for 'effectively no cash-out path')"
  - "FYI defaults shipped with no objection: A3 highest bonusPercent wins on overlapping promos; A5 engine filters verifiedAt:null and active:false fail-closed; A7 single-hop transfers only; almost-there threshold 0.75 (parameterized)"
metrics:
  duration: "~5min execution (checkpoint spanned sessions)"
  completed: "2026-09-01"
---

# Phase 3 Plan 01: Engine Contracts + Purity Gate Summary

Interface-first foundation: ratified A1/A2/Bilt methodology rulings encoded in pure hand-written engine type contracts, guarded by a dynamic CI purity gate that fails on any framework/DB/node/clock import in src/engine.

## Ratified Rulings (wave 2 plans encode these exactly)

1. **A1 — cheapest path = minimum raw `requiredSourcePoints`.** Ties break to direct-use first, then lowest `fromProgramSlug` alphabetically. Opportunity-cost-cheapest was rejected (makes null-baseline programs look "free", inflates wow delta).
2. **A2 — conservative gating on `pointsMax ?? pointsMin`.** Dynamic-priced awards are "bookable now" only if the balance covers `pointsMax`; valuations returned at BOTH ends (`ValueRange { atMin, atMax }`, `atMax` null for fixed charts).
3. **Bilt baseline stays `cashOutBaselineCppX100 = 10`** (0.1¢/pt stand-in for "effectively no cash-out path"). Recorded as CONFIRMED in src/data/programs.ts; feeds every Bilt wow delta.
4. **FYI defaults (no objection, ship as stated):** A3 overlapping promos → highest `bonusPercent`; A5 engine filters `verifiedAt: null` drafts and `active: false` routes fail-closed; A7 single-hop only; `almostThereThreshold` default 0.75, parameterized via `EngineOptions`.

## Task Commits

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Ratify A1, A2, Bilt baseline (checkpoint) | — (no files; rulings recorded in Task 2's code) | — |
| 2 | Engine type contracts + ratified-assumption recording | 55de60c | src/engine/types.ts, src/data/programs.ts |
| 3 | Executable purity gate (TDD) | 2dcbe91 | tests/engine-purity.test.ts |

## What Was Built

- **src/engine/types.ts** — zero runtime imports; sole import is `import type { ... } from "../data/types"`. Exports `EnterableProgramSlug` (8 canonical slugs), `Balances`, `EngineDataset`, `TransferPath` (routeKey uses `${from}→${to}` Unicode-arrow format), `ValueRange`, `RankedResult` (coverage is the single sanctioned float, display-only; `pointsAway` non-null only for almost-there, in the chosen path's source currency), `EngineOptions` (default 0.75 documented), `RankedResults`, `RankInput` (`asOf` ISO date compared lexically — engine never reads the clock). Every money/scale field carries a unit comment (cents; cppX100 where 100 = 1.0¢/pt); A1/A2 cited as CONFIRMED by Nick 2026-09-01 at the fields that encode them.
- **src/data/programs.ts** — Bilt stand-in comment replaced with CONFIRMED ruling note; file-header "remains a Phase 3 gate" language replaced with ratification note. Value unchanged (10), so no seed-test expectations needed updating.
- **tests/engine-purity.test.ts** — enumerates `src/engine/*.ts` dynamically via `node:fs` (`readdirSync`/`readFileSync`); regex-extracts every import/export-from specifier. Test 1: allowlist (intra-engine `./` or type-only `../data/types`). Test 2: denylist (`next`, `react`, `zod`, `drizzle`, `@neondatabase`, `server-only`, `node:`, `/db`, `../app`, `@/`). Test 3: determinism guard (`Date.now(`/`new Date(` forbidden). Sanity test asserts transfers.ts + types.ts are found. Replaces the manual grep gate from plan 02-03; automatically covers paths/valuation/ranking/index as waves 2-3 add them.

## Purity Gate RED Proof (Task 3 acceptance)

Deliberate temp violation `import { z } from "zod";` added to src/engine/types.ts made 2 tests fail, then was removed (suite green again). Recorded failing output:

```
FAIL  tests/engine-purity.test.ts > engine purity (success criterion 5) > only allows intra-engine imports or type-only ../data/types
AssertionError: types.ts imports "zod" — only "./" or a type-only "../data/types" import is allowed: expected [ Array(1) ] to deeply equal []

FAIL  tests/engine-purity.test.ts > engine purity (success criterion 5) > imports nothing matching a forbidden pattern (framework/db/node)
AssertionError: types.ts imports "zod" — forbidden (zod): expected [ Array(1) ] to deeply equal []
```

## Verification

- `npm run typecheck` — exit 0
- `npm test` — 32 passed (28 pre-existing + 4 new purity tests)
- `npm run lint` — exit 0
- `npx vitest run tests/engine-purity.test.ts` — 4 passed; demonstrably fails on deliberate violation (above)

## Deviations from Plan

None - plan executed exactly as written. (One minor scope note: the programs.ts file-header comment was also updated alongside the bilt entry comment, since it contained the same "Phase 3 gate" open-item language the acceptance criteria required removing.)

## Known Stubs

None. All types are contracts by design (implementations arrive in waves 2-3 per the interface-first plan); no hardcoded empty values or placeholder data flow anywhere.

## Threat Flags

None — no new network endpoints, auth paths, file access, or schema changes. T-03-01 (Bilt baseline tampering) mitigated by the blocking checkpoint ratification now recorded in code; T-03-02 (boundary erosion) mitigated by the executable purity gate.

## Self-Check: PASSED

- src/engine/types.ts — FOUND
- tests/engine-purity.test.ts — FOUND
- Commit 55de60c — FOUND
- Commit 2dcbe91 — FOUND
