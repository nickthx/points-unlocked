"use client";

import { NumericFormat } from "react-number-format";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { programs } from "@/data";
import type { Balances, EnterableProgramSlug } from "@/engine";
import { PARAM_KEY_BY_SLUG } from "@/lib/balance-params";

// The 8-program balance form (INPUT-01). Purely presentational: the client
// island (plan 04-04) owns nuqs URL state and browser storage; this component
// only reports edits through onBalanceChange. No arithmetic beyond the
// boundary guard on the raw input value (T-04-08 — the codec and engine
// re-sanitize downstream).

interface BalanceFormProps {
  balances: Balances;
  onBalanceChange: (slug: EnterableProgramSlug, value: number | null) => void;
}

interface EnterableProgram {
  slug: EnterableProgramSlug;
  name: string;
}

/** Slug set derived from the codec's single source of truth — no second list. */
function isEnterableSlug(slug: string): slug is EnterableProgramSlug {
  return slug in PARAM_KEY_BY_SLUG;
}

/**
 * The 8 enterable programs in dataset order, derived from the seed array's
 * isUserEnterable flag (fixed contract frozen by tests/seed-data.test.ts).
 */
const enterablePrograms: EnterableProgram[] = programs.flatMap((program) =>
  program.isUserEnterable && isEnterableSlug(program.slug)
    ? [{ slug: program.slug, name: program.name }]
    : [],
);

export function BalanceForm({ balances, onBalanceChange }: BalanceFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink/70 text-base leading-6">
        Enter what you have. No account, nothing stored on our servers.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {enterablePrograms.map(({ slug, name }) => (
          <div key={slug} className="flex flex-col gap-2">
            <Label htmlFor={slug} className="text-ink text-sm font-semibold">
              {name}
            </Label>
            <NumericFormat
              customInput={Input}
              id={slug}
              name={slug}
              value={balances[slug] ?? ""}
              thousandSeparator=","
              allowNegative={false}
              decimalScale={0}
              inputMode="numeric"
              placeholder="0"
              autoComplete="off"
              // UI-SPEC exception: 44px touch target for the LinkedIn WebView
              // session — overrides the vendored Input's h-8 via cn merge.
              className="text-ink h-11 bg-white text-base"
              onValueChange={({ floatValue }, sourceInfo) => {
                // Pitfall (RESEARCH Pattern 3): ignore prop-driven echoes so a
                // URL/storage hydration never re-fires as a user edit.
                if (sourceInfo.source !== "event") return;
                onBalanceChange(
                  slug,
                  floatValue && floatValue > 0 ? Math.floor(floatValue) : null,
                );
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
