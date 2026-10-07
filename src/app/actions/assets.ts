"use server";

import { randomUUID } from "crypto";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { revalidatePath } from "next/cache";
import { assertProjectOwner } from "@/lib/supabase/authz";
import { r2Client, R2_BUCKET_NAME, transcriptionAudioKey } from "@/lib/r2/client";

export async function createUploadUrl(
  projectId: string,
  fileName: string,
  fileType: string
) {
  await assertProjectOwner(projectId);

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = `projects/${projectId}/${randomUUID()}-${safeName}`;

  const uploadUrl = await getSignedUrl(
    r2Client,
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storageKey,
      ContentType: fileType,
    }),
    { expiresIn: 600 }
  );

  return { uploadUrl, storageKey };
}

const TRANSCRIPTION_AUDIO_TYPES = { m4a: "audio/mp4", wav: "audio/wav" } as const;

// Upload URL for the audio the browser extracts from a video before
// transcription. It is far smaller than the video, so long videos fit under
// the transcription service's upload limit.
export async function createTranscriptionAudioUploadUrl(
  projectId: string,
  assetId: string,
  extension: "m4a" | "wav"
) {
  const { supabase } = await assertProjectOwner(projectId);
  if (!(extension in TRANSCRIPTION_AUDIO_TYPES)) throw new Error("Unsupported audio type");

  const { data: asset } = await supabase
    .from("assets")
    .select("id")
    .eq("id", assetId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (!asset) throw new Error("ไม่พบไฟล์วิดีโอ");

  const storageKey = transcriptionAudioKey(projectId, assetId, extension);
  const uploadUrl = await getSignedUrl(
    r2Client,
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storageKey,
      ContentType: TRANSCRIPTION_AUDIO_TYPES[extension],
    }),
    { expiresIn: 600 }
  );

  return { uploadUrl, storageKey };
}

export async function confirmAssetUpload({
  projectId,
  storageKey,
  type,
  fileSize,
  duration,
}: {
  projectId: string;
  storageKey: string;
  type: string;
  fileSize: number;
  duration?: number;
}) {
  const { supabase } = await assertProjectOwner(projectId);

  const { data, error } = await supabase
    .from("assets")
    .insert({
      project_id: projectId,
      type,
      storage_key: storageKey,
      file_size: fileSize,
      duration,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Failed to save asset");
  }

  revalidatePath(`/editor/${projectId}`);

  return { id: data.id as string };
}

export async function getAssetPlaybackUrl(projectId: string, assetId: string) {
  const { supabase } = await assertProjectOwner(projectId);

  const { data: asset } = await supabase
    .from("assets")
    .select("storage_key")
    .eq("id", assetId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!asset) {
    throw new Error("ไม่พบไฟล์วิดีโอ");
  }

  return getSignedUrl(
    r2Client,
    new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: asset.storage_key }),
    { expiresIn: 3600 }
  );
}
