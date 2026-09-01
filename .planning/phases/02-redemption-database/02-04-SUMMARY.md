---
phase: 02-redemption-database
plan: 04
subsystem: database
tags: [seed-pipeline, db-batch, neon, vitest, idempotency]
requires:
  - "02-01: src/db barrel (lazy neon-http db + Drizzle tables), validateDataset"
  - "02-02: src/data/index.ts barrel (programs/routes/bonuses/redemptions arrays)"
provides:
  - "scripts/seed.ts: idempotent one-command full rebuild of the 4 curated tables via db.batch"
  - "tests/seed-data.test.ts: DB-free structural suite over the real seed data (16 tests)"
  - "Neon seeded live: 21 programs, 46 routes, 2 bonuses, 36 redemptions (0 verified)"
affects:
  - 02-05 (verification gate re-runs db:seed after Nick's edits; adds the ≥30-verified assertion here)
tech-stack:
  added: []
  patterns:
    - "Validate-before-import ordering: src/data + validateDataset run before src/db is ever imported"
    - "Full delete-then-insert rebuild in FK-safe order inside one db.batch (never interactive transactions on neon-http)"
    - "Empty-array insert guard (drizzle .values([]) throws)"
    - "BatchItem<'pg'>[] accumulation + non-empty tuple cast for conditional batch composition"
key-files:
  created:
    - scripts/seed.ts
    - tests/seed-data.test.ts
  modified: []
decisions:
  - "REQUIREMENTS.md left untouched: DATA-01/DATA-03 demand verified entries (0 exist at draft stage); 02-05's human gate completes them — this plan proves only the automated portions"
  - "Conditional inserts typed as BatchItem<'pg'>[] with a [first, ...rest] tuple cast — deletes guarantee non-emptiness"
metrics:
  duration: "~6 minutes"
  completed: "2026-09-01"
---

# Phase 2 Plan 04: Idempotent Seed Pipeline + DB-Free Data Tests Summary

One command (`npm run db:seed`) now rebuilds all four curated Neon tables from the repo via a single db.batch — validation throws before any write, two consecutive runs converge to identical counts — and 16 DB-free vitest assertions lock the real dataset's structure, edge-case routes, bonus dating, and provenance in CI.

## What Was Built

- **scripts/seed.ts** — follows scripts/db-check.ts conventions exactly (guarded `process.loadEnvFile`, DATABASE_URL exit-1 guard, dynamic imports after env load, counts-only output, message-only catch handler). Ordering inside `main()`: dynamic import of `../src/data` + `validateDataset(...)` runs FIRST — any Zod or cross-ref failure throws before `../src/db` is imported, so bad data can never reach a write (T-02-11). Colliding names aliased (`programs: programData`, `redemptions: redemptionData`). Rebuild is one `db.batch([...])`: deletes child→parent (transferBonuses, redemptions, transferRoutes, programs) then inserts parent→child, with empty seed arrays skipped (drizzle's `.values([])` throws; bonuses may legitimately empty out). Success line: `seeded: 21 programs, 46 routes, 2 bonuses, 36 redemptions (0 verified)` — never the connection string (T-02-10). A6 convergence note in the header: partial batch application self-heals on re-run because every run is a full rebuild.
- **tests/seed-data.test.ts** — imports only from `../src/data` (no database code, no env access; CI needs no credentials). Four describe blocks, 16 tests:
  - *dataset validity (DATA-01):* per-element `safeParse` for all four arrays with failures reported per-slug/route-key; `validateDataset` over the full dataset does not throw; exactly 8 `isUserEnterable` programs matching the canonical slug set.
  - *edge-case routes (DATA-02 data-side):* Marriott 1:3 with 5,000/60,000 block bonus; Amex MR→Hilton 2:1; Bilt 1:1 — all present as real seed rows.
  - *transfer bonuses (DATA-03):* endDate ≥ startDate, bonusPercent 1–100, non-empty sourceNote, every (from,to) pair rides an existing route.
  - *provenance (DATA-04 automated):* every redemption has non-empty sourceNote + bookingHint; pointsMax ≥ pointsMin when set.
  - The ≥30-verified coverage assertion is deliberately absent (drafts are all `verifiedAt: null` by design) with a breadcrumb comment pointing at the plan 02-05 gate.
- **Neon (live)** — full draft dataset seeded and visible for Nick's drizzle-kit studio verification pass; `npx tsx scripts/db-check.ts` prints `programs rows: 21`.

## Verification Results

- `npm run db:seed` run twice: both exit 0 with IDENTICAL counts `21 programs, 46 routes, 2 bonuses, 36 redemptions (0 verified)` — phase success criterion 4 (idempotency) proven
- `npx tsx scripts/db-check.ts` → `programs rows: 21` (matches the programs seed array length; data landed in Neon)
- `grep -vE "^\s*//" scripts/seed.ts | grep -c "db.transaction"` = 0; `grep -c "db.batch" scripts/seed.ts` = 2
- Seed output contains no `postgresql://` or DATABASE_URL fragment (grep count 0)
- `npx vitest run tests/seed-data.test.ts` → 16/16 passing without a DB; `grep -vE "^\s*//" tests/seed-data.test.ts | grep -cE "src/db|@/db|DATABASE_URL"` = 0; 02-05 breadcrumb present
- `npm test` (17/17), `npm run typecheck`, `npm run lint`, `npm run build` — all exit 0

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree lacked .env.development.local and node_modules**
- **Found during:** Task 1 setup
- **Issue:** Gitignored env file and node_modules don't carry into git worktrees (known from waves 1–2)
- **Fix:** Copied `.env.development.local` from the main checkout (stays gitignored, not committed) and ran `npm ci` (exact lockfile restore, no new packages)
- **Files modified:** none (gitignored local files only)

## Notes for Downstream Plans

- 02-05's verification gate: after Nick's edits, re-run `npm run db:seed` (idempotent — safe any number of times) and add the ≥30-verified coverage assertion to tests/seed-data.test.ts where the breadcrumb comment sits (end of the "provenance" describe block header).
- `db.batch` conditional composition pattern: accumulate `BatchItem<"pg">[]`, cast to `[BatchItem<"pg">, ...BatchItem<"pg">[]]` — the four unconditional deletes guarantee the tuple is non-empty.
- Homepage still reads "0 verified redemptions live" — correct until 02-05 sets verifiedAt dates.

## Known Stubs

- Seed output reports "(0 verified)" — all 36 redemptions remain drafts by design (DATA-04 draft stage); plan 02-05's human verification checkpoint is the resolution path. No code stubs.

## Threat Flags

None — no new surface beyond the plan's threat model. T-02-10 (counts-only output), T-02-11 (validate-before-import), T-02-12 (parameterized builder only) all mitigated as specified; T-02-13 accepted with the convergence note documented in the script header.

## Commits

- 92b6bdb feat(02-04): add idempotent db.batch seed rebuild pipeline
- d8c36b5 test(02-04): add DB-free structural tests over real seed data

## Self-Check: PASSED

- scripts/seed.ts and tests/seed-data.test.ts exist
- Commits 92b6bdb and d8c36b5 present on worktree-agent-a227b79670bcd2bb4
