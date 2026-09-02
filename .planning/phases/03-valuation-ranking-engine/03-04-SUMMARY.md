---
phase: 03-valuation-ranking-engine
plan: 04
subsystem: engine
tags: [ranking, orchestrator, barrel, val-05, tdd]
requires:
  - "03-01 (engine type contracts, purity gate, ratified A2/A5 rulings)"
  - "03-02 (paths.ts — resolvePaths, requiredSourcePoints)"
  - "03-03 (valuation.ts — cppX100, effectiveCppX100, wowDeltaCents)"
provides:
  - "src/engine/ranking.ts — rankRedemptions orchestrator (filter → resolve → value → partition → sort)"
  - "src/engine/index.ts — public engine barrel (the Phase 4 / v2-advisor import surface)"
  - "tests/engine-ranking.test.ts — 18 tests: VAL-05 end-to-end, partitions, sorts, threshold, hostile balances, draft exclusion, determinism"
affects:
  - "Phase 4 results UI (renders RankedResults from the barrel)"
  - "v2 advisor (calls rankRedemptions as a tool)"
  - "Phase 5 methodology page (defends the pipeline documented in ranking.ts JSDoc)"
tech-stack:
  added: []
  patterns:
    - "Orchestrator composes frozen wave-2 primitives — zero re-implemented math"
    - "Integer cross-multiplication for coverage sorting (float never used as a ranking key)"
    - "Defensive balance sanitization at the engine boundary (positive safe integers only)"
key-files:
  created:
    - src/engine/ranking.ts
    - src/engine/index.ts
    - tests/engine-ranking.test.ts
  modified: []
decisions:
  - "almostThere coverage-desc sort implemented via integer cross-multiplication (balA × reqB vs balB × reqA) — honors both the plan's 'sort by coverage' behavior and the types.ts 'coverage is never a ranking key' contract"
  - "effectiveCppX100/wowDeltaCents atMin re-derives requiredSourcePoints for pointsMin on the SAME route+bonus as the conservative resolution (direct paths spend pointsMin itself); fixed charts report atMax null across all three ranges"
  - "requiredSourcePoints(route, bonus, 0) degenerate coverage treated as 1 (bookable) — schema-impossible, kept as a defensive branch"
metrics:
  duration: "~10min active (session spanned a rate-limit interruption)"
  completed: "2026-09-01"
---

# Phase 3 Plan 04: Ranking Orchestrator + Public Barrel Summary

rankRedemptions turns { balances, dataset, asOf, options } into { bookableNow ranked by wow delta, almostThere with points-away } by composing the frozen wave-2 path/valuation primitives, sealed behind a single barrel — VAL-05 is now CI-verified end-to-end (the live Amex→Hilton +30% window demonstrably drops the Conrad Maldives cost from 100,000 to 77,000 MR and lifts effective cpp from 220 to 286).

## Task Commits

| Task | Name | Commits | Files |
| ---- | ---- | ------- | ----- |
| 1 | rankRedemptions core — filter, resolve, value, partition, sort | b9f8e4f (RED), ad2fcc6 (GREEN) | tests/engine-ranking.test.ts, src/engine/ranking.ts |
| 2 | VAL-05 end-to-end + hardening (bonus auto-adjust, drafts, hostile balances) | 06ea6ae (tests-only) | tests/engine-ranking.test.ts |
| 3 | Public barrel + phase gates | b76cba1 | src/engine/index.ts |

## What Was Built

- **`rankRedemptions(input: RankInput): RankedResults`** (src/engine/ranking.ts) — the pipeline per redemption:
  1. Sanitize balances: only positive safe integers survive (negative/zero/NaN/Infinity/unsafe-huge treated as absent — Pitfall 6, T-03-09).
  2. Filter `verifiedAt !== null` (A5 fail-closed; inactive routes already excluded inside resolvePaths).
  3. Resolve the A1-cheapest path for the A2 conservative need (`pointsMax ?? pointsMin`).
  4. Value at both range ends: partner-point `cppX100`, path-dependent `effectiveCppX100` (atMin re-runs `requiredSourcePoints` for `pointsMin` on the chosen route+bonus), per-program `wowDeltaCents`; all `atMax` fields null for fixed charts.
  5. Partition: coverage ≥ 1 → bookableNow (pointsAway null); threshold ≤ coverage < 1 → almostThere (`pointsAway = requiredSourcePoints − balance`, in the chosen path's source currency); below threshold → dropped. Default threshold 0.75, parameterized via `EngineOptions` (Pitfall 8).
  6. Sort: bookableNow by conservative wow delta (`atMax ?? atMin`) descending; almostThere by coverage descending via integer cross-multiplication; all ties break to slug ascending.
- **`src/engine/index.ts`** — five `export *` lines over types/transfers/paths/valuation/ranking, with the src/engine/transfers.ts ↔ src/data/transfers.ts filename-collision warning for consumers. No export-name collisions surfaced at typecheck.
- **`tests/engine-ranking.test.ts`** (18 tests, 345 lines, real seed rows throughout) — partition membership (park-hyatt-tokyo bookable at chase-ur 80,000; st-regis-bora-bora almost-there with pointsAway exactly 20,000); coverage exactly 0.75 included, exactly 1.0 bookable; threshold 0.5 override surfaces ritz-carlton-kyoto (coverage ≈ 0.615); unreachable-partner absence; sortedness walks; the flagship hand-computed anchor (bilt 80,000 → ANA First via Virgin at wow 1,352,700 cents); full field pin on conrad-maldives under the live promo (cpp 138/110, effective 355/286, wow 182,800/173,800); VAL-05 direct two-call comparison across the 2026-10-14 endDate; draft exclusion under 5M-everywhere balances; five hostile-balance cases with all-finite output walk; availabilityRating enum passthrough; deep-equal determinism.

## Verification

- `npx vitest run tests/engine-ranking.test.ts` — 18 passed
- `npx vitest run tests/engine-purity.test.ts` — passed (ranking.ts + index.ts auto-covered by the dynamic gate; 6-file engine green — phase SC-5)
- `npm test` — 90 passed (7 files; all Phase 2 + wave 1-2 suites untouched)
- `npm run typecheck` — exit 0
- `npm run lint` — exit 0
- `npm run build` — exit 0 (Next.js 16.3.4 production build)

## TDD Gate Compliance

Task 1 followed strict RED → GREEN: b9f8e4f (test, observed failing on module-not-found) → ad2fcc6 (feat). Task 2's extended tests passed immediately against the Task 1 implementation — the plan explicitly anticipated this ("Task 1's sanitize step should already handle most; if nothing needs fixing, note tests-only in the commit"), so 06ea6ae is a tests-only commit rather than a RED/GREEN pair. No REFACTOR commits — implementations landed clean.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree had an empty node_modules, breaking `npm run build`**
- **Found during:** Task 3 (phase gate run)
- **Issue:** The isolated worktree contained an empty `node_modules/` (only a vitest cache). CLI tools (vitest/tsc/eslint) resolved upward to the main repo's install, but Turbopack anchors resolution at the worktree root and failed (`node_modules/next` missing); an out-of-root junction was also rejected by Turbopack.
- **Fix:** Ran `npm ci` inside the worktree (lockfile-pinned, no new packages — the Package Legitimacy Audit's "no external packages" verdict is unaffected). Environment-only; nothing committed.
- **Files modified:** none (node_modules is gitignored)
- **Commit:** n/a

Otherwise the plan executed exactly as written. (Task 2's tests-only outcome is the plan's own sanctioned branch, noted above, not a deviation.)

## Known Stubs

None. rankRedemptions is a complete implementation wired end-to-end to the real dataset; no hardcoded empty values, placeholders, or unwired data paths.

## Threat Flags

None — no new network endpoints, auth paths, file access, or schema changes. Plan-scoped threats each mitigated and pinned by named tests: T-03-09 (hostile balances → sanitize + five all-finite cases), T-03-10 (draft leaks → A5 filter + max-balance exclusion test naming both draft slugs), T-03-11 (non-determinism → asOf-as-input + deep-equal repeat-call test; purity gate forbids clock reads).

## Self-Check: PASSED

- src/engine/ranking.ts — FOUND (`export function rankRedemptions(` present)
- src/engine/index.ts — FOUND (`export * from "./ranking";` present)
- tests/engine-ranking.test.ts — FOUND (345 lines ≥ 100 min_lines)
- Commits b9f8e4f, ad2fcc6, 06ea6ae, b76cba1 — FOUND
