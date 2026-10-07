"use server";

import { revalidatePath } from "next/cache";
import { assertProjectOwner } from "@/lib/supabase/authz";
import type { SubtitleSegment } from "./subtitles";
import { DEFAULT_SUBTITLE_STYLE, type SubtitleStyle } from "@/lib/subtitle-style";
import type { ClipTransform } from "@/lib/clip-transform";

export type TimelineClip = {
  id: string;
  assetId: string;
  start: number;
  end: number;
  /** Zoom and position in the frame; absent means fitted and centred. */
  transform?: ClipTransform;
};

export async function saveTimeline(
  projectId: string,
  clips: TimelineClip[],
  subtitles: SubtitleSegment[] = [],
  subtitleStyle: SubtitleStyle = DEFAULT_SUBTITLE_STYLE
) {
  const { supabase } = await assertProjectOwner(projectId);

  const { data: latest } = await supabase
    .from("timelines")
    .select("version")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latest?.version ?? 0) + 1;

  const { error } = await supabase.from("timelines").insert({
    project_id: projectId,
    version: nextVersion,
    timeline_json: { clips, subtitles, subtitleStyle },
  });

  if (error) {
    throw new Error("Failed to save timeline");
  }

  revalidatePath(`/editor/${projectId}`);

  return { version: nextVersion };
}
