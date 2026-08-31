# Points Unlocked

## What This Is

A web app that shows people who have credit card points — but no idea what to do with them — how powerful those points actually are. Users enter their balances across major programs and see ranked, aspirational redemptions ("Your 90K Amex MR → ANA business class to Tokyo, worth ~$4,500 cash") with the side-by-side delta between cash-out value and transfer-partner value. Built as both a real product for points beginners and a portfolio piece demonstrating product thinking + full-stack execution.

## Core Value

The "wow" moment: a user sees that the points they were about to burn at 1¢ each are actually a business-class flight — concrete route, concrete numbers, concrete delta. If everything else fails, that reveal must land.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can enter points balances for 8 programs: Chase UR, Amex MR, Capital One, Citi TY, Bilt, World of Hyatt, Hilton Honors, Marriott Bonvoy
- [ ] App shows ranked redemptions matched to the user's balances — hybrid ranking: bookable-now redemptions ordered by wow delta, then an "almost there" section showing what a bit more earning unlocks
- [ ] Each redemption shows dual valuation side by side: retail cash fare AND cents-per-point, with a transparent methodology note
- [ ] Curated redemption database of ~80–120 entries (sweet spots, transfer ratios, rough award pricing) — built together: Claude drafts from research, Nick corrects with real numbers
- [ ] Static transfer rates in the data model, with a manual field for transfer bonuses (Nick enters these by hand for now)
- [ ] App works instantly with no login; an optional "save my balances" prompts sign-up (Clerk)
- [ ] Saved user record holds: identity (email/OAuth), points balances, travel goals (stored only, no v1 ranking effect), and bookmarked redemptions
- [ ] Legal handling of user data: privacy policy, consent, and deletion rights
- [ ] "Coming soon" tease of the v2 AI card-roadmap advisor
- [ ] Deployed publicly on Vercel, shareable via a single link

### Out of Scope

- AI card-roadmap advisor (LLM + knowledge base → exact card application order/timing, annual fee budgeting) — this is the v2 milestone; v1 only teases it
- Live award search / real-time award availability — curation is the product, not search
- Automated transfer bonus ingestion — manual entry for now; automation system comes later
- Card recommendation engine and eligibility rules (5/24, Chase 48-month, Amex lifetime) — belongs to the v2 advisor
- Travel-goal-personalized ranking — goals are captured and stored in v1, used later
- Login-required experience — a login wall would kill the LinkedIn demo; core flow stays open

## Context

- **Owner:** Nick Whitsett — finance background, job-searching for credit/financial analyst roles. Active churner: Middle East, Europe, and Africa trips in 2026 on points, multiple first-class flights. The domain expertise is the differentiator; the app should carry "here's what's possible" energy — aspirational, concrete, numbers-forward.
- **Audience:** Primary — beginners sitting on 50K–200K points who redeem at ~1¢/pt or let them rot. Secondary — LinkedIn viewers (recruiters/hiring managers) evaluating the owner's product and engineering judgment. Production quality matters: real deploy, clean UI, not a toy.
- **Knowledge base:** The curated redemption data doubles as the foundation for the v2 AI advisor. Nick supplies the picks; entries are drafted collaboratively and corrected by him before ship.
- **Original brief:** `PROJECT-BRIEF.md` in repo root.

## Constraints

- **Tech stack**: Next.js on Vercel, Postgres (Neon or Vercel Postgres), Clerk for auth — chosen for speed to production quality and portfolio credibility
- **Timeline**: ASAP — target a polished, deployed demo in 2–4 weeks for a LinkedIn launch post (job search is active)
- **Design**: Editorial travel aesthetic — light, magazine-like, destination imagery; Condé Nast meets fintech. Big numbers carry the drama
- **Distribution**: Must be publicly deployable and shareable via a single link
- **Data integrity**: Valuations must be defensible — finance credibility is part of the pitch; methodology stays transparent

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| V1 = redemption visualizer; AI advisor deferred to v2 with a teaser | Advisor is 2–3x the work; ASAP LinkedIn deadline wins | — Pending |
| Optional save (no login wall) | LinkedIn viewers must reach the wow moment with zero friction | — Pending |
| Broad database (~80–120 redemptions) | More matches per user beats depth-per-entry for demo breadth | — Pending |
| Dual valuation (cash fare + cpp, side by side) | Most credible for a finance-background author; wow AND defensible | — Pending |
| Hybrid ranking (bookable-now by wow delta, then "almost there") | Leads with achievable jaw-droppers, keeps aspiration visible | — Pending |
| Next.js + Postgres + Clerk on Vercel | Production-credible assembled stack; fast path to optional-save auth | — Pending |
| Editorial travel design direction | Aspirational warmth differentiates from generic fintech dashboards | — Pending |
| Static transfer rates + manual bonus entry | Ship now; automation is a later system | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-31 after initialization*
