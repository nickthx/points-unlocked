---
phase: 03-valuation-ranking-engine
verified: 2026-09-02T00:35:00Z
status: passed
score: 12/12 must-haves verified
overrides_applied: 0
---

# Phase 3: Valuation & Ranking Engine Verification Report

**Phase Goal:** A sealed, pure TypeScript engine that turns balances + dataset into ranked, valued redemptions — framework-free so it later becomes the v2 advisor's tool
**Verified:** 2026-09-02T00:35:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Merged from ROADMAP Success Criteria (SC-1..SC-5) and all four PLAN `must_haves` (deduplicated; roadmap wording kept where overlapping).

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1 | SC-1: Given balances, engine returns bookable-now ranked by wow delta + almost-there with points-away | ✓ VERIFIED | Live probe (real dataset, `amex-mr: 120_000`, asOf 2026-09-15): 19 bookableNow sorted wow-desc (checked programmatically), 3 almostThere, `pointsAway` 10,000 on ritz-carlton-kyoto. Pinned by tests/engine-ranking.test.ts (18 tests). |
| 2 | SC-2: Cpp follows TPG convention, verified by unit tests against hand-computed examples | ✓ VERIFIED | valuation.ts:38 `Math.round(((cashFareCents − taxesFeesCents) × 100) / partnerPoints)`; tests pin 933 (ANA business) and 1876 (ANA First) from literals AND real rows; 100× bug explicitly ruled out (`not.toBe(93_333)`, engine-valuation.test.ts:45-48). |
| 3 | SC-3: Active transfer bonuses auto-adjust effective points cost and cpp | ✓ VERIFIED | Live probe: Conrad Maldives 77,000 MR / effCpp 286 / bonus 30% at 2026-09-15 vs 100,000 MR / effCpp 220 / bonus null at 2026-10-15. Direct two-call comparison test at engine-ranking.test.ts:219-236. |
| 4 | SC-4: Engine resolves cheapest transfer path when multiple held programs reach the same partner | ✓ VERIFIED | resolvePaths (paths.ts:169-254) — affordable pool → min requiredSourcePoints, ties direct-first then slug; test pins bilt 60,000 chosen over Marriott 150,000 (engine-paths.test.ts:189-200). |
| 5 | SC-5: Engine imports nothing from Next.js, React, or the database layer | ✓ VERIFIED | tests/engine-purity.test.ts (4 tests, pass) dynamically enumerates all 6 src/engine files; denylist (next/react/zod/drizzle/@neondatabase/node:/db/@/) + clock-read guard; RED-proof of gate firing recorded in 03-01-SUMMARY. |
| 6 | A1/A2/Bilt rulings ratified by Nick and recorded in code comments | ✓ VERIFIED | types.ts:23-35 (A1/A2/A3/A5/A7 "CONFIRMED by Nick 2026-09-01"), paths.ts:52, 137-140, 161; programs.ts:49-51 bilt = 10 "CONFIRMED by Nick 2026-09-01 (Phase 3 methodology sign-off)" — remaining sign-off phrases are ratification citations, not open items. |
| 7 | Engine result shape = plain hand-written interfaces, zero runtime imports | ✓ VERIFIED | types.ts sole import is `import type {...} from "../data/types"` (line 1-6); purity gate enforces. |
| 8 | Inverse transfer math exact: 60K Alaska via Marriott = 150,000 Bonvoy (block bonus), never naive 180,000 | ✓ VERIFIED | Binary search over increment multiples (paths.ts:98-128); test pins 150_000 (engine-paths.test.ts:127) with 147,000→59,000 minimality counter-case. |
| 9 | Wow delta uses per-program cash-out baselines, null baselines → 0 | ✓ VERIFIED | valuation.ts:72-81 (`null ? 0 : floor(points × baseline / 100)`); tests use real program rows via `cashOutBaselineCppX100` fixtures. |
| 10 | All money math integer (cents, cppX100) | ✓ VERIFIED | Math.round/floor/ceil on integers throughout; single sanctioned float is display-only `coverage`; sorts use integer cross-multiplication (ranking.ts:215-224). See WR-06 caveat under Anti-Patterns — exactness bound (2^53) is documented-by-comment, not enforced; safe by ~4 orders of magnitude at seed scale. |
| 11 | Drafts never appear; hostile balances (negative, NaN, Infinity, huge) never produce NaN outputs | ✓ VERIFIED | sanitizeBalances (ranking.ts:35-43) keeps only positive safe integers; verifiedAt-null filter at ranking.ts:116; tests engine-ranking.test.ts:283-317 (five hostile cases + all-finite output walk); live probe: 0 draft leaks, `{}` → empty partitions. |
| 12 | Single public barrel for Phase 4 / v2 advisor | ✓ VERIFIED | src/engine/index.ts exports all 5 modules; `npm run typecheck` exit 0 (no collisions); live probe imported `rankRedemptions` through the barrel successfully. |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/engine/types.ts` | Engine contracts, `export interface RankedResult` | ✓ VERIFIED | 194 lines; all 9 contracts exported; type-only imports only |
| `src/engine/paths.ts` | activeBonusFor, effectivePartnerPoints, requiredSourcePoints, resolvePaths | ✓ VERIFIED | 254 lines; all 4 exported; substantive implementations |
| `src/engine/valuation.ts` | cppX100, effectiveCppX100, cashOutValueCents, wowDeltaCents | ✓ VERIFIED | 106 lines; all 4 exported |
| `src/engine/ranking.ts` | `export function rankRedemptions` orchestrator | ✓ VERIFIED | 230 lines; full filter→resolve→value→partition→sort pipeline |
| `src/engine/index.ts` | Public barrel, `export * from "./ranking"` | ✓ VERIFIED | 5 export lines + collision-hazard header |
| `tests/engine-purity.test.ts` | Executable purity gate, contains "node:fs" | ✓ VERIFIED | 125 lines; 4 tests pass; dynamic enumeration |
| `tests/engine-paths.test.ts` | ≥80 lines, real seed-row fixtures | ✓ VERIFIED | 320 lines |
| `tests/engine-valuation.test.ts` | ≥60 lines, VAL-02 anchors | ✓ VERIFIED | 142 lines |
| `tests/engine-ranking.test.ts` | ≥100 lines, VAL-05 end-to-end | ✓ VERIFIED | 345 lines, 18 tests |

gsd-sdk `verify.artifacts`: 9/9 passed across all 4 plans.

### Key Link Verification

gsd-sdk `verify.key-links` reported 4 false negatives (its literal-filename matcher misses extension-less import specifiers). All links re-verified manually against the plans' declared regex patterns:

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| types.ts | ../data/types | type-only import | ✓ WIRED | types.ts:1-6 |
| engine-purity.test.ts | src/engine/ | fs.readdirSync | ✓ WIRED | SDK-verified |
| paths.ts | ./transfers | frozen primitives | ✓ WIRED | paths.ts:2 `import { applyPromoBonus, computePartnerPoints } from "./transfers"` |
| engine-paths.test.ts | src/data/transfers.ts | real seed fixtures | ✓ WIRED | SDK-verified |
| valuation.ts | ../data/types | type-only import | ✓ WIRED | valuation.ts:1 (matches plan's OR-pattern) |
| engine-valuation.test.ts | src/data/programs.ts | baseline fixtures | ✓ WIRED | SDK-verified |
| ranking.ts | ./paths | resolvePaths composition | ✓ WIRED | ranking.ts:1 |
| ranking.ts | ./valuation | cpp/wow-delta composition | ✓ WIRED | ranking.ts:2 |

Note: nothing under src/app or src/lib imports the engine yet — by design; the barrel's consumers are Phase 4 UI and the v2 advisor. Tests exercise every export.

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| ranking.ts | RankedResults | real seed arrays (programs/routes/bonuses/redemptions) via caller-assembled EngineDataset | Yes — live probe returned 19 real ranked results with correct hand-verifiable numbers | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Full suite | `npm test` | 90 passed (7 files) | ✓ PASS |
| Purity gate | `npx vitest run tests/engine-purity.test.ts` | 4 passed | ✓ PASS |
| Typecheck | `npm run typecheck` | exit 0 | ✓ PASS |
| End-to-end ranking (real dataset) | tsx probe via barrel | 19 bookableNow wow-desc-sorted, 3 almostThere, pointsAway 10,000, 0 draft leaks, empty balances → empty partitions | ✓ PASS |
| VAL-05 promo window flip | same probe, asOf 09-15 vs 10-15 | 77,000→100,000 MR, effCpp 286→220, bonus 30%→null | ✓ PASS |

### Probe Execution

No conventional `scripts/*/tests/probe-*.sh` probes exist in this project and no plan declares any — probe step satisfied by the ad-hoc live probe above.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| VAL-02 | 03-01, 03-03, 03-04 | Cpp math follows TPG convention: (cash fare − taxes/fees) ÷ points × 100 | ✓ SATISFIED | valuation.ts:38 + hand-computed anchors 933/1876 pinned from both literals and real rows |
| VAL-05 | 03-01, 03-02, 03-04 | Active transfer bonus auto-adjusts valuations (bonus-adjusted cpp) and is surfaced in result | ✓ SATISFIED | chosenPath.activeBonus surfaced; direct before/after-endDate comparison test + live probe confirm cost drop and cpp lift |

REQUIREMENTS.md maps exactly VAL-02 and VAL-05 to Phase 3 — no orphaned requirements.

### Anti-Patterns Found

No debt markers (TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER) in any phase-modified file. No stub patterns, empty returns, or hardcoded empty data.

Code-review findings (03-REVIEW.md, 1 Critical + 6 Warnings) assessed for goal impact:

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| src/engine/paths.ts | 103-127 | CR-01: requiredSourcePoints infinite-loops on `partnerPointsNeeded = Infinity`, returns 0 on NaN; in-code T-03-05 "bounded loop" comment overclaims | ⚠️ Warning (not goal-blocking) | Unreachable through `rankRedemptions` + the shipped dataset: `pointsMin`/`pointsMax` are zod `.int().positive()` (src/data/types.ts:73-75), which rejects NaN/Infinity, and the 03-04 threat model explicitly rules the dataset boundary trusted. Reachable only by calling the barrel-exported `requiredSourcePoints`/`resolvePaths` directly with non-finite junk (v2 advisor scenario). One-line fail-closed guard; fix before or during Phase 4. |
| src/engine/valuation.ts | 72-106 | WR-01: cashOutValueCents/wowDeltaCents lack the non-finite guard the module header claims | ⚠️ Warning | Inputs come from zod-validated cents fields + increment-aligned requiredSourcePoints in the real pipeline; hardening follow-up |
| src/engine/ranking.ts | 35-43 | WR-02: sanitizeBalances validates values, not keys — junk keys can mint phantom direct paths | ⚠️ Warning | The 03-04 must-have covered hostile values only; plan assigns key/shape clamping to Phase 4's zod boundary. Recommend whitelisting the 8 enterable slugs when Phase 4 wires URL input |
| src/engine/paths.ts | 59-72 | WR-03: weak promo (<25%) on a block-bonus route would raise cost vs no promo | ⚠️ Warning (latent) | No such seed row exists today; requires a ruling from Nick before changing ratified-A4 code |
| tests/engine-purity.test.ts | 24 | WR-05: gate regex misses side-effect/dynamic/require imports | ⚠️ Warning | Gate covers all forms actually used; cheap regex additions recommended |
| multiple | — | WR-04/WR-06/IN-01..04: tie-break, 2^53 bounds, asOf format, alternates affordability, A3 same-percent tie | ℹ️ Info | Latent at current data magnitudes/route set; hardening backlog |

None of these falsify a must-have truth or roadmap success criterion; all sit at input boundaries the plans explicitly designated as trusted (dataset) or Phase-4-owned (user input clamping). They should be carried into Phase 4 planning as hardening tasks.

### Human Verification Required

None. All five success criteria are programmatically verifiable (pure functions + executable gates); the phase's one human checkpoint (03-01 Task 1 ratification) completed during execution with rulings recorded in code. No `<human-check>` blocks exist on auto tasks in any plan.

### Gaps Summary

No gaps. The sealed engine exists, is substantive (784 lines of implementation across 6 files), fully wired (barrel → ranking → paths/valuation → frozen transfers), and demonstrably produces correct real-data output end-to-end: 90/90 tests green, purity gate green over all 6 engine files, typecheck clean, and an independent live probe reproduced the SUMMARY's flagship numbers exactly (Conrad Maldives 77,000 MR @ effCpp 286 during the +30% window vs 100,000 @ 220 after). The review's Critical finding is a real robustness defect on a barrel-exported utility but is unreachable via the phase's contracted data path and does not falsify any success criterion — recommend the one-line `Number.isFinite` guard (plus WR-01/WR-02 guards) as an early Phase 4 hardening task before user-supplied input reaches the engine.

---

_Verified: 2026-09-02T00:35:00Z_
_Verifier: Claude (gsd-verifier)_
