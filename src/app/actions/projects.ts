"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/supabase/server";
import { assertProjectOwner } from "@/lib/supabase/authz";

export async function createProject() {
  const { supabase, user } = await getAuthUser();

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

export async function renameProject(projectId: string, name: string) {
  const { supabase } = await assertProjectOwner(projectId);
  const trimmed = name.trim().slice(0, 200);
  if (!trimmed) throw new Error("ชื่อโปรเจกต์ห้ามว่าง");

  const { error } = await supabase
    .from("projects")
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) throw new Error("เปลี่ยนชื่อไม่สำเร็จ");

  revalidatePath(`/editor/${projectId}`);
  revalidatePath("/dashboard");
  return { name: trimmed };
}
