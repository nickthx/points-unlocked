// D-04 homepage shell: wordmark + pitch + in-progress note. This is the real
// production app shell (D-01 — no holding page); Phase 4 replaces it with the
// balance-entry flow. Server component, zero client JS.
export default function Home() {
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
    </main>
  );
}
