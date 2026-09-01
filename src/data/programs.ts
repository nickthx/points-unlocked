import type { ProgramSeed } from "./types";

// Curated program seed data (DATA-01). The 8 enterable programs are the fixed
// contract for all later phases (canonical slugs — do not rename). Partner
// programs exist only as transfer targets / direct redemption currencies.
// Cash-out baselines (A3) passed Nick's DATA-04 no-veto review 2026-09-01;
// the Phase 3 methodology sign-off (A1/A2/Bilt) was ratified by Nick
// 2026-09-01 — see src/engine/types.ts for the rulings as encoded.

export const programs = [
  // ── The 8 user-enterable programs (canonical slugs, fixed contract) ──────
  {
    slug: "chase-ur",
    name: "Chase Ultimate Rewards",
    kind: "bank",
    isUserEnterable: true,
    // A3 confirmed 2026-09-01 (explicitly): 1.0¢/pt cash-out.
    cashOutBaselineCppX100: 100,
  },
  {
    slug: "amex-mr",
    name: "Amex Membership Rewards",
    kind: "bank",
    isUserEnterable: true,
    // A3 confirmed 2026-09-01 (explicitly): 0.6¢/pt statement credit.
    cashOutBaselineCppX100: 60,
  },
  {
    slug: "capital-one",
    name: "Capital One Miles",
    kind: "bank",
    isUserEnterable: true,
    // A3 no-veto 2026-09-01: 0.5¢/pt cash-out matches published values.
    cashOutBaselineCppX100: 50,
  },
  {
    slug: "citi-ty",
    name: "Citi ThankYou Points",
    kind: "bank",
    isUserEnterable: true,
    // A3 no-veto 2026-09-01: 1.0¢/pt cash-out matches published values.
    cashOutBaselineCppX100: 100,
  },
  {
    slug: "bilt",
    name: "Bilt Rewards",
    kind: "bank",
    isUserEnterable: true,
    // CONFIRMED by Nick 2026-09-01 (Phase 3 methodology sign-off): Bilt has
    // effectively no cash-out path; schema requires a positive integer, so
    // 10 (= 0.1¢/pt) is the ratified stand-in for "near zero". This value
    // feeds every Bilt wow delta.
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
  // Partner lists (A5) confirmed in Nick's DATA-04 verification pass
  // (2026-09-01) — all 46 routes structurally verified.
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
    // Slug stays stable through the Aug 2025 rebrand (Mileage Plan → Atmos
    // Rewards); only the display name changed.
    slug: "alaska-mileage-plan",
    name: "Alaska Atmos Rewards",
    kind: "airline",
    isUserEnterable: false,
    cashOutBaselineCppX100: null,
  },
] satisfies ProgramSeed[];
