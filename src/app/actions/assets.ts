"use server";

import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2/client";

async function assertProjectOwner(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

export async function confirmAssetUpload({
  projectId,
  storageKey,
  type,
  fileSize,
}: {
  projectId: string;
  storageKey: string;
  type: string;
  fileSize: number;
}) {
  const { supabase } = await assertProjectOwner(projectId);

  const { error } = await supabase.from("assets").insert({
    project_id: projectId,
    type,
    storage_key: storageKey,
    file_size: fileSize,
  });

  if (error) {
    throw new Error("Failed to save asset");
  }

  revalidatePath(`/editor/${projectId}`);
}
