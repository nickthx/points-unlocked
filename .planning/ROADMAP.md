# Roadmap: Points Unlocked

## Overview

Build bottom-up in horizontal layers: stand up the production skeleton on Vercel first, then the curated data layer (the product's substance), then the pure valuation/ranking engine on top of it, then the user-facing core experience that makes the wow moment land, then the credibility and account layers, and finish with an editorial design pass and a launch-hardening gate for the LinkedIn debut.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Foundation** - Next.js 16 + Neon + CI skeleton deployed to production Vercel
- [ ] **Phase 2: Redemption Database** - Schema, typed seed files, and the verified curated dataset
- [ ] **Phase 3: Valuation & Ranking Engine** - Pure TypeScript engine: transfer paths, cpp math, wow delta, hybrid ranking
- [ ] **Phase 4: Core Experience** - Balance entry → ranked results flow, shareable URLs, guest-first
- [ ] **Phase 5: Credibility Layer** - Methodology page, OG cards, v2 advisor tease
- [ ] **Phase 6: Accounts & Legal** - Optional Clerk save, bookmarks, goals, privacy/deletion
- [ ] **Phase 7: Editorial Polish & Launch** - Design system pass, mobile/WebView hardening, launch gate

## Phase Details

### Phase 1: Foundation
**Goal**: A deployed, production-grade skeleton — every later phase ships onto live infrastructure from day one
**Depends on**: Nothing (first phase)
**Requirements**: PLAT-01
**Success Criteria** (what must be TRUE):
  1. A Next.js 16 (App Router) app with Tailwind v4 + shadcn/ui builds clean and deploys to a public Vercel URL
  2. Neon Postgres (via Vercel Marketplace) is connected through Drizzle with env vars flowing locally and in production
  3. Pushing to main auto-deploys; lint, typecheck, and test commands run green
**Plans**: TBD

Plans:
- [ ] 01-01: TBD

### Phase 2: Redemption Database
**Goal**: The curated dataset exists as structured, verified data — the substance every other layer reads
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. Schema models programs, transfer routes (ratio + bonus rule + increment), transfer bonuses (dated manual overrides), and redemptions (points, cash fare, taxes/fees, verified date, booking notes)
  2. Transfer-route edge cases compute correctly in seed validation: Marriott 3:1 with 5K-per-60K bonus, Amex→Hilton 1:2, Bilt 1:1
  3. At least 30 Nick-verified entries covering all 8 programs load from typed seed files (path to 80–120 established, no unverified entry marked shippable)
  4. Seed files rebuild the database idempotently with one command
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

### Phase 3: Valuation & Ranking Engine
**Goal**: A sealed, pure TypeScript engine that turns balances + dataset into ranked, valued redemptions — framework-free so it later becomes the v2 advisor's tool
**Depends on**: Phase 2
**Requirements**: VAL-02, VAL-05
**Success Criteria** (what must be TRUE):
  1. Given balances, the engine returns bookable-now redemptions ranked by wow delta plus an "almost there" set with points-away amounts
  2. Cpp follows TPG convention — (cash fare − taxes/fees) ÷ points × 100 — verified by unit tests against hand-computed examples
  3. Active transfer bonuses auto-adjust effective points cost and cpp
  4. The engine resolves the cheapest transfer path when multiple held programs reach the same partner
  5. The engine module imports nothing from Next.js, React, or the database layer
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: Core Experience
**Goal**: The end-to-end guest flow — enter balances, see the wow, share the link
**Depends on**: Phase 3
**Requirements**: INPUT-01, INPUT-02, INPUT-03, RANK-01, RANK-02, RANK-03, RANK-04, RANK-05, VAL-01, VAL-04
**Success Criteria** (what must be TRUE):
  1. User enters balances for the 8 programs with formatted inputs and sees ranked results without logging in
  2. Each result leads with the dollar delta and shows cash fare + cpp side by side, its transfer path, which balance it uses, booking guidance, and a "Verified [date]" stamp
  3. The "Almost there" section shows near-miss redemptions with "you're X points away" callouts
  4. Balances survive a page reload (localStorage) and a shared URL reproduces the same results in a fresh browser
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: Credibility Layer
**Goal**: The numbers are defensible and the product markets itself when shared
**Depends on**: Phase 4
**Requirements**: VAL-03, PLAT-03, PLAT-04
**Success Criteria** (what must be TRUE):
  1. A methodology page explains fare sourcing, taxes/fees treatment, and the dynamic-award-pricing disclaimer, linked from results
  2. Shared links unfurl with proper OG tags and a branded OG image (verified in a link-preview inspector)
  3. A "coming soon" tease for the v2 AI card-roadmap advisor is present with an interest hook
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Accounts & Legal
**Goal**: Optional persistence bolts on without touching the guest flow
**Depends on**: Phase 4
**Requirements**: ACCT-01, ACCT-02, ACCT-03, ACCT-04
**Success Criteria** (what must be TRUE):
  1. User can sign up via Clerk and their balances save to their profile; the core flow still works fully logged out
  2. Signed-in user can bookmark redemptions and record travel goals, and both persist across sessions
  3. Privacy policy and consent are in place; a user can delete their account and data
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

### Phase 7: Editorial Polish & Launch
**Goal**: The app earns the "production quality" bar on the device that matters — a recruiter's phone inside LinkedIn's browser
**Depends on**: Phase 5, Phase 6
**Requirements**: PLAT-02, PLAT-05
**Success Criteria** (what must be TRUE):
  1. Editorial travel design system (light, magazine-like, destination imagery, big numbers) is applied consistently across all pages
  2. The full flow works in LinkedIn's in-app browser and on small screens, verified by a real-device pass
  3. Lighthouse mobile scores are launch-worthy and the dataset has reached its launch size with all entries Nick-verified
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 (5 and 6 both depend only on Phase 4 and may interleave)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/TBD | Not started | - |
| 2. Redemption Database | 0/TBD | Not started | - |
| 3. Valuation & Ranking Engine | 0/TBD | Not started | - |
| 4. Core Experience | 0/TBD | Not started | - |
| 5. Credibility Layer | 0/TBD | Not started | - |
| 6. Accounts & Legal | 0/TBD | Not started | - |
| 7. Editorial Polish & Launch | 0/TBD | Not started | - |
