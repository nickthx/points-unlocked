---
phase: 02-redemption-database
plan: 01
subsystem: database
tags: [drizzle, neon, zod, schema, seed-validation]
requires: []
provides:
  - "src/db/schema.ts: 4 curated pgTables (programs, transferRoutes, transferBonuses, redemptions) + 3 pgEnums, integer-only quantities"
  - "src/data/types.ts: Zod seed schemas + validateDataset cross-referential checks"
  - "Live Neon schema in sync (health_check dropped, 4 curated tables pushed)"
affects:
  - 02-02 (program/route seed data authoring)
  - 02-03 (redemption drafting)
  - 02-04 (seed pipeline consumes validateDataset)
  - 02-05 (seed-data tests parse via these schemas)
tech-stack:
  added: [zod ^4.5.4]
  patterns:
    - "Integer-only DB quantities: cents, cppX100, ratio numerator/denominator — no floats/numeric"
    - "Composite PK via (t) => [primaryKey({...})]; composite foreignKey() on transfer_bonuses"
    - "Hand-written Zod v4 seed schemas mirroring Drizzle camelCase keys (no drizzle-zod)"
    - "z.iso.date() for ISO date strings in seed data"
key-files:
  created:
    - src/data/types.ts
  modified:
    - src/db/schema.ts (full rewrite — healthCheck deleted)
    - src/app/page.tsx (verified-redemptions count status line)
    - scripts/db-check.ts (read-only programs count)
    - package.json (zod dep; db:push, db:seed scripts)
decisions:
  - "drizzle-kit push --force does not bypass the table-rename TTY prompt; dropped health_check via direct SQL first so the push contained only creations"
  - "Assumption A4 documented in code: promo transfer bonuses do not stack with structural block bonuses (pending DATA-04 confirmation)"
metrics:
  duration: "~10 minutes"
  completed: "2026-09-01"
---

# Phase 2 Plan 01: Curated Schema Foundation Summary

Replaced the Phase 1 health_check placeholder with the four real curated Drizzle tables plus a hand-written Zod v4 seed-validation layer, migrated both consumers atomically, and pushed the schema live to Neon.

## What Was Built

- **src/db/schema.ts** — full rewrite: 3 pgEnums (`program_kind`, `availability_rating`, `redemption_category`) and 4 tables (`programs`, `transfer_routes`, `transfer_bonuses`, `redemptions`) per RESEARCH.md Pattern 1. All quantities are integers (cents, cppX100, ratio numerator/denominator, bonus blocks); no `real`/`numeric`/floats. `transfer_routes` uses a composite PK on (from, to); `transfer_bonuses` carries a composite FK onto that pair. No derived values (cpp/wow-delta) stored; no users/bookmarks tables (Phase 6).
- **src/data/types.ts** — hand-written Zod v4 schemas (`programSeedSchema`, `transferRouteSeedSchema`, `transferBonusSeedSchema`, `redemptionSeedSchema`) whose keys exactly mirror the Drizzle camelCase properties, plus inferred types and `validateDataset` (aggregated per-element parse issues, uniqueness of program slugs / route pairs / redemption slugs, cross-refs: routes→programs, bonuses→routes, redemptions→programs). Refinements: bonus fields both-null-or-both-set, `endDate >= startDate`, `pointsMax >= pointsMin`. Assumption A4 (promo bonuses don't stack with structural block bonuses) documented as a comment near the bonus schema.
- **src/app/page.tsx** — status line now counts verified redemptions (`count()` + `isNotNull(redemptions.verifiedAt)`) rendering "0 verified redemptions live"; T-01-07 empty-catch + neutral fallback preserved; `force-dynamic` and all JSX untouched.
- **scripts/db-check.ts** — repointed to a read-only `programs` count ("programs rows: N"); env guard, DATABASE_URL check, dynamic import, counts-only output, and message-only error handling all preserved (T-01-08).
- **package.json** — `zod ^4.5.4` added (only new dependency); `db:push` and `db:seed` scripts added (`db:seed` inert until plan 02-04 creates scripts/seed.ts).
- **Neon (live)** — `health_check` dropped; `programs`, `transfer_routes`, `transfer_bonuses`, `redemptions` created. Verified via information_schema listing and `npx tsx scripts/db-check.ts` printing "programs rows: 0".

## Verification Results

- `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` — all exit 0
- `grep -rc "healthCheck" src/ scripts/` — 0 occurrences everywhere
- `grep -c "pgEnum(" src/db/schema.ts` = 3; `grep -c "pgTable(" src/db/schema.ts` = 4; no `real(`/`doublePrecision(`/`numeric(`
- tsx smoke: `validateDataset` exists, empty dataset passes ("types.ts OK"); functional check confirms the "must be set together" refinement throws
- `npx drizzle-kit push --force` exited 0; `npx tsx scripts/db-check.ts` exited 0 printing "programs rows: 0"; no output contained any DATABASE_URL fragment

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `.env.development.local` missing in worktree**
- **Found during:** Task 3
- **Issue:** Untracked env file doesn't carry into git worktrees
- **Fix:** Copied the gitignored file from the main checkout instead of re-running `vercel env pull` (no repo change; file remains gitignored)
- **Files modified:** none (gitignored local file only)

**2. [Rule 3 - Blocking] `drizzle-kit push --force` still prompted interactively**
- **Found during:** Task 3
- **Issue:** `--force` bypasses only data-loss confirmation; the deleted-vs-created table resolver (`tablesResolver` asking whether `programs` renames `health_check`) requires a TTY and crashed non-interactively
- **Fix:** Dropped `health_check` first via a one-off `DROP TABLE IF EXISTS health_check` through `@neondatabase/serverless` (data loss intended per plan), then `push --force` applied cleanly with only creations
- **Files modified:** none (remote schema + scratchpad script outside repo)

## Notes for Downstream Plans

- The tsx `-e` eval harness applies CJS interop (no `"type": "module"` in package.json): dynamic `import()` of TS files in eval scripts exposes exports under `.default`. App/bundler imports are unaffected; test files under vitest are unaffected.
- `validateDataset` runs the aggregated Zod parse first and throws before cross-ref checks if any element is malformed; cross-ref/uniqueness errors are aggregated in a second throw.

## Known Stubs

- `"db:seed": "tsx scripts/seed.ts"` in package.json references a script that does not exist until plan 02-04. Intentional per plan text ("the script entry is inert until then").
- Homepage renders "0 verified redemptions live" — 0 is a valid render this phase; plans 02-02..02-05 populate the data.

## Threat Flags

None — no new surface beyond the plan's threat model (T-02-01..T-02-04, T-02-SC all mitigated as specified).

## Commits

- 7cb1a37 feat(02-01): replace health_check schema with 4 curated tables, migrate consumers
- 40a7f55 feat(02-01): add Zod seed schemas and validateDataset cross-referential checks
- (Task 3: remote Neon schema operation — no repo files changed)

## Self-Check: PASSED

- src/data/types.ts exists; SUMMARY.md exists
- Commits 7cb1a37 and 40a7f55 present on worktree-agent-ab94b6f8ca5a635a4
