---
phase: 02-redemption-database
reviewed: 2026-09-01T19:02:13Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - package.json
  - scripts/db-check.ts
  - scripts/seed.ts
  - src/app/page.tsx
  - src/data/index.ts
  - src/data/programs.ts
  - src/data/redemptions-flights-europe.ts
  - src/data/redemptions-flights.ts
  - src/data/redemptions-hotels.ts
  - src/data/redemptions.ts
  - src/data/transfers.ts
  - src/data/types.ts
  - src/db/schema.ts
  - src/engine/transfers.ts
  - tests/seed-data.test.ts
  - tests/transfers.test.ts
findings:
  critical: 0
  warning: 5
  info: 5
  total: 10
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-09-01T19:02:13Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Reviewed the full redemption-database phase: Drizzle schema (4 tables), Zod seed
validation, the typed seed dataset (21 programs / 46 routes / 1 promo bonus /
36 redemptions — all counts verified against the actual files), the pure
transfer-math engine, the idempotent seed script, and the DB-free tests.

The core arithmetic is sound: integer-only math with `Math.floor`, correct
FK-safe delete/insert ordering inside a single `db.batch()`, seed object keys
exactly mirror the Drizzle property names, and the dataset cross-reference
validation runs before any DB import. Dataset counts, route counts, and the
verified-entry floor (34 verified of 36) all check out. No hardcoded secrets, no
connection-string leakage paths found in scripts or the homepage error handling.

Five warnings survive adversarial tracing. The most important is a genuine
correctness trap in the engine's public API: the documented "promo bonuses never
stack with structural block bonuses" rule (A4) is impossible for a caller to
honor using the exported functions, and nothing in `validateDataset` prevents
the data configuration that would trigger the compounding. Second, the engine
file claims a test-enforced purity gate that does not exist anywhere in
`tests/`. No blocker-severity defects: no current seed row or code path produces
incorrect output today.

## Warnings

### WR-01: A4 non-stacking rule is unenforceable through the engine's public API, and validation permits the triggering data

**File:** `src/engine/transfers.ts:22-52` (also `src/data/types.ts:147-213`)
**Issue:** The doc comments (types.ts:40-44, transfers.ts:42-45) state the
engine "never compounds" a promo bonus with a structural block bonus, and that
"callers pass the base conversion (without block bonus) when a promo applies."
But `computePartnerPoints` unconditionally adds the block bonus (lines 31-36),
and no exported function returns the base-only conversion. If a promo bonus is
ever added on a block-bonus route (e.g. a Marriott→airline promo — Marriott has
historically run exactly these), every caller composing the two public functions
naively — `applyPromoBonus(computePartnerPoints(route, pts), pct)` — compounds
both bonuses, violating the frozen A4 spec. `validateDataset` does not reject a
bonus row riding a block-bonus route, so nothing stops that data from shipping.
The existing test (`tests/transfers.test.ts:76-83`) only covers the MR→Hilton
route where `bonusMilesPerBlock` is null, so this gap is invisible to CI.
**Fix:** Make the composition rule executable, and guard the data. Either:

```ts
// src/engine/transfers.ts — one entry point that owns the A4 rule
export function computeTransfer(
  route: TransferRouteSeed,
  sourcePoints: number,
  promoBonusPercent: number | null = null,
): number {
  const transferable =
    Math.floor(sourcePoints / route.incrementPoints) * route.incrementPoints;
  const base = Math.floor(
    (transferable * route.ratioNumerator) / route.ratioDenominator,
  );
  if (promoBonusPercent !== null) {
    // A4: promo replaces (never stacks with) the structural block bonus.
    return applyPromoBonus(base, promoBonusPercent);
  }
  const bonus =
    route.bonusMilesPerBlock !== null && route.bonusBlockPoints !== null
      ? Math.floor(transferable / route.bonusBlockPoints) * route.bonusMilesPerBlock
      : 0;
  return base + bonus;
}
```

and in `validateDataset`, until Phase 3 defines precedence, reject the ambiguous
configuration outright:

```ts
const blockBonusRoutes = new Set(
  d.routes
    .filter((r) => r.bonusMilesPerBlock !== null)
    .map((r) => `${r.fromProgramSlug}→${r.toProgramSlug}`),
);
for (const b of d.bonuses) {
  const key = `${b.fromProgramSlug}→${b.toProgramSlug}`;
  if (blockBonusRoutes.has(key)) {
    issues.push(`promo bonus on block-bonus route ${key} (A4 composition undefined in data)`);
  }
}
```

### WR-02: Claimed "purity gate" test does not exist

**File:** `src/engine/transfers.ts:6-7`
**Issue:** The module header states "the purity gate in tests enforces this
boundary" (no next/react/db/app imports). No such test exists — `tests/` contains
only `smoke.test.ts`, `seed-data.test.ts`, and `transfers.test.ts`, and none
inspects the engine's imports. The boundary holds today (single type-only import,
verified), but the documented enforcement mechanism is fictional: a future
`import { db } from "../db"` added to the engine would pass CI silently, and the
phase requirement explicitly says this boundary must be test-enforced.
**Fix:** Add the gate to `tests/transfers.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

it("engine stays framework- and DB-free (purity gate)", () => {
  const src = readFileSync(
    join(__dirname, "../src/engine/transfers.ts"),
    "utf8",
  );
  const imports = [...src.matchAll(/^import\s+(type\s+)?.*?from\s+["'](.+?)["']/gms)];
  for (const [full, typeOnly, specifier] of imports) {
    expect(specifier, `forbidden import: ${full}`).toBe("../data/types");
    expect(typeOnly, `engine import must be type-only: ${full}`).toBeTruthy();
  }
});
```

(Or delete the claim from the comment — but the test is the right fix given the
phase requirement.)

### WR-03: `computePartnerPoints` has no input guards — negative/NaN balances produce garbage, and `route.active` is silently ignored

**File:** `src/engine/transfers.ts:22-37`
**Issue:** Two unhandled edge cases at what will become a user-facing boundary:
1. `sourcePoints = -5000` yields `Math.floor(-5000/1000)*1000 = -5000` →
   negative partner points; `NaN`/`Infinity` propagate straight through. Phase 4
   feeds this function from user-controlled URL params (nuqs), so a crafted or
   mistyped `?mr=-90000` renders negative "wow" numbers unless every future
   caller remembers to sanitize. CLAUDE.md requires input validation at system
   boundaries; a pure engine that silently emits nonsense for out-of-domain
   input makes that easy to get wrong.
2. The function computes full conversions for routes with `active: false`.
   Nothing in the engine or its doc comment says the caller must pre-filter
   inactive routes, so a dead route would still show transfer value.
**Fix:**

```ts
export function computePartnerPoints(
  route: TransferRouteSeed,
  sourcePoints: number,
): number {
  if (!route.active) return 0; // or: document that callers MUST pre-filter
  if (!Number.isFinite(sourcePoints) || sourcePoints <= 0) return 0;
  // ...existing math
}
```

At minimum, guard for non-finite/negative input; the `active` behavior can
alternatively be a documented caller contract, but it must be written down.

### WR-04: Duplicate and overlapping promo bonuses pass validation and the DB

**File:** `src/data/types.ts:147-213` (also `src/db/schema.ts:70-92`)
**Issue:** `validateDataset` enforces uniqueness for program slugs, route pairs,
and redemption slugs — but not for bonuses. Two identical bonus rows, or two
bonuses on the same route with overlapping date windows, validate cleanly and
insert cleanly (the `transfer_bonuses` PK is a `serial` id, so the DB blocks
nothing). The seed script's stated guarantee — "bad data can never reach a
write" — doesn't hold for this table, and no downstream selection rule exists
for which of two overlapping promos applies, so the first data-entry mistake
here becomes a silent wrong-number bug in the engine's consumers.
**Fix:** Add an overlap check in `validateDataset`:

```ts
const bonusesByRoute = new Map<string, TransferBonusSeed[]>();
for (const b of d.bonuses) {
  const key = `${b.fromProgramSlug}→${b.toProgramSlug}`;
  const prior = bonusesByRoute.get(key) ?? [];
  for (const other of prior) {
    if (b.startDate <= other.endDate && other.startDate <= b.endDate) {
      issues.push(`overlapping bonuses on route ${key} (${b.startDate}..${b.endDate})`);
    }
  }
  prior.push(b);
  bonusesByRoute.set(key, prior);
}
```

(ISO date strings compare correctly lexicographically, matching the existing
`endDate >= startDate` refine.)

### WR-05: `shadcn` CLI shipped as a runtime dependency

**File:** `package.json:26`
**Issue:** `"shadcn": "^4.19.1"` sits in `dependencies`. The project's own stack
doc (CLAUDE.md) is explicit: "CLI `shadcn@latest` (components are vendored, not
a dependency)." The CLI is a code generator — it has no runtime role, bloats
production installs, and its presence in `dependencies` invites accidental
runtime imports. (`radix-ui`, `clsx`, `cva`, `tailwind-merge` are correct as
runtime deps for the vendored components; `shadcn` itself is not.)
**Fix:** Remove `shadcn` from `dependencies` and invoke it ad hoc:

```bash
npm uninstall shadcn
npx shadcn@latest add <component>
```

## Info

### IN-01: env-load `try/catch` swallows more than "file absent"

**File:** `scripts/seed.ts:13-17`, `scripts/db-check.ts:7-11`
**Issue:** The bare `catch {}` around `process.loadEnvFile` swallows every
failure: a malformed `.env.development.local`, permission errors, and — on
Node < 20.12 where `loadEnvFile` doesn't exist — the resulting `TypeError`. All
of these then surface as the misleading "DATABASE_URL is not set (re-run
`vercel env pull ...`)" message. (The comment also says "Node 22 built-in";
`process.loadEnvFile` landed in Node 20.12.)
**Fix:** Re-throw anything that isn't file-absence:

```ts
try {
  process.loadEnvFile(".env.development.local");
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
}
```

### IN-02: slug regex accepts degenerate "kebab-case" values

**File:** `src/data/types.ts:10`
**Issue:** `/^[a-z0-9-]+$/` accepts `"---"`, `"-foo"`, and `"foo-"`. Harmless
for the current hand-curated set, but slugs become URL segments later.
**Fix:** `z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug must be kebab-case")`

### IN-03: `bonusPercent` cap of 100 contradicts the "data-only change" promise

**File:** `src/data/types.ts:55`
**Issue:** `z.number().int().min(1).max(100)` — but `src/data/transfers.ts:148-150`
promises that adding a promo is "a data-only change, never a schema change."
Real transfer promos occasionally exceed +100%; such a promo would require a
schema (and DB-mirroring) edit.
**Fix:** Raise the cap (e.g. `.max(200)`) or document the deliberate ceiling next
to the "data-only change" claim.

### IN-04: Bilt 0.1¢ cash-out baseline is a live data-integrity placeholder

**File:** `src/data/programs.ts:44-52`
**Issue:** `cashOutBaselineCppX100: 10` stands in for "effectively no cash-out
path." It is documented and Nick-acknowledged, but it will flow into Phase 3
delta math as a fabricated number in a product whose pitch is defensible
valuations. Flagged here so it cannot silently survive the Phase 3 methodology
sign-off.
**Fix:** Resolve at the Phase 3 gate — either make the column nullable-for-Bilt
with an explicit "no cash-out" rendering path, or document the 0.1¢ convention
on the methodology page.

### IN-05: No DB-level CHECK constraints mirror the Zod rules

**File:** `src/db/schema.ts:45-92`
**Issue:** Positivity (`ratio_numerator > 0`, `points_min > 0`, cents `>= 0`),
the paired bonus-fields rule, and `bonus_percent` bounds exist only in
application-side Zod. Acceptable while the seed script is the sole writer, but
any future writer (admin UI, migration script) bypasses all invariants.
**Fix:** Low priority; when the schema stabilizes, add `check()` constraints via
drizzle's `check` builder for the numeric invariants.

---

_Reviewed: 2026-09-01T19:02:13Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
