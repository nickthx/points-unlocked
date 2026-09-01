import type { RedemptionSeed } from "./types";

// Flight redemption drafts — Asia-Pacific & Hawaii (DATA-01). Every entry is
// a Claude draft: verifiedAt is null without exception, and sourceNote names
// concretely what Nick must check against live 2026 sources (Pitfall 1:
// training-lag makes drafted award prices stale by construction). Dynamic or
// uncertain pricing uses pointsMin/pointsMax ranges; pointsMax: null is
// reserved for genuinely fixed charts. Money is integer cents. Fare-benchmark
// convention (methodologyNote) is provisional until Nick's sign-off (Pitfall 5).
// Europe & Middle East flights live in redemptions-flights-europe.ts
// (500-line rule); redemptions.ts concatenates both.

export const flightRedemptions = [
  {
    slug: "ana-business-tokyo-roundtrip",
    partnerProgramSlug: "ana-mileage-club",
    title: "ANA business class to Tokyo — round trip",
    category: "flight",
    origin: "New York (JFK)",
    destination: "Tokyo (HND)",
    cabin: "business",
    pointsMin: 75000,
    pointsMax: 100000,
    taxesFeesCents: 60000,
    cashFareCents: 900000,
    availabilityRating: "hard_to_find",
    bookingHint:
      "Transfer Amex MR 1:1 to ANA Mileage Club (allow ~48h; irreversible).\nSearch award space on ANA's own site; ANA's chart requires round-trip bookings.\nBest space opens ~355 days out and again close-in.",
    methodologyNote:
      "Cash fare benchmarked as a discounted retail round-trip business fare, not full-flex.",
    sourceNote:
      "CLAUDE DRAFT — verify ANA's current round-trip business pricing NA↔Japan (chart changed in recent years) and fuel surcharge level; fare benchmark needs a Google Flights check.",
    verifiedAt: null,
    imageSlug: "tokyo",
    featured: true,
    notes: "The flagship pitch redemption: ~90K Amex MR → Tokyo in business.",
  },
  {
    slug: "ana-first-tokyo-via-virgin",
    partnerProgramSlug: "virgin-atlantic",
    title: "ANA First Class to Tokyo via Virgin Atlantic",
    category: "flight",
    origin: "Los Angeles (LAX)",
    destination: "Tokyo (HND)",
    cabin: "first",
    pointsMin: 85000,
    pointsMax: null,
    taxesFeesCents: 40000,
    cashFareCents: 1400000,
    availabilityRating: "hard_to_find",
    bookingHint:
      "Find ANA F space first (2 seats max, opens sporadically), then call Virgin Atlantic to book.\nTransfer from Amex/Chase/Citi 1:1 only once space is confirmed.\nThis is a unicorn — expect to hunt for weeks.",
    methodologyNote:
      "Cash fare benchmarked as a one-way retail first fare; F is rarely sold discounted.",
    sourceNote:
      "CLAUDE DRAFT — verify Virgin's current ANA first-class award chart (rates increased post-2023; treat 85K one-way as unconfirmed) and whether one-ways are still bookable.",
    verifiedAt: null,
    imageSlug: "tokyo",
    featured: true,
    notes: null,
  },
  {
    slug: "ana-business-tokyo-via-virgin",
    partnerProgramSlug: "virgin-atlantic",
    title: "ANA business class to Tokyo via Virgin Atlantic",
    category: "flight",
    origin: "San Francisco (SFO)",
    destination: "Tokyo (NRT)",
    cabin: "business",
    pointsMin: 47500,
    pointsMax: null,
    taxesFeesCents: 35000,
    cashFareCents: 450000,
    availabilityRating: "hard_to_find",
    bookingHint:
      "Same ANA metal as booking direct, but one-ways allowed and no ANA account needed.\nConfirm space via ANA/United search tools, then book with Virgin online or by phone.\nTransfer 1:1 from Chase, Amex, Citi, or Bilt.",
    methodologyNote:
      "Cash fare benchmarked as a discounted one-way retail business fare.",
    sourceNote:
      "CLAUDE DRAFT — verify Virgin's current ANA business one-way rate (was 45–47.5K West Coast pre-2023 changes) and surcharge amount.",
    verifiedAt: null,
    imageSlug: "tokyo",
    featured: false,
    notes: null,
  },
  {
    slug: "aeroplan-business-tokyo",
    partnerProgramSlug: "air-canada-aeroplan",
    title: "Star Alliance business to Tokyo via Aeroplan",
    category: "flight",
    origin: "Vancouver (YVR)",
    destination: "Tokyo (HND)",
    cabin: "business",
    pointsMin: 75000,
    pointsMax: 115000,
    taxesFeesCents: 10000,
    cashFareCents: 550000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "Aeroplan's zone chart covers ANA, Air Canada, and United to Japan in one search.\nStopovers on one-ways cost just 5K extra — build Tokyo + a second city.\nTransfer 1:1 from Amex, Chase, Capital One, or Bilt.",
    methodologyNote:
      "Cash fare benchmarked as a discounted one-way retail business fare.",
    sourceNote:
      "CLAUDE DRAFT — verify Aeroplan's post-June-2026 Pacific zone pricing (devaluation +20–67% on partners) and the partner booking fee.",
    verifiedAt: null,
    imageSlug: "tokyo",
    featured: false,
    notes: null,
  },
  {
    slug: "singapore-business-sfo-singapore",
    partnerProgramSlug: "singapore-krisflyer",
    title: "Singapore Airlines business, SFO to Singapore nonstop",
    category: "flight",
    origin: "San Francisco (SFO)",
    destination: "Singapore (SIN)",
    cabin: "business",
    pointsMin: 95000,
    pointsMax: 115000,
    taxesFeesCents: 20000,
    cashFareCents: 650000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "One of the world's longest flights, ~17h in Singapore's business product.\nSaver space is decent outside holiday peaks; book on singaporeair.com.\nTransfer 1:1 from any of the five bank programs.",
    methodologyNote:
      "Cash fare benchmarked as a discounted one-way retail business fare.",
    sourceNote:
      "CLAUDE DRAFT — verify current KrisFlyer saver business pricing US West Coast–SIN against the live award chart.",
    verifiedAt: null,
    imageSlug: "singapore",
    featured: false,
    notes: null,
  },
  {
    slug: "cathay-business-hong-kong",
    partnerProgramSlug: "cathay-asia-miles",
    title: "Cathay Pacific business to Hong Kong",
    category: "flight",
    origin: "Los Angeles (LAX)",
    destination: "Hong Kong (HKG)",
    cabin: "business",
    pointsMin: 70000,
    pointsMax: 85000,
    taxesFeesCents: 20000,
    cashFareCents: 500000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "Asia Miles' distance chart keeps trans-Pacific business reasonable.\nBook on cathaypacific.com; space opens in waves ~360 days out and close-in.\nTransfer 1:1 from Amex, Citi, or Capital One.",
    methodologyNote:
      "Cash fare benchmarked as a discounted one-way retail business fare.",
    sourceNote:
      "CLAUDE DRAFT — verify current Asia Miles distance-band pricing LAX–HKG business and fee levels.",
    verifiedAt: null,
    imageSlug: "hong-kong",
    featured: false,
    notes: null,
  },
  {
    slug: "cathay-first-hong-kong",
    partnerProgramSlug: "cathay-asia-miles",
    title: "Cathay Pacific First Class to Hong Kong",
    category: "flight",
    origin: "New York (JFK)",
    destination: "Hong Kong (HKG)",
    cabin: "first",
    pointsMin: 110000,
    pointsMax: 125000,
    taxesFeesCents: 25000,
    cashFareCents: 1600000,
    availabilityRating: "hard_to_find",
    bookingHint:
      "Caviar and a lie-flat suite on one of aviation's classic F products.\nUsually 1–2 seats, released close to departure — flexibility required.\nTransfer 1:1 from Amex, Citi, or Capital One once space is found.",
    methodologyNote:
      "Cash fare benchmarked as a one-way retail first fare.",
    sourceNote:
      "CLAUDE DRAFT — verify current Asia Miles first pricing JFK–HKG and whether CX still flies F on the route.",
    verifiedAt: null,
    imageSlug: "hong-kong",
    featured: false,
    notes: null,
  },
  {
    slug: "turkish-hawaii-on-united",
    partnerProgramSlug: "turkish-miles-smiles",
    title: "Hawaii on United via Turkish Miles&Smiles",
    category: "flight",
    origin: "US mainland (any United gateway)",
    destination: "Honolulu (HNL)",
    cabin: "economy",
    pointsMin: 15000,
    pointsMax: 25000,
    taxesFeesCents: 1200,
    cashFareCents: 45000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "The classic small-balance sweet spot: United-operated Hawaii flights priced off Turkish's partner chart.\nFind United saver space first, then book through Miles&Smiles (online or by email/phone).\nTransfer 1:1 from Capital One or Citi.",
    methodologyNote:
      "Cash fare benchmarked as a round-trip main-cabin economy fare.",
    sourceNote:
      "CLAUDE DRAFT — verify Turkish's current domestic-US/Hawaii partner pricing (post-2025 changes; the old 7.5K one-way is gone) and the booking process.",
    verifiedAt: null,
    imageSlug: "hawaii",
    featured: false,
    notes: null,
  },
  {
    slug: "avios-alaska-hawaii",
    partnerProgramSlug: "british-airways-avios",
    title: "West Coast to Hawaii on Alaska with Avios",
    category: "flight",
    origin: "Seattle (SEA)",
    destination: "Honolulu (HNL)",
    cabin: "economy",
    pointsMin: 13000,
    pointsMax: 16000,
    taxesFeesCents: 600,
    cashFareCents: 40000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "BA's distance-based chart makes West Coast–Hawaii on Alaska a cheap Avios play.\nBook on ba.com; taxes on domestic partners are trivial.\nTransfer 1:1 from Chase, Amex, Capital One, or Bilt.",
    methodologyNote:
      "Cash fare benchmarked as a one-way main-cabin economy fare.",
    sourceNote:
      "CLAUDE DRAFT — verify current Avios partner pricing for the SEA–HNL distance band and Alaska award availability via BA.",
    verifiedAt: null,
    imageSlug: "hawaii",
    featured: false,
    notes: null,
  },
  {
    slug: "jal-first-tokyo-via-alaska",
    partnerProgramSlug: "alaska-mileage-plan",
    title: "Japan Airlines First Class to Tokyo via Alaska",
    category: "flight",
    origin: "Los Angeles (LAX)",
    destination: "Tokyo (HND)",
    cabin: "first",
    pointsMin: 80000,
    pointsMax: 140000,
    taxesFeesCents: 5000,
    cashFareCents: 1500000,
    availabilityRating: "hard_to_find",
    bookingHint:
      "JAL F with Alaska miles is a legendary sweet spot when space appears.\nSearch on alaskaair.com; JAL releases F sparingly and close-in.\nTransfer 1:1 from Bilt (the only bank path to Alaska), or 3:1 from Marriott.",
    methodologyNote:
      "Cash fare benchmarked as a one-way retail first fare.",
    sourceNote:
      "CLAUDE DRAFT — verify Alaska's current JAL first pricing (award chart changes post-2024) and that JAL F remains bookable via Alaska in 2026.",
    verifiedAt: null,
    imageSlug: "tokyo",
    featured: true,
    notes: null,
  },
] satisfies RedemptionSeed[];
