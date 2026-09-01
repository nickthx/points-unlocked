# Phase 2: Redemption Database - Pattern Map

**Mapped:** 2026-09-01
**Files analyzed:** 13 (10 new, 3 modified)
**Analogs found:** 8 / 13 (5 files have no codebase analog — RESEARCH.md provides their patterns directly)

## File Classification

| New/Modified File | Change | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|--------|------|-----------|----------------|---------------|
| `src/db/schema.ts` | modify | model | CRUD (schema def) | `src/db/schema.ts` (self — healthCheck pattern) | exact |
| `src/data/types.ts` | new | model/validation | transform | — (RESEARCH.md Pattern 2) | none |
| `src/data/programs.ts` | new | config (curated data) | batch | — (RESEARCH.md seed-data shape) | none |
| `src/data/transfers.ts` | new | config (curated data) | batch | — (RESEARCH.md seed-data shape) | none |
| `src/data/redemptions.ts` | new | config (curated data) | batch | — (RESEARCH.md seed-data shape) | none |
| `src/data/index.ts` | new | barrel | — | `src/db/index.ts` (re-export line only) | role-match |
| `src/engine/transfers.ts` | new | utility (pure math) | transform | — (RESEARCH.md Code Examples; no pure-logic modules exist yet beyond shadcn's `src/lib/utils.ts`) | none |
| `scripts/seed.ts` | new | script | batch (DB write) | `scripts/db-check.ts` | exact |
| `tests/transfers.test.ts` | new | test | — | `tests/smoke.test.ts` | exact (structure) |
| `tests/seed-data.test.ts` | new | test | — | `tests/smoke.test.ts` | exact (structure) |
| `src/app/page.tsx` | modify | component (RSC) | request-response | `src/app/page.tsx` (self) | exact |
| `package.json` | modify | config | — | `package.json` (self) | exact |
| `scripts/db-check.ts` | modify/retire | script | batch | itself | exact |

## Pattern Assignments

### `src/db/schema.ts` (model, schema definition) — MODIFY

**Analog:** `src/db/schema.ts` (current file, 11 lines) — the healthCheck table it replaces establishes the conventions.

**Existing conventions to preserve** (lines 1-11):
```typescript
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const healthCheck = pgTable("health_check", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().default("ok"),
  checkedAt: timestamp("checked_at").defaultNow(),
});
```

Conventions: named exports in camelCase (`healthCheck`), table names and column names in snake_case strings (`"health_check"`, `"checked_at"`), camelCase TS property keys, chained `.notNull().default()`. The Phase 1 comment (lines 3-6) explicitly says Phase 2 replaces this table with `programs`, `transfer_routes`, `transfer_bonuses`, `redemptions`.

**New-table shapes:** copy verbatim from RESEARCH.md Pattern 1 (lines 159-218 of `02-RESEARCH.md`) — `pgEnum` for `program_kind`/`availability_rating`/`redemption_category`, composite PK via `(t) => [primaryKey({ columns: [...] })]` on `transfer_routes`, composite `foreignKey()` on `transfer_bonuses`, integers only (cents / x100 / numerator-denominator), text-slug natural keys.

**Coupling warning:** `healthCheck` is imported by `src/app/page.tsx` (line 1) and `scripts/db-check.ts` (line 19), and re-exported by `src/db/index.ts` (line 24 `export * from "./schema"`). Removing the export without updating both consumers breaks `npm run typecheck` and `npm run build` (RESEARCH Pitfall 4).

---

### `scripts/seed.ts` (script, batch DB write) — NEW

**Analog:** `scripts/db-check.ts` — the only existing script; same role, same data flow (tsx script writing to Neon). Copy its structure wholesale.

**Header + guarded env load pattern** (lines 1-10):
```typescript
// Round-trip proof against Neon: insert one health_check row, select rows back.
// Prints ONLY row count + status (T-01-08: connection string is never echoed).
// Run with: npx tsx scripts/db-check.ts

// Guarded local env load (Node 22 built-in) — absent on CI/Vercel where env is set.
try {
  process.loadEnvFile(".env.development.local");
} catch {
  // file absent — env vars come from the environment
}
```

**Env guard + import-after-env-load pattern** (lines 12-19) — critical ordering: `src/db/index.ts` reads `process.env.DATABASE_URL` lazily, but the dynamic import keeps the ordering explicit and is the established convention:
```typescript
async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set (re-run `vercel env pull .env.development.local`)");
    process.exit(1);
  }

  // Import after env load so src/db/index.ts sees DATABASE_URL.
  const { db, healthCheck } = await import("../src/db");
```
For seed.ts: import `../src/data` first (Zod validation throws before any DB import/write), then `../src/db` for `db` + the four tables — see RESEARCH.md Pattern 4 sketch (lines 285-309).

**Output + error-handling pattern** (lines 29-37) — row counts only, never the connection string, `err.message` only:
```typescript
  console.log(`health_check rows: ${rows.length}, latest status: ${rows[rows.length - 1].status}`);
  process.exit(0);
}

main().catch((err: unknown) => {
  // Print only the error class/message — never the connection string.
  console.error("db-check failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
```

**Core write pattern:** no batch-write analog exists (db-check.ts does single insert `db.insert(healthCheck).values({ status: "ok" })`, line 21). Use RESEARCH.md Pattern 4's `db.batch([...deletes children→parents, ...inserts parents→children])`. Do NOT use `db.transaction()` — neon-http throws on interactive transactions.

---

### `tests/transfers.test.ts` and `tests/seed-data.test.ts` (tests) — NEW

**Analog:** `tests/smoke.test.ts` (whole file, 7 lines):
```typescript
import { describe, expect, it } from "vitest";

describe("smoke", () => {
  it("runs the test toolchain end to end", () => {
    expect(true).toBe(true);
  });
});
```

Conventions: explicit named imports from `vitest` (no globals — `vitest.config.ts` does not enable `globals`), `describe`/`it` structure, files live in `tests/` (config `include: ["tests/**/*.test.ts"]`, `environment: "node"`). Tests are DB-free: import seed data and engine directly from `../src/data` / `../src/engine/transfers` (relative or `@/` — the `@/* → ./src/*` alias in `tsconfig.json` lines 21-23 resolves in vitest via its default tsconfig handling; if alias resolution fails under vitest, use relative imports — no `vite-tsconfig-paths` plugin is installed).

**Test bodies:** RESEARCH.md Code Examples — hand-computed edge-case table for `transfers.test.ts` (lines 395-406), coverage assertion for `seed-data.test.ts` (lines 425-438), plus Zod `parse()` of the real seed arrays.

---

### `src/app/page.tsx` (RSC component, request-response) — MODIFY

**Analog:** itself. Only the DB query block changes; layout/JSX stays.

**Current status-line pattern to replace** (lines 1-20):
```typescript
import { db, healthCheck } from "@/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  let dbStatus = "infrastructure: warming up";
  try {
    const rows = await db.select().from(healthCheck).limit(1);
    if (rows.length > 0) {
      dbStatus = "infrastructure: live";
    }
  } catch {
    // T-01-07: never render the caught error — it can embed connection details.
    // Neutral fallback set above.
  }
```

Pattern to keep: `@/db` barrel import (tables come through the same import as `db`), neutral-fallback string initialized before try, empty catch that never renders the error (T-01-07), server component with zero client JS. Swap the query per RESEARCH.md Open Question 1's recommendation, e.g. `db.select({ count: count() }).from(redemptions).where(isNotNull(redemptions.verifiedAt))` (import `count`, `isNotNull` from `drizzle-orm`) → "N verified redemptions live". The status `<p>` at lines 33-35 renders `{dbStatus}` — reuse it. `force-dynamic` (line 5) can stay for Phase 2; caching moves are Phase 3+ per the file's own comment.

---

### `src/data/types.ts`, `programs.ts`, `transfers.ts`, `redemptions.ts` (curated data + validation) — NEW, no analog

`src/data/` exists but is empty. No Zod usage exists anywhere in the codebase (zod is a new install this phase). Use RESEARCH.md Pattern 2 verbatim for `types.ts` (hand-written Zod schemas + `validateDataset()` cross-referential checks) and the seed-data shape example (lines 413-420) for the data files: plain object arrays with `satisfies XSeed[]`.

Conventions to carry over from the codebase anyway:
- camelCase property names matching the Drizzle schema's TS keys (so `db.insert(programs).values(programData)` works without mapping)
- Intent comments in the Phase 1 style (short `// D-xx / T-xx style rationale` headers — see schema.ts lines 3-6, db-check.ts lines 1-3)
- Keep each file under 500 lines (RuFlo CLAUDE.md) — split `redemptions.ts` by category when it grows

---

### `src/data/index.ts` (barrel) — NEW

**Analog:** `src/db/index.ts` line 24 (`export * from "./schema";`). The seed script sketch imports `await import("../src/data")`, so a barrel re-exporting `programs`, `routes`, `bonuses`, `redemptions`, and the validators is needed:
```typescript
export * from "./types";
export * from "./programs";
export * from "./transfers";
export * from "./redemptions";
```
Watch name collisions with `src/db` exports (both define `programs`/`redemptions`) — consumers must import data arrays from `@/data` and Drizzle tables from `@/db`; never `export * from "../data"` inside `src/db`.

---

### `src/engine/transfers.ts` (pure utility, transform) — NEW, no analog

`src/engine/` exists but is empty; the only pure-utility file in the repo is `src/lib/utils.ts` (shadcn `cn()` — not a useful pattern source). Use RESEARCH.md Code Examples verbatim: `computePartnerPoints()` + `applyPromoBonus()` (lines 377-393). Hard constraint from the architecture: this file imports NOTHING from `src/db/` or `src/app/` — it may import types from `src/data/types.ts` (pure types/Zod only). Integer math with `Math.floor` throughout, no floats.

---

### `package.json` (config) — MODIFY

**Analog:** itself. Scripts block (lines 5-13) uses bare short names. Add, matching style:
```json
"db:push": "drizzle-kit push",
"db:seed": "tsx scripts/seed.ts"
```
Plus `npm install zod` (goes to `dependencies`; version ^4.5.4). tsx and drizzle-kit are already in `devDependencies` — no other installs.

---

### `scripts/db-check.ts` (script) — MODIFY or RETIRE

Imports `healthCheck` (line 19) and inserts into it (line 21) — breaks at typecheck when the table is dropped. Per RESEARCH.md Runtime State Inventory: retire (delete) or repoint to a curated-table read (e.g., select count from `programs`). If repointed, keep every pattern in the file as-is (env guard, DATABASE_URL check, counts-only output, message-only errors) — it is the canonical script template.

## Shared Patterns

### Guarded env loading (scripts + CLI configs)
**Source:** `scripts/db-check.ts` lines 5-10 (identical block in `drizzle.config.ts` lines 3-9)
**Apply to:** `scripts/seed.ts`, any repointed `scripts/db-check.ts`
```typescript
// Guarded local env load (Node 22 built-in) — absent on CI/Vercel where env is set.
try {
  process.loadEnvFile(".env.development.local");
} catch {
  // file absent — env vars come from the environment
}
```
Never install dotenv. Never log `process.env.DATABASE_URL`.

### Secrets-safe error handling (T-01-07 / T-01-08)
**Source:** `scripts/db-check.ts` lines 33-37 (scripts) and `src/app/page.tsx` lines 17-20 (RSC)
**Apply to:** `scripts/seed.ts`, modified `src/app/page.tsx`
Scripts: `catch` prints `err instanceof Error ? err.message : String(err)` only, then `process.exit(1)`. RSC: empty catch, neutral fallback string set before try, never render the caught error. Success output is row counts only.

### Lazy DB client + barrel import
**Source:** `src/db/index.ts` (whole file, 25 lines)
**Apply to:** everything that touches the DB (`scripts/seed.ts`, `src/app/page.tsx`)
The `db` export is a lazy Proxy — importing `@/db` never throws at build time. All Drizzle tables are consumed via the same barrel (`import { db, redemptions } from "@/db"`), never via deep imports of `schema.ts`. `src/db/index.ts` itself needs NO changes this phase (line 24 `export * from "./schema"` auto-picks-up the new tables).

### Naming conventions (DB layer)
**Source:** `src/db/schema.ts`
**Apply to:** all four new tables, seed types, seed data
snake_case in Postgres strings (`"transfer_routes"`, `"verified_at"`), camelCase TS identifiers (`transferRoutes`, `verifiedAt`), kebab-case slugs (`"chase-ur"`). Integer-only quantities with unit suffixes in the name (`taxesFeesCents`, `cashOutBaselineCppX100`).

### Test conventions
**Source:** `tests/smoke.test.ts` + `vitest.config.ts`
**Apply to:** both new test files
Named vitest imports (no globals), files in `tests/` only (never `src/**/*.test.ts`), node environment, no DB connection in tests — parse real seed data in-memory.

## No Analog Found

Files with no close codebase match (planner uses RESEARCH.md patterns directly):

| File | Role | Data Flow | Reason | RESEARCH.md source |
|------|------|-----------|--------|--------------------|
| `src/data/types.ts` | validation/model | transform | No Zod usage exists yet (new install) | Pattern 2 (lines 232-270) |
| `src/data/programs.ts` | curated data | batch | `src/data/` is empty | Seed-data shape (lines 413-420) |
| `src/data/transfers.ts` | curated data | batch | `src/data/` is empty | Pattern 1 columns + Pattern 3 workflow |
| `src/data/redemptions.ts` | curated data | batch | `src/data/` is empty | Pattern 1 `redemptions` columns; drafts `verifiedAt: null` |
| `src/engine/transfers.ts` | pure math | transform | `src/engine/` is empty; no domain logic exists yet | Code Examples (lines 377-393) |

## Metadata

**Analog search scope:** `src/` (app, components, data, db, engine, lib), `scripts/`, `tests/`, root configs (`package.json`, `vitest.config.ts`, `drizzle.config.ts`, `tsconfig.json`)
**Files scanned:** 8 read in full (schema.ts, db/index.ts, db-check.ts, page.tsx, smoke.test.ts, vitest.config.ts, package.json, drizzle.config.ts) + tsconfig paths block
**Pattern extraction date:** 2026-09-01
