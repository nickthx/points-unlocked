// Round-trip proof against Neon: insert one health_check row, select rows back.
// Prints ONLY row count + status (T-01-08: connection string is never echoed).
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
  const { db, healthCheck } = await import("../src/db");

  await db.insert(healthCheck).values({ status: "ok" });
  const rows = await db.select().from(healthCheck);

  if (rows.length < 1) {
    console.error("health_check round trip failed: no rows returned");
    process.exit(1);
  }

  console.log(`health_check rows: ${rows.length}, latest status: ${rows[rows.length - 1].status}`);
  process.exit(0);
}

main().catch((err: unknown) => {
  // Print only the error class/message — never the connection string.
  console.error("db-check failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
