---
phase: 02-redemption-database
verified: 2026-09-01T15:10:00Z
status: passed
score: 4/4 must-haves verified
overrides_applied: 0
---

# Phase 2: Redemption Database Verification Report

**Phase Goal:** The curated dataset exists as structured, verified data — the substance every other layer reads
**Verified:** 2026-09-01T15:10:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1   | Schema models programs, transfer routes (ratio + bonus rule + increment), transfer bonuses (dated manual overrides), and redemptions (points, cash fare, taxes/fees, verified date, booking notes) | ✓ VERIFIED | `src/db/schema.ts` (123 lines, read in full): 4 pgTables + 3 pgEnums. `transfer_routes` has `ratioNumerator`/`ratioDenominator`, `incrementPoints`, `bonusMilesPerBlock`/`bonusBlockPoints` (composite PK on from/to). `transfer_bonuses` has `bonusPercent`, `startDate`/`endDate`, `sourceNote` (composite FK onto routes). `redemptions` has `pointsMin`/`pointsMax`, `cashFareCents`, `taxesFeesCents`, `verifiedAt` (date, NULL = draft), `bookingHint`. Integer-only quantities — grep confirms zero `real(`/`numeric(`/`doublePrecision(`. |
| 2   | Transfer-route edge cases compute correctly in seed validation: Marriott 3:1 with 5K-per-60K bonus, Amex→Hilton 1:2, Bilt 1:1 | ✓ VERIFIED | `tests/transfers.test.ts` (read in full) asserts against REAL seed rows via `findRoute` (throws if row missing): Marriott 120,000→50,000, 60,000→25,000, 59,000→19,000; MR→Hilton 60,000→120,000; Bilt 25,000→25,000, 900→0; promo composition 10,000 MR→26,000 Hilton. Ran `npm test` myself: **28/28 pass**. Seed rows confirmed in `src/data/transfers.ts` lines 54-60, 101-108, 126-145 (1/3 + 3000 increment + 5000/60000; 2/1; 1/1). |
| 3   | At least 30 Nick-verified entries covering all 8 programs load from typed seed files (path to 80–120 established, no unverified entry marked shippable) | ✓ VERIFIED | Counted in source: 34 entries with `verifiedAt: "2026-09-01"` (10 flights-AP + 11 flights-EU + 13 hotels); 2 held drafts (`st-regis-maldives`, `gritti-palace-venice`) with `verifiedAt: null` + needs-manual-check sourceNotes. Coverage gate in `tests/seed-data.test.ts:160-178` asserts ≥30 verified AND per-program reachability for all 8 enterable slugs — passing in the suite I ran. Provenance gate (lines 180-193) fails CI if a verified entry carries a "CLAUDE DRAFT" sourceNote. Live DB (read-only query): **34 verified in DB**. Path to 80–120: category/region file split (`redemptions-flights.ts` 256 lines, `-flights-europe.ts` 279, `-hotels.ts` 378 — all under 500) + concatenation barrel. |
| 4   | Seed files rebuild the database idempotently with one command | ✓ VERIFIED | `scripts/seed.ts` (92 lines, read in full): `npm run db:seed` (script confirmed in package.json:14) runs full delete-then-insert in FK-safe order inside one `db.batch()` — idempotent by construction (every run converges to exact repo state; no `db.transaction`). `validateDataset` runs BEFORE `src/db` is imported (bad data can never reach a write). Empty-array insert guard present. Documented double-runs with identical counts at both draft stage (02-04) and verified stage (02-05); per orchestrator instruction the seed was not re-run here — instead confirmed live DB state matches seed arrays exactly via read-only queries: `programs rows: 21` (= programs array length) and `34 verified` (= source count). |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/db/schema.ts` | 4 curated pgTables + 3 pgEnums, integer-only | ✓ VERIFIED | 123 lines; contains `transferRoutes`; imported by page.tsx, seed.ts, db-check.ts via `@/db` barrel |
| `src/data/types.ts` | Zod seed schemas + validateDataset | ✓ VERIFIED | 213 lines; exports all 4 schemas, 4 z.infer types, `validateDataset` (line 147); A4 rule + cash-fare convention (lines 40-49) recorded as CONFIRMED 2026-09-01 |
| `src/data/programs.ts` | 8 enterable + partner programs | ✓ VERIFIED | 171 lines; grep counts exactly 8 `isUserEnterable: true`; canonical-slug test passes |
| `src/data/transfers.ts` | Structural routes + dated bonuses | ✓ VERIFIED | 162 lines; 46 routes incl. 3 mandatory edge cases; 1 live dated bonus (Amex→Hilton 30%, 2026-09-01→2026-10-14) with sourceNote |
| `src/data/redemptions.ts` (+ split files) | ≥30 verified entries | ✓ VERIFIED | 36 entries (34 verified) across 3 split files + concatenation barrel; every entry has sourceNote + bookingHint (CI-asserted) |
| `src/data/index.ts` | Barrel for seed script/tests | ✓ VERIFIED | 13 lines; consumed by seed.ts and both test files (imports confirmed) |
| `src/engine/transfers.ts` | Pure transfer math, 2 exports | ✓ VERIFIED | 52 lines; `computePartnerPoints` + `applyPromoBonus`; only import is type-only `TransferRouteSeed` — framework/DB-free confirmed by reading the file |
| `scripts/seed.ts` | Idempotent db.batch rebuild | ✓ VERIFIED | 92 lines; contains `db.batch`; validate-before-import ordering confirmed; counts-only output, message-only errors |
| `tests/transfers.test.ts` | Edge-case table over real seed rows | ✓ VERIFIED | 88 lines; imports `../src/data/transfers` (real rows, no fixtures); 9 assertions with literal expected numbers |
| `tests/seed-data.test.ts` | Activated coverage gate | ✓ VERIFIED | 223 lines; contains `toBeGreaterThanOrEqual(30)` (line 162); no `src/db`/`DATABASE_URL` imports — DB-free |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `src/app/page.tsx` | `src/db/schema.ts` | `import { db, redemptions } from "@/db"` | ✓ WIRED | Line 3; query result rendered as `{dbStatus}` (line 37) |
| `scripts/seed.ts` | `src/data/index.ts` | `validateDataset` before `src/db` import | ✓ WIRED | Lines 32-45: data imported + validated first; `src/db` imported at line 50 |
| `scripts/seed.ts` | `src/db/index.ts` | `db.batch` delete children→parents, insert parents→children | ✓ WIRED | Lines 55-74: delete order bonuses→redemptions→routes→programs; inserts reversed |
| `tests/transfers.test.ts` | `src/data/transfers.ts` | real routes import | ✓ WIRED | Line 3 `import { routes } from "../src/data/transfers"`; `findRoute` throws on missing row |
| `tests/seed-data.test.ts` | `src/data/index.ts` | in-memory import, no DB | ✓ WIRED | Lines 6-16; zero `src/db`/env references |
| `src/engine/transfers.ts` | `src/data/types.ts` | type-only import (purity boundary) | ✓ WIRED | Line 1 `import type`; no other imports in file |
| Neon database | `src/db/schema.ts` | pushed schema + seeded data | ✓ WIRED | Read-only checks ran during verification: `programs rows: 21`, `34 verified in DB` — live tables match seed arrays |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `src/app/page.tsx` | `dbStatus` | `db.select({n: count()}).from(redemptions).where(isNotNull(verifiedAt))` | Yes — live DB returns 34; would render "34 verified redemptions live" | ✓ FLOWING |
| `tests/*` | seed arrays | direct imports of real seed files | Yes — 36 entries, 46 routes, 21 programs | ✓ FLOWING |
| Neon tables | seed data | `scripts/seed.ts` full rebuild | Yes — row counts match repo arrays exactly | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Full DB-free test suite (incl. coverage gate + edge-case math) | `npm test` | 3 files, 28/28 pass | ✓ PASS |
| Typecheck clean | `npm run typecheck` | exit 0 | ✓ PASS |
| Live DB has seeded programs | `npx tsx scripts/db-check.ts` (read-only) | `programs rows: 21` | ✓ PASS |
| Live DB verified count ≥ 30 | read-only drizzle count query | `34 verified in DB` | ✓ PASS |
| No secrets in script output | grep for `postgresql://` in outputs | 0 matches | ✓ PASS |

Seed re-run intentionally skipped per orchestrator instruction (already proven twice with identical counts); build/lint passed post-merge per orchestrator context and typecheck+test re-confirmed here.

### Probe Execution

Skipped — no `scripts/*/tests/probe-*.sh` exist and no plan declares probes (confirmed via find/grep).

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
| ----------- | -------------- | ----------- | ------ | -------- |
| DATA-01 | 02-01, 02-02, 02-04, 02-05 | Curated database of 80–120 redemptions ... as typed seed files | ✓ SATISFIED (phase scope) | 36 typed entries with all required fields (program, ratio, points, cash fare, taxes/fees, verified date, booking notes); phase SC explicitly scopes this phase to ≥30 verified with "path to 80–120 established" — met via file-split structure. Growth to the full 80–120 corpus is data-only follow-on work (no schema/pipeline change needed). |
| DATA-02 | 02-01, 02-03 | Transfer routes modeled structurally, edge cases handled | ✓ SATISFIED | Structural columns in schema; Marriott 1:3+5K/60K, Amex→Hilton 2:1, Bilt 1:1 as real seed rows; math frozen by 9 passing tests |
| DATA-03 | 02-01, 02-02, 02-04 | Transfer bonuses as dated manual overrides, editable without schema change | ✓ SATISFIED | `transfer_bonuses` table + 1 live dated row (Amex→Hilton 30%); adding/editing is a seed-data-only change; DATA-03 tests in suite |
| DATA-04 | 02-02, 02-05 | Content drafted collaboratively, verified by Nick before launch | ✓ SATISFIED | 34/36 entries carry `verifiedAt: "2026-09-01"`; rulings audit trail in `02-05-corrections.md`; 2 unverified entries stay `verifiedAt: null` (draft ≠ shippable); ≥30 floor + provenance-consistency CI-enforced |

No orphaned requirements: REQUIREMENTS.md maps exactly DATA-01..04 to Phase 2; all four appear in plan frontmatter.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | — | — | No TBD/FIXME/XXX/TODO/HACK markers in any phase-modified file. The single "placeholder" grep hit (schema.ts:13) is a descriptive comment about the Phase 1 placeholder being *replaced*. The 2 unverified redemptions are honest drafts by explicit human ruling, filtered by the `verifiedAt` NULL convention — not stubs. |

### Human Verification Required

None. The phase's human gate (DATA-04) was already executed as the 02-05 checkpoint — rulings are logged in `02-05-corrections.md` and materialized as commit 7eb284a, with two CI tests (coverage floor + provenance consistency) making regression fail the build. This phase has no visual/UX surface; live-DB state was confirmed here via read-only queries.

### Gaps Summary

No gaps. All four ROADMAP success criteria are observably true in the codebase: the schema models everything criterion 1 lists, the three edge-case routes compute correctly under a 28/28-green test suite run during this verification, 34 Nick-verified entries (≥30, all 8 programs reachable, CI-enforced) load from typed seed files, and the one-command seed pipeline is idempotent by construction with the live Neon state matching the repo arrays exactly.

Informational (not gaps):
- The full 80–120 corpus (DATA-01's end-state count) is future data-authoring work; this phase's contract was "path established," which the split-file structure + verified pipeline delivers.
- `st-regis-maldives` and `gritti-palace-venice` remain drafts by explicit human ruling; resolution is a data-only edit (verifiedAt + sourceNote) once manually checked on marriott.com.

---

_Verified: 2026-09-01T15:10:00Z_
_Verifier: Claude (gsd-verifier)_
