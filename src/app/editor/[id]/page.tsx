import { redirect, notFound } from "next/navigation";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@/lib/supabase/server";
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2/client";
import type { TimelineClip } from "@/app/actions/timeline";
import { EditorWorkspace } from "./_components/editor-workspace";

export default async function EditorPage({ params }: PageProps<"/editor/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!project) {
    notFound();
  }

  const { data: assets } = await supabase
    .from("assets")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  const { data: timeline } = await supabase
    .from("timelines")
    .select("*")
    .eq("project_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const rawClips = timeline?.timeline_json?.clips;
  const initialClips: TimelineClip[] = Array.isArray(rawClips) ? rawClips : [];

  const firstAsset = assets?.[0] ?? null;
  const videoUrl = firstAsset
    ? await getSignedUrl(
        r2Client,
        new GetObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: firstAsset.storage_key,
        }),
        { expiresIn: 3600 }
      )
    : null;

  return (
    <EditorWorkspace
      projectId={id}
      projectName={project.name}
      videoUrl={videoUrl}
      asset={firstAsset ? { id: firstAsset.id, duration: firstAsset.duration } : null}
      initialClips={initialClips}
    />
  );
}
