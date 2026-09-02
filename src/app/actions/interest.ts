"use server";

import { db, interestSignups } from "@/db";
import { interestSchema } from "@/lib/interest-validation";

// PLAT-04: the advisor-waitlist Server Action. This is the ONLY file under
// src/app + src/components permitted to import "@/db" (grep gate, T-05-13) —
// the client tree stays DB-free so the Phase 4 guest-flow gate holds.
//
// T-05-12 (spam / enumeration): the hidden honeypot short-circuits to success
// without a write; interestSchema caps + validates the email; the UNIQUE
// column + onConflictDoNothing make repeat submits idempotent and return the
// same success copy, so there is no "already registered" oracle.
//
// T-05-14 (information disclosure): zod issue text is never returned (it can
// echo the input); driver errors are never returned or logged (they can embed
// connection details). Every message below is fixed, neutral copy.

export type InterestState = {
  status: "idle" | "ok" | "error";
  message: string;
};

export async function joinAdvisorWaitlist(
  _prev: InterestState,
  formData: FormData,
): Promise<InterestState> {
  // Honeypot first: humans never see the field, so a filled value is a bot.
  // Bots see success; nothing is stored, nothing is revealed.
  const website = formData.get("website");
  if (typeof website === "string" && website.length > 0) {
    return { status: "ok", message: "You're on the list." };
  }

  const parsed = interestSchema.safeParse({
    email: formData.get("email"),
    website: "",
  });
  if (!parsed.success) {
    return { status: "error", message: "Enter a valid email address." };
  }

  try {
    await db
      .insert(interestSignups)
      .values({ email: parsed.data.email })
      .onConflictDoNothing({ target: interestSignups.email });
    return { status: "ok", message: "You're on the list." };
  } catch {
    return {
      status: "error",
      message: "Something went wrong. Try again in a moment.",
    };
  }
}
