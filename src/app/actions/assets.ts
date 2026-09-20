"use server";

import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { revalidatePath } from "next/cache";
import { assertProjectOwner } from "@/lib/supabase/authz";
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2/client";

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
  duration,
}: {
  projectId: string;
  storageKey: string;
  type: string;
  fileSize: number;
  duration?: number;
}) {
  const { supabase } = await assertProjectOwner(projectId);

  const { error } = await supabase.from("assets").insert({
    project_id: projectId,
    type,
    storage_key: storageKey,
    file_size: fileSize,
    duration,
  });

  if (error) {
    throw new Error("Failed to save asset");
  }

  revalidatePath(`/editor/${projectId}`);
}
