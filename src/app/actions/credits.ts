"use server";

import { getAuthUser } from "@/lib/supabase/server";
import { assertCanAfford, spendCredits, type CreditAction } from "@/lib/credits";

// Actions whose work happens in the browser, so the browser has to ask for
// the charge. Everything else is charged inside its own server action.
const CLIENT_SIDE_ACTIONS: CreditAction[] = ["remove_silence"];

async function resolve(action: CreditAction) {
  if (!CLIENT_SIDE_ACTIONS.includes(action)) throw new Error("Unsupported credit action");
  const { supabase, user } = await getAuthUser();
  if (!user) throw new Error("Not authenticated");
  return supabase;
}

/** Throws if the signed-in user can't afford `action`. */
export async function checkCredits(action: CreditAction) {
  await assertCanAfford(await resolve(action), action);
}

/** Charges the signed-in user for an `action` that has just succeeded. */
export async function chargeCredits(action: CreditAction) {
  await spendCredits(await resolve(action), action);
}
