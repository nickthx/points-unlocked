---
phase: 2
slug: redemption-database
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-09-01
updated: 2026-09-01
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (installed in Phase 1) |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test && npm run typecheck && npm run build`
- **Before `/gsd:verify-work`:** Full suite green + `npm run db:seed` idempotency check + Nick verification checkpoint complete
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01 T1 | 02-01 | 1 | DATA-01/02/03 (schema) | T-02-02, T-02-03 | No healthCheck refs remain; page error path renders neutral fallback | build/typecheck | `npm run typecheck && npm run lint && npm run build && npm test` | n/a | ⬜ pending |
| 02-01 T2 | 02-01 | 1 | DATA-01 (Zod boundary) | T-02-04 | validateDataset throws on bad data before any write path | CLI | `npx tsx -e` types.ts smoke (see plan) + `npm run typecheck` | n/a | ⬜ pending |
| 02-01 T3 | 02-01 | 1 | Schema push [BLOCKING] | T-02-01 | Push/check output contains no connection-string fragment | CLI | `npx drizzle-kit push --force && npx tsx scripts/db-check.ts` | n/a | ⬜ pending |
| 02-02 T1 | 02-02 | 2 | DATA-02/03 (routes+bonuses data) | T-02-05, T-02-06 | Every bonus/route carries provenance notes | CLI | tsx Zod-parse one-liner (see plan) + `npm run typecheck` | n/a | ⬜ pending |
| 02-02 T2 | 02-02 | 2 | DATA-01/04 (drafts) | T-02-05 | 0 entries falsely claim verification | CLI | tsx draft-count one-liner (see plan) | n/a | ⬜ pending |
| 02-02 T3 | 02-02 | 2 | DATA-01 (cross-refs) | T-02-04 | Full-dataset validateDataset exits 0 | CLI | tsx validateDataset one-liner + `npm run build` | n/a | ⬜ pending |
| 02-03 T1 | 02-03 | 3 | DATA-02 (edge-case math) | T-02-08 | Integer-only math frozen against real seed rows | unit | `npx vitest run tests/transfers.test.ts` | ❌ Wave 0 (created by this task) | ⬜ pending |
| 02-03 T2 | 02-03 | 3 | DATA-02/03 (promo composition) | T-02-08, T-02-09 | Engine purity grep gate: 0 db/app/next/react imports | unit + grep gate | `npx vitest run tests/transfers.test.ts && npm test` + purity grep (see plan) | ❌ Wave 0 | ⬜ pending |
| 02-04 T1 | 02-04 | 3 | SC-4 (idempotent seed) | T-02-10, T-02-11, T-02-12 | Validation before import of src/db; counts-only output; no db.transaction | script | `npm run db:seed && npm run db:seed && npx tsx scripts/db-check.ts` | n/a | ⬜ pending |
| 02-04 T2 | 02-04 | 3 | DATA-01/03 (structural tests) | T-02-11 | Tests are DB-free (no DATABASE_URL in CI) | unit | `npx vitest run tests/seed-data.test.ts && npm test` | ❌ Wave 0 (created by this task) | ⬜ pending |
| 02-05 T1 | 02-05 | 4 | DATA-04 (human gate) | T-02-14 | Nick's rulings are the only path to verifiedAt | **manual-only** | checkpoint:human-verify (cannot be automated) | n/a | ⬜ pending |
| 02-05 T2 | 02-05 | 4 | DATA-04/01 (coverage gate) | T-02-14, T-02-15 | verifiedAt set only from Nick's list; gate CI-enforced | unit | `npm test` (incl. ≥30-verified + all-8-programs assertions) | ❌ activated in this task | ⬜ pending |
| 02-05 T3 | 02-05 | 4 | SC-3/SC-4 (final gate) | T-02-16 | Reseed output secret-free; DB verified count ≥30 | script | seed×2 + DB-count tsx one-liner + `npm test && npm run build` (see plan) | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/transfers.test.ts` — hand-computed transfer edge-case table (Marriott 3:1 + 5K/60K bonus, Amex→Hilton 1:2, Bilt 1:1, promo composition) — created RED-first in plan 02-03 T1
- [ ] `tests/seed-data.test.ts` — DB-free structural gate over typed seed data (Zod parse, cross-refs, edge-case routes present, bonus dating, provenance) — created in plan 02-04 T2; the ≥30-verified/all-8-programs coverage assertion activates in plan 02-05 T2 (would be red against drafts by design)

*Note: originally sketched as `tests/seed-coverage.test.ts`; consolidated into `tests/seed-data.test.ts` per 02-RESEARCH.md Validation Architecture. Existing vitest infrastructure from Phase 1 covers the framework requirement. Waves 1-2 tasks sample via typecheck/build + tsx Zod one-liners until the test files land in wave 3 — no 3 consecutive tasks lack an automated verify.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Award-value verification of seed entries | DATA-04 | Point values/ratios must be human-verified against live program data (2026 devaluations make drafted numbers stale by construction) | Plan 02-05 Task 1 checkpoint: Nick reviews drafted entries against live sources, supplies corrections + `verifiedAt` dates, and rules on assumptions A1-A4 + cash-fare convention |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags (all vitest invocations use `vitest run`)
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planner sign-off 2026-09-01 (pending checker review)
