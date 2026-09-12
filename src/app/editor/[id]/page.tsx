import { redirect, notFound } from "next/navigation";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@/lib/supabase/server";
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2/client";
import { EditorHeader } from "./_components/editor-header";
import { ToolsSidebar } from "./_components/tools-sidebar";
import { PreviewPanel } from "./_components/preview-panel";
import { AIChatPanel } from "./_components/ai-chat-panel";
import { TimelinePanel } from "./_components/timeline-panel";

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

  const clips = Array.isArray(timeline?.timeline_json?.clips)
    ? timeline.timeline_json.clips
    : [];

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
    <div className="h-screen w-full bg-slate-950 text-slate-50 flex flex-col overflow-hidden">
      <EditorHeader projectName={project.name} />

      <main className="flex-1 flex overflow-hidden">
        <ToolsSidebar />
        <PreviewPanel videoUrl={videoUrl} projectId={id} />
        <AIChatPanel />
      </main>

      <TimelinePanel clips={clips} />
    </div>
  );
}
