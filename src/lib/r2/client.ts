import { S3Client } from "@aws-sdk/client-s3";

export const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME!;

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

/** Storage key for the audio-only copy of an asset that is sent for transcription. */
export function transcriptionAudioKey(projectId: string, assetId: string, extension: "m4a" | "wav") {
  return `projects/${projectId}/transcription/${assetId}.${extension}`;
}
