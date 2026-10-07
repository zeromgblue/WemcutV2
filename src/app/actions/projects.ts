"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/supabase/server";
import { assertProjectOwner } from "@/lib/supabase/authz";
import { parseCanvasSize } from "@/lib/canvas-size";

export async function createProject(formData: FormData) {
  const { supabase, user } = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim().slice(0, 200) || "Untitled Project";
  const canvas = parseCanvasSize(formData.get("width"), formData.get("height"));

  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: user.id, name })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/dashboard?error=create-project-failed");
  }

  // The frame size lives in the project's first timeline version, alongside
  // everything else the editor saves. If this insert fails the project still
  // opens; the editor then sizes the frame from the first video instead.
  if (canvas) {
    await supabase
      .from("timelines")
      .insert({ project_id: data.id, version: 1, timeline_json: { clips: [], subtitles: [], canvas } });
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
