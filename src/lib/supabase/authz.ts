import { getAuthUser } from "@/lib/supabase/server";

export async function assertProjectOwner(projectId: string) {
  const { supabase, user } = await getAuthUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!project) {
    throw new Error("Project not found");
  }

  return { supabase, user };
}
