// Read-only connectivity proof against Neon: count rows in the curated
// programs table. Prints ONLY the row count (T-01-08: connection string is
// never echoed). Curated tables have no writer besides the seed script.
// Run with: npx tsx scripts/db-check.ts

// Guarded local env load (Node 22 built-in) — absent on CI/Vercel where env is set.
try {
  process.loadEnvFile(".env.development.local");
} catch {
  // file absent — env vars come from the environment
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set (re-run `vercel env pull .env.development.local`)");
    process.exit(1);
  }

  // Import after env load so src/db/index.ts sees DATABASE_URL.
  const [{ db, programs }, { count }] = await Promise.all([
    import("../src/db"),
    import("drizzle-orm"),
  ]);

  const [row] = await db.select({ n: count() }).from(programs);

  console.log(`programs rows: ${row.n}`);
  process.exit(0);
}

main().catch((err: unknown) => {
  // Print only the error class/message — never the connection string.
  console.error("db-check failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
