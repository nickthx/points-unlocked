import { defineConfig } from "drizzle-kit";

// Load local env for CLI runs (Node 22 built-in — no dotenv dependency).
// Guarded: CI/Vercel have no .env.development.local; env vars are already set there.
try {
  process.loadEnvFile(".env.development.local");
} catch {
  // file absent — env vars come from the environment
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
