"use server";

import { assertProjectOwner } from "@/lib/supabase/authz";
import { runDirector, type DirectorContext, type DirectorReply } from "@/lib/director";

export async function interpretCommand(
  projectId: string,
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
  context: DirectorContext
): Promise<DirectorReply> {
  await assertProjectOwner(projectId);
  return runDirector(history, userMessage, context);
}
