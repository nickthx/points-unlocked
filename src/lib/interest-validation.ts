import { z } from "zod";

// Form-submission boundary for the advisor waitlist (PLAT-04, T-05-03): the
// tease form's FormData is attacker-controllable, so every field is validated
// here before any DB code runs. Hand-written Zod v4 schema in the src/data/
// types.ts house style; the `email` key mirrors the `interest_signups`
// Drizzle column property so the Server Action can insert the parsed object
// without field mapping.
//
// DB-free and framework-free on purpose: importable by the Server Action
// (05-04) and by node tests without DATABASE_URL, no client directive.

/**
 * Waitlist input. `email` is trimmed and lowercased BEFORE the format check
 * so " Nick@Example.com " normalizes to a dedupe-stable value; the 254-char
 * cap (RFC 5321) runs before the comparatively costly email regex;
 * `.pipe(z.email())` applies zod 4's top-level email validator (A8).
 *
 * `website` is the honeypot: never rendered to humans, so a real browser
 * submits it empty or not at all. Any other value (a bot auto-filling the
 * field, or a null smuggled through) fails validation outright.
 */
export const interestSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  website: z.literal("").optional(),
});

export type InterestInput = z.infer<typeof interestSchema>;
