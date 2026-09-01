// Barrel for the curated seed dataset — consumed by scripts/seed.ts (02-04)
// and the seed-data tests. redemptions.ts already flattens the category/region
// split files, so this barrel must NOT also re-export redemptions-flights* /
// redemptions-hotels (duplicate symbol exports).
//
// Name-collision hazard: src/data exports `programs`/`redemptions` ARRAYS
// while src/db exports Drizzle TABLES of the same names. Consumers importing
// both must alias (the seed script destructures with renames). Never
// re-export data from src/db or vice versa.
export * from "./types";
export * from "./programs";
export * from "./transfers";
export * from "./redemptions";
