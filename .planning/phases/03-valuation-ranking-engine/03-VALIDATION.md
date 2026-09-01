---
phase: 3
slug: valuation-ranking-engine
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-09-01
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.x |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run tests/engine` (substring filter matches all tests/engine-*.test.ts files) |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/engine`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-T1 | 03-01 | 1 | VAL-02, VAL-05 (gates) | T-03-01 | A1/A2/Bilt ratified before deltas ship | human checkpoint | — (manual; see Manual-Only) | — | ⬜ pending |
| 03-01-T2 | 03-01 | 1 | VAL-02, VAL-05 | T-03-01 | Contracts pure (zero runtime imports); Bilt ruling recorded | typecheck + regression | `npm run typecheck && npm test` | ✅ existing suites | ⬜ pending |
| 03-01-T3 | 03-01 | 1 | SC-5 | T-03-02 | Import allowlist + no Date.now/new Date in engine | static test (Wave 0) | `npx vitest run tests/engine-purity.test.ts` | ❌ W0 (created here) | ⬜ pending |
| 03-02-T1 | 03-02 | 2 | VAL-05 | T-03-04 | A4 non-stacking pinned by synthetic route+promo; lexical bonus windows | unit (TDD) | `npx vitest run tests/engine-paths.test.ts` | ❌ W0 (created here) | ⬜ pending |
| 03-02-T2 | 03-02 | 2 | VAL-05, SC-2 | T-03-03, T-03-05 | Inverse math exact + increment-aligned (150K not 180K; 77K promo) | unit (TDD) | `npx vitest run tests/engine-paths.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-T3 | 03-02 | 2 | SC-4 | T-03-03 | A1 min-raw-source-points selection, deterministic tie-breaks | unit (TDD) | `npx vitest run tests/engine-paths.test.ts && npm test` | ❌ W0 | ⬜ pending |
| 03-03-T1 | 03-03 | 2 | VAL-02 | T-03-06, T-03-08 | TPG cpp anchors (933, 1876); no 100× unit bug; 0 on junk divisors | unit (TDD) | `npx vitest run tests/engine-valuation.test.ts` | ❌ W0 (created here) | ⬜ pending |
| 03-03-T2 | 03-03 | 2 | VAL-02 | T-03-07 | Per-program baselines; null → 0 cash-out; integer-only delta | unit (TDD) | `npx vitest run tests/engine-valuation.test.ts && npm test` | ❌ W0 | ⬜ pending |
| 03-04-T1 | 03-04 | 3 | SC-1 | T-03-09 | A2 conservative gating; sanitized balances; deterministic sorts | unit (TDD) | `npx vitest run tests/engine-ranking.test.ts` | ❌ W0 (created here) | ⬜ pending |
| 03-04-T2 | 03-04 | 3 | VAL-05 | T-03-09, T-03-10, T-03-11 | Bonus auto-adjust end-to-end; drafts never surface; no NaN on hostile balances | unit (TDD) | `npx vitest run tests/engine-ranking.test.ts && npm test` | ❌ W0 | ⬜ pending |
| 03-04-T3 | 03-04 | 3 | SC-5 (whole module) | T-03-02 | Barrel purity auto-covered; all phase gates green | full gates | `npm test && npm run typecheck && npm run lint && npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/engine-purity.test.ts` — executable purity gate (success criterion 5) — created in plan 03-01 wave 1, guards all later waves
- [ ] `tests/engine-paths.test.ts` — created RED-first inside plan 03-02 (TDD)
- [ ] `tests/engine-valuation.test.ts` — created RED-first inside plan 03-03 (TDD)
- [ ] `tests/engine-ranking.test.ts` — created RED-first inside plan 03-04 (TDD)

*Existing vitest infrastructure from Phase 2 covers the framework; project precedent (02-03) is RED→GREEN within each plan rather than a separate Wave 0 pass. Flat `tests/engine-*.test.ts` naming satisfies the `npx vitest run tests/engine` filter.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bilt 0.1¢ cash-out baseline ratification | VAL-02 | Data methodology sign-off flagged by Phase 2 | Plan 03-01 Task 1 checkpoint — confirm or change the integer; Task 2 records the ruling |
| Cheapest-path semantics (A1) + pointsMax gating (A2) | VAL-05 | Design assumption needs human confirmation | Plan 03-01 Task 1 checkpoint — resume signal "approved" or per-item amendments |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (only 03-01-T1, a checkpoint, lacks one)
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planner sign-off 2026-09-01
