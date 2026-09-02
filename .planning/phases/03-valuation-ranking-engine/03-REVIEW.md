---
phase: 03-valuation-ranking-engine
reviewed: 2026-09-02T00:08:08Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - src/data/programs.ts
  - src/engine/index.ts
  - src/engine/paths.ts
  - src/engine/ranking.ts
  - src/engine/types.ts
  - src/engine/valuation.ts
  - tests/engine-paths.test.ts
  - tests/engine-purity.test.ts
  - tests/engine-ranking.test.ts
  - tests/engine-valuation.test.ts
findings:
  critical: 1
  warning: 6
  info: 4
  total: 11
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-09-02T00:08:08Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Reviewed the pure valuation/ranking engine (paths, valuation, ranking, types, barrel), the Bilt baseline change in `src/data/programs.ts`, and the four new test files. The ratified rulings (A1/A2/A3/A5/A7, Bilt=10, threshold 0.75) are correctly encoded and pinned by tests; the binary-search inverse transfer math and A1 tie-breaking were traced by hand and are correct for valid inputs; all 90 tests pass. Cross-checks against `src/engine/transfers.ts`, `src/data/types.ts`, and `src/data/transfers.ts` confirmed the seed-facing assumptions (unique route keys, positive-int schema fields) the engine relies on.

Findings concentrate on the gap between what the code *claims* about hostile inputs and what it *does*. One Critical: `requiredSourcePoints` infinite-loops on a non-finite `partnerPointsNeeded` (empirically confirmed — the call never returns) and silently returns 0 for NaN, despite an in-code comment claiming the loop is bounded against hostile inputs. Warnings cover the unguarded NaN path in `wowDeltaCents`, phantom direct-use paths from unvalidated balance keys, a latent A4 edge where a weak promo *increases* cost on block-bonus routes, a coverage tie-break that ignores cost, purity-gate regex blind spots, and unenforced magnitude bounds under the "no float drift" claim.

No structural pre-pass was provided; all findings below are narrative.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: `requiredSourcePoints` infinite-loops on Infinity and returns 0 for NaN — the T-03-05 "bounded loop" claim is false

**File:** `src/engine/paths.ts:103-127`
**Issue:** The comment at `src/engine/paths.ts:93` claims "the finite ceiling also bounds the loop against hostile inputs (T-03-05)". It does not, because the ceiling is only finite for finite inputs:

- `partnerPointsNeeded = Infinity`: `baseCeiling = Infinity`, `upperK = Infinity`; the guard at line 111 evaluates `Infinity < Infinity` → false, so the search runs with `hi = Infinity`. `mid = Math.floor((0 + Infinity) / 2) = Infinity`, `effectivePartnerPoints(..., Infinity) = Infinity >= Infinity` → `hi = mid = Infinity` — **no progress, infinite loop**. Empirically confirmed: the call never returns (probe killed by a 15s timeout).
- `partnerPointsNeeded = NaN`: `NaN <= 0` is false so the early return is skipped; `upperK = NaN`; the guard's `NaN < NaN` is false; `while (0 < NaN)` never runs → **returns 0**, i.e. a NaN need is priced as "free". Empirically confirmed.

`requiredSourcePoints` and `resolvePaths` are exported from the public barrel (`src/engine/index.ts`), and `rankRedemptions` feeds `partnerPointsNeeded` straight from caller-supplied `dataset.redemptions` (`ranking.ts:120`) with **no** finiteness check — the engine validates balances (`sanitizeBalances`) but trusts the dataset completely. The engine is explicitly positioned as the v2 advisor's tool boundary ("plain data in, plain data out"); one non-finite `pointsMax` in a dataset row hangs the process (in a serverless function: a billed timeout, effectively a DoS on the results page). Zod validation of the curated dataset happens outside the engine and is not part of this function's contract.
**Fix:**
```ts
export function requiredSourcePoints(
  route: TransferRouteSeed,
  bonus: TransferBonusSeed | null,
  partnerPointsNeeded: number,
): number | null {
  if (!Number.isFinite(partnerPointsNeeded)) {
    return null; // fail closed on NaN/±Infinity — never 0, never a hang
  }
  if (partnerPointsNeeded <= 0) {
    return 0;
  }
  // ... unchanged
```
(Optionally also guard `conservativeNeed` in `ranking.ts` with `Number.isSafeInteger`, mirroring `sanitizeBalances`.) Add the NaN/Infinity cases to `tests/engine-paths.test.ts` so T-03-05 is actually pinned.

## Warnings

### WR-01: `wowDeltaCents`/`cashOutValueCents` emit NaN/Infinity, contradicting the module's "never emits NaN or Infinity" guarantee

**File:** `src/engine/valuation.ts:72-106` (claim at `valuation.ts:9-10`)
**Issue:** The module header states "Non-finite or non-positive inputs degrade to 0 — the engine never emits NaN or Infinity", but only `cppX100` implements that guard (lines 30-37). `cashOutValueCents(Infinity, chaseUr)` returns `Infinity`; `wowDeltaCents(NaN, 0, 90_000, chaseUr)` returns `NaN`; `wowDeltaCents(Infinity, Infinity, ...)` returns `NaN` (`Infinity − Infinity`). Both are public barrel exports, and the guard tests in `tests/engine-valuation.test.ts:69-96` only cover `cppX100`/`effectiveCppX100` — the stated invariant is untested exactly where it is unimplemented.
**Fix:**
```ts
export function wowDeltaCents(...): number {
  if (
    !Number.isFinite(cashFareCents) ||
    !Number.isFinite(taxesFeesCents) ||
    !Number.isFinite(spentSourcePoints)
  ) {
    return 0;
  }
  // ... unchanged
```
Apply the same guard (or a shared helper) in `cashOutValueCents`, and add the missing test cases.

### WR-02: `sanitizeBalances` validates values but not keys — junk keys mint phantom "direct" funding paths in non-enterable currencies

**File:** `src/engine/ranking.ts:35-43` (consumed via `paths.ts:131-134, 178-185`)
**Issue:** `sanitizeBalances` keeps **every** key whose value is a positive safe integer. The `Balances` type restricts keys to the 8 enterable slugs, but that is compile-time only — the sanitizer exists precisely because runtime input is untrusted (Pitfall 6), and Phase 4's balances will arrive from URL params/JSON where extra keys are trivial to inject. A payload like `{ "virgin-atlantic": 80_000 }` sails through sanitization, `heldBalance(balances, "virgin-atlantic")` matches the direct-use branch in `resolvePaths`, and the engine reports a bookable "direct" path in a currency the product's fixed contract says users cannot hold — e.g. `ana-first-tokyo-via-virgin` becomes bookableNow with a fabricated Virgin balance. That corrupts the product's core numbers from a tampered share URL.
**Fix:** Whitelist keys against the fixed contract that already lives in the same module graph:
```ts
const ENTERABLE_SLUGS: ReadonlySet<string> = new Set([
  "chase-ur", "amex-mr", "capital-one", "citi-ty", "bilt",
  "world-of-hyatt", "hilton-honors", "marriott-bonvoy",
] satisfies EnterableProgramSlug[]);

if (
  ENTERABLE_SLUGS.has(slug) &&
  typeof value === "number" && Number.isSafeInteger(value) && value > 0
) {
  sanitized[slug] = value;
}
```
Add a hostile-balances test with a non-enterable key.

### WR-03: A4 promo application is unconditional — a weak promo on a block-bonus route *increases* requiredSourcePoints versus no promo

**File:** `src/engine/paths.ts:59-72`
**Issue:** `effectivePartnerPoints` strips the structural block bonus whenever any promo is active and applies the promo to the base alone. On the Marriott routes the 5K/60K block is worth +25% at full blocks, and `transferBonusSeedSchema` permits `bonusPercent` from 1 to 100 — so any future Marriott promo below 25% makes the computed conversion *worse* than having no promo at all: 150,000 Bonvoy under a 10% promo → `floor(50,000 × 1.10)` = 55,000 miles vs 60,000 with no promo, and `requiredSourcePoints` rises accordingly. A live promotion making users' points compute as less valuable is both a real-world modeling error (the structural block bonus is unconditional in Marriott's program) and a monotonicity absurdity the methodology page cannot defend. The ratified A4 ruling forbids *stacking* (base+block then promo); it does not require discarding the block bonus when the promo is inferior — taking the better of the two non-stacked figures still satisfies "never both compounded". Latent today (the only seed promo rides the block-free Amex→Hilton route), so it will ship silently the day a Marriott promo row is added.
**Fix:**
```ts
if (bonus === null) {
  return computePartnerPoints(route, sourcePoints);
}
const withBlocks = computePartnerPoints(route, sourcePoints);
const promoOnBase = applyPromoBonus(
  computePartnerPoints(
    { ...route, bonusMilesPerBlock: null, bonusBlockPoints: null },
    sourcePoints,
  ),
  bonus.bonusPercent,
);
return Math.max(withBlocks, promoOnBase); // non-stacking preserved; promo can never hurt
```
This keeps monotonicity (max of two non-decreasing functions), so the binary search in `requiredSourcePoints` remains exact. Confirm the interpretation with Nick before changing ratified-ruling code; if unconditional-strip is truly the intent, encode a dataset invariant instead (reject promos below the route's block-bonus rate).

### WR-04: `prefersByCoverage` tie-break ignores requiredSourcePoints — an exact coverage tie can pick the path with a far larger pointsAway

**File:** `src/engine/paths.ts:219-231`
**Issue:** When no candidate is affordable and two candidates have exactly equal coverage (integer cross-products tie, e.g. 48,000/60,000 via Bilt vs 120,000/150,000 via Marriott — both 0.8), the tie-break goes straight to kind then alphabetical slug and never considers `requiredSourcePoints`. The affordable-branch comparator (`prefersByCost`, lines 142-150) puts cost first; the coverage branch drops it entirely. If the alphabetically-later path is the cheaper one, the user is shown a `pointsAway` figure inflated by the ratio difference (12,000 vs 102,000 in the example above, had the slugs sorted the other way). With the current 46 routes the cheaper-ratio source ("amex-mr", "bilt") happens to also sort first, so this is latent — it will bite silently when a route is added whose cheaper source sorts later.
**Fix:** Insert a cost tie-break before the kind/slug fallbacks:
```ts
if (crossA !== crossB) {
  return crossA > crossB;
}
if (a.requiredSourcePoints !== b.requiredSourcePoints) {
  return a.requiredSourcePoints < b.requiredSourcePoints;
}
if (a.kind !== b.kind) { ... }
```

### WR-05: Purity gate misses side-effect imports, dynamic `import()`, and `require()` — the boundary can regress without failing CI

**File:** `tests/engine-purity.test.ts:24` (`SPECIFIER_RE`)
**Issue:** The gate's regex only matches `import/export ... from "x"`. Three specifier forms escape it entirely: bare side-effect imports (`import "server-only";` — the exact form that package is used in), dynamic imports (`await import("node:fs")`), and CJS `require("...")`. An engine file adding any of these would pass the purity suite while violating the boundary the test exists to enforce ("this test replaces the manual grep gate ... so the boundary can never silently regress"). This is a test-reliability gap in the phase's stated success criterion 5.
**Fix:** Add two more patterns and merge the matches:
```ts
const SIDE_EFFECT_RE = /import\s+["']([^"']+)["']/g;
const DYNAMIC_RE = /\b(?:import|require)\s*\(\s*["']([^"']+)["']\s*\)/g;
```
Run all three regexes in `extractSpecifiers`. (Optionally extend the determinism check beyond `Date` to `Math.random` and `process.` for the same reason.)

### WR-06: "Integer-only / no float drift" relies on unenforced magnitude bounds — float division and cross-products are exact only below 2^53

**File:** `src/engine/valuation.ts:38`, `src/engine/valuation.ts:78-80`, `src/engine/paths.ts:107-109`, `src/engine/paths.ts:222-223`, `src/engine/ranking.ts:218-219`
**Issue:** Per the project ruling, float arithmetic in value computation must be flagged. The value math is not literally integer-only — it is IEEE double division/multiplication over integers, which is exact only while every intermediate stays under 2^53:
- `Math.round(((cashFareCents − taxesFeesCents) * 100) / partnerPoints)` (`valuation.ts:38`) — float division then rounding; exact while the numerator < 2^53 (fare < ~$900 trillion — fine) and safe from half-way misrounds at seed magnitudes, but nothing asserts it.
- `Math.floor((spentSourcePoints * baseline) / 100)` (`valuation.ts:78-80`) — `sanitizeBalances` admits balances up to `Number.MAX_SAFE_INTEGER`; a spent figure near 2^53 times baseline 100 overflows exactness (floor-off-by-one class errors).
- The "no float" cross-multiplications (`paths.ts:222-223`, `ranking.ts:218-219`) — `balA × reqB` is exact only while products < 2^53, i.e. requirements below ~94.9M points. In practice both operands are bounded by the max requirement (unaffordable ⇒ balance < required), so current seed data (~10^5–10^6) is safe by ~4 orders of magnitude, but the comments claim unconditional exactness and no code or test enforces the bound.
No behavior change is needed for the shipping dataset; the defect is that the finance-credibility guarantee is a comment, not an invariant.
**Fix:** Pick one: (a) document and enforce the bound — add a dataset/CI assertion that `pointsMax`, derived `requiredSourcePoints`, and cent fields stay below a stated ceiling (e.g. 10^8), and reference it in the "integer-only" comments; or (b) make the hot comparisons overflow-proof with `BigInt` cross-products (comparison-only, so no float leaks into results).

## Info

### IN-01: `asOf` format is never validated — malformed dates silently mis-evaluate bonus windows

**File:** `src/engine/paths.ts:37-38` (contract at `types.ts:187-192`)
**Issue:** The lexical comparison contract requires zero-padded `YYYY-MM-DD`, but nothing checks it. `"2026-9-15"` or a full ISO timestamp (`"2026-09-01T12:00:00Z"` compares *inside* the window while `"2026-9-15"` falls outside it) silently changes promo outcomes with no error. Mostly fail-conservative, but silent.
**Fix:** Cheap guard at the `rankRedemptions`/`resolvePaths` boundary: `/^\d{4}-\d{2}-\d{2}$/.test(asOf)` — throw or treat all bonuses as inactive with a documented rule.

### IN-02: `heldBalance` in paths.ts accepts Infinity and non-integers when `resolvePaths` is called directly

**File:** `src/engine/paths.ts:131-134`
**Issue:** `typeof balance === "number" && balance > 0` admits `Infinity` and floats (NaN is rejected only because `NaN > 0` is false). `rankRedemptions` sanitizes first, but `resolvePaths` is an exported barrel API and applies weaker rules — an `Infinity` balance makes every path "affordable". Inconsistent hardening across the two entry points.
**Fix:** Use `Number.isSafeInteger(balance) && balance > 0` here too (mirrors `sanitizeBalances`).

### IN-03: `alternatePaths` carries no affordability signal

**File:** `src/engine/paths.ts:244-251` (doc at `types.ts:121`)
**Issue:** Alternates include paths the user cannot afford, undistinguished from affordable ones, and the type doc calls them "every other viable path". Phase 4 can render an unaffordable alternate as if actionable; recomputing affordability in the UI requires re-deriving balances per path.
**Fix:** Either add `affordable: boolean` (or `shortfall: number | null`) to `TransferPath`, or sharpen the doc to state alternates may be unaffordable.

### IN-04: A3 tie on equal `bonusPercent` resolves by dataset order

**File:** `src/engine/paths.ts:40-42`
**Issue:** Two overlapping promos with the *same* `bonusPercent` on one route resolve to whichever appears first in `dataset.bonuses` — deterministic per dataset but unspecified by A3, and the surfaced `activeBonus` (with its `sourceNote`/dates) would flip if seed rows are reordered.
**Fix:** Add a stable secondary key (e.g. later `endDate`, then `startDate`, then `sourceNote`), or a dataset invariant rejecting same-percent overlapping promos on one route.

---

_Reviewed: 2026-09-02T00:08:08Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
