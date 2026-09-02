---
phase: 04-core-experience
plan: 01
subsystem: ui
tags: [nuqs, react-number-format, url-state, localstorage, codec, vitest, typescript]

# Dependency graph
requires:
  - phase: 03-valuation-ranking-engine
    provides: Balances + EnterableProgramSlug types and the sanitizeBalances positive-safe-integer guard (T-03-09) that both codecs replicate at the boundary
provides:
  - nuqs 2.10.1 and react-number-format 5.4.5 installed and pinned (exact versions, slopcheck [OK])
  - src/lib/balance-params.ts — server-safe nuqs parser map, short-key URL codec, createLoader export (INPUT-03)
  - src/lib/balance-storage.ts — injected-storage read/write with wholesale-discard validation and the pure A1 precedence function (INPUT-02)
  - 39 node-environment unit tests (17 codec + 22 storage) covering round-trip, every short key, hostile values, throwing storage, and all three precedence outcomes
affects: [04-02, 04-03, 04-04, core-experience island, page.tsx server loader, share-link, og-image]

# Tech tracking
tech-stack:
  added: [nuqs@2.10.1, react-number-format@5.4.5]
  patterns:
    - "Boundary codecs are pure, node-testable modules: URL params and stored JSON are validated with the engine's exact guard (positive safe integer) before reaching app state"
    - "Storage I/O is injected (Pick<Storage, 'getItem'|'setItem'>) and never reached via the browser global — tests use a fake storage object, no jsdom"
    - "One source of truth for slugs/short keys: PARAM_KEY_BY_SLUG (as const satisfies Record<EnterableProgramSlug, string>); storage derives its slug set from its keys"
    - "Only 'nuqs/server' is imported in lib code so the module is importable by both the server page and the client island"

key-files:
  created:
    - src/lib/balance-params.ts
    - src/lib/balance-storage.ts
    - tests/balance-params.test.ts
    - tests/balance-storage.test.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Storage validation discards the whole payload on the first unknown key or hostile value (no partial salvage) — a tampered payload is treated as not ours (T-04-02)"
  - "writeStoredBalances filters through the same guard as the read side so a hostile value can never round-trip through storage"
  - "resolveInitialBalances returns a discriminated union ({source: 'url'} | {source: 'storage', balances} | {source: 'none'}); the 'url' branch carries no balances so the caller cannot accidentally write a share link's values to storage (A1)"
  - "Guard duplicated locally in balance-storage (not imported from balance-params) per the plan's 'reuse the approach' wording — three intentional copies now exist (engine, URL boundary, storage boundary) as defense in depth"

patterns-established:
  - "Decision-ID comments at point of use: A1 (precedence), Pitfall 2 (effects-only usage note), Pitfall 6 / T-04-03 (try/catch guard), T-01-07 (never log/rethrow the caught error)"
  - "Source-scan purity tests: test files read the module source and assert absence of 'use client', 'localStorage', and bare 'nuqs' imports"

requirements-completed: [INPUT-02, INPUT-03]

# Metrics
duration: ~12min across two sessions (interrupted + resumed)
completed: 2026-09-02
---

# Phase 4 Plan 01: State Codec Layer Summary

**Shareable-URL codec (nuqs short keys `ur/mr/c1/ty/bilt/hyatt/hilton/bonvoy` <-> canonical slugs) and hostile-input-proof localStorage persistence with a pure, tested URL-wins precedence function**

## Performance

- **Duration:** ~12 min of execution across two sessions (original session 2026-09-01 23:29-23:31 ET completed tasks 1-2 and task 3 RED before being interrupted; this resumed session 2026-09-02 11:14-11:19 ET completed task 3 GREEN)
- **Started:** 2026-09-02T03:29:00Z (task 1 commit)
- **Completed:** 2026-09-02T15:18:22Z (task 3 GREEN commit)
- **Tasks:** 3/3
- **Files modified:** 6 (4 created, 2 modified)

## Accomplishments

- Both phase dependencies installed at exact pinned versions with no other package.json changes; `npm ls nuqs react-number-format` resolves nuqs@2.10.1 and react-number-format@5.4.5; `npm run build` green
- `balance-params.ts`: `PARAM_KEY_BY_SLUG`, `balanceParsers` (one `parseAsInteger` per short key), `loadBalanceParams = createLoader(...)`, `paramsToBalances`, `balancesToParams` — round-trips losslessly, drops null/0/negative/fractional/unsafe values by omitting the key, encodes absent slugs as `null` so nuqs clears the URL key
- `balance-storage.ts`: `STORAGE_KEY = "pu:balances:v1"`, `readStoredBalances`, `writeStoredBalances`, `resolveInitialBalances` — field-by-field validation with wholesale discard, all I/O behind try/catch with silent degrade, precedence as a pure function
- Full suite 152/152 green (was 90 pre-phase), `tsc --noEmit` clean, `eslint` clean, `next build` exit 0

## Task Commits

Tasks 1, 2, and task 3 RED were executed by the earlier interrupted session and recovered onto main by the orchestrator before this worktree was forked. This session verified them (files present, contract matches plan, tests pass) rather than redoing them.

1. **Task 1: Install nuqs and react-number-format at exact versions** - `6600283` (chore) — recovered, verified
2. **Task 2: URL param codec — src/lib/balance-params.ts + tests** - `3df63e8` (test, RED) + `9d7a208` (feat, GREEN) — recovered, verified (17 tests pass; grep checks: 0 `"use client"`, 1 `from "nuqs/server"`, 0 bare `"nuqs"`)
3. **Task 3: localStorage persistence + precedence — src/lib/balance-storage.ts + tests** - `adecd6d` (test, RED — recovered) + `14b0e74` (feat, GREEN — this session)

**Plan metadata:** see final docs commit for this SUMMARY.

## TDD Gate Compliance

Both TDD tasks have a `test(...)` commit preceding a `feat(...)` commit in git history (3df63e8 -> 9d7a208; adecd6d -> 14b0e74). No refactor commit was needed. During this session's RED verification the storage suite failed 22/22 on a missing module before implementation, and the source-scan purity test caught a comment mentioning the storage global by name (reworded before commit, see Issues).

## Files Created/Modified

- `src/lib/balance-params.ts` (94 lines) - nuqs parser map + short-key codec; server-importable (no client directive, only `nuqs/server`)
- `src/lib/balance-storage.ts` (138 lines) - injected-storage read/write with validation; `resolveInitialBalances` precedence; `InitialBalancesSource` union type
- `tests/balance-params.test.ts` (162 lines, 17 tests) - round-trip, all 8 short keys, hostile values, `balancesToParams({})` all-null, source-scan purity
- `tests/balance-storage.test.ts` (187 lines, 22 tests) - valid read, absent key, malformed JSON, array payload, unknown key, string/negative/fractional/unsafe/zero values, throwing getItem/setItem, write round-trip, three precedence outcomes, source-scan purity
- `package.json` / `package-lock.json` - `nuqs: ^2.10.1`, `react-number-format: ^5.4.5`

## Decisions Made

- Storage slug set is derived from `Object.keys(PARAM_KEY_BY_SLUG)` (import from `./balance-params`) rather than re-listing strings — one source of truth as the plan required. This means `balance-storage.ts` transitively imports `nuqs/server`, which is server-safe and works in the node test environment.
- `writeStoredBalances` filters to valid entries before serializing (same guard as read). Writing `{}` when nothing is valid is acceptable: `resolveInitialBalances` treats an empty stored object as `{ source: "none" }`.
- `resolveInitialBalances` counts URL keys only (`Object.keys(urlBalances).length > 0`); it trusts that `urlBalances` has already passed through `paramsToBalances`, so no re-validation there.

## Deviations from Plan

None - plan executed exactly as written. The two recovered tasks matched the plan contract on verification; no follow-up fix commits were needed.

## Issues Encountered

- **Worktree base drift:** the worktree's merge-base with the expected base `adecd6d` was `061ced1` (end of phase 2). The branch check's sanctioned `git reset --hard adecd6d` corrected it before any work; HEAD was already on `worktree-agent-a142898c0b243fe09` (no protected-ref issue).
- **Purity scan caught a comment:** the first draft of `balance-storage.ts` used the literal word "localStorage" in two comments; the test's source scan (and the plan's `grep -c "localStorage"` acceptance criterion) rejects any occurrence. Reworded to "browser storage" / "client storage" before committing — the code itself never referenced the global.
- **No node_modules in worktree:** ran `npm ci --no-audit --no-fund` from the already-updated lockfile before any test/typecheck command, per the resume instructions.

## Known Stubs

None. Both modules are fully wired pure functions; no placeholder values or unwired data paths.

## Threat Flags

None beyond the plan's register. T-04-01, T-04-02, T-04-03 mitigations are implemented and unit-tested; T-04-SC (installs) was satisfied by the recovered task 1 commit at the audited exact versions.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 2 plans (04-02 path/format helpers already merged; 04-03 balance form; 04-04 island/page) can import `loadBalanceParams` in `page.tsx` and `balanceParsers` + `paramsToBalances`/`balancesToParams` in the client island, and `readStoredBalances`/`writeStoredBalances`/`resolveInitialBalances` in a `useEffect` (Pitfall 2: effects only — the module JSDoc says so).
- `react-number-format` is installed and ready for plan 04-03's `NumericFormat` + shadcn `Input` `customInput` pattern; no further package.json write is needed in wave 2.
- Remaining Phase 4 wiring (NuqsAdapter in layout, page.tsx replacement) is owned by later plans, not this one.

## Self-Check: PASSED

- FOUND: src/lib/balance-params.ts
- FOUND: src/lib/balance-storage.ts
- FOUND: tests/balance-params.test.ts
- FOUND: tests/balance-storage.test.ts
- FOUND commits: 6600283, 3df63e8, 9d7a208, adecd6d, 14b0e74
- Verified: `npx vitest run` 152/152, `npx tsc --noEmit` clean, `npm run lint` clean, `npm run build` exit 0

---
*Phase: 04-core-experience*
*Completed: 2026-09-02*
