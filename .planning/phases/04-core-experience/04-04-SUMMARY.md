---
phase: 04-core-experience
plan: 04
subsystem: ui
tags: [nextjs, app-router, react-server-components, nuqs, localstorage, client-island, editorial-design]

# Dependency graph
requires:
  - phase: 04-core-experience
    provides: "04-01: balanceParsers/loadBalanceParams/paramsToBalances/balancesToParams codec + readStoredBalances/writeStoredBalances/resolveInitialBalances precedence layer; 04-02: formatDollars/formatPoints/formatVerifiedDate; 04-03: BalanceForm, ResultCard, AlmostThere"
  - phase: 03-valuation-ranking-engine
    provides: rankRedemptions(RankInput) → RankedResults (pre-sorted bookableNow + almostThere tiers)
  - phase: 02-redemption-database
    provides: "@/data barrel — programs, routes, bonuses, redemptions seed arrays (featured + verifiedAt for the teaser)"
provides:
  - src/components/core-experience.tsx — CoreExperience client island: useQueryStates URL state, engine useMemo, A1 storage hydration + edit-ownership write effects, hero, form, Copy-my-link CTA, empty/sparse/error/results branches (INPUT-01/02/03, RANK-01/02, VAL-01)
  - src/app/page.tsx — DB-free dynamic server component: awaits loadBalanceParams(searchParams), derives asOf once per request, renders the island (INPUT-03 SSR)
  - src/app/layout.tsx — NuqsAdapter wrapping children (Fraunces opsz + noindex preserved)
affects: [05 credibility layer, 05/06 share + og polish, 06 accounts (save flow hooks off the same URL state), 07 visual polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server/client split for the guest flow: the page awaits searchParams (implicit dynamic — no `export const dynamic`) and derives the sole clock read; the island owns all interactive state and recomputes the engine in a useMemo keyed on [params, asOf]"
    - "A1 precedence in effects only: mount effect resolves url > storage > none via resolveInitialBalances and pushes storage-restored balances into the URL with history: replace; a hasEditedRef gate means storage is written only after the visitor edits, so share links never clobber a visitor's stored balances"
    - "Browser APIs reached through guarded accessors only (getSafeStorage try/catch, clipboard try/catch) — the flow degrades to URL-only in WebViews rather than crashing"
    - "Client bundle is DB-free by grep gate: no `@/db` or drizzle import reachable from src/app/page.tsx or any src/components file"
    - "Every UI branch is an explicit designed state (error / empty+teaser / sparse / results) with UI-SPEC copy verbatim; the empty-state teaser shows direct seed fields only — no invented delta"

key-files:
  created:
    - src/components/core-experience.tsx
  modified:
    - src/app/page.tsx
    - src/app/layout.tsx

key-decisions:
  - "Phase 1 placeholder page deleted rather than migrated: the @/db import, the DB count query, and `export const dynamic = \"force-dynamic\"` are gone; awaiting searchParams makes / dynamic implicitly (Pitfall 3) and keeps the route table honest (ƒ marker)"
  - "asOf is derived once per request on the server and passed as a prop; the island never calls new Date, so server HTML and hydrated client results agree (Pitfall 7)"
  - "Storage-restored balances are pushed to the URL with history: replace so a bare / visit becomes instantly shareable again without back-button spam (Pattern 4 rule 2)"
  - "A share-link visit (source === \"url\") writes nothing to storage; only an actual input edit (hasEditedRef) claims ownership and begins persisting (A1)"
  - "Engine throw renders only the neutral UI-SPEC error string; the caught error is neither rendered nor logged (T-04-12 / T-01-07 precedent)"

patterns-established:
  - "Client-island composition: `\"use client\"` island imports arrays ONLY from the @/data barrel and functions from @/engine, with a filename-collision hazard comment at the import site"
  - "Decision-ID comments at point of use: A1 (hydration + write effects), A5 (teaser default), Pitfalls 2/6/7/8/9 and T-04-11/12/14 annotated where the code enforces them"

requirements-completed: [INPUT-01, INPUT-02, INPUT-03, RANK-01, RANK-02, VAL-01]

# Metrics
duration: ~10min active (plus human walkthrough wait)
completed: 2026-09-02
---

# Phase 4 Plan 04: Page Composition and Guest-Flow Walkthrough Summary

**The end-to-end guest flow on `/` — NuqsAdapter-wrapped layout, a DB-free dynamic server page, and a client island that runs the ranking engine per keystroke, syncs localStorage under the A1 precedence rules, and renders the hero, form, Copy-my-link CTA, and every designed state — human-verified across all four Phase 4 success criteria.**

## Performance

- **Duration:** ~10 min of automated execution (Tasks 1–2 committed by 15:39Z), then paused at the Task 3 human-verify gate until approval; wrap-up completed 15:45Z
- **Started:** 2026-09-02T15:35:33Z
- **Completed:** 2026-09-02T15:45:42Z
- **Tasks:** 3/3 (2 auto + 1 human-verify checkpoint, approved)
- **Files modified:** 1 created, 2 modified (302 + 36 + 45 lines; all well under the 500-line cap)

## Accomplishments

- `src/app/layout.tsx` now wraps `{children}` in `<NuqsAdapter>` from `nuqs/adapters/next/app` (Pitfall 1 — hooks throw without it). Fraunces `axes: ["opsz"]` (D-13) and `robots: { index: false, follow: false }` (D-03) are untouched.
- `src/components/core-experience.tsx` (`"use client"`, 302 lines) owns the three-way state dance: `useQueryStates(balanceParsers)` for URL state (nuqs defaults: shallow, history replace); `useMemo` calling `rankRedemptions({ balances, dataset: { programs, routes, bonuses, redemptions }, asOf })` keyed on `[params, asOf]` inside try/catch; a mount-only hydration effect that resolves url > storage > none and pushes storage-restored balances into the URL with `history: "replace"`; a `hasEditedRef`-gated write effect; a `getSafeStorage()` try/catch accessor as the sole storage touchpoint; the hero heading in `font-display text-ink text-display md:text-display-xl`; `BalanceForm`; the terracotta "Copy my link" Button with a 2s "Link copied" swap; and four explicit branches — `ErrorState`, `EmptyState` (with the A5 featured teaser showing title / `~$ cash fare` / `points` / `Verified` from seed fields only), `SparseState`, and the "Bookable now" section + `AlmostThere` rendered in engine order.
- `src/app/page.tsx` (36 lines) is an async server component: `Home({ searchParams }: { searchParams: Promise<SearchParams> })`, `await loadBalanceParams(searchParams)` (implicit dynamic — no `export const dynamic`), `const asOf = new Date().toISOString().slice(0, 10)` as the repo's sole clock read for this flow, and a `<main className="bg-cream ...">` shell around `<CoreExperience asOf={asOf} />`. The Phase 1 `@/db` import, count query, and `force-dynamic` export were deleted.
- Human walkthrough (Task 3) approved by the user — all 7 steps passed, confirming the four ROADMAP Phase 4 success criteria.

## Task Commits

Each task was committed atomically:

1. **Task 1: Client island — src/components/core-experience.tsx + NuqsAdapter in layout** — `1b3ef46` (feat)
2. **Task 2: Server page replacement — src/app/page.tsx + build/bundle gates** — `0366366` (feat)
3. **Task 3: Human walkthrough of the four phase success criteria** — no code commit (verification only); in-progress position recorded in `2dff11c` (docs). **Approved by user.**

**Plan metadata:** committed with this SUMMARY (docs).

## Files Created/Modified

- `src/components/core-experience.tsx` (created, 302 lines) — `CoreExperience({ asOf })` island; imports arrays only from `@/data`, `rankRedemptions` from `@/engine`, codec + storage helpers from `@/lib`, formatters from `@/lib/format`, and the three 04-03 components. Local subcomponents `ErrorState`, `EmptyState`, `SparseState`.
- `src/app/page.tsx` (modified, 61 lines changed: +28/−33) — placeholder replaced; DB-free dynamic server component delegating to the island.
- `src/app/layout.tsx` (modified, +7/−1) — `NuqsAdapter` import + wrap only.

## Acceptance Gate Results

All gates confirmed on `main` at `2dff11c`; vitest and tsc re-run at wrap-up.

| Gate | Result |
|------|--------|
| layout: `NuqsAdapter` count = 2, `opsz` ≥ 1, `index: false` = 1 | pass |
| island: first line `"use client";`; `rankRedemptions` inside `useMemo`; `useEffect` = 4 (hydration, write, copied-label timeout, + cleanup); no `useState(() => …storage)`; `.sort(` = 0; `new Date` = 0 | pass |
| island verbatim copy: "What are your points actually worth?" = 1, "Copy my link" ≥ 1, "Link copied" ≥ 1, "Bookable now" ≥ 1, "Nothing bookable with these balances yet" = 1, "Something went wrong showing your results" = 1 | pass |
| bundle gate: `from "@/db` / `drizzle` = 0 in page.tsx, core-experience, balance-form, result-card, almost-there | pass |
| page: `force-dynamic` = 0, `loadBalanceParams` ≥ 1, `Promise<SearchParams>` = 1, `new Date` = 1 | pass |
| `npm run build` — exit 0, route table lists `ƒ /` (dynamic, server-rendered on demand) | pass |
| `npm test` (vitest 152/152), `npm run typecheck`, `npm run lint` | green |
| Human walkthrough — 7/7 steps | **approved** |

### Human walkthrough (Task 3) — steps confirmed by the user

1. Fresh visit, no params: hero heading, 8 labeled inputs, empty state with one featured teaser card; no login prompt.
2. Typing 90000 into Chase UR: input formats to "90,000" live, URL gains `?ur=90000`, ranked cards appear instantly with no submit button or spinner.
3. Top card anatomy: terracotta dollar delta leads; cash fare + value-per-point side by side; balance-used chip; "via … 1:1" path line; booking guidance; "Verified …" stamp.
4. Second, smaller balance (Amex MR): "Almost there" section with plain-ink "You're X … points away" callouts.
5. Reload bare `/`: balances repopulate from localStorage and the URL re-fills via history replace.
6. "Copy my link" swaps to "Link copied" ~2s; pasted into a private window the identical results are present in the initial HTML (View Source — SSR proof); the main window's stored balances remain untouched (A1).
7. ~360px width: single-column layout, inputs comfortably tappable.

## Decisions Made

- **Delete, don't migrate, the Phase 1 placeholder.** The DB count line existed to prove the live DB path (D-16); with the guest flow it would be a credential-exposure hazard in a client-adjacent tree (T-04-11) and a needless per-request query. Awaiting `searchParams` gives the required dynamic rendering without `force-dynamic`.
- **Server-derived `asOf` prop.** One `new Date` per request on the server; the island and engine are clock-free, so SSR and hydration agree and tests remain deterministic (Pitfall 7).
- **`history: "replace"` on storage hydration.** Restoring from localStorage rewrites the current entry rather than pushing, so the bare `/` visit is immediately shareable and the back button behaves.
- **Edit-gated persistence (A1).** `hasEditedRef` flips only inside `onBalanceChange`; the write effect is a no-op before that, so opening someone else's link never overwrites the visitor's saved balances.
- **Teaser shows seed fields only (A5).** No delta on the empty-state card — a delta requires a balance, and inventing one would violate the no-UI-arithmetic rule.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Build, tests, typecheck, and lint were green on the first full run after Task 2; the walkthrough passed on the first pass.

## Known Stubs

None. The island is fully wired: URL state, engine, storage, clipboard, and all four render branches are connected to real data paths. The empty-state teaser intentionally renders only direct seed fields (no engine output) per A5 — this is a designed state, not a stub.

## Threat Flags

None beyond the plan's register. T-04-10 (hostile searchParams through `loadBalanceParams` + `paramsToBalances` + engine sanitize), T-04-11 (grep-gated DB-free bundle; Phase 1 query deleted), T-04-12 (neutral error copy, no error rendered/logged), T-04-13 (wholesale-validated storage before any `setParams`), and T-04-14 (guarded storage + clipboard accessors) are implemented as specified.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 4 goal is delivered: enter balances → see ranked wow results → share the link. All four ROADMAP Phase 4 success criteria are human-verified.
- Phase 5 (credibility layer) and Phase 6 (accounts) both depend only on Phase 4 and may interleave. The save flow can read balances straight from the same nuqs URL state (`paramsToBalances(params)`) after a Clerk modal — no pre-auth localStorage dance is needed.
- Share/OG polish can key its `opengraph-image` off the same `loadBalanceParams` loader used in `page.tsx`.
- Carry-forward from STATE.md still applies: the ≥30-verified dataset gate (Plan 02-05 DATA-04) remains deferred, and the LinkedIn in-app WebView test is a launch gate.

## Self-Check: PASSED

- FOUND: src/components/core-experience.tsx
- FOUND: src/app/page.tsx (contains `loadBalanceParams`)
- FOUND: src/app/layout.tsx (contains `NuqsAdapter`)
- FOUND commits: 1b3ef46, 0366366, 2dff11c
- Verified at wrap-up: `npx vitest run` 152/152, `npx tsc --noEmit` clean, all acceptance greps pass

---
*Phase: 04-core-experience*
*Completed: 2026-09-02*
