import { count, isNotNull } from "drizzle-orm";

import { db, redemptions } from "@/db";

// Phase 1 placeholder: force-dynamic proves the live DB path on every request
// (D-16). Phase 2+ moves to cached reads per ARCHITECTURE.md.
export const dynamic = "force-dynamic";

// D-04 homepage shell: wordmark + pitch + in-progress note. This is the real
// production app shell (D-01 — no holding page); Phase 4 replaces it with the
// balance-entry flow. Server component, zero client JS.
export default async function Home() {
  let dbStatus = "infrastructure: warming up";
  try {
    const [row] = await db
      .select({ n: count() })
      .from(redemptions)
      .where(isNotNull(redemptions.verifiedAt));
    dbStatus = `${row.n} verified redemptions live`;
  } catch {
    // T-01-07: never render the caught error — it can embed connection details.
    // Neutral fallback set above.
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-cream px-6 text-center">
      <h1 className="font-display text-display text-ink sm:text-display-xl">
        Points Unlocked
      </h1>
      <p className="mt-6 max-w-md text-lg leading-8 text-ink/70">
        See what your credit card points are actually worth.
      </p>
      <p className="mt-12 text-sm tracking-wide text-terracotta uppercase">
        In progress — launching soon
      </p>
      <p className="mt-2 text-xs tracking-wide text-ink/40 uppercase">
        {dbStatus}
      </p>
    </main>
  );
}
