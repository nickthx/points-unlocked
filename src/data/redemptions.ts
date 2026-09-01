import type { RedemptionSeed } from "./types";
import { flightRedemptions } from "./redemptions-flights";
import { flightRedemptionsEurope } from "./redemptions-flights-europe";
import { hotelRedemptions } from "./redemptions-hotels";

// Concatenation barrel: the `redemptions` export name and array shape are the
// contract consumed by scripts/seed.ts (02-04) and the seed-data tests
// (02-03/02-05). Category/region-split files keep each source file under the
// 500-line rule and establish the growth path to the 80–120-entry corpus.
export const redemptions = [
  ...flightRedemptions,
  ...flightRedemptionsEurope,
  ...hotelRedemptions,
] satisfies RedemptionSeed[];
