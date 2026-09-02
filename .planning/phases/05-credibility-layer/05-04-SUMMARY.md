---
phase: 05-credibility-layer
plan: 04
subsystem: api
tags: [drizzle, neon, server-action, react-19, useActionState, zod, honeypot, waitlist]

# Dependency graph
requires:
  - phase: 05-credibility-layer
    plan: 01
    provides: interestSchema (zod 4 email/honeypot boundary) consumed by the Server Action before any DB call
  - phase: 02-redemption-database
    provides: src/db lazy Neon proxy + schema house style (pgTable/serial/text), drizzle-kit push workflow, db-check script
  - phase: 04-core-experience
    provides: shadcn Input/Label/Button primitives, h-11 touch-target convention, section heading/spacing classes, terracotta reserved list
provides:
  - interest_signups table live in Neon (serial id, unique lower-cased email, source default "advisor-tease", created_at timestamptz)
  - src/app/actions/interest.ts — joinAdvisorWaitlist Server Action + InterestState; the single "@/db" importer under src/app + src/components
  - src/components/advisor-tease.tsx — AdvisorTease client section with useActionState form (pending / success / neutral error)
  - scripts/db-check.ts prints `interest_signups rows: N` as the post-push proof line
affects: [05-05, page.tsx mount, phase-06 privacy policy, phase-06 users/bookmarks push]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Runtime DB writes live only in \"use server\" files under src/app/actions/; client components import the action reference, never @/db (grep gate: exactly one importer)"
    - "Server Action error discipline: honeypot short-circuits to success without a write; zod issue text is never returned; bare catch returns fixed neutral copy; no console.* on the driver error"
    - "Idempotent signup: UNIQUE(email) + onConflictDoNothing({ target }) so repeat submits return the same success copy (no 'already registered' oracle)"
    - "React 19 form state: useActionState(action, INITIAL) + <form action={formAction}>; success replaces the form, error swaps the consent line, both under aria-live=polite"

key-files:
  created:
    - src/app/actions/interest.ts
    - src/components/advisor-tease.tsx
    - .planning/phases/05-credibility-layer/deferred-items.md
  modified:
    - src/db/schema.ts
    - scripts/db-check.ts

key-decisions:
  - "interest_signups was created by the first drizzle-kit push run; the push exit 1 came from pre-existing FK/PK churn on the curated tables (63-char identifier truncation), verified via pg_constraint — logged to deferred-items.md rather than touching curated constraints in this plan"
  - "Honeypot check runs before schema parse so bots never reach zod or the DB; the action passes website: \"\" into interestSchema explicitly since the honeypot was already handled"
  - "Honeypot <input> kept on one line with prettier-ignore so the attribute set is auditable in a single grep"

patterns-established:
  - "Post-push proof: scripts/db-check.ts counts every runtime-writable table; a new table is not done until its `<table> rows: N` line prints"
  - "Worktree deps via npm ci inside the worktree (no junction/symlink to the main checkout)"

requirements-completed: [PLAT-04]

# Metrics
duration: ~9min
completed: 2026-09-02
---

# Phase 5 Plan 04: Advisor Tease + Interest Hook Summary

**PLAT-04 end to end: `interest_signups` live in Neon, a `"use server"` `joinAdvisorWaitlist` action that validates with `interestSchema` and inserts idempotently with neutral-only responses, and the `AdvisorTease` client section wired through `useActionState` — with the client tree still DB-free**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-09-02T23:22:06Z
- **Completed:** 2026-09-02T23:31:00Z
- **Tasks:** 3
- **Files modified:** 5 (2 modified, 3 created)

## Accomplishments
- `interestSignups` Drizzle table added in house style (alphabetical `timestamp` import, column-rule comments, header note that it is the first runtime-writable table); `scripts/seed.ts` confirmed to never reference it
- Table exists in the live Neon database with the exact declared shape (verified via `information_schema.columns` + `pg_constraint`: `interest_signups_pkey`, `interest_signups_email_unique`, `source DEFAULT 'advisor-tease'`, `created_at timestamptz DEFAULT now()`); `npx tsx scripts/db-check.ts` prints `programs rows: 21` and `interest_signups rows: 0`
- `joinAdvisorWaitlist` (55 lines): honeypot → `interestSchema.safeParse` → `db.insert(...).onConflictDoNothing({ target: interestSignups.email })`; three fixed copy strings, bare `catch`, zero `console.*`
- `AdvisorTease`: "Coming soon" eyebrow, "The AI card-roadmap advisor" heading, hook copy, 44px email input + default ink "Notify me" button, hidden honeypot, consent line "One email when it launches. No spam, unsubscribe any time."; success state replaces the form with "You're on the list."
- Grep gate holds: `grep -rlE 'from "@/db|drizzle' src/components src/app` → exactly `src/app/actions/interest.ts`
- `npm run typecheck`, `npm run lint`, `npx vitest run` (167 tests) all exit 0; `.env.development.local` confirmed gitignored, `git status` shows no `.env` file

## Task Commits

Each task was committed atomically:

1. **Task 1: interest_signups schema + drizzle-kit push + db-check count** - `950258b` (feat)
2. **Task 2: joinAdvisorWaitlist Server Action** - `a831612` (feat)
3. **Task 3: AdvisorTease client section with useActionState form** - `fdf3436` (feat)

## Files Created/Modified
- `src/db/schema.ts` - `timestamp` import; `interestSignups` pgTable; header comment noting the first runtime writer
- `scripts/db-check.ts` - Destructures `interestSignups`; second `count()` query; prints `interest_signups rows: N`; T-01-08 error hygiene preserved
- `src/app/actions/interest.ts` - `"use server"`; `InterestState` type; `joinAdvisorWaitlist(_prev, formData)`; the only `@/db` importer in the app tree
- `src/components/advisor-tease.tsx` - `"use client"`; `AdvisorTease()` section with `useActionState` form, honeypot, aria-live status lines
- `.planning/phases/05-credibility-layer/deferred-items.md` - Out-of-scope drizzle-kit constraint-churn finding with root cause and suggested Phase 6 fix

## Decisions Made
- The pre-existing drizzle-kit drift on `transfer_bonuses`/`transfer_routes` was **not** fixed here: it touches curated-table constraints outside this plan's files, the live constraints are correct, and the plan's outcome (table created, shape verified, row count printed) was achieved. Logged to `deferred-items.md` with the verbatim statements and a suggested explicit FK name for Phase 6.
- Honeypot is checked before `safeParse` (bots never reach zod or the DB), and the action passes `website: ""` into the schema explicitly, matching the plan's contract.
- The tease's submit uses the default `bg-primary` button; terracotta remains reserved for "Copy my link" per 04-UI-SPEC.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `npx drizzle-kit push` exited 1 after creating the table**
- **Found during:** Task 1, step 3
- **Issue:** Non-interactive push ran `CREATE TABLE "interest_signups"` successfully, then attempted four pre-existing ALTERs unrelated to this plan (drop/re-add the `transfer_bonuses` composite FK whose generated name exceeds Postgres's 63-char limit, and drop/re-add the `transfer_routes` composite PK). The PK drop failed with `2BP01` because the re-added FK depends on the PK index. No interactive rename prompt was shown; `--strict --verbose` (declined via `/dev/null` stdin) listed only those four statements, confirming `interest_signups` was already in sync.
- **Fix:** Verified the live state directly (read-only `pg_constraint` / `information_schema` query through `@neondatabase/serverless`, no URL printed): `interest_signups` exists with the declared columns, PK, and unique index; the curated FK and PK are both present with unchanged definitions; seed data intact (`programs rows: 21`). Proceeded on the plan's real acceptance signal (`interest_signups rows: 0`). The drift itself is out of scope and recorded in `deferred-items.md`.
- **Files modified:** none in the repo beyond the planned files (plus the deferred-items note)
- **Commit:** `950258b`

**2. [Rule 3 - Blocking] Worktree had no `node_modules` or `.env.development.local`**
- **Found during:** Task 1 setup
- **Issue:** Fresh worktree; `drizzle-kit`, `tsx`, `tsc`, `eslint`, `vitest` unavailable and `DATABASE_URL` absent
- **Fix:** `npm ci --prefer-offline --no-audit --no-fund` inside the worktree (no junction/symlink to the main checkout); copied the main checkout's `.env.development.local` read-only into the worktree (gitignored, `git check-ignore` exit 0, never committed)
- **Files modified:** none

## Issues Encountered
- The worktree sandbox refuses compound Bash commands that mix git with other operations; each git step was run as a plain single command. No effect on deliverables.
- Two plan grep gates are line-shape sensitive (`useActionState(joinAdvisorWaitlist` and the honeypot `name="website"` line containing `tabIndex={-1}` + `aria-hidden`); both are written on single lines (the honeypot with `prettier-ignore`) so the gates are satisfied without changing behavior.

## User Setup Required

None. The table is live on the Neon database that `DATABASE_URL` already points at; Vercel injects the same variable at runtime, so the Server Action works on deploy without further configuration.

## Known Stubs

None. `AdvisorTease` is not yet mounted on `/` by design — plan 05-05 mounts it and confirms an end-to-end production submission (row count ≥ 1).

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: new-write-path | src/app/actions/interest.ts | First runtime write path to Neon (browser FormData → Server Action → `interest_signups`). Already covered by the plan's register (T-05-12/13/14) — listed here because it is the app's first mutating boundary; Phase 7 may add WAF rate limits on top of Vercel platform limits. |

## Next Phase Readiness
- 05-05 can `import { AdvisorTease } from "@/components/advisor-tease"` and render it after `<CoreExperience/>` in `page.tsx`; the action needs no props.
- Production verification (submit on the deployed site → `interest_signups rows: 1`) belongs to 05-05.
- Phase 6 should read `deferred-items.md` before the next `drizzle-kit push` (users/bookmarks): name the composite FK explicitly so push exits 0 non-interactively.

## Self-Check: PASSED

- FOUND: src/db/schema.ts, scripts/db-check.ts, src/app/actions/interest.ts, src/components/advisor-tease.tsx, .planning/phases/05-credibility-layer/deferred-items.md
- FOUND commits: 950258b, a831612, fdf3436

---
*Phase: 05-credibility-layer*
*Completed: 2026-09-02*
