---
phase: 04-core-experience
reviewed: 2026-09-02T18:55:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - src/lib/balance-params.ts
  - src/lib/balance-storage.ts
  - src/lib/format.ts
  - src/lib/path-display.ts
  - src/components/balance-form.tsx
  - src/components/result-card.tsx
  - src/components/almost-there.tsx
  - src/components/core-experience.tsx
  - src/app/layout.tsx
  - src/app/page.tsx
  - tests/balance-params.test.ts
  - tests/balance-storage.test.ts
  - tests/format.test.ts
  - tests/path-display.test.ts
findings:
  critical: 1
  warning: 3
  info: 7
  total: 11
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-09-02T18:55:00Z
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

Reviewed the Phase 4 guest core experience: the URL codec (`balance-params`), browser-storage persistence and A1 precedence (`balance-storage`), display formatters (`format`, `path-display`), the three presentational components, the client island, the root layout, the server page, and the four unit-test files. `tsc --noEmit`, `eslint`, and `vitest run` (152 tests) all pass, so every finding below is something the current suite does not catch.

The invariants called out for this phase hold on inspection and by grep:

- Nothing in the guest chain (`src/components`, `src/lib`, `src/engine`, `src/data`) imports `@/db` or drizzle.
- `localStorage` is reached for in exactly one place (`getSafeStorage` in the island), and `writeStoredBalances` runs only behind `hasEditedRef` (A1: URL wins, editing claims ownership). The storage-hydration effect never writes storage.
- No `.sort(` in components/lib; `bookableNow` and `almostThere` render in engine array order.
- The only `new Date` is in `src/app/page.tsx`; the island threads `asOf` through as a prop.
- URL params are validated at the boundary (`isValidBalance`: positive safe integer) and storage payloads are validated field-by-field with wholesale discard.

The defects are concentrated in the number-rendering path, which is the part of this product whose credibility is the pitch. One is a Critical: `formatCpp` uses `toFixed(1)` on a float and therefore mis-rounds every cppX100 value ending in 5 (`145 → "1.4¢"`, `115 → "1.1¢"`, `205 → "2.0¢"`, while `125 → "1.3¢"`). The engine emits integer `cppX100` via `Math.round`, so these values are common, not theoretical. Two Warnings concern arithmetic drift (a second `cashOutValueCents` in the UI layer that rounds differently from the engine's) and an input path that bypasses the codec guard and can turn a garbage entry into a shared link that decodes to a balance of 1. A third Warning is the UTC clock read for `asOf`, which makes transfer-bonus badges flip a few hours early for US visitors.

## Critical Issues

### CR-01: `formatCpp` rounds inconsistently — every `xx5` cppX100 value renders 0.1¢ low or high depending on binary representation

**File:** `src/lib/format.ts:64-69`
**Issue:** `(cppX100 / 100).toFixed(1)` rounds the *binary* float, not the decimal. Probed in Node:

```
105 → "1.1¢"   (half-up would give 1.1)  OK
115 → "1.1¢"   (half-up: 1.2)            WRONG
125 → "1.3¢"   (half-up: 1.3)            OK
145 → "1.4¢"   (half-up: 1.5)            WRONG
195 → "1.9¢"   (half-up: 2.0)            WRONG
205 → "2.0¢"   (half-up: 2.1)            WRONG
215 → "2.1¢"   (half-up: 2.2)            WRONG
255 → "2.5¢"   (half-up: 2.6)            WRONG
305 → "3.0¢"   (half-up: 3.1)            WRONG
```

The engine produces `cppX100` as `Math.round(((fare - taxes) * 100) / points)` — an arbitrary integer — so values ending in 5 will appear across the dataset. The result is a "Value per point" figure that is sometimes rounded up and sometimes down for identical decimal inputs. For a product whose Phase 5 methodology page will show `cpp = (fare − taxes) ÷ points`, a reader who computes 1.45¢ and sees "1.4¢" while another card shows 1.25¢ as "1.3¢" has found an inconsistency in exactly the place the pitch says there are none. `tests/format.test.ts:50` pins `105 → "1.1¢"`, which happens to pass, and masks the problem. Note: `04-UI-SPEC.md:67` mandates this exact formula; the spec should be amended alongside the fix.

**Fix:** Round in integer tenths, then format by string assembly — no float division in the rounding step:

```ts
export function formatCpp(cppX100: number): string {
  if (!Number.isFinite(cppX100)) {
    return "0.0¢";
  }
  // Integer tenths of a cent; Math.round on an exact x.5 is deterministic half-up.
  const tenths = Math.round(cppX100 / 10);
  const sign = tenths < 0 ? "-" : "";
  const abs = Math.abs(tenths);
  return `${sign}${Math.floor(abs / 10)}.${abs % 10}¢`;
}
```

`cppX100 / 10` for an integer input is exact to the tenth when the input is a multiple of 10 and yields an exact `.5` for `xx5` inputs (e.g. `145 / 10 === 14.5` exactly), so `Math.round` is reliable here in a way `toFixed` on `/100` is not. Add table-driven tests for `115, 145, 195, 205, 215, 255, 305` expecting `1.2¢, 1.5¢, 2.0¢, 2.1¢, 2.2¢, 2.6¢, 3.1¢`.

## Warnings

### WR-01: UI-layer `cashOutValueCents` does not mirror the engine — `Math.round` vs. the engine's `Math.floor`, and it duplicates an exported engine function

**File:** `src/lib/format.ts:128-142` (compare `src/engine/valuation.ts:72-81`)
**Issue:** The JSDoc says this helper "mirrors the engine's cash-out definition used inside wowDeltaCents … so the framing line is presentation of an engine-consistent figure, not new math." It is new math: the engine floors, this rounds. The hero delta on the card is `fare − taxes − floor(points × cpp / 100)` while the line beneath it says "vs. ~$X cashing out" with `X = round(points × cpp / 100)`. Today the two agree because every enterable baseline (100/60/50/10) times an increment-aligned `requiredSourcePoints` happens to divide evenly; the first route with an odd increment or a future baseline like 75 makes the hero and its framing line disagree by a cent, which can flip a whole-dollar `formatDollars` boundary. More importantly, the engine already exports `cashOutValueCents(spentSourcePoints, sourceProgram)`, and `ResultCard` already holds `sourceProgram` — the second implementation exists only to avoid an import alias, and the module header even documents the name collision it creates. `tests/format.test.ts:98-116` pins the *round* behavior, locking in the drift.

**Fix:** Delete `cashOutValueCents` from `src/lib/format.ts` and its tests; in `result-card.tsx` call the engine's function directly on the program object:

```ts
import { cashOutValueCents } from "@/engine";
// ...
const framingLine =
  sourceProgram === undefined || sourceProgram.cashOutBaselineCppX100 === null
    ? "Pure travel value — these points have no cash-out option"
    : `vs. ~${formatDollars(
        cashOutValueCents(chosenPath.requiredSourcePoints, sourceProgram),
      )} cashing out`;
```

If a UI-layer wrapper is still wanted for the non-finite guard, have it delegate to the engine function rather than re-implement the formula, and add a parity test asserting `uiCashOut(p, program.cashOutBaselineCppX100) === engineCashOut(p, program)` for a non-divisible case such as `(12_345, bilt)`.

### WR-02: `handleBalanceChange` writes raw input to the URL without the codec guard — huge entries silently clear the field, and ≥1e21 serializes to `ur=1e+21`, which re-parses as a balance of 1

**File:** `src/components/core-experience.tsx:144-150`; `src/components/balance-form.tsx:68-76`
**Issue:** `balance-params.ts` centralizes validation in `isValidBalance` and provides `balancesToParams` so "invalid values … never reach the URL" (comment at line 85). The island's edit handler bypasses both: it forwards whatever `BalanceForm` emits straight into `setParams`. `BalanceForm` only checks `floatValue > 0` and applies `Math.floor`; there is no `isAllowed`/max cap on `NumericFormat`. Traced consequences (confirmed against nuqs 2.10.1 `parseAsInteger`, which serializes with `"" + Math.round(v)` and parses with bare `parseInt`):

1. Type 16+ digits (≥ 2^53): the value goes into nuqs state and the URL as full digits, `paramsToBalances` drops it as unsafe, the controlled `value` prop becomes `""`, and the field visibly empties with no feedback. The URL still carries the junk param.
2. Type 22+ digits (≥ 1e21): `"" + 1e21` is `"1e+21"`, so the URL becomes `?ur=1e+21`. On reload or for anyone opening that link, `parseInt("1e+21")` is `1`, which passes `isValidBalance`, and the visitor sees results ranked for a 1-point Chase balance. `hasEditedRef` is also set, so the write effect persists `{}` (the unsafe value was dropped) to storage while the URL says otherwise — URL and storage now disagree.

This is a boundary-validation gap on the one path that user keystrokes take into the shareable-link contract; the codec's guard exists precisely to cover it. Low likelihood, but it contradicts the "validate at the boundary" rule the phase set for itself and produces a silently wrong shared result.

**Fix:** Route edits through the same guard the codec uses, and cap the input so the field never accepts an unrepresentable value:

```ts
// core-experience.tsx
function handleBalanceChange(slug: EnterableProgramSlug, value: number | null) {
  hasEditedRef.current = true;
  const next = value !== null && Number.isSafeInteger(value) && value > 0 ? value : null;
  void setParams({ [PARAM_KEY_BY_SLUG[slug]]: next });
}
```

```tsx
// balance-form.tsx — a realistic ceiling well inside the safe-integer range
const MAX_BALANCE = 100_000_000; // 100M points
<NumericFormat
  // ...
  isAllowed={({ floatValue }) => floatValue === undefined || floatValue <= MAX_BALANCE}
/>
```

Consider exporting `isValidBalance` from `balance-params.ts` (see IN-04) so the handler, the codec, and storage share one predicate.

### WR-03: `asOf` is the UTC calendar date — US visitors see transfer-bonus badges disappear (or appear) hours before the program's own date boundary

**File:** `src/app/page.tsx:29`
**Issue:** `new Date().toISOString().slice(0, 10)` yields the UTC date. Vercel functions run in UTC, so from 8pm ET (5pm PT) onward the page computes `asOf` as tomorrow. Bonus windows in the seed are date-granular and describe the issuer's calendar (US programs, typically ET), so a promo "through Oct 14" stops rendering the `+30% transfer bonus through Oct 14, 2026` badge — and stops being applied to `requiredSourcePoints` and the hero delta — for the last 4–7 hours of Oct 14 for the majority of the launch audience. The reverse happens on start dates. Pitfall 7 correctly pins the clock read to the server; it just leaves the timezone implicit, and UTC is the one choice that is wrong for every US timezone.

**Fix:** Derive the date in an explicit zone that matches how bonus dates are authored (document the choice next to `startDate`/`endDate` in `src/data/types.ts`):

```ts
// page.tsx — en-CA yields YYYY-MM-DD; the zone should match how bonus windows are authored.
const asOf = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
```

Keep this as the sole clock read; the island and engine are unchanged.

## Info

### IN-01: `isEnterableSlug` uses the `in` operator, which walks the prototype chain

**File:** `src/components/balance-form.tsx:28-30`
**Issue:** `slug in PARAM_KEY_BY_SLUG` is `true` for `"constructor"`, `"toString"`, etc. The seed slug regex `^[a-z0-9-]+$` does not exclude those names, so the guard is not the "single source of truth" check the comment describes. No practical exposure today (seed slugs are curated and the filter also requires `isUserEnterable`), but the intent is an own-key check.
**Fix:** `return Object.hasOwn(PARAM_KEY_BY_SLUG, slug);` (or `Object.prototype.hasOwnProperty.call`).

### IN-02: Redundant null guards after narrowing

**File:** `src/components/almost-there.tsx:57-59`; `src/components/core-experience.tsx:260`
**Issue:** `result.pointsAway ?? 0` sits inside a block already guarded by `result.pointsAway !== null`, and `featuredTeaser.verifiedAt !== null` re-checks the predicate `redemptions.find` already applied. The `?? 0` in particular could mask a future regression (a `null` would silently render "You're 0 … points away" instead of failing type-check).
**Fix:** Use `formatPoints(result.pointsAway)` inside the guarded block. For the teaser, either keep the re-check (TS cannot carry narrowing through a module-level `find`) but drop the `?? 0` pattern, or type `featuredTeaser` as `(RedemptionSeed & { verifiedAt: string }) | undefined` via a type-guard predicate so the JSX check is unnecessary.

### IN-03: Heading class strings duplicated across four call sites

**File:** `src/components/result-card.tsx:65`, `src/components/almost-there.tsx:27,52`, `src/components/core-experience.tsx:80-81,263`
**Issue:** The card-title string `"text-ink text-[1.75rem] leading-tight font-semibold"` appears three times and the section-heading string twice (once as `SECTION_HEADING_CLASS`, once inline in `almost-there.tsx:27`). `1.75rem` is a magic value standing in for the UI-SPEC "Heading 28px" role. A Phase 7 typography pass will have to find every copy.
**Fix:** Add a `--text-heading` token in `globals.css` `@theme` (28px / 1.2) and use `text-heading`, or export small `SectionHeading`/`CardHeading` wrappers from one module and use them in all three components.

### IN-04: `isValidBalance` implemented three times

**File:** `src/lib/balance-params.ts:59-61`; `src/lib/balance-storage.ts:33-35`; (engine: `src/engine/ranking.ts:35-43`)
**Issue:** Identical predicate in two UI modules; `balance-storage.ts` already imports from `balance-params.ts`, so the duplication is unnecessary. WR-02 adds a fourth place that needs it.
**Fix:** `export function isValidBalance(value: unknown): value is number` from `balance-params.ts` and import it in `balance-storage.ts` and the island. The engine copy can stay (engine purity forbids importing `src/lib`).

### IN-05: Test gaps that would have caught CR-01 and WR-01

**File:** `tests/format.test.ts:45-62, 98-116`
**Issue:** `formatCpp` is tested only at 220, 105, 0 — none of the `xx5` values that mis-round (105 happens to pass). `cashOutValueCents` is tested only with inputs that divide evenly, so its `Math.round` never diverges from the engine's `Math.floor` in a test. `formatVerifiedDate`'s degrade branches (`"not-a-date"`, month `"13"`, day `"xx"`) are documented but untested.
**Fix:** Add table-driven cases for `formatCpp` at `115, 145, 195, 205, 215, 255, 305`; add a parity test against `cashOutValueCents` from `@/engine` for a non-divisible case; add two degrade cases for `formatVerifiedDate`.

### IN-06: `AlmostThere` outer margin stacks on the parent gap when Bookable-now is empty

**File:** `src/components/almost-there.tsx:26`; `src/components/core-experience.tsx:174,206`
**Issue:** The section carries `mt-12` (48px, the UI-SPEC "section break") for the case where it follows Bookable now, but the wrapper `div` at line 206 is itself a `gap-8` flex child. When `bookableNow` is empty and `almostThere` is not, the section sits 32 + 48 = 80px below the header instead of the spec's 32px form-to-results gap.
**Fix:** Move the spacing decision into the parent: render `<AlmostThere className={results.bookableNow.length > 0 ? "mt-12" : undefined} />`, or use `gap-12` on the wrapper `div` and drop `mt-12` from the section.

### IN-07: `paramsToBalances(params)` computed three times per render/commit

**File:** `src/components/core-experience.tsx:88, 96, 121, 141`
**Issue:** The same decode runs at render (line 88), inside the `useMemo` (96), in the hydration effect (121), and in the write effect (141). Not a correctness issue — the function is pure — but the fresh `balances` object each render also defeats any future memoization of `BalanceForm`, and having the decode in four places invites one of them to drift (e.g., a future guard added to one and not the others).
**Fix:** Memoize once and reuse:

```ts
const balances = useMemo(() => paramsToBalances(params), [params]);
const results = useMemo(() => { try { return rankRedemptions({ balances, dataset, asOf }); } catch { return null; } }, [balances, asOf]);
// effects: use `balances` in their dependency arrays instead of re-decoding
```

---

_Reviewed: 2026-09-02T18:55:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
