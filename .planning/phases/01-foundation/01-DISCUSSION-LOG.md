# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-31
**Phase:** 1-Foundation
**Areas discussed:** Public URL while building, CI & quality gates, Testing foundation, Scaffold scope

---

## Public URL while building

| Option | Description | Selected |
|--------|-------------|----------|
| Real app shell | Deploy the actual app from day one, minimal until later phases fill it in | ✓ |
| Branded holding page | "Coming soon" page at root; real app swaps in at launch | |
| Real shell + noindex | Real app plus noindex meta until launch | |

**User's choice:** Real app shell (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| vercel.app for now | Free subdomain; Phase 7 can add a domain | ✓ |
| Buy custom domain now | ~$10–20/yr; share links never change | |
| Decide at launch | Explicitly park the decision to Phase 7 | |

**User's choice:** vercel.app for now (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Noindex until launch | One meta tag now, removed in Phase 7 | ✓ |
| Indexable from day one | Google crawls immediately | |

**User's choice:** Noindex until launch (Recommended) — confirmed deliberate after the shell choice omitted it

| Option | Description | Selected |
|--------|-------------|----------|
| Name + one-liner | Wordmark, one-sentence pitch, in-progress note | ✓ |
| Bare Next.js starter | Untouched create-next-app default | |
| DB health check page | Name + one-liner plus a Neon proof-of-life read | |

**User's choice:** Name + one-liner (Recommended)

---

## CI & quality gates

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Actions | Lint + typecheck + test on every push/PR, visible checks on repo | ✓ |
| Vercel build only | No separate CI; local lint/test | |
| Both, CI blocks deploy | Actions checks gate the Vercel deploy | |

**User's choice:** GitHub Actions (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Advisory only | Vercel deploys on push regardless; red X signals fix | ✓ |
| CI blocks production | Production waits for green checks | |

**User's choice:** Advisory only (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Push to main | Direct commits, auto-deploy each push | ✓ |
| Feature branches + PRs | Every change via PR with CI green | |
| PRs for phases only | Day-to-day to main; each GSD phase as one PR | |

**User's choice:** Push to main (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| No hooks, CI catches it | ESLint + Prettier via scripts/editor; CI enforces | ✓ |
| Pre-commit hooks | husky + lint-staged on every commit | |

**User's choice:** No hooks, CI catches it (Recommended)

---

## Testing foundation

| Option | Description | Selected |
|--------|-------------|----------|
| Vitest | Fast, zero-config TS/ESM; fits Phase 3 engine tests | ✓ |
| Jest | Older standard, more config | |
| Node built-in test runner | Zero deps, weaker DX | |

**User's choice:** Vitest (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Trivial placeholder test | One smoke test so npm test runs green from day one | ✓ |
| Component render test | testing-library + jsdom, renders homepage | |
| DB connectivity test | Pings Neon in CI — flaky, needs secrets | |

**User's choice:** Trivial placeholder test (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Engine gets tests, no metric | Qualitative rule: thorough engine unit tests, UI untested | ✓ |
| Coverage threshold on engine only | e.g. 90% on src/engine/** | |
| Project-wide threshold | Global gate, forces UI testing | |

**User's choice:** Engine gets tests, no metric (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Manual only for v1 | Hand-verified critical path + Phase 7 device pass | ✓ |
| One Playwright smoke test | Headless load-and-assert on deployed URL | |
| Defer decision to Phase 4 | Decide when the core flow exists | |

**User's choice:** Manual only for v1 (Recommended)

---

## Scaffold scope

| Option | Description | Selected |
|--------|-------------|----------|
| Fonts + tokens in Phase 1 | Font pair + @theme tokens now; Phase 7 refines | ✓ |
| System fonts until Phase 7 | Design system lands in one late pass | |
| Tokens now, fonts later | Token structure with placeholders | |

**User's choice:** Fonts + tokens in Phase 1 (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Fraunces + Inter | Warm characterful display serif w/ optical-size axis + workhorse sans | ✓ |
| Newsreader + Geist | Restrained newspapery serif, quieter tone | |
| Playfair Display + Inter | Classic high-contrast fashion serif, most common | |
| You decide | Claude picks in Phase 7 with visual comparisons | |

**User's choice:** Fraunces + Inter (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Full skeleton, minimal shadcn | All dirs now, 0–2 components, add per-phase | |
| Bare minimum dirs | Only what Phase 1 touches | |
| Full skeleton + form components | All dirs + preinstalled button/input/label/card/dialog | ✓ |

**User's choice:** Full skeleton + form components — user opted for more preinstalled than the recommendation

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder table only | health_check table proves schema.ts → Neon → server component path | ✓ |
| Real table names, empty | Stub Phase 2 tables now | |
| Connection only, no tables | Raw SELECT 1, no drizzle-kit push proof | |

**User's choice:** Placeholder table only (Recommended)

---

## Claude's Discretion

- Vercel project name / subdomain slug
- GitHub Actions workflow internals (Node version, caching, job layout)
- Placeholder test content and test file layout conventions
- Warm palette starting values (Phase 7 refines)

## Deferred Ideas

- Custom domain purchase — Phase 7 launch gate
- Remove noindex tag — Phase 7 launch gate
- Optional single Playwright smoke test — reconsider at Phase 4
