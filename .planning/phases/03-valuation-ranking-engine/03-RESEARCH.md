# Phase 3: Valuation & Ranking Engine - Research

**Researched:** 2026-09-01
**Domain:** Pure-TypeScript domain engine — transfer-path resolution, cents-per-point valuation, hybrid ranking
**Confidence:** HIGH (grounded almost entirely in this repo's Phase 2 artifacts and confirmed specs; no new external dependencies)

## Summary

Phase 3 builds the sealed engine on top of a foundation that Phase 2 already poured. `src/engine/transfers.ts` exists with two frozen, Nick-confirmed pure functions (`computePartnerPoints`, `applyPromoBonus`) whose semantics (A1 increment flooring, A4 promo non-stacking) are locked by tests against real seed rows. Phase 3's job is to add three layers above them — path resolution (`paths.ts`), valuation (`valuation.ts`), and hybrid ranking (`ranking.ts`) — plus an engine-owned result type and an automated purity gate. Zero new packages are needed: the entire phase is hand-rolled integer arithmetic over in-memory data, tested with the existing vitest 4 setup.

The two hard problems are (1) **inverse transfer math** — "how many source points do I need for N partner points?" cannot be computed by naive ratio division because of increments, block bonuses, and promos (needing 60,000 Alaska miles via Marriott takes 150,000 Bonvoy, not the naive 180,000, because of the 5K/60K block bonus) — and (2) **"cheapest path" semantics** when multiple held programs reach the same partner. Both are design decisions, not library lookups; this document prescribes concrete rules for each (monotonic binary search for inversion; minimum-raw-source-points for cheapest path) with rationale.

Everything money-related stays integer (cents, cppX100) per the Phase 2 convention — the finance-credibility claim tolerates no float drift. The engine must be deterministic: "today" (for bonus-window checks) is an `asOf` ISO-date string parameter compared lexically, never `Date.now()` inside the module. Draft redemptions (`verifiedAt: null`) are filtered out by the engine — draft ≠ shippable is an established Phase 2 rule.

**Primary recommendation:** Extend `src/engine/` with `types.ts`, `paths.ts`, `valuation.ts`, `ranking.ts`, and `index.ts` — pure functions only, type-only imports from `../data/types`, TDD with hand-computed fixtures against real seed rows (the exact pattern plan 02-03 established), plus an automated purity test replacing the manual grep gate.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VAL-02 | Cpp math follows TPG convention: (cash fare − taxes/fees) ÷ points × 100 | Formula analysis + integer-unit mapping in "Cpp math" pattern; hand-computed ANA example (933 cppX100); unit-confusion pitfall documented; test map includes hand-computed cases |
| VAL-05 | When a transfer bonus is active, valuations auto-adjust (bonus-adjusted cpp) and the bonus is surfaced | Active-bonus window semantics (`asOf` string compare), A4 non-stacking contract from `applyPromoBonus`, promo-aware inverse math (77K MR vs 100K MR for 200K Hilton example), `effectiveCppX100` per-source-point design |

Phase success criteria additionally require the ranking/path outputs that Phase 4's RANK-01..04 will display (bookable-now by wow delta, almost-there with points-away, cheapest path, purity). Research supports each — see Architecture Patterns.
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Files under 500 lines; typed interfaces for all public APIs; DDD-style bounded module (`src/engine/` is exactly this)
- Prefer TDD; Phase 2 set the working precedent (RED→GREEN commits, hand-computed expectations against REAL seed rows — continue it; classic TDD fits pure functions better than mock-first here since there are no collaborators to mock)
- ALWAYS run tests after code changes; verify `npm run build` before commit
- `/src` for source, `/tests` for tests; never save working files to root
- Input validation at system boundaries (engine boundary behavior specified below; the zod boundary itself is Phase 4's job)
- No new docs files unless required (RESEARCH/PLAN artifacts are GSD-managed, allowed)

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Transfer math (ratio/increment/block bonus) | Engine (`src/engine/transfers.ts`) | — | Already built and frozen in Phase 2; Phase 3 consumes as-is, never re-implements |
| Inverse transfer math (required source points) | Engine (`src/engine/paths.ts`, new) | — | Pure integer algorithm; needed for bookability, points-away, and effective cost |
| Path resolution (direct-use + routes, cheapest path) | Engine (`src/engine/paths.ts`, new) | — | Deterministic function of balances × dataset; RANK-03/04 display consumes its output in Phase 4 |
| Cpp + wow-delta valuation | Engine (`src/engine/valuation.ts`, new) | — | Never persisted (Pattern: store inputs, compute valuations); one formula, one methodology |
| Hybrid ranking (bookable-now / almost-there) | Engine (`src/engine/ranking.ts`, new) | — | The orchestrator; returns plain data for any caller (Phase 4 UI, v2 advisor) |
| Active-bonus window determination | Engine (with `asOf` input) | Caller supplies date | Purity: engine never reads the clock |
| Dataset provisioning | Data layer (`src/data/*`, exists) | DB/seed (exists) | Engine receives dataset as an argument; it does not import data values |
| Balance input validation (zod, clamping at UI boundary) | Phase 4 (app boundary) | Engine defensive handling | System-boundary validation is the UI/server's job; engine still degrades gracefully on junk |
| Display/rounding/copy ("~$4,500", "you're 23K away") | Phase 4 (presentation) | — | Engine returns exact integers; precision-theater rounding is a UI concern |

## Standard Stack

### Core

**No new libraries.** This phase adds zero dependencies. Everything needed is installed and proven in CI:

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5 (installed) | Engine language | Already the repo language; `satisfies`/type-only imports carry the purity boundary [VERIFIED: package.json] |
| vitest | ^4.1.11 (installed) | Unit tests | Existing test runner; `vitest.config.ts` targets `tests/**/*.test.ts`, node environment [VERIFIED: repo] |
| zod | ^4.5.4 (installed) | Seed types only | Engine imports **types only** from `src/data/types.ts`; zod never reaches the engine at runtime (type-only imports erase) [VERIFIED: repo] |

### Supporting

None. `node:fs` (built-in) is used by the new purity **test** (tests may use node APIs; the engine may not).

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled binary-search inversion | A generic solver / brute-force scan | Brute force over ≤10M/1000 increments works but is inelegant; binary search on the monotonic conversion function is ~15 lines and provably correct |
| Vitest purity test (reads engine source, asserts import allowlist) | ESLint `no-restricted-imports` scoped to `src/engine/**` in flat config | Both work; the vitest test keeps the gate in the same suite that CI already runs and produces a phase-criterion-shaped failure message. ESLint variant is acceptable if the planner prefers lint-time feedback; do not do both |
| Integer `cppX100` / cents everywhere | Floating-point cpp | Floats invite drift in the numbers that are the product's credibility claim; Phase 2 froze the integer convention — extend it |

**Installation:** none — `npm ci` state is sufficient.

## Package Legitimacy Audit

**No external packages are installed in this phase.** The slopcheck protocol is not applicable — nothing to audit.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Inherited Contracts (from Phase 2 — locked, do not relitigate)

These are confirmed specs (Nick's 2026-09-01 DATA-04 rulings), enforced by existing tests. Phase 3 builds on them verbatim:

| Contract | Where Frozen | Implication for Phase 3 |
|----------|-------------|------------------------|
| `computePartnerPoints(route, sourcePoints)`: floor to increment → integer ratio → block bonus per full block | `src/engine/transfers.ts` + `tests/transfers.test.ts` (Marriott 120K→50K, 59K→19K) | Consume as-is; the inverse function must invert exactly this |
| `applyPromoBonus(basePartnerPoints, pct)` applies to the base-CONVERTED amount; **never stacks** with block bonuses (A4) | Same files | Path resolver owns the branch: when a promo is active on a route, compute base conversion **without** block bonus, then apply promo |
| Integer-only math (`Math.floor`), no floats in finance numbers | Module header comment, all Phase 2 code | cpp becomes `cppX100` integer; money stays cents |
| Engine purity: only permitted import is type-only from `../data/types` | 02-03 summary; grep gate in verification | Phase 3 makes this an automated test (success criterion 5) |
| Per-program cash-out baselines: Chase 100, Citi 100, Amex 60, CapOne 50, Bilt 10 (stand-in), hotels `null` | `src/data/programs.ts` (`cashOutBaselineCppX100`) | Wow delta uses per-program baseline, never a flat 1¢; `null` → cash-out value 0 |
| Cash-fare convention: discounted realistic retail (economy/business), undiscounted retail (First) | `src/data/types.ts` comment (Phase 5 methodology page inherits verbatim) | Engine doesn't touch fares; convention already encoded in `cashFareCents` |
| Draft ≠ shippable: `verifiedAt: null` entries are filtered by downstream readers | 02-05 summary ("Known Stubs") | Engine excludes unverified redemptions (2 currently: st-regis-maldives, gritti-palace-venice) |
| Bilt 0.1¢ baseline is a stand-in; "final convention lands with the Phase 3 methodology sign-off" | `src/data/programs.ts` comment; 02-05 summary ("A3 full sign-off still a Phase 3 gate") | Phase 3 plan should include a small human-confirm step: ratify (or change) the Bilt baseline before the engine's deltas ship |
| Canonical 8 enterable slugs: chase-ur, amex-mr, capital-one, citi-ty, bilt, world-of-hyatt, hilton-honors, marriott-bonvoy | `tests/seed-data.test.ts` | Engine `Balances` type keys on these slugs |

Dataset shape available to the engine (all already typed in `src/data/types.ts`): `ProgramSeed`, `TransferRouteSeed` (46 rows incl. Marriott 1:3+5K/60K, Amex→Hilton 2:1, Bilt 1:1), `TransferBonusSeed` (1 live row: Amex→Hilton +30%, 2026-09-01→2026-10-14), `RedemptionSeed` (36 rows, 34 verified; `pointsMin`/`pointsMax` ranges, integer cents, `availabilityRating`, `partnerProgramSlug`).

## Architecture Patterns

### System Architecture Diagram

```
                         ┌────────────────────────────────────────────────┐
                         │              src/engine (sealed)               │
 Balances ──────────────►│                                                │
 (Record<enterableSlug,  │  ranking.ts: rankRedemptions(input)            │
  points>)               │    │  filter: verifiedAt !== null              │
                         │    ▼                                           │
 Dataset ───────────────►│  paths.ts: for each redemption                 │
 (programs, routes,      │    ├─ candidate paths:                        │
  bonuses, redemptions   │    │    direct (user holds partner program)    │
  — passed as plain      │    │    + each active route into the partner   │
  arguments)             │    │      from a held program (single hop)     │
                         │    ├─ activeBonus(route, asOf)? ──┐            │
 asOf (ISO date) ───────►│    │                              ▼            │
                         │    ├─ effective conversion fn:                 │
                         │    │    promo: applyPromoBonus(baseOnly)  (A4) │
                         │    │    else:  computePartnerPoints (incl.     │
                         │    │           block bonus)                    │
                         │    ├─ requiredSourcePoints = binary-search     │
                         │    │    inverse of the conversion fn           │
                         │    └─ choose path: min requiredSourcePoints    │
                         │         among affordable; else max coverage    │
                         │    ▼                                           │
                         │  valuation.ts:                                 │
                         │    cppX100        (partner points, VAL-02)     │
                         │    effectiveCppX100 (source points, VAL-05)    │
                         │    wowDeltaCents = (fare − taxes) −            │
                         │        spentSourcePts × baselineCppX100 / 100  │
                         │    ▼                                           │
                         │  ranking.ts:                                   │
                         │    coverage ≥ 1        → bookableNow           │
                         │        (sort: wowDelta desc)                   │
                         │    threshold ≤ cov < 1 → almostThere           │
                         │        (sort: coverage desc; pointsAway)       │
                         └───────────────┬────────────────────────────────┘
                                         ▼
                    { bookableNow: RankedResult[], almostThere: RankedResult[] }
                                         │
                    Phase 4 UI renders it; v2 advisor calls it as a tool
```

### Recommended Module Structure

```
src/engine/
├── types.ts        # Balances, TransferPath, RankedResult, EngineOptions, Dataset input shape
├── transfers.ts    # EXISTS — do not modify (frozen signatures)
├── paths.ts        # activeBonusFor, effectivePartnerPoints, requiredSourcePoints (inverse), resolvePaths
├── valuation.ts    # cppX100, effectiveCppX100, cashOutValueCents, wowDeltaCents
├── ranking.ts      # rankRedemptions orchestrator (filter → resolve → value → partition → sort)
└── index.ts        # public barrel — the surface Phase 4 and the v2 advisor import

tests/
├── engine-paths.test.ts      # inverse math + cheapest-path selection vs real seed rows
├── engine-valuation.test.ts  # VAL-02 hand-computed cpp cases, wow delta, null baselines
├── engine-ranking.test.ts    # partition/sort/threshold, bonus auto-adjust end-to-end, edge balances
└── engine-purity.test.ts     # success criterion 5 as an executable gate
```

### Pattern 1: Deterministic engine input (no clock, no I/O)

**What:** `rankRedemptions({ balances, dataset, asOf, options })` — everything the engine needs arrives as arguments. Bonus-active checks compare ISO date strings lexically (`b.startDate <= asOf && asOf <= b.endDate`), which is safe because the seed schema enforces `z.iso.date()` and avoids timezone/Date-parsing bugs entirely.
**When to use:** Always in this module. Callers (Phase 4 server/client, tests, v2 advisor) supply `asOf`.
**Why:** Purity (criterion 5), reproducible tests (a test pinned to `asOf: "2026-09-15"` exercises the live Amex→Hilton bonus forever), and shareable-URL determinism (same URL + same dataset ⇒ same results).

### Pattern 2: Promo-aware effective conversion (A4 branch)

**What:** The path resolver builds one conversion function per (route, asOf):

```typescript
// paths.ts — conceptual; exact naming is the planner's call
function effectivePartnerPoints(
  route: TransferRouteSeed,
  bonus: TransferBonusSeed | null, // active at asOf, else null
  sourcePoints: number,
): number {
  if (bonus === null) return computePartnerPoints(route, sourcePoints); // incl. block bonus
  // A4: promo multiplies the BASE conversion; block bonus never stacks.
  const baseOnly = computePartnerPoints(
    { ...route, bonusMilesPerBlock: null, bonusBlockPoints: null },
    sourcePoints,
  );
  return applyPromoBonus(baseOnly, bonus.bonusPercent);
}
```

**Why:** This is the confirmed A4 rule made structural. Today no route has both a block bonus and a live promo, but the engine must encode the rule so future data (a Marriott promo) can't silently compound. If multiple bonuses overlap on one route at `asOf`, take the highest `bonusPercent` (deterministic; flagged in Assumptions).

### Pattern 3: Inverse transfer math by binary search (the phase's real algorithm)

**What:** `requiredSourcePoints(convert, incrementPoints, partnerPointsNeeded)` — the minimum source amount (a multiple of the route increment) whose conversion covers the need. `effectivePartnerPoints` is monotonically non-decreasing in `sourcePoints` (floors of non-decreasing functions), so binary search over increment multiples is exact:

```typescript
// Upper bound: base-ratio ceiling, rounded up to the increment — bonuses only ADD
// points, so the true answer is ≤ this bound.
// upper = ceilToIncrement(ceil(needed × den / num))
// Binary search k ∈ [0, upper/increment] for the smallest k with
// convert(k × increment) ≥ needed. Return k × increment (or null if even upper fails).
```

**Why not naive division:** Marriott→Alaska, need 60,000 miles. Naive: 60,000 × 3 = 180,000 Bonvoy. Actual: 150,000 (base 50,000 + two 5K block bonuses). Naive overshoots by 30,000 points — a visibly wrong "you need X more" number on exactly the route experts check first.
**Direct-use degenerate case:** if the user holds the partner program itself, `requiredSourcePoints = partnerPointsNeeded` (no route, no increment).

### Pattern 4: Cheapest path = minimum raw source points (recommended rule)

**What:** For each redemption, candidate paths = direct-use (if the user holds `partnerProgramSlug` and it's enterable) plus every `active` route from a held program into the partner (single hop only). Among paths the balance can afford, choose the one with the **smallest `requiredSourcePoints`**; tie-break deterministically (prefer direct-use, then lowest `fromProgramSlug` alphabetically). If none is affordable, the "best" path for almost-there purposes is the one with **maximum coverage** (`balance / requiredSourcePoints`).
**Why this rule (and not min-opportunity-cost):** Ranking paths by cash-out opportunity cost (points × baseline) would make null-baseline programs (Marriott/Hyatt/Hilton) always look "free," steering users to burn 150K Bonvoy over 60K Bilt for the same award — and it lets the path choice inflate the wow delta, a credibility hazard. Minimum raw source points is neutral, explainable in one sentence ("the path that needs the fewest points"), and matches the intuitive reading of RANK-03. The wow delta is then computed honestly from the chosen path. Tagged [ASSUMED] — worth a one-line confirmation at plan discussion, but a defensible default.
**Test case built into the data:** Alaska awards are reachable via Bilt 1:1 (60K Bilt) and Marriott 3:1+5K/60K (150K Bonvoy) — a real two-path resolution fixture. Hilton hotels via direct Hilton balance vs Amex 1:2 (×1.3 promo through Oct 14) is the promo-path fixture.

### Pattern 5: Cpp math in integers (VAL-02, exact unit mapping)

**What:** TPG formula is stated in dollars: cpp = (cash fare − taxes/fees) ÷ points × 100. The dataset stores **cents**. In cents the ×100 vanishes: `cpp = (cashFareCents − taxesFeesCents) / points`. To stay integer, return `cppX100 = round(((cashFareCents − taxesFeesCents) * 100) / points)` — same scale as the existing `cashOutBaselineCppX100` field (100 = 1.0¢/pt).
**Hand-computed anchors for tests (from real verified rows):**
- ANA business RT (fare $9,000, taxes $600, 90,000 pts at max): (900000−60000)/90000 = 9.33 cpp → `cppX100 = 933`. TPG check: ($9,000−$600)÷90,000×100 = 9.33 ✓
- ANA First via Virgin (fare $14,000, taxes $400, 72,500 pts): 1360000/72500 = 18.76 → `cppX100 = 1876`
**Two cpp figures, deliberately:**
- `cppX100` — per **partner** point (redemption-intrinsic; the number VAL-02's convention describes)
- `effectiveCppX100` — per **source** point actually spent on the chosen path: `round(((fare − taxes) * 100) / requiredSourcePoints)`. This is the number a transfer bonus improves (VAL-05): an active promo lowers `requiredSourcePoints`, which raises `effectiveCppX100`. Both are returned; Phase 4 decides display.

### Pattern 6: Wow delta with per-program baselines

**What:** `wowDeltaCents = (cashFareCents − taxesFeesCents) − cashOutValueCents(spentSourcePoints, sourceProgram)` where `cashOutValueCents = floor(spentSourcePoints × cashOutBaselineCppX100 / 100)` and a `null` baseline (hotel currencies) contributes 0 (no cash-out path exists; the delta is the full net cash value). `spentSourcePoints` = the increment-aligned `requiredSourcePoints` of the chosen path, **not** the full balance.
**Why:** RANK-01 defines the delta as transfer-partner value minus cash-out value; PITFALLS #4 mandates per-program baselines over a flat 1¢. Subtracting taxes on the value side keeps the numerator consistent with cpp (you still pay taxes in cash either way).

### Pattern 7: Ranges handled conservatively (pointsMin/pointsMax)

**What:** Dynamic-priced awards carry `pointsMin`–`pointsMax`; `pointsMax: null` means a fixed chart. Recommended: gate **bookability and ranking on the conservative end** — `pointsNeeded = pointsMax ?? pointsMin` — and return valuations at both ends (`atMin`/`atMax` pairs) so Phase 4 can render honest ranges.
**Why:** Declaring "you can book this" off `pointsMin` overpromises on exactly the dynamic programs (Hilton 160–200K spreads) where overpromising hurts most; conservative gating is the finance-credible default. Ranking on the conservative delta avoids inflated ordering. Tagged [ASSUMED] — a reasonable planner/discussion confirmation, but consistent with PITFALLS #1/#3.

### Pattern 8: Automated purity gate (success criterion 5 as a test)

**What:** `tests/engine-purity.test.ts` reads every file in `src/engine/` with `node:fs`, extracts import statements, and asserts each is either (a) a relative import within `src/engine/`, or (b) an `import type` from `../data/types`. Explicitly forbidden matches: `next`, `react`, `zod` (value import), `drizzle`, `@neondatabase`, `../db`, `../../db`, `@/db`, `../app`, `server-only`, `node:*`.
**Why:** The 02-03 gate was a manual grep in the verification step; the phase criterion says "imports nothing from Next.js, React, or the database layer" — making it CI-executable means it can never silently regress in Phase 4+ when someone "just needs" a helper. Note `import type { X } from "../data/types"` is safe even though that file imports zod at runtime: type-only imports erase at compile time.

### Anti-Patterns to Avoid

- **Re-implementing transfer math in the new layers:** `computePartnerPoints`/`applyPromoBonus` are the only conversion primitives; paths.ts composes them (02-03: "Phase 3 consumes these exact signatures — no re-implementation").
- **Ranking logic leaking into SQL or components (ARCHITECTURE.md anti-pattern 2):** all math in `src/engine/`; Phase 4 only renders.
- **`Date.now()` / `new Date()` inside the engine:** breaks purity, determinism, and invites timezone bugs; `asOf` is an input.
- **Persisting derived numbers:** cpp/wow delta are computed per call, never stored (schema comment already says so).
- **Multi-hop transfer chains** (e.g., Chase UR → Marriott → Alaska): technically exists in the route graph but is never good value (1:1 then 3:1), doubles resolution complexity, and no requirement asks for it. Single hop only; document the constraint in code.
- **Balance pooling across programs toward one award:** explicitly deferred (V2-05). One source program per result.
- **The word "bookable" in engine type/field names becoming UI copy:** PITFALLS #3 — the engine can use `bookableNow` internally, but pass `availabilityRating` through on every result so Phase 4 can tier honestly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Transfer conversion math | A second implementation in paths.ts | Existing `computePartnerPoints`/`applyPromoBonus` | Frozen, Nick-confirmed, test-covered; two implementations will drift |
| Date parsing for bonus windows | `new Date()` arithmetic | Lexical ISO-string comparison | Schema guarantees `YYYY-MM-DD`; string compare is timezone-proof and pure |
| Dataset validation inside the engine | Zod re-validation per call | Trust the seed boundary (`validateDataset` at seed/test time) | Engine input is repo-controlled data already validated in CI; re-validating adds a runtime zod dependency that breaks purity |
| Graph library for path resolution | Dijkstra/graph packages | A filter over 46 route rows | Depth-1 graph, ≤46 edges; a `routes.filter()` is the whole "traversal" |

**Key insight:** this phase is the one place where hand-rolling *is* the standard practice — the algorithms are the product's defensible-numbers claim, and every line must be explainable on a methodology page. The discipline is in tests (hand-computed expectations against real seed rows), not in libraries.

## Common Pitfalls

### Pitfall 1: Units confusion in the cpp formula
**What goes wrong:** Applying the TPG "× 100" to cent-denominated inputs yields cpp figures 100× too large (933 cpp instead of 9.33).
**Why it happens:** The requirement states the formula in dollars; the dataset stores cents.
**How to avoid:** One conversion site: `cppX100 = round(((cashFareCents − taxesFeesCents) * 100) / points)`. Unit-comment every money field. Anchor tests to hand-computed TPG-form examples (ANA 9.33 cpp).
**Warning signs:** cpp values > 100; deltas in the hundreds of thousands of dollars.

### Pitfall 2: Naive inversion of transfer math
**What goes wrong:** `requiredSourcePoints = ceil(needed × den/num)` ignores block bonuses and increments — overstates Marriott needs by up to 30K points and produces non-increment "you need 47,350 more" outputs that look amateur.
**How to avoid:** Binary search the monotonic conversion (Pattern 3); every returned figure is increment-aligned by construction. Test: 60,000 Alaska miles via Marriott ⇒ exactly 150,000 (not 180,000); 147,000 ⇒ insufficient.
**Warning signs:** points-away numbers that aren't multiples of 1,000/3,000; Marriott paths looking wildly expensive.

### Pitfall 3: Promo/block-bonus stacking (violating A4)
**What goes wrong:** Applying `applyPromoBonus` to `computePartnerPoints`' output (which includes block bonus) compounds bonuses Nick confirmed never stack.
**How to avoid:** Pattern 2's branch — base-only conversion under a promo. Test with a synthetic route carrying both a block bonus and a promo to pin the rule (real data has no such row yet — that's exactly why the test must exist).
**Warning signs:** an effective Marriott ratio better than 1:0.433 under any promo.

### Pitfall 4: Hidden clock or environment reads
**What goes wrong:** `Date.now()` for bonus windows makes results non-reproducible (test flakes at bonus boundaries; shared URLs render differently across timezones) and dents the purity claim.
**How to avoid:** `asOf: string` parameter; lexical comparison; purity test forbids `Date.now(` as a bonus assertion if desired.

### Pitfall 5: Drafts and inactive routes leaking into results
**What goes wrong:** The 2 `verifiedAt: null` entries (or a future `active: false` route) surface in rankings, violating the DATA-04 "no unverified entry ships" gate.
**How to avoid:** Engine filters `verifiedAt !== null` redemptions and `active === true` routes; tests assert the two known drafts never appear given any balance.

### Pitfall 6: Junk balances producing NaN valuations
**What goes wrong:** Negative numbers, `NaN`, `Infinity`, or 10^15 balances reach the arithmetic and render as `NaN cpp` publicly (PITFALLS security table).
**How to avoid:** Zod clamping is Phase 4's boundary job, but the engine defensively treats non-finite/`<= 0` balances as absent (`Number.isSafeInteger(b) && b > 0`), and tests cover 0-balance, single-program, and 5,000,000-point inputs (the "Looks Done But Isn't" checklist cases).

### Pitfall 7: Path choice gaming the wow delta
**What goes wrong:** Choosing the transfer path that maximizes the delta (e.g., always routing through null-baseline Marriott) inflates the hero number — the exact "attackable methodology" failure PITFALLS #4 warns about.
**How to avoid:** Path selection rule is valuation-independent (min raw source points); delta is computed after the path is chosen. Document the rule in code for the Phase 5 methodology page.

### Pitfall 8: Almost-there without a floor becomes discouraging
**What goes wrong:** A 5K-balance user sees "you're 195,000 points away" — aspiration turns to bounce (PITFALLS UX table caps almost-there at ~25–50% above balance).
**How to avoid:** `almostThereThreshold` option, default **0.75 coverage** (SUMMARY.md's reconciled recommendation), i.e., balance covers ≥75% of the conservative requirement. Parameterized so Phase 4 can tune with real data without engine edits.

## Code Examples

Verified patterns from the repo (the engine's real fixtures):

### Existing frozen primitives (consume, don't modify)
```typescript
// src/engine/transfers.ts [VERIFIED: repo]
export function computePartnerPoints(route: TransferRouteSeed, sourcePoints: number): number
export function applyPromoBonus(basePartnerPoints: number, bonusPercent: number): number
// tests/transfers.test.ts freezes: Marriott 120_000→50_000, 60_000→25_000, 59_000→19_000;
// MR→Hilton 60_000→120_000; promo composition 10_000 MR → 20_000 → 26_000
```

### Hand-computed expectations to freeze in Phase 3 tests
```typescript
// VAL-02 (real row: ana-business-tokyo-roundtrip, at pointsMax 90_000)
// cppX100 = round((900_000 − 60_000) * 100 / 90_000) = 933   // 9.33 cpp, TPG-checked

// Inverse math (real route: marriott-bonvoy → alaska-mileage-plan)
// requiredSourcePoints(…, needed = 60_000) === 150_000       // NOT naive 180_000
// effectivePartnerPoints at 147_000 = 49_000 + 2×5_000 = 59_000 → insufficient

// VAL-05 (real route amex-mr → hilton-honors + live bonus row, asOf "2026-09-15")
// need 200_000 Hilton (Conrad Maldives pointsMax):
//   promo path:    77_000 MR  (154_000 base × 1.30 = 200_200 ≥ 200_000; 76_000 fails)
//   no-promo path: 100_000 MR (asOf "2026-10-15", after endDate)
// effectiveCppX100 improves accordingly — the bonus-adjusted cpp VAL-05 requires

// Cheapest path (real routes into alaska-mileage-plan)
// balances { bilt: 70_000, "marriott-bonvoy": 200_000 }, need 60_000 miles:
//   Bilt path 60_000 < Marriott path 150_000 → chosen path = bilt (min raw source points)

// Bonus-window determinism (live bonus row: 2026-09-01 → 2026-10-14)
// asOf "2026-09-01" → active; "2026-10-14" → active; "2026-10-15" → inactive (string compare)
```

### Engine result shape (recommended, planner refines)
```typescript
// src/engine/types.ts — plain data out; Phase 4 renders it, v2 advisor consumes it
export interface TransferPath {
  kind: "direct" | "transfer";
  fromProgramSlug: string;            // the balance used (RANK-03 tag)
  routeKey?: string;                  // "amex-mr→hilton-honors" (RANK-04 display)
  requiredSourcePoints: number;       // increment-aligned, promo-adjusted
  activeBonus: TransferBonusSeed | null; // surfaced per VAL-05
}
export interface RankedResult {
  redemption: RedemptionSeed;         // carries availabilityRating, verifiedAt, bookingHint
  chosenPath: TransferPath;
  alternatePaths: TransferPath[];     // transparency; cheap at ≤46 routes
  pointsNeeded: { min: number; max: number | null };
  cppX100: { atMin: number; atMax: number | null };        // partner-point cpp (VAL-02)
  effectiveCppX100: { atMin: number; atMax: number | null }; // source-point cpp (VAL-05)
  wowDeltaCents: { atMin: number; atMax: number | null };
  coverage: number;                   // balance / conservative requirement (the one float; display-only)
  pointsAway: number | null;          // almost-there only, in the chosen path's source currency
}
export interface EngineOptions { almostThereThreshold?: number } // default 0.75
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat 1¢ cash-out baseline | Per-program baselines in data (`cashOutBaselineCppX100`) | Decided in project research; encoded Phase 2 | Delta is program-honest; engine reads it, never hardcodes |
| Retail-F fare numerators (20+ cpp inflation) | Confirmed fare convention (discounted realistic retail; undiscounted for F only) | Nick ruling 2026-09-01 | Already baked into `cashFareCents`; engine needs no fare judgment |
| Manual grep purity gate | Executable purity test in CI | This phase | Criterion 5 survives future phases |
| Single points price | `pointsMin`/`pointsMax` ranges for dynamic programs | Phase 2 schema | Engine must be range-aware (Pattern 7) |

**Deprecated/outdated:** nothing library-wise — the phase deliberately uses no libraries.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | "Cheapest transfer path" = minimum raw `requiredSourcePoints`, tie-break direct-use then alphabetical | Pattern 4 | If Nick intends opportunity-cost-cheapest, chosen paths (and deltas) change for multi-path awards; contained to one comparator function |
| A2 | Bookability/ranking gate on conservative `pointsMax ?? pointsMin`; valuations returned at both ends | Pattern 7 | If optimistic gating is preferred, more results move into bookable-now; one-line change but affects test fixtures |
| A3 | Overlapping active promos on one route → apply the highest `bonusPercent` | Pattern 2 | Only matters if data ever holds overlapping bonuses; validation could instead forbid overlaps at seed time |
| A4 | `almostThereThreshold` default 0.75 coverage (from SUMMARY.md reconciliation) | Pitfall 8 | Pure tuning; parameterized so no structural risk |
| A5 | Engine (not caller) filters `verifiedAt: null` drafts and `active: false` routes | Pitfall 5 | If callers were meant to filter, engine filtering is still the safer default (fail-closed) |
| A6 | Bilt 0.1¢ baseline stand-in is acceptable for engine deltas pending the Phase 3 methodology sign-off noted in programs.ts | Inherited Contracts | If Nick changes it, it's a one-integer data edit; engine reads the field |
| A7 | Multi-hop transfer chains (Chase→Marriott→Alaska) are out of scope for v1 path resolution | Anti-patterns | Practically never optimal at 1:1→3:1; excluding them documented in code |

## Open Questions

1. **Bilt cash-out baseline sign-off (flagged by Phase 2 as "a Phase 3 gate")**
   - What we know: 0.1¢ stand-in encodes "effectively no cash-out path"; schema requires a positive integer.
   - What's unclear: whether Nick wants 0.1¢, a `null`-like treatment, or a different figure before deltas ship.
   - Recommendation: include a small `checkpoint:human-verify` in the plan (alongside ratifying A1/A2 above); it's a one-integer data change either way.

2. **Should `availabilityRating` influence ranking order (PITFALLS suggests delta × attainability) or only be passed through?**
   - What we know: RANK-01 says "ranked by wow delta" — the requirement is the tiebreaker; PITFALLS wants attainability visible.
   - Recommendation: rank strictly by wow delta (requirement wins), pass `availabilityRating` through on every result, and optionally accept a comparator option later. Don't invent a weighting formula — it would need its own methodology defense.

3. **Marriott hotel awards use per-night points; multi-night totals** — current rows appear to be per-night/representative-stay figures set at verification time. The engine treats `pointsMin/Max` as the bookable quantity as-is; any per-night semantics are a data/display concern, not engine logic. No action needed unless Phase 4 wants night-count math (out of scope).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | toolchain | ✓ | v24.11.0 | — |
| npm | scripts | ✓ | 10.9.8 | — |
| vitest | test suite | ✓ | 4.1.11 (installed) | — |
| TypeScript / tsc | typecheck | ✓ | ^5 (installed) | — |
| Database / network | — | not needed | — | Engine and all its tests are DB-free by design (Phase 2 precedent: CI holds no credentials) |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.11 (node environment) |
| Config file | `vitest.config.ts` (includes `tests/**/*.test.ts`) |
| Quick run command | `npx vitest run tests/<file>.test.ts` |
| Full suite command | `npm test` (currently 28 tests / 3 files, all green) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VAL-02 | cppX100 matches hand-computed TPG examples (ANA 933; taxes subtracted; unit mapping) | unit | `npx vitest run tests/engine-valuation.test.ts` | ❌ Wave 0 |
| VAL-05 | Active bonus lowers requiredSourcePoints and raises effectiveCppX100; bonus surfaced on result; inactive at asOf past endDate | unit | `npx vitest run tests/engine-ranking.test.ts` | ❌ Wave 0 |
| SC-1 | Partition into bookableNow (wow-delta desc) + almostThere (points-away, threshold) | unit | `npx vitest run tests/engine-ranking.test.ts` | ❌ Wave 0 |
| SC-2 | Inverse math: Marriott 150K not 180K; increment-aligned outputs | unit | `npx vitest run tests/engine-paths.test.ts` | ❌ Wave 0 |
| SC-4 | Cheapest path chosen among Bilt/Marriott→Alaska, direct-vs-Amex→Hilton | unit | `npx vitest run tests/engine-paths.test.ts` | ❌ Wave 0 |
| SC-5 | Purity: engine imports nothing from next/react/db/zod-runtime | static test | `npx vitest run tests/engine-purity.test.ts` | ❌ Wave 0 |
| Regression | Phase 2 contracts stay frozen | unit | `npm test` (existing transfers/seed-data suites) | ✅ |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/<touched-area>.test.ts` (< 5s)
- **Per wave merge:** `npm test && npm run typecheck && npm run lint`
- **Phase gate:** `npm test` + `npm run build` green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/engine-paths.test.ts` — SC-2, SC-4 (inverse math, path selection vs real seed rows)
- [ ] `tests/engine-valuation.test.ts` — VAL-02, wow delta, null-baseline handling
- [ ] `tests/engine-ranking.test.ts` — VAL-05, SC-1, edge balances (0, single-program, 5M)
- [ ] `tests/engine-purity.test.ts` — SC-5
- Framework install: none needed. Project precedent is TDD (RED→GREEN per 02-03) — tests are written first within each plan rather than as a separate wave, but the file list above is the coverage contract either way.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth surface in this phase |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes (defensively) | Zod boundary is Phase 4's; engine treats non-finite/non-positive balances as absent so junk can never render as NaN valuations |
| V6 Cryptography | no | — |

### Known Threat Patterns for this phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Wrong-math integrity (silent valuation error = product-destroying) | Tampering/Integrity | Hand-computed frozen tests against real seed rows; integer-only arithmetic (Phase 2's T-02-08 pattern, extended) |
| Purity-boundary erosion (framework/DB creep) | Tampering | Automated purity test (T-02-09 pattern, upgraded from manual grep) |
| NaN/overflow via hostile balances | DoS/Integrity | Defensive input coercion + edge-balance tests (0, negative, 5M, 10^15) |
| Secrets in test output | Information disclosure | N/A here — no env access anywhere in the engine or its tests (keep it that way) |

## Sources

### Primary (HIGH confidence)
- `src/engine/transfers.ts`, `tests/transfers.test.ts` — frozen primitives + A1/A4 semantics [VERIFIED: repo]
- `src/data/types.ts`, `programs.ts`, `transfers.ts`, `redemptions*.ts` — dataset shapes, baselines, live bonus row, verified entries [VERIFIED: repo]
- `.planning/phases/02-redemption-database/02-03-SUMMARY.md`, `02-05-SUMMARY.md` — confirmed rulings A1–A4, cash-fare convention, draft-filtering rule, Phase 3 gates [VERIFIED: repo]
- `.planning/REQUIREMENTS.md` (VAL-02/VAL-05 text), `.planning/ROADMAP.md` (phase success criteria) [VERIFIED: repo]
- `vitest.config.ts`, `package.json` — toolchain state [VERIFIED: repo]

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` — engine module layout, `rankRedemptions` sketch, 0.75 threshold; treated as guidance, superseded where Phase 2 reality differs (e.g., data lives in `src/data`, not `db/seed`)
- `.planning/research/PITFALLS.md` — cpp-methodology attack surface, transfer-math edge cases, almost-there UX caps (researched 2026-08-31 against 2026 sources)

### Tertiary (LOW confidence)
- None — no unverified web claims were used; the TPG cpp convention is stated verbatim in the requirement itself, which is the binding definition.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies; everything verified installed and green in CI
- Architecture: HIGH — extends an existing, tested module along boundaries Phase 2 explicitly designed for this phase
- Pitfalls: HIGH — derived from repo-frozen specs and the project's own domain-expert-reviewed pitfalls research
- Design decisions (cheapest-path rule, conservative range gating): MEDIUM — defensible recommendations tagged [ASSUMED] in the Assumptions Log for confirmation

**Research date:** 2026-09-01
**Valid until:** ~2026-10-01 (stable domain; the one dated element is the live Amex→Hilton bonus row ending 2026-10-14, which is data, not engine logic)
