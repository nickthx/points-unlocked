---
phase: 02-redemption-database
plan: 05
subsystem: database
tags: [verification-gate, data-04, coverage-test, neon, seed]
requires:
  - "02-03: transfer engine + frozen A1/A2/A4 math tests"
  - "02-04: idempotent seed pipeline + DB-free structural test suite"
provides:
  - "34 of 36 redemptions Nick-verified (verifiedAt 2026-09-01) with 2026-source sourceNotes"
  - "Activated CI coverage gate: ≥30 verified + all-8-enterable-programs reachability"
  - "Neon reseeded with the verified dataset: 21 programs, 46 routes, 1 bonus, 36 redemptions (34 verified)"
  - "A1-A4 + cash-fare convention resolved from assumptions into confirmed frozen specs"
affects:
  - "Phase 3 (methodology page inherits the confirmed cash-fare convention from types.ts verbatim)"
  - "Phase 3 (A3 cash-out baselines passed no-veto review; full sign-off still a Phase 3 gate)"
tech-stack:
  added: []
  patterns:
    - "Human verification materialized as a diffable git event: rulings log → seed-file diff → CI gate"
    - "Coverage gate shape: verified.length ≥ 30 + per-program reachability (direct partnerProgramSlug match OR active route) with per-program failure messages"
key-files:
  created: []
  modified:
    - src/data/redemptions-flights.ts
    - src/data/redemptions-flights-europe.ts
    - src/data/redemptions-hotels.ts
    - src/data/transfers.ts
    - src/data/programs.ts
    - src/data/types.ts
    - src/engine/transfers.ts
    - tests/seed-data.test.ts
    - tests/transfers.test.ts
decisions:
  - "Coverage gate asserts the ≥30 floor (not the exact 34) so future verified additions never break CI; a comment records the 2026-09-01 count"
  - "Added a provenance-consistency test: every verifiedAt entry's sourceNote must start with 'Verified ' and not contain 'CLAUDE DRAFT' — spoofed verification claims (T-02-14) now fail CI two ways"
  - "st-regis-maldives + gritti-palace-venice held as drafts per Nick's ruling (no reliable 2026 pricing found); sourceNotes name the manual marriott.com check needed"
  - "Task 3's push-to-main deploy is left to the orchestrator's merge — parallel executors never push protected refs"
metrics:
  duration: "~10 minutes (apply step; the human verification pass preceded this agent)"
  completed: "2026-09-01"
---

# Phase 2 Plan 05: DATA-04 Verification Gate Summary

Nick's joint-research verification pass is now materialized in the seed files: 34 of 36 redemptions carry verifiedAt 2026-09-01 with sourceNotes naming the live 2026 finding, the ≥30-verified/all-8-programs coverage gate is an executable CI test, and Neon holds the verified dataset (idempotency re-proven: two seed runs, identical counts, 34 verified).

## What Was Built

- **Batch 1 (Asia-Pacific & Hawaii flights, 10/10 verified)** — applied every ruling: ANA RT max 90K, Virgin→ANA F 72.5K / J 52.5K, KrisFlyer SFO–SIN fixed 112.5K, Asia Miles May-2026 chart (J 88K / F 160K), Turkish Hawaii post-deval 25K one-way (cash benchmark switched to one-way), Avios Alaska-Hawaii 16–20K. **Slug rework:** `jal-first-tokyo-via-alaska` → `jal-business-tokyo-via-alaska` (JAL F is NOT bookable via Alaska; J = 60K one-way; Atmos Rewards rebrand noted).
- **Batch 2 (Europe & Middle East flights, 11/11 verified)** — Virgin Upper Class surcharge $975, Delta One via Virgin 47.5–50K flat, Flying Blue Sept-2026 3-tier chart (60/75K + Light-fare tradeoffs in bookingHint), LH First 90K flat via Aeroplan (A340-retirement caveat in notes), Emirates F post-May-2026 deval 136–188K + $1,000 surcharges, Turkish J 65K, Qsuites 70K fixed, LifeMiles 70–80K. **Slug rework:** `singapore-suites-frankfurt` → `singapore-first-777-frankfurt` (A380 Suites left JFK–FRA March 2026; 777 F = 156K).
- **Batch 3 (hotels, 13/15 verified)** — Hyatt May-2026 five-tier chart applied (PH Tokyo/Alila Top 75K, Kauai Cat 8 35–45K, Zilara Top 32K, Miraval 40–72K), Hilton post-Nov-2025 deval (Conrad Maldives 160–200K, WA Maldives at the 250K cap, Conrad Bora Bora 130–200K, Grand Wailea 110–150K), Marriott (St. Regis Bora Bora corrected DOWN to 70–100K, Al Maha 85–120K, RC Kyoto confirmed). **Held unverified:** st-regis-maldives, gritti-palace-venice (needs-manual-check sourceNotes).
- **Batch 4 (routes/bonuses/programs)** — A1 (Marriott 3:1, 3,000-pt increment, 5K per full 60K block; Alaska + ANA bonus-eligible; AA/LifeMiles/Delta excluded and United's 10K/60K noted as unmodeled), A2 (1,000-pt increments as confirmed conservative simplification), A3 (no veto; Chase 1.0¢ + Amex 0.6¢ explicitly confirmed), A4 (promo multiplies base-converted amount, no stacking — live Amex→Hilton math matches the model exactly) — all `[ASSUMED]` markers resolved to confirmed-with-date across transfers.ts, programs.ts, types.ts, engine/transfers.ts, and both test files. Both placeholder promos deleted, replaced with the single live **Amex MR→Hilton 30% bonus (2026-09-01 → 2026-10-14)**. Alaska display name → "Alaska Atmos Rewards" (slug stable). The confirmed cash-fare convention (discounted realistic retail for economy/business, undiscounted retail for First) is recorded in types.ts for Phase 3's methodology page.
- **Coverage gate (tests/seed-data.test.ts)** — replaced the 02-04 breadcrumb with two active tests: (1) `verified.length ≥ 30` plus per-enterable-program reachability (direct partner match OR active route) with failure messages naming the uncovered program slug; (2) provenance consistency — every verified entry's sourceNote starts with "Verified " and contains no "CLAUDE DRAFT". Suite grew 16 → 18 tests (28 total across 3 files).

## Verification Results

- `npm run db:seed` run twice: both exit 0 with IDENTICAL counts `21 programs, 46 routes, 1 bonuses, 36 redemptions (34 verified)` — idempotency re-proven over the final dataset
- DB-level query (drizzle count where `verified_at is not null`) → `34 verified in DB`; `npx tsx scripts/db-check.ts` → `programs rows: 21`
- In-memory gate check → `34 verified` (≥30)
- `npm test` 28/28, `npm run typecheck`, `npm run lint`, `npm run build` — all exit 0
- No command output contained a connection-string fragment (counts-only seed output preserved)
- Zero entries marked verified outside Nick's confirmation list; the 2 held entries stay `verifiedAt: null`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree lacked .env.development.local and node_modules**
- **Found during:** Task 3 setup
- **Issue:** Gitignored env file and node_modules don't carry into git worktrees (known from waves 1–3)
- **Fix:** Copied `.env.development.local` from the main checkout (stays gitignored, not committed) and ran `npm ci`
- **Files modified:** none (gitignored local files only)

**2. [Minor] Plan's tsx one-liner needed a namespace unwrap**
- **Found during:** Task 2/3 acceptance checks
- **Issue:** `tsx -e "import('./src/data/index.ts')..."` wraps the ESM namespace under `.default` in CJS-eval mode, so the literal one-liner from the plan threw. Not a data problem — the vitest coverage gate is the binding check.
- **Fix:** Ran the same assertions with `m.default ?? m`; both printed 34 and exited 0.

**3. [Deferred to orchestrator] Push-to-main deploy**
- Task 3's "commit and push to main so Vercel auto-deploys" cannot be done from a parallel worktree executor (protected-ref prohibition). The orchestrator's merge of this branch to main triggers the Vercel deploy; the DB-level count assertion (the plan's stated binding proof) passed here.

## Known Stubs

- `st-regis-maldives` and `gritti-palace-venice` remain `verifiedAt: null` by explicit ruling — downstream readers filter them out (draft ≠ shippable). Resolution: manual marriott.com check, then set verifiedAt + sourceNote (data-only change; the coverage gate keeps passing either way).

## Threat Flags

None — no new surface. T-02-14 (spoofed verification) mitigated twice over: verifiedAt applied only from the rulings log, and the new provenance-consistency test fails CI if a verified entry carries a draft sourceNote. T-02-15 mitigated: every verified sourceNote names the 2026 finding. T-02-16 mitigated: counts-only output confirmed in all runs.

## Commits

- 7eb284a feat(02-05): apply Nick's DATA-04 verification rulings and activate the coverage gate

## Self-Check: PASSED

- All 9 modified files exist with the applied rulings
- Commit 7eb284a present on worktree-agent-aa0e0f63188a243bd
- Coverage gate active: `toBeGreaterThanOrEqual(30)` present in tests/seed-data.test.ts
