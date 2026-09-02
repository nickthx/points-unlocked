import type { TransferPath } from "@/engine";
import type { ProgramSeed, TransferRouteSeed } from "@/data";

// Transfer-path → human-readable string (RANK-04) — pure, testable, zero
// arithmetic. The engine's TransferPath carries routeKey but not the ratio;
// the UI looks the route up in the seed dataset passed in by the caller.
//
// Imports stay on the "@/engine" and "@/data" BARRELS only — never deep
// paths. Both barrels export a module named transfers (engine FUNCTIONS vs
// seed ARRAYS, a known filename-collision hazard); type-only barrel imports
// sidestep it entirely.

/**
 * Render a funding path per the UI-SPEC copy contract (RANK-04):
 * - transfer: "via {From} → {To} {ratioNumerator}:{ratioDenominator}"
 * - direct:   "Use your {Program} points directly"
 *
 * routeKey is the repo-wide `${from}→${to}` Unicode-arrow contract, absent
 * for kind "direct". Guard-clause house style — no non-null assertions:
 * an unknown program slug degrades to the raw slug (already public in the
 * shipped dataset, T-04-05), and a missing route degrades to
 * "via {From} → {To}" without a ratio rather than throwing.
 */
export function formatTransferPath(
  path: TransferPath,
  routes: TransferRouteSeed[],
  programs: ProgramSeed[],
): string {
  const nameOf = (slug: string): string =>
    programs.find((p) => p.slug === slug)?.name ?? slug;

  if (path.kind === "direct" || path.routeKey === undefined) {
    // Direct use of the held currency; the routeKey guard also degrades a
    // contract-violating transfer path with no routeKey to the safe sentence.
    return `Use your ${nameOf(path.fromProgramSlug)} points directly`;
  }

  const [fromSlug = "", toSlug = ""] = path.routeKey.split("→");
  const from = nameOf(fromSlug);
  const to = nameOf(toSlug);

  const route = routes.find(
    (r) => r.fromProgramSlug === fromSlug && r.toProgramSlug === toSlug,
  );
  if (route === undefined) {
    return `via ${from} → ${to}`;
  }

  return `via ${from} → ${to} ${route.ratioNumerator}:${route.ratioDenominator}`;
}
