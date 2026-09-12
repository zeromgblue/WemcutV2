"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createProject() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: user.id, name: "Untitled Project" })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/dashboard?error=create-project-failed");
  }

  redirect(`/editor/${data.id}`);
}
