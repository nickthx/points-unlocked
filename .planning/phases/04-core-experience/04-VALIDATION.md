---
phase: 4
slug: core-experience
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-09-01
planned: 2026-09-02
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing node-env setup) |
| **Config file** | existing project vitest config |
| **Quick run command** | `npx vitest run tests/<touched-file>.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run the quick run command
- **After every plan wave:** Run the full suite command + `npm run typecheck && npm run lint`
- **Before `/gsd:verify-work`:** Full suite + `npm run build` green + human checkpoint (04-04 Task 3) approved
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01 T1 | 04-01 | 1 | (deps) | T-04-SC | exact-version pins; slopcheck [OK]; no postinstall | build | `npm ls nuqs react-number-format && npm run build` | ✅ | ⬜ pending |
| 04-01 T2 | 04-01 | 1 | INPUT-03 | T-04-01 | URL codec drops negative/fractional/unsafe/unknown values | unit | `npx vitest run tests/balance-params.test.ts` | ⬜ Wave 0 | ⬜ pending |
| 04-01 T3 | 04-01 | 1 | INPUT-02 | T-04-02, T-04-03 | storage validated wholesale; throwing storage never crashes; A1 precedence pure fn | unit | `npx vitest run tests/balance-storage.test.ts` | ⬜ Wave 0 | ⬜ pending |
| 04-02 T1 | 04-02 | 1 | VAL-01, VAL-04 | T-04-04, T-04-06 | heroDelta = ranking key (atMax ?? atMin); no Date object; guards degrade to safe values | unit | `npx vitest run tests/format.test.ts` | ⬜ Wave 0 | ⬜ pending |
| 04-02 T2 | 04-02 | 1 | RANK-04 | T-04-05 | path strings from real seed routes; degrade (no throw) on unknown slug/route | unit | `npx vitest run tests/path-display.test.ts` | ⬜ Wave 0 | ⬜ pending |
| 04-03 T1 | 04-03 | 2 | INPUT-01 | T-04-08 | allowNegative=false, decimalScale=0, event-source guard | typecheck + grep gates | `npm run typecheck && npm run lint` + grep criteria in plan | — | ⬜ pending |
| 04-03 T2 | 04-03 | 2 | RANK-01, RANK-03, RANK-04, RANK-05, VAL-01, VAL-04 | T-04-07, T-04-09 | JSX auto-escaping only; no dangerouslySetInnerHTML; framing branches on null baseline | typecheck + grep gates | `npm run typecheck && npm run lint` + grep criteria in plan | — | ⬜ pending |
| 04-03 T3 | 04-03 | 2 | RANK-02 | T-04-07 | engine order preserved (no .sort); accent-free callouts | typecheck + grep gates | `npm run typecheck && npm run lint && npm test` | — | ⬜ pending |
| 04-04 T1 | 04-04 | 3 | INPUT-01..03, RANK-01, RANK-02 | T-04-12, T-04-13, T-04-14 | engine try/catch → neutral copy; storage effects-only + guarded; A1 non-clobber | typecheck + grep gates | `npm run typecheck && npm run lint && npm test` | — | ⬜ pending |
| 04-04 T2 | 04-04 | 3 | INPUT-03, VAL-01 | T-04-10, T-04-11 | SSR param triple-layer sanitize; DB-free client bundle (grep gate) | build + grep | `npm run build && npm test` + `grep -rE "from \"@/db\|drizzle" src/components/ src/app/page.tsx` → empty | — | ⬜ pending |
| 04-04 T3 | 04-04 | 3 | all four phase success criteria | — | — | manual (checkpoint:human-verify) | 7-step walkthrough in 04-04-PLAN.md | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 test files are created inside their wave-1 plan tasks (test + implementation land together, tdd="true" behavior-first):

- [ ] `tests/balance-params.test.ts` — INPUT-03 codec (plan 04-01 Task 2)
- [ ] `tests/balance-storage.test.ts` — INPUT-02 precedence/validation, fake storage injected, no jsdom (plan 04-01 Task 3)
- [ ] `tests/format.test.ts` — VAL-01/VAL-04 display helpers (plan 04-02 Task 1)
- [ ] `tests/path-display.test.ts` — RANK-04 helpers vs real seed routes (plan 04-02 Task 2)

No new test infrastructure — node environment covers all pure-helper suites.

---

## Manual-Only Verifications

Covered by 04-04 Task 3 (checkpoint:human-verify — 7-step walkthrough):

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Shared URL renders full results in a fresh browser (initial HTML) | INPUT-03, RANK-01 | Requires real browser + SSR | Step 6: incognito paste + View Source |
| Balances survive page reload | INPUT-02 | Browser localStorage behavior | Step 5: bare `/` reload repopulates |
| Formatted typing + mobile keypad + 360px layout | INPUT-01 | Interactive rendering | Steps 2, 7 |
| Empty/sparse/card visual states | RANK-01..05, VAL-01/04 | Visual confirmation | Steps 1, 3, 4 |

Justification for no component/e2e harness (from 04-RESEARCH.md): the interactive surface is thin, all logic beneath it is unit-tested, and adding jsdom + @testing-library would introduce new unverified deps for marginal coverage on a 2–4 week timeline.
