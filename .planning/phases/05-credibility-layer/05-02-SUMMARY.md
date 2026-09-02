---
phase: 05-credibility-layer
plan: 02
subsystem: ui
tags: [next-app-router, rsc, static-route, methodology, vitest, react-dom-server, tailwind]

# Dependency graph
requires:
  - phase: 05-credibility-layer
    provides: "05-01 vitest @ alias (resolve.alias '@' → ./src) so a test can import a page that runtime-imports @/data / @/engine / @/lib/format"
  - phase: 03-valuation-ranking-engine
    provides: "cppX100 / cashOutValueCents / wowDeltaCents JSDoc, A1 cheapest-path rule, A2 conservative gate, A5 fail-closed verifiedAt filter — the rules the prose states"
  - phase: 04-core-experience
    provides: "UI-SPEC class vocabulary, @/lib/format formatters, CoreExperience island with the Bookable now section the link hangs under"
provides:
  - "/methodology — static (○) zero-client-JS server route with nine sections; every figure rendered from @/data through @/engine cppX100 and @/lib/format (VAL-03)"
  - "SiteFooter server component (src/components/site-footer.tsx) with the /methodology link and standing disclaimer — unmounted until plan 05-05"
  - "'How we calculate these numbers →' next/link under the Bookable now heading in the results island"
  - "tests/methodology-page.test.ts — 10 SSR + source-scan assertions deriving expectations from the same data/engine modules"
affects: [05-05, layout.tsx footer mount, phase-06 legal contact channel]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Static RSC as drift guard: a sync default-export page with no request-time input imports the seed barrels and computes its numbers at build; a re-ratified baseline changes the page with zero edits"
    - "SSR string testing: renderToStaticMarkup(createElement(Page)) in the vitest node env, with next/link rendering as a plain <a href> — no router mock; decode &#x27; before prose assertions"
    - "Source-scan gate for static routes: the test reads the page file and rejects 'use client', searchParams, export const dynamic, new Date, and @/db — so a future edit cannot silently make the route dynamic or DB-bound"
    - "Class strings hoisted to module consts (SECTION_CLASS, HEADING_CLASS, BODY_CLASS, …) copied verbatim from the UI-SPEC vocabulary; no new tokens"

key-files:
  created:
    - src/app/methodology/page.tsx
    - tests/methodology-page.test.ts
    - src/components/site-footer.tsx
  modified:
    - src/components/core-experience.tsx
    - .planning/REQUIREMENTS.md

key-decisions:
  - "Nine sections fit in one 260-line page.tsx; no sections.tsx split was needed (plan allowed one past 400 lines)"
  - "Bilt's baseline is described as 'a stand-in for near zero rather than a published rate' and hotel currencies as 'Pure travel value' — matching the ratified A2/A3 rulings encoded in programs.ts, never a flat 1.0¢"
  - "No mailto: or contact channel on the Independence section — none is ratified yet; Phase 6 legal adds it"
  - "The cash-out table uses a real <table> with scope='col' headers and per-row seed keys, styled with the label/body vocabulary; no card primitive"

patterns-established:
  - "Methodology prose must be updated alongside src/engine/valuation.ts, paths.ts, ranking.ts — the page header comment names the three files it describes"
  - "Worktree dependency setup: npm ci --prefer-offline inside the worktree (~3 min); no junctions to the main checkout"

requirements-completed: [VAL-03]

# Metrics
duration: ~10min
completed: 2026-09-02
---

# Phase 5 Plan 02: Methodology Page Summary

**Static, zero-client-JS `/methodology` route whose nine sections state exactly what the valuation engine does, with the live cash-out baseline table and the worked ANA example rendered from `@/data` + `@/engine` — plus the footer component and results-view link that point to it**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-09-02T23:19:21Z
- **Completed:** 2026-09-02T23:29:20Z
- **Tasks:** 2 (1 TDD)
- **Files modified:** 5

## Accomplishments
- `/methodology` prerenders as `○ /methodology` in the `next build` route table: sync default export, no `searchParams`, no clock read, no `@/db` import, no client directive (T-05-05)
- Every number on the page is computed, not typed: the eight enterable programs render from `programs.filter(isUserEnterable)` with `formatCpp(cashOutBaselineCppX100)` or "Pure travel value", and the flagship example renders `formatCpp(cppX100(900000, 60000, 90000))` → "9.3¢" from the live ANA entry (T-05-04)
- Prose states the engine's actual rules: TPG cpp formula with taxes subtracted, per-program baselines (never flat), increment rounding + Marriott 5K/60K block bonus ("60,000 Alaska miles via Marriott cost 150,000 Bonvoy points, not the naive 180,000"), A4 no-stacking, A7 single hop, A1 cheapest path with direct-use ties, A2 high-end ranking, A5 fail-closed verification, automatic bonus-window reversion
- `SiteFooter` exists with the `/methodology` link and "Educational only — not financial advice"; the results island shows "How we calculate these numbers →" beneath the Bookable now heading
- Full suite 177 tests green (10 new); `npm run typecheck`, `npm run lint`, and `npm run build` exit 0

## Task Commits

Each task was committed atomically:

1. **Task 1: /methodology static page + SSR test** - `ea5cdb6` (test, RED) → `d7b4536` (feat, GREEN)
2. **Task 2: SiteFooter component + methodology link under "Bookable now"** - `87e2ab1` (feat)

_Note: Task 1 was TDD (two commits); no refactor pass was needed. The RED run failed on "Cannot find module '../src/app/methodology/page'" before any implementation existed._

## Files Created/Modified
- `src/app/methodology/page.tsx` - VAL-03 page: `metadata` export, module-scope `anchor` + `enterablePrograms`, nine `<section>` blocks with `<h2>` headings, `<table>` of live baselines, worked ANA `<p>`, "Back to your results" link (260 lines)
- `tests/methodology-page.test.ts` - Renders once via `renderToStaticMarkup`; asserts h1, nine ordered h2s, every enterable baseline, the formatter-derived ANA figures, A2/disclaimer/Marriott wording, `href="/"`, no "1¢ each"/accent; plus a four-check source scan
- `src/components/site-footer.tsx` - `export function SiteFooter()`; server component, `next/link` to `/methodology`, ink only, not yet mounted
- `src/components/core-experience.tsx` - `import Link from "next/link"` added before the `nuqs` import; Bookable now `<h2>` wrapped in a `gap-2` column with the methodology link; nothing else touched
- `.planning/REQUIREMENTS.md` - VAL-03 checked off via `requirements.mark-complete`

## Decisions Made
- Kept all nine sections in `page.tsx` (260 lines, under the 400-line split threshold); a `sections.tsx` sibling was not needed.
- Described Bilt's `cashOutBaselineCppX100: 10` as a stand-in for "effectively no cash-out path" rather than a published rate, mirroring the ratified comment in `programs.ts`.
- Did not invent a contact address on the Independence section; Phase 6 legal owns the contact channel.
- The formula line is plain text (`cents per point = (cash fare − taxes and fees) ÷ points`) in a body paragraph rather than `<code>` or a figure, keeping the editorial voice.

## Deviations from Plan

None - plan executed exactly as written.

Environment setup (not a code deviation): the worktree lacked `node_modules`, so `npm ci --prefer-offline --no-audit --no-fund` was run inside the worktree per the orchestrator's safety rule (~3 min, 720 packages). No junctions were created; the main checkout was not touched.

## Issues Encountered
- The worktree sandbox refuses compound Bash commands (loops, `$(...)` substitutions feeding `sed`, chained git); every check was split into plain single commands, and the npm-ci wait loop was placed in a scratchpad script. No effect on deliverables.
- The worktree's initial HEAD (`061ced1`) was behind the expected wave-1 base; the mandated `git reset --hard 0acc0d7` corrected it before any work began.
- Vite's `configLoader: 'native'` warning for the ESM `vitest.config.ts` is pre-existing and informational.

## User Setup Required

None - no external service configuration required.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes. The route is static and DB-free; the only client-tree change is a `next/link`. All three register mitigations (T-05-04 drift guard test, T-05-05 static/DB-free source scan, T-05-06 `src/components` grep gate) are implemented and passing.

## Next Phase Readiness
- Plan 05-05 mounts `<SiteFooter />` in `src/app/layout.tsx` (import from `@/components/site-footer`); nothing else is required for the footer to appear site-wide.
- Plan 05-03's `metadataBase` + `openGraph` defaults in the layout will be inherited by `/methodology`'s `metadata` export without changes here.
- No blockers.

## Self-Check: PASSED

- FOUND: src/app/methodology/page.tsx, tests/methodology-page.test.ts, src/components/site-footer.tsx, src/components/core-experience.tsx
- FOUND commits: ea5cdb6, d7b4536, 87e2ab1

---
*Phase: 05-credibility-layer*
*Completed: 2026-09-02*
