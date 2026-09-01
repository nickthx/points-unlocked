---
phase: 02-redemption-database
plan: 02
subsystem: database
tags: [seed-data, zod, curated-content, transfer-routes, redemptions]
requires:
  - "02-01: src/data/types.ts (Zod seed schemas + validateDataset), src/db/schema.ts"
provides:
  - "src/data/programs.ts: 8 enterable + 13 partner programs (ProgramSeed[])"
  - "src/data/transfers.ts: 46 structural routes incl. 3 DATA-02 edge cases + 2 dated draft bonuses"
  - "src/data/redemptions.ts: 36 draft redemptions (0 verified) via category/region-split files"
  - "src/data/index.ts: barrel consumed by scripts/seed.ts (02-04) and tests (02-03/02-05)"
affects:
  - 02-03 (engine tests consume the three edge-case routes as real seed rows)
  - 02-04 (seed pipeline imports the barrel)
  - 02-05 (Nick's DATA-04 verification pass edits these files in place)
tech-stack:
  added: []
  patterns:
    - "satisfies XSeed[] on literal arrays; Zod parse at seed/test time"
    - "route() helper defaults (1:1, 1000-pt increment) with explicit literal overrides for edge cases"
    - "Draft workflow: verifiedAt: null + mandatory CLAUDE DRAFT sourceNote on every entry"
    - "500-line rule via category/region file split, flattened by a concatenation barrel"
key-files:
  created:
    - src/data/programs.ts
    - src/data/transfers.ts
    - src/data/redemptions-flights.ts
    - src/data/redemptions-flights-europe.ts
    - src/data/redemptions-hotels.ts
    - src/data/redemptions.ts
    - src/data/index.ts
  modified: []
decisions:
  - "Bilt cashOutBaselineCppX100 set to 10 (0.1¢) — schema requires positive int, Bilt has effectively no cash-out; [ASSUMED A3] pending Nick's methodology sign-off"
  - "Flight drafts split by region (Asia-Pacific/Hawaii vs Europe/Middle East) to stay under the 500-line rule; barrel flattens all three redemption files"
  - "Marriott 1:3 + 5K/60K block bonus authored on two routes (→alaska-mileage-plan, →ana-mileage-club) so 02-03 tests have real rows"
metrics:
  duration: "~15 minutes"
  completed: "2026-09-01"
---

# Phase 2 Plan 02: Curated Seed Dataset (Draft Stage) Summary

Authored the full draft seed dataset as typed TypeScript: 21 programs, 46 structural transfer routes (including the Marriott 1:3+5K/60K, Amex MR→Hilton 2:1, and Bilt 1:1 edge cases), 2 dated draft promo bonuses, and 36 draft redemptions — every entry verifiedAt: null with concrete verification instructions for Nick, and the whole dataset passes validateDataset end to end.

## What Was Built

- **src/data/programs.ts** — `programs satisfies ProgramSeed[]`: exactly 8 `isUserEnterable: true` entries on the canonical slugs (chase-ur, amex-mr, capital-one, citi-ty, bilt as banks; world-of-hyatt, hilton-honors, marriott-bonvoy as hotels) plus 13 airline partner programs. Bank cash-out baselines are provisional `[ASSUMED A3]` values (Chase 100, Amex 60, Capital One 50, Citi 100, Bilt 10); hotels null.
- **src/data/transfers.ts** — `routes` (46) + `bonuses` (2). A `route()` helper supplies the standard shape (1:1, 1000-pt increment `[ASSUMED A2]`, active); edge cases override with explicit literals:
  - `marriott-bonvoy→alaska-mileage-plan` and `marriott-bonvoy→ana-mileage-club`: ratioNumerator 1 / ratioDenominator 3, incrementPoints 3000 `[ASSUMED A1]`, bonusMilesPerBlock 5000, bonusBlockPoints 60000
  - `amex-mr→hilton-honors`: ratioNumerator 2 / ratioDenominator 1, no block bonus
  - `bilt→alaska-mileage-plan` (and six more Bilt routes): 1:1, with Bilt 2.0 caveats (Accor 3:2 exception noted, not modeled) in notes
  - 2 dated draft transfer bonuses (amex→virgin 30%, citi→lifemiles 25%) with ISO dates and explicit CLAUDE DRAFT sourceNotes — proves the DATA-03 data-only edit path
- **src/data/redemptions-flights.ts / redemptions-flights-europe.ts / redemptions-hotels.ts** — 21 flight + 15 hotel drafts (36 total). Every entry: `verifiedAt: null`, CLAUDE DRAFT sourceNote naming the live-source check, methodologyNote recording the fare convention (provisional per Pitfall 5), 2–4-line bookingHint, integer cents, kebab-case unique slug, stable imageSlug. Dynamic-priced programs use pointsMin/pointsMax ranges; only the two Virgin fixed-chart ANA entries use pointsMax: null. All 8 enterable programs are reachable (hotels directly; every airline partner has ≥1 inbound bank route).
- **src/data/redemptions.ts** — concatenation barrel exporting the contract `redemptions` array.
- **src/data/index.ts** — barrel (`types`, `programs`, `transfers`, `redemptions`) with the src/data-vs-src/db name-collision hazard documented; does NOT re-export the split files (no duplicate symbols).

## Verification Results

- Task 1 tsx check: `programs+transfers OK: 21 programs, 46 routes, 2 bonuses`; exactly 8 enterable
- Task 2 tsx check: `redemptions OK: 36 drafts, 0 verified`; cross-ref check: all partners exist, all reachable
- Task 3 full run: `dataset valid: 21 programs, 46 routes, 2 bonuses, 36 redemptions` via `validateDataset` on the index barrel
- `npm run typecheck`, `npm run build`, `npm run lint`, `npm test` — all exit 0
- `grep "bonusBlockPoints: 60000"` (comments stripped) = 2; all seed files under 500 lines (max 376)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] redemptions-flights.ts exceeded the 500-line rule (516 lines)**
- **Found during:** Task 2
- **Issue:** 21 flight entries with full provenance fields could not fit one file under the CLAUDE.md 500-line hard constraint
- **Fix:** Split flights by region — `redemptions-flights.ts` (Asia-Pacific/Hawaii, 10 entries, 254 lines) + new `redemptions-flights-europe.ts` (Europe/Middle East, 11 entries, 274 lines); `redemptions.ts` barrel concatenates all three redemption files. Matches the plan's own file-split growth path to 80–120 entries.
- **Files modified:** src/data/redemptions-flights.ts, src/data/redemptions-flights-europe.ts (new), src/data/redemptions.ts
- **Commit:** fa9021a

**2. [Rule 3 - Blocking] Worktree had no node_modules — `npm run build` failed**
- **Found during:** Task 3
- **Issue:** tsc/tsx resolve packages by walking up to the main checkout, but Turbopack pins resolution to the worktree root and also rejects an out-of-root junction ("Symlink node_modules is invalid")
- **Fix:** `npm ci` in the worktree (restores the exact lockfile — no new packages installed); build then passed
- **Files modified:** none (gitignored node_modules only)

## Notes for Downstream Plans

- The three DATA-02 edge cases exist as real seed rows for 02-03's tests: `marriott-bonvoy→alaska-mileage-plan` / `→ana-mileage-club` (1/3, 3000-increment, 5000/60000), `amex-mr→hilton-honors` (2/1), `bilt→alaska-mileage-plan` (1/1).
- tsx `-e` eval harness note from 02-01 holds: dynamic `import()` results were accessed defensively (`m.default ?? m`) in verification one-liners.
- `redemptions.ts` (not the split files) is the only redemption import surface; `src/data/index.ts` deliberately does not re-export the split files.

## Known Stubs

- **All 36 redemptions and both promo bonuses are drafts by design** (`verifiedAt: null`, CLAUDE DRAFT sourceNotes). This is the DATA-04 draft stage the plan mandates — plan 02-05's human verification checkpoint is the resolution path. Nothing falsely claims verification (CI-enforced by the Task 2/3 checks).
- Draft promo bonuses are placeholder promos with plausible dates; Nick must confirm or replace them with live promos at the 02-05 checkpoint (explicitly stated in their sourceNotes).

## Threat Flags

None — repo-controlled seed files only; no new endpoints, env access, or DB writes. T-02-05/T-02-06 mitigations are in force (0 verified entries; sourceNote schema-enforced).

## Commits

- b2092f1 feat(02-02): author program and transfer-route seed data
- fa9021a feat(02-02): draft 36 redemption entries, all verifiedAt null
- d7593fb feat(02-02): add data barrel and validate full dataset end to end

## Self-Check: PASSED

- src/data/programs.ts, transfers.ts, redemptions.ts, redemptions-flights.ts, redemptions-flights-europe.ts, redemptions-hotels.ts, index.ts all exist
- Commits b2092f1, fa9021a, d7593fb present on worktree-agent-a0d4675e94a383ea5
