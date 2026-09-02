---
phase: 4
slug: core-experience
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-01
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing node-env setup) |
| **Config file** | existing project vitest config |
| **Quick run command** | `npm test -- --run` (scoped to changed test files where possible) |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run the quick run command
- **After every plan wave:** Run the full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD — filled by planner | | | | | | | | | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Planner note (from 04-RESEARCH.md Validation Architecture): all phase logic — URL param codec, localStorage precedence, number formatters, transfer-path display — is extractable as pure functions testable in the existing node-env vitest setup. Four Wave 0 test files, zero new test infrastructure.*

---

## Wave 0 Requirements

- [ ] URL param codec tests — stubs for INPUT-03 / RANK-05 (shared URL reproduces results)
- [ ] localStorage precedence tests — stubs for INPUT-02 (reload persistence, share-link non-clobber)
- [ ] Formatted input parsing tests — stubs for INPUT-01
- [ ] Path/valuation display helper tests — stubs for RANK-01..04, VAL-01, VAL-04

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Shared URL renders full results in a fresh browser (initial HTML) | RANK-05 | Requires real browser + SSR | Open a results URL in an incognito window; ranked results visible without interaction |
| Balances survive page reload | INPUT-02 | Browser localStorage behavior | Enter balances, reload, confirm inputs repopulate |
