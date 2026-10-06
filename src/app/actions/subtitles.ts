"use server";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { assertProjectOwner } from "@/lib/supabase/authz";
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2/client";

const GROQ_TRANSCRIPTION_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const MODEL = "whisper-large-v3";
const MAX_TRANSCRIBABLE_FILE_SIZE = 25 * 1024 * 1024;

// A new subtitle line starts on a long pause (likely silence) or once the
// current line has accumulated enough text/time — keeps lines short and
// stops them from spanning gaps where nothing is actually being said.
const MAX_GAP_SECONDS = 0.7;
const MAX_CHUNK_CHARS = 42;
const MAX_CHUNK_DURATION_SECONDS = 6;

export type SubtitleSegment = { assetId: string; start: number; end: number; text: string };

type GroqWord = { word: string; start: number; end: number };
type GroqVerboseJson = {
  segments?: { start: number; end: number; text: string }[];
  words?: GroqWord[];
};

function chunkWords(words: GroqWord[]): { start: number; end: number; text: string }[] {
  const chunks: { start: number; end: number; text: string }[] = [];
  let current: GroqWord[] = [];

  function flush() {
    if (current.length === 0) return;
    const text = current.map((w) => w.word).join("").trim();
    if (text) chunks.push({ start: current[0].start, end: current[current.length - 1].end, text });
    current = [];
  }

  for (const word of words) {
    const last = current[current.length - 1];
    if (last) {
      const gap = word.start - last.end;
      const prospectiveChars = current.reduce((n, w) => n + w.word.length, 0) + word.word.length;
      const prospectiveDuration = word.end - current[0].start;
      if (gap > MAX_GAP_SECONDS || prospectiveChars > MAX_CHUNK_CHARS || prospectiveDuration > MAX_CHUNK_DURATION_SECONDS) {
        flush();
      }
    }
    current.push(word);
  }
  flush();

  return chunks;
}

export async function transcribeAsset(
  projectId: string,
  assetId: string
): Promise<SubtitleSegment[]> {
  const { supabase } = await assertProjectOwner(projectId);

  const { data: asset } = await supabase
    .from("assets")
    .select("storage_key, file_size")
    .eq("id", assetId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!asset) {
    throw new Error("ไม่พบไฟล์วิดีโอ");
  }
  if (asset.file_size && asset.file_size > MAX_TRANSCRIBABLE_FILE_SIZE) {
    throw new Error("วิดีโอมีขนาดใหญ่เกินไปสำหรับการถอดเสียงอัตโนมัติ (จำกัด 25MB)");
  }
  if (!process.env.GROQ_API_KEY) {
    throw new Error("ยังไม่ได้ตั้งค่า GROQ_API_KEY บนเซิร์ฟเวอร์");
  }

  const object = await r2Client.send(
    new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: asset.storage_key })
  );
  const bytes = await object.Body?.transformToByteArray();
  if (!bytes) {
    throw new Error("ไม่สามารถโหลดไฟล์วิดีโอจากที่จัดเก็บได้");
  }

  const extension = asset.storage_key.split(".").pop() || "mp4";

  const form = new FormData();
  form.append("file", new Blob([Buffer.from(bytes)]), `audio.${extension}`);
  form.append("model", MODEL);
  form.append("language", "th");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");

  const res = await fetch(GROQ_TRANSCRIPTION_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Groq transcription failed", res.status, detail);
    throw new Error("การถอดเสียงล้มเหลว กรุณาลองใหม่อีกครั้ง");
  }

  const json = (await res.json()) as GroqVerboseJson;

  const chunks =
    json.words && json.words.length > 0
      ? chunkWords(json.words)
      : (json.segments ?? []).map((s) => ({ start: s.start, end: s.end, text: s.text }));

  return chunks
    .map((c) => ({ assetId, start: c.start, end: c.end, text: c.text.trim() }))
    .filter((c) => c.text.length > 0);
}
