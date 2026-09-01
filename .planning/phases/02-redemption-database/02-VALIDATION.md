---
phase: 2
slug: redemption-database
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-01
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
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (filled by planner) | | | | | | | | | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/transfers.test.ts` — hand-computed transfer edge-case table (Marriott 3:1 + 5K/60K bonus, Amex→Hilton 1:2, Bilt 1:1)
- [ ] `tests/seed-coverage.test.ts` — DB-free coverage gate over typed seed data (≥30 verified entries, all 8 programs)

*Existing vitest infrastructure from Phase 1 covers the framework requirement.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Award-value verification of seed entries | DATA-04 | Point values/ratios must be human-verified against live program data (2026 devaluations make drafted numbers stale by construction) | Nick reviews drafted entries, sets `verifiedAt` dates on confirmed ones |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
