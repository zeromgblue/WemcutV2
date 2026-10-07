import type { SupabaseClient } from "@supabase/supabase-js";

// Server-side access to the credit system defined in
// supabase/migrations/001_credits.sql. The database owns the balance, the
// costs, and the rules; this file only calls it.

export type CreditAction = "create_project" | "subtitles" | "remove_silence" | "ai_chat";

export type CreditStatus = {
  plan: string;
  /** Credits given for the current period. */
  granted: number;
  used: number;
  remaining: number;
  /** ISO timestamp of when the allowance resets. */
  periodEnd: string;
};

export type CreditCost = { action: string; cost: number; label: string };
export type CreditTransaction = { id: string; amount: number; type: string; reason: string | null; createdAt: string };

export const INSUFFICIENT_CREDITS_MESSAGE = "เครดิตไม่พอสำหรับการใช้งานนี้ เครดิตจะรีเซ็ตต้นเดือนหน้า";

// PostgREST's code for "no such function": the credits migration hasn't been
// run on this database yet. Until it is, the app works as it did before
// credits existed instead of locking everyone out.
const FUNCTION_NOT_FOUND = "PGRST202";

/** The signed-in user's balance, or null when credits aren't set up or can't be read. */
export async function getCreditStatus(supabase: SupabaseClient): Promise<CreditStatus | null> {
  const { data, error } = await supabase.rpc("get_credit_status");
  if (error || !data) {
    if (error && error.code !== FUNCTION_NOT_FOUND) console.error("get_credit_status failed", error);
    return null;
  }
  return {
    plan: String(data.plan ?? "free"),
    granted: Number(data.granted) || 0,
    used: Number(data.used) || 0,
    remaining: Number(data.remaining) || 0,
    periodEnd: String(data.period_end),
  };
}

export async function getCreditCosts(supabase: SupabaseClient): Promise<CreditCost[]> {
  const { data } = await supabase.from("credit_costs").select("action, cost, label").order("sort_order");
  return (data ?? []) as CreditCost[];
}

export async function getRecentCreditTransactions(supabase: SupabaseClient, limit: number): Promise<CreditTransaction[]> {
  const { data } = await supabase
    .from("credit_transactions")
    .select("id, amount, type, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    amount: row.amount as number,
    type: row.type as string,
    reason: row.reason as string | null,
    createdAt: row.created_at as string,
  }));
}

/**
 * Throws if the user can't afford `action`. Call this before starting work
 * that costs money, then spendCredits() once the work has succeeded, so a
 * failed job is never charged.
 */
export async function assertCanAfford(supabase: SupabaseClient, action: CreditAction) {
  const [status, costs] = await Promise.all([getCreditStatus(supabase), getCreditCosts(supabase)]);
  if (!status) return;
  const cost = costs.find((c) => c.action === action)?.cost ?? 0;
  if (status.remaining < cost) throw new Error(INSUFFICIENT_CREDITS_MESSAGE);
}

/** Charges the user for `action`. Returns false if the balance was too low to charge. */
export async function spendCredits(supabase: SupabaseClient, action: CreditAction): Promise<boolean> {
  const { data, error } = await supabase.rpc("spend_credits", { p_action: action });
  if (error) {
    if (error.code !== FUNCTION_NOT_FOUND) console.error("spend_credits failed", error);
    // A billing hiccup shouldn't throw away work that has already been done.
    return true;
  }
  return data?.ok === true;
}
