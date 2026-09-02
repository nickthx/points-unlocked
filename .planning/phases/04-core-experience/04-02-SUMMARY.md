---
phase: 04-core-experience
plan: 02
subsystem: ui
tags: [display-formatters, intl-numberformat, transfer-path, vitest, tdd, pure-functions]

# Dependency graph
requires:
  - phase: 03-valuation-ranking-engine
    provides: RankedResult / ValueRange / TransferPath types and the conservativeWow (atMax ?? atMin) ranking key that heroDelta mirrors
  - phase: 02-redemption-database
    provides: ProgramSeed / TransferRouteSeed seed arrays (programs, routes) used as real fixtures for RANK-04 path strings
provides:
  - src/lib/format.ts — formatDollars, formatCpp, formatPoints, formatVerifiedDate, heroDelta, cashOutValueCents (pure, guard-claused display helpers)
  - src/lib/path-display.ts — formatTransferPath rendering "via {From} → {To} {n}:{d}" / "Use your {Program} points directly" with graceful degradation
  - Exact-string unit suites (tests/format.test.ts, tests/path-display.test.ts) pinning every rendered figure
affects: [04-03 result cards, 04-04 page composition, 07 polish (any typography/number refinements must route through these helpers)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Display layer is the ONLY sanctioned UI-adjacent arithmetic: the final /100 inside a formatter plus the documented engine-mirroring cashOutValueCents"
    - "Intl.NumberFormat instances constructed once at module scope; T-04-04 guard clauses degrade non-finite input to safe strings ($0, 0.0¢, 0)"
    - "ISO dates rendered by string splitting only — no Date object (Pitfall 5 timezone off-by-one)"
    - "UI helpers import from @/engine and @/data barrels only (type-only); tests import real seed arrays via relative paths so seed renames fail display tests"

key-files:
  created:
    - src/lib/format.ts
    - src/lib/path-display.ts
    - tests/format.test.ts
    - tests/path-display.test.ts
  modified: []

key-decisions:
  - "heroDelta is the literal `atMax ?? atMin` expression over wowDeltaCents — identical to the engine's conservativeWow sort key, so the hero number provably matches what the ranking sorted on (A2 / Pitfall 4, T-04-06)"
  - "formatTransferPath takes ProgramSeed[] (plan contract) rather than RESEARCH Pattern 5's Map, and replaces Pattern 5's non-null assertions with degrade branches: unknown slug → raw slug, missing route → 'via From → To' with no ratio"
  - "cashOutValueCents in src/lib/format.ts intentionally shares a name with the engine export of the same concept but takes the raw baseline; the module header documents the aliasing hazard for consumers importing both"

patterns-established:
  - "Formatter house style: one exported function per concept, JSDoc naming the finance rule + requirement ID, guard clause first, integer arithmetic until the last step"
  - "Exact-string test convention for display code: `it` strings carry the concrete input and expected output (e.g. 450_000 → \"$4,500\")"

requirements-completed: [VAL-01, VAL-04, RANK-04]

# Metrics
duration: ~2min implementation (2026-09-01 23:29–23:31) + ~6min verification session (2026-09-02)
completed: 2026-09-02
---

# Phase 4 Plan 02: Display Formatters and Transfer-Path Rendering Summary

**Pure display layer for the results UI: whole-dollar/cpp/points formatters, a timezone-safe verified-date stamp, the conservative `heroDelta` selector that mirrors the ranking key, an engine-consistent cash-out helper, and `formatTransferPath` rendering RANK-04 path strings from real seed routes — all pinned by exact-string vitest suites.**

## Performance

- **Duration:** ~2 min of TDD commits (original session) + ~6 min verification (this session)
- **Started:** 2026-09-02T03:29:02Z (first RED commit, original session)
- **Completed:** 2026-09-02 (verification session; SUMMARY written after the original session was interrupted before this step)
- **Tasks:** 2 / 2
- **Files modified:** 4 created, 0 modified

## Accomplishments

- `src/lib/format.ts` exports six pure helpers: `formatDollars` (450_000 → "$4,500"), `formatCpp` (220 → "2.2¢"), `formatPoints` (90_000 → "90,000"), `formatVerifiedDate` ("2026-09-01" → "Sep 1, 2026" via string splitting, zero `new Date` usage), `heroDelta` (`wowDeltaCents.atMax ?? atMin`), and `cashOutValueCents` (points × cppX100 ÷ 100, null baseline → 0).
- `src/lib/path-display.ts` exports `formatTransferPath(path, routes, programs)` producing "via Amex Membership Rewards → Hilton Honors 2:1", "via Chase Ultimate Rewards → World of Hyatt 1:1", and "Use your World of Hyatt points directly", with no non-null assertions and graceful degradation for unknown slugs / missing routes.
- Every hostile-input branch (NaN, Infinity, negative, zero baseline) is tested to degrade to a safe value per threat T-04-04; both `heroDelta` shapes (atMax present / null) are tested per T-04-06.
- Path tests consume the real `programs` and `routes` arrays from `../src/data`, so a seed rename or ratio change fails the display suite.

## Task Commits

Both tasks were TDD and were committed in the original (interrupted) session; the orchestrator recovered them onto main before this worktree was forked. This session verified them against the plan and found no gaps — no additional code commits were needed.

1. **Task 1: Display formatters + heroDelta** — `8b991ee` (test: RED) → `a3eab31` (feat: GREEN)
2. **Task 2: Transfer-path display** — `7857ab2` (test: RED) → `4be6f47` (feat: GREEN)

**Plan metadata:** committed with this SUMMARY (docs).

## Files Created/Modified

- `src/lib/format.ts` — Six pure display helpers; module-scope `Intl.NumberFormat` instances; Pitfall 5 / A2 / T-04-04 annotations in JSDoc.
- `src/lib/path-display.ts` — `formatTransferPath`; type-only imports from `@/engine` and `@/data` barrels with a comment on the `transfers` filename-collision hazard.
- `tests/format.test.ts` — 19 exact-string assertions across the six exports.
- `tests/path-display.test.ts` — 5 cases (2:1, 1:1, direct, transfer-degrade, direct-degrade) against real seed data.

## Verification (this session, in the worktree)

| Check | Result |
|-------|--------|
| `grep -c "new Date" src/lib/format.ts` | 0 |
| `grep -cE 'from "@/(engine\|data)/' src/lib/path-display.ts` (deep imports) | 0 |
| `grep -c ")!" src/lib/path-display.ts` (non-null assertions) | 0 |
| Seed facts: amex-mr→hilton-honors `ratioNumerator: 2, ratioDenominator: 1`; chase-ur→world-of-hyatt uses `route()` defaults 1:1 | confirmed in `src/data/transfers.ts` |
| `npx vitest run` | 130 tests passed; `tests/format.test.ts` and `tests/path-display.test.ts` green |
| `npm run lint` | clean |
| `npx tsc --noEmit` | one error, outside this plan — see Issues Encountered |

## Decisions Made

- `formatTransferPath` follows the plan's `ProgramSeed[]` signature and guard-clause degradation instead of RESEARCH Pattern 5's `Map` + `!` sketch (the plan explicitly supersedes it; the `!`-free version is also what the acceptance grep enforces).
- The `routeKey === undefined` guard on a `kind: "transfer"` path degrades to the direct-use sentence rather than throwing — a contract-violating path never crashes a card.
- `formatVerifiedDate` returns the raw input string for malformed dates (rather than throwing) because `verifiedAt` is Zod-validated at the seed boundary and the field is already public (T-04-05 accept).

## Deviations from Plan

None - plan executed exactly as written. This session made no code changes.

## Issues Encountered

- **Worktree base drift (resolved):** the worktree was forked at `061ced1` (end of Phase 02) rather than the pinned base `adecd6d`; the branch-check protocol's sanctioned `git reset --hard adecd6d` corrected it before any work.
- **Pre-existing out-of-scope failure (not fixed, by design):** `tests/balance-storage.test.ts` fails to import `../src/lib/balance-storage`, which also produces the single `tsc --noEmit` error (TS2307). That file is plan **04-01**'s RED commit (`adecd6d test(04-01): add failing tests for localStorage persistence (INPUT-02)`) — exactly the base commit the orchestrator pinned for this worktree. It belongs to the parallel 04-01 executor and is intentionally failing until that plan's GREEN commit lands. Per the scope-boundary rule it was left untouched; every other suite (10 files, 130 tests) passes and lint is clean. The full suite and typecheck will be green once 04-01 merges.

## Known Stubs

None — both modules are fully wired pure functions with no placeholder values.

## Threat Flags

None — no new trust boundaries beyond the plan's threat model (T-04-04 mitigated via guard clauses; T-04-06 mitigated via the literal `atMax ?? atMin` expression; T-04-05 accepted).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 04-03 (result cards) can render every hard number exclusively through `heroDelta`, `formatDollars`, `formatCpp`, `formatPoints`, `formatVerifiedDate`, and `cashOutValueCents`, and every path line through `formatTransferPath` — no arithmetic belongs in components.
- Consumers importing both `@/engine` and `@/lib/format` must alias one `cashOutValueCents` (documented in the module header).

---
*Phase: 04-core-experience*
*Completed: 2026-09-02*

## Self-Check: PASSED

- Files: src/lib/format.ts, src/lib/path-display.ts, tests/format.test.ts, tests/path-display.test.ts, 04-02-SUMMARY.md — all present
- Commits: 8b991ee, a3eab31, 7857ab2, 4be6f47 (tasks) + docs commit — all present in branch history
