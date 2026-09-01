import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Neon HTTP driver — works over fetch, no TCP pooling needed in serverless.
export const db = drizzle(neon(process.env.DATABASE_URL!));

export * from "./schema";
