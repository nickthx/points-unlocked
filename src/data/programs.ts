import type { ProgramSeed } from "./types";

// Curated program seed data (DATA-01). The 8 enterable programs are the fixed
// contract for all later phases (canonical slugs — do not rename). Partner
// programs exist only as transfer targets / direct redemption currencies.
// Every drafted number here is provisional until Nick's DATA-04 verification
// pass (plan 02-05); [ASSUMED] markers name what must be checked.

export const programs = [
  // ── The 8 user-enterable programs (canonical slugs, fixed contract) ──────
  {
    slug: "chase-ur",
    name: "Chase Ultimate Rewards",
    kind: "bank",
    isUserEnterable: true,
    // [ASSUMED] baseline — Nick methodology sign-off (A3): 1.0¢/pt cash-out.
    cashOutBaselineCppX100: 100,
  },
  {
    slug: "amex-mr",
    name: "Amex Membership Rewards",
    kind: "bank",
    isUserEnterable: true,
    // [ASSUMED] baseline — Nick methodology sign-off (A3): 0.6¢/pt statement credit.
    cashOutBaselineCppX100: 60,
  },
  {
    slug: "capital-one",
    name: "Capital One Miles",
    kind: "bank",
    isUserEnterable: true,
    // [ASSUMED] baseline — Nick methodology sign-off (A3): 0.5¢/pt cash-out.
    cashOutBaselineCppX100: 50,
  },
  {
    slug: "citi-ty",
    name: "Citi ThankYou Points",
    kind: "bank",
    isUserEnterable: true,
    // [ASSUMED] baseline — Nick methodology sign-off (A3): 1.0¢/pt cash-out.
    cashOutBaselineCppX100: 100,
  },
  {
    slug: "bilt",
    name: "Bilt Rewards",
    kind: "bank",
    isUserEnterable: true,
    // [ASSUMED] baseline — Nick methodology sign-off (A3): Bilt has effectively
    // no cash-out path; schema requires a positive integer, so 10 (= 0.1¢/pt)
    // stands in for "near zero" until Nick picks the convention.
    cashOutBaselineCppX100: 10,
  },
  {
    slug: "world-of-hyatt",
    name: "World of Hyatt",
    kind: "hotel",
    isUserEnterable: true,
    cashOutBaselineCppX100: null,
  },
  {
    slug: "hilton-honors",
    name: "Hilton Honors",
    kind: "hotel",
    isUserEnterable: true,
    cashOutBaselineCppX100: null,
  },
  {
    slug: "marriott-bonvoy",
    name: "Marriott Bonvoy",
    kind: "hotel",
    isUserEnterable: true,
    cashOutBaselineCppX100: null,
  },

  // ── Partner programs (transfer targets only; never user-enterable) ───────
  // Partner list per program is Assumption A5 — wrong routes are caught by the
  // DATA-04 verification gate; drafts never ship.
  {
    slug: "ana-mileage-club",
    name: "ANA Mileage Club",
    kind: "airline",
    isUserEnterable: false,
    cashOutBaselineCppX100: null,
  },
  {
    slug: "virgin-atlantic",
    name: "Virgin Atlantic Flying Club",
    kind: "airline",
    isUserEnterable: false,
    cashOutBaselineCppX100: null,
  },
  {
    slug: "air-france-flying-blue",
    name: "Air France-KLM Flying Blue",
    kind: "airline",
    isUserEnterable: false,
    cashOutBaselineCppX100: null,
  },
  {
    slug: "british-airways-avios",
    name: "British Airways Executive Club (Avios)",
    kind: "airline",
    isUserEnterable: false,
    cashOutBaselineCppX100: null,
  },
  {
    slug: "singapore-krisflyer",
    name: "Singapore Airlines KrisFlyer",
    kind: "airline",
    isUserEnterable: false,
    cashOutBaselineCppX100: null,
  },
  {
    slug: "cathay-asia-miles",
    name: "Cathay Pacific Asia Miles",
    kind: "airline",
    isUserEnterable: false,
    cashOutBaselineCppX100: null,
  },
  {
    slug: "emirates-skywards",
    name: "Emirates Skywards",
    kind: "airline",
    isUserEnterable: false,
    cashOutBaselineCppX100: null,
  },
  {
    slug: "turkish-miles-smiles",
    name: "Turkish Airlines Miles&Smiles",
    kind: "airline",
    isUserEnterable: false,
    cashOutBaselineCppX100: null,
  },
  {
    slug: "avianca-lifemiles",
    name: "Avianca LifeMiles",
    kind: "airline",
    isUserEnterable: false,
    cashOutBaselineCppX100: null,
  },
  {
    slug: "air-canada-aeroplan",
    name: "Air Canada Aeroplan",
    kind: "airline",
    isUserEnterable: false,
    cashOutBaselineCppX100: null,
  },
  {
    slug: "united-mileageplus",
    name: "United MileagePlus",
    kind: "airline",
    isUserEnterable: false,
    cashOutBaselineCppX100: null,
  },
  {
    slug: "delta-skymiles",
    name: "Delta SkyMiles",
    kind: "airline",
    isUserEnterable: false,
    cashOutBaselineCppX100: null,
  },
  {
    slug: "alaska-mileage-plan",
    name: "Alaska Airlines Mileage Plan",
    kind: "airline",
    isUserEnterable: false,
    cashOutBaselineCppX100: null,
  },
] satisfies ProgramSeed[];
