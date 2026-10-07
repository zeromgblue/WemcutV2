"use server";

import { assertProjectOwner } from "@/lib/supabase/authz";
import { runDirector, type DirectorContext, type DirectorReply } from "@/lib/director";
import { assertCanAfford, spendCredits } from "@/lib/credits";

export async function interpretCommand(
  projectId: string,
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
  context: DirectorContext
): Promise<DirectorReply> {
  const { supabase } = await assertProjectOwner(projectId);
  await assertCanAfford(supabase, "ai_chat");

  const reply = await runDirector(history, userMessage, context);
  await spendCredits(supabase, "ai_chat");
  return reply;
}
