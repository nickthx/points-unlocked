import type { SearchParams } from "nuqs/server";

import { CoreExperience } from "@/components/core-experience";
import { loadBalanceParams } from "@/lib/balance-params";

// D-04 homepage — Phase 4 replaces the Phase 1 placeholder (wordmark + live
// DB count) with the guest core experience. The DB import, the count query,
// and the forced-dynamic export were DELETED, not migrated: the guest flow never touches
// Postgres (T-04-11), and error handling now lives in the island (T-01-07
// precedent carried forward there).
//
// Server component, no client directive. Awaiting searchParams makes the
// route dynamic implicitly (Pitfall 3 / RESEARCH anti-pattern: do NOT add
// `export const dynamic`), so a shared URL server-renders full ranked results
// into the initial HTML (INPUT-03).
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // nuqs loader — same parser map the island uses (Pattern 1, one source of
  // truth). The island reads the URL itself via useQueryStates; awaiting here
  // is what opts the route into per-request rendering.
  await loadBalanceParams(searchParams);

  // Pitfall 7: the repo's SOLE clock read for this flow — once per request,
  // server-side. The island reuses this prop for every client recompute and
  // the engine never reads the clock, so server HTML and hydrated results agree.
  const asOf = new Date().toISOString().slice(0, 10);

  return (
    <main className="bg-cream flex flex-1 flex-col">
      <CoreExperience asOf={asOf} />
    </main>
  );
}
