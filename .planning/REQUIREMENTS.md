# Requirements — Points Unlocked v1

## v1 Requirements

### Balance Input

- [ ] **INPUT-01**: User can enter points balances for 8 programs (Chase UR, Amex MR, Capital One, Citi TY, Bilt, World of Hyatt, Hilton Honors, Marriott Bonvoy) with formatted number inputs, no login required
- [ ] **INPUT-02**: Balances persist in localStorage so a returning guest keeps their numbers
- [ ] **INPUT-03**: Balances encode into the URL so a user can share a link that reproduces their results

### Results & Ranking

- [ ] **RANK-01**: User sees redemptions they can book now with current balances, ranked by wow delta (transfer-partner value minus cash-out value)
- [ ] **RANK-02**: User sees an "Almost there" section for redemptions within reach, with a "you're X points away" callout
- [ ] **RANK-03**: Each result is tagged with which of the user's balances it uses, showing the cheapest transfer path when multiple programs reach the same partner
- [ ] **RANK-04**: Each result shows its transfer path explicitly (e.g., "via Chase UR → World of Hyatt 1:1")
- [ ] **RANK-05**: Each result includes short how-to-book guidance (2–4 lines, curated)

### Valuation & Credibility

- [ ] **VAL-01**: Each result shows dual valuation side by side: representative cash fare AND cents-per-point, with the dollar delta as the hero number
- [ ] **VAL-02**: Cpp math follows TPG convention: (cash fare − taxes/fees) ÷ points × 100
- [ ] **VAL-03**: A methodology page explains fare sourcing, taxes/fees treatment, and the dynamic-award-pricing disclaimer
- [ ] **VAL-04**: Each result displays its "Verified [date]" stamp from the database
- [ ] **VAL-05**: When a transfer bonus is active, valuations auto-adjust (bonus-adjusted cpp) and the bonus is surfaced in the result

### Redemption Database

- [ ] **DATA-01**: Curated database of 80–120 redemptions with program, partner, transfer ratio, points cost, representative cash fare, taxes/fees, verified date, and booking notes — maintained as typed seed files in the repo
- [ ] **DATA-02**: Transfer routes modeled structurally (ratio + bonus rule + transfer increment), correctly handling edge cases: Marriott 3:1 with 5K bonus per 60K, Amex→Hilton 1:2, and similar
- [ ] **DATA-03**: Transfer bonuses are manual override entries with start/end dates, editable in seed data without schema changes
- [ ] **DATA-04**: Database content is drafted collaboratively and verified by Nick before launch (verification gate — no unverified entry ships)

### Accounts & Legal

- [ ] **ACCT-01**: User can optionally sign up (Clerk) to save balances to their profile — core flow never requires login
- [ ] **ACCT-02**: Signed-in user can bookmark redemptions they're working toward
- [ ] **ACCT-03**: Signed-in user can record travel goals (stored only; no v1 ranking effect)
- [ ] **ACCT-04**: Privacy policy, consent, and account/data deletion are available

### Platform & Launch

- [ ] **PLAT-01**: App is deployed publicly on Vercel and shareable via a single link
- [ ] **PLAT-02**: App is fully responsive and works in the LinkedIn in-app browser (mobile WebView tested before launch)
- [ ] **PLAT-03**: Share links render proper OG tags with a branded OG image
- [ ] **PLAT-04**: A "coming soon" tease for the v2 AI card-roadmap advisor is present
- [ ] **PLAT-05**: Editorial travel design system (light, magazine-like, destination imagery, big numbers) applied across all pages

## v2 Requirements (Deferred)

- **V2-01**: AI card-roadmap advisor — LLM + curated knowledge base → personalized card application order/timing with annual fee budget
- **V2-02**: Card eligibility rules (5/24, Chase 48-month, Amex lifetime language)
- **V2-03**: Goal-personalized ranking using stored travel goals
- **V2-04**: Per-result generated share image cards (v1 ships baseline OG image only)
- **V2-05**: Combined-currency pooling (multiple balances toward one award)
- **V2-06**: Admin refresh workflow for database maintenance (n8n automation available for transfer-bonus ingestion)

## Out of Scope

| Exclusion | Reasoning |
|-----------|-----------|
| Live award availability search | Full-time engineering product; conflicts with curation premise; guaranteed to miss timeline |
| Balance auto-sync / credential aggregation | Security liability; Travel Freely won by refusing credentials — manual entry framed as privacy feature |
| Full program coverage (30+ programs) | AwardHacker died of exhaustive-but-stale; 8 programs done credibly beats 30 done poorly |
| Auto-updating fares/valuations | Representative fare with verified date is defensible; live-but-wrong is not |
| Points-earning tracker (bonuses, fees, deadlines) | Different job-to-be-done; a second product's worth of work |
| Native mobile app | Responsive web reaches LinkedIn viewers with zero install friction |
| User-submitted redemptions | Expert curation IS the product; moderation erodes it |
| Card recommendation engine in v1 | It's the v2 advisor by another name; affiliate taint risks the defensible-numbers brand |

## Traceability

(Filled by roadmap — maps each REQ-ID to a phase)

---
*Defined: 2026-08-31 · 25 v1 requirements across 6 categories*
