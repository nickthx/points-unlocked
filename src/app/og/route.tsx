import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { loadBalanceParams, paramsToBalances } from "@/lib/balance-params";
import { buildShareContent } from "@/lib/share-content";

// GET /og — the social card for a share link (PLAT-03). Renders a 1200x630
// PNG of the top bookable redemption's wow delta so the product markets
// itself when a `/?ur=…&mr=…` link unfurls on LinkedIn. Text comes ONLY from
// buildShareContent — the same helper generateMetadata on `/` consumes — so
// the preview text and the card can never disagree.
//
// Fonts: @fontsource/fraunces@5.3.0 files/fraunces-latin-600-normal.woff and
// @fontsource/inter@5.3.0 files/inter-latin-400-normal.woff (latin subsets,
// SIL Open Font License 1.1, https://cdn.jsdelivr.net/npm/@fontsource/fraunces@5.3.0/
// and https://cdn.jsdelivr.net/npm/@fontsource/inter@5.3.0/) — vendored under
// src/assets/fonts, never fetched at runtime (T-05-02). Static .woff
// instances, not woff2 and not the variable face: Satori supports neither.
//
// Runtime is the Node default — the edge runtime export is deprecated in
// Next 16 and would break the node:fs font reads; no segment config exports
// here. Reading `request` makes the handler dynamic; the s-maxage header
// below lets Vercel's CDN cache each PNG per URL.
//
// Threats: T-05-07 (hostile params) — the nuqs loader (parseAsInteger) →
// paramsToBalances (positive safe integers only) → engine sanitizeBalances
// is the same triple layer the page uses (T-04-10); unknown keys, arrays,
// floats, negatives and 1e9-style strings simply drop, so bad input yields
// the baseline card, never a 500. T-05-08 (CPU/DoS) — input collapses to at
// most 8 bounded integers, the engine search is bounded, fonts are read once
// per process, and the CDN absorbs repeat requests. T-05-09 (information
// disclosure) — the error path returns a neutral 500 with no detail and no
// logging (T-01-07 precedent).

const FONT_DIR = join(process.cwd(), "src/assets/fonts");

const CACHE_CONTROL =
  "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";

const CREAM = "#faf7f2";
const INK = "#262119";

/**
 * Memoized font loader: the two .woff files are read exactly once per process
 * (format.ts module-scope setup pattern). A lazy promise instead of top-level
 * await keeps the module shape identical under Next's bundler and vitest.
 */
let fontsPromise: Promise<{ fraunces: Buffer; inter: Buffer }> | undefined;

function loadFonts(): Promise<{ fraunces: Buffer; inter: Buffer }> {
  fontsPromise ??= Promise.all([
    readFile(join(FONT_DIR, "fraunces-latin-600-normal.woff")),
    readFile(join(FONT_DIR, "inter-latin-400-normal.woff")),
  ]).then(([fraunces, inter]) => ({ fraunces, inter }));
  return fontsPromise;
}

export async function GET(request: Request): Promise<Response> {
  // Synchronous for a Request (the page awaits the searchParams Promise form).
  const balances = paramsToBalances(loadBalanceParams(request));
  // Server-only clock read (Pitfall 10) — the island and engine stay clock-free.
  const asOf = new Date().toISOString().slice(0, 10);
  const share = buildShareContent({ balances, asOf });
  const isResult = share.kind === "result";

  try {
    const { fraunces, inter } = await loadFonts();

    // Satori rules: inline style objects only, and every multi-child div is
    // display: flex. The terracotta headline is UI-SPEC reserved use #1 (the
    // wow delta) — the baseline question is a sentence, not a delta, so it
    // renders in ink at a smaller size and the separate title line is omitted.
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: 72,
            background: CREAM,
            color: INK,
            fontFamily: "Inter",
          }}
        >
          <div style={{ display: "flex", fontSize: 28 }}>{share.eyebrow}</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {isResult ? (
              <div
                style={{
                  fontFamily: "Fraunces",
                  fontWeight: 600,
                  fontSize: 176,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  color: "#c05f33",
                }}
              >
                {share.headline}
              </div>
            ) : (
              <div
                style={{
                  fontFamily: "Fraunces",
                  fontWeight: 600,
                  fontSize: 88,
                  lineHeight: 1.05,
                  color: INK,
                }}
              >
                {share.headline}
              </div>
            )}

            {isResult ? (
              <div
                style={{
                  display: "flex",
                  fontFamily: "Fraunces",
                  fontWeight: 600,
                  fontSize: 44,
                  lineHeight: 1.15,
                  lineClamp: 2,
                }}
              >
                {share.title}
              </div>
            ) : null}

            <div style={{ display: "flex", fontSize: 28, opacity: 0.7 }}>
              {share.subline}
            </div>

            <div style={{ display: "flex", fontSize: 22, opacity: 0.6 }}>
              points-unlocked.vercel.app
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: "Fraunces", data: fraunces, weight: 600, style: "normal" },
          { name: "Inter", data: inter, weight: 400, style: "normal" },
        ],
        headers: { "Cache-Control": CACHE_CONTROL },
      },
    );
  } catch {
    // T-05-09 / T-01-07: neutral 500 — no error text, no logging.
    return new Response("Image unavailable", { status: 500 });
  }
}
