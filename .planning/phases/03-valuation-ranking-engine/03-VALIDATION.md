---
phase: 3
slug: valuation-ranking-engine
status: draft
nyquist_compliant: false
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
| **Quick run command** | `npx vitest run tests/engine` |
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
| (filled by planner) | | | VAL-02, VAL-05 | | | unit | `npx vitest run tests/engine` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/engine/` — test directory for engine unit tests (paths, valuation, ranking)
- [ ] `tests/engine-purity.test.ts` — executable purity gate (success criterion 5)

*Existing vitest infrastructure from Phase 2 covers the framework; only new test files are needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bilt 0.1¢ cash-out baseline ratification | VAL-02 | Data methodology sign-off flagged by Phase 2 | Confirm or change the Bilt cash-out stand-in value in the dataset |
| Cheapest-path semantics (A1) + pointsMax gating (A2) | VAL-05 | Design assumption needs human confirmation | Review Assumptions Log in 03-RESEARCH.md; confirm minimum-raw-source-points rule |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
