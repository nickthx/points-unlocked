import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Neon HTTP driver — works over fetch, no TCP pooling needed in serverless.
// Lazily initialized so importing this module never throws at build time
// (next build evaluates page modules without .env.development.local; on
// Vercel DATABASE_URL is present at runtime, which is when this runs).
function makeDb() {
  return drizzle(neon(process.env.DATABASE_URL!));
}

type Db = ReturnType<typeof makeDb>;

let cached: Db | undefined;

export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    cached ??= makeDb();
    const value = Reflect.get(cached, prop, cached);
    return typeof value === "function" ? value.bind(cached) : value;
  },
});

export * from "./schema";
