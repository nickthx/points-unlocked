import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// D-16 placeholder: proves the full schema.ts → drizzle-kit push → Neon path.
// Phase 2 replaces this with the real schema (programs, transfer_routes,
// transfer_bonuses, redemptions per ARCHITECTURE.md) — per D-16 we do NOT
// stub real table names now.
export const healthCheck = pgTable("health_check", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().default("ok"),
  checkedAt: timestamp("checked_at").defaultNow(),
});
