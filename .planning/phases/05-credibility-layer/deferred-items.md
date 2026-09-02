# Phase 05 Deferred Items

Out-of-scope discoveries logged during execution. Not fixed here (scope boundary).

## drizzle-kit push churns pre-existing transfer_routes / transfer_bonuses constraints (found in 05-04 Task 1)

**Symptom:** Every `npx drizzle-kit push` (0.31.x) diffs the live Neon schema against `src/db/schema.ts` and emits four ALTERs that have nothing to do with the change being pushed:

```
ALTER TABLE "transfer_bonuses" DROP CONSTRAINT "transfer_bonuses_from_program_slug_to_program_slug_transfer_rou";
ALTER TABLE "transfer_bonuses" ADD CONSTRAINT "transfer_bonuses_from_program_slug_to_program_slug_transfer_routes_from_program_slug_to_program_slug_fk" FOREIGN KEY (...) REFERENCES "public"."transfer_routes"(...);
ALTER TABLE "transfer_routes" DROP CONSTRAINT "transfer_routes_from_program_slug_to_program_slug_pk";
ALTER TABLE "transfer_routes" ADD CONSTRAINT "transfer_routes_from_program_slug_to_program_slug_pk" PRIMARY KEY("from_program_slug","to_program_slug");
```

The third statement fails with Postgres `2BP01` (`cannot drop constraint ... because other objects depend on it` — the freshly re-added FK depends on the PK index), so the push exits 1 after any preceding CREATE statements have already applied.

**Root cause:** drizzle-kit's auto-generated FK name for the composite `transfer_bonuses → transfer_routes` foreign key is 100 characters; Postgres truncates identifiers to 63, so the stored name (`..._transfer_rou`) never equals the generated name and drizzle-kit treats it as a rename on every run. The composite-PK drop/re-add is a companion drizzle-kit quirk. The live constraints are correct and unchanged (verified via `pg_constraint` after the failed push in 05-04: FK and PK both present, same definitions, seed rows intact).

**Impact:** `npx drizzle-kit push` cannot exit 0 non-interactively until this is resolved; new tables still get created (05-04's `interest_signups` did), but the exit code is misleading.

**Suggested fix (Phase 6, when `users`/`bookmarks` are added and push runs again):** give the FK an explicit short name in `src/db/schema.ts` — `foreignKey({ name: "transfer_bonuses_route_fk", columns: [...], foreignColumns: [...] })` — then run push once with a TTY to let it rename the constraint. That removes the >63-char name from the diff; if the composite-PK churn persists, it is a drizzle-kit bug (check the 0.31.x changelog / issues before upgrading).
