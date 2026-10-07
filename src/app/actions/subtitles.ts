"use server";

import Anthropic from "@anthropic-ai/sdk";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { assertProjectOwner } from "@/lib/supabase/authz";
import { r2Client, R2_BUCKET_NAME, transcriptionAudioKey } from "@/lib/r2/client";
import { buildSubtitleLines, isSafeCorrection, type TimedLine, type TimedToken } from "@/lib/subtitle-lines";

const GROQ_TRANSCRIPTION_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const MODEL = "whisper-large-v3";
const MAX_TRANSCRIBABLE_FILE_SIZE = 25 * 1024 * 1024;

// Whisper continues from this as if it were the preceding transcript, which
// keeps it in Thai script with normal Thai spacing.
const TRANSCRIPTION_PROMPT = "ต่อไปนี้เป็นบทพูดภาษาไทย";

// Whisper invents text over silence and music. A segment is treated as invented
// when the model itself was unsure there was speech, or when it loops.
const NO_SPEECH_PROB_LIMIT = 0.6;
const LOW_CONFIDENCE_LOGPROB = -0.8;
const REPETITION_COMPRESSION_RATIO = 2.6;
// Stock phrases Whisper is known to produce for Thai audio with no speech.
const STOCK_HALLUCINATIONS = ["ขอบคุณที่รับชม", "โปรดติดตามตอนต่อไป", "ขอบคุณสำหรับการรับชม"];

const CORRECTION_MODEL = "claude-sonnet-5-5";
const CORRECTION_BATCH_SIZE = 150;

export type SubtitleSegment = { assetId: string; start: number; end: number; text: string };

type GroqSegment = {
  start: number;
  end: number;
  text: string;
  avg_logprob?: number;
  compression_ratio?: number;
  no_speech_prob?: number;
};
type GroqVerboseJson = { segments?: GroqSegment[]; words?: TimedToken[] };

function isHallucinated(segment: GroqSegment) {
  const noSpeech = segment.no_speech_prob ?? 0;
  const logprob = segment.avg_logprob ?? 0;
  if (noSpeech > NO_SPEECH_PROB_LIMIT && logprob < LOW_CONFIDENCE_LOGPROB) return true;
  if ((segment.compression_ratio ?? 0) > REPETITION_COMPRESSION_RATIO) return true;
  const text = segment.text.trim();
  if (text === TRANSCRIPTION_PROMPT) return true;
  return noSpeech > 0.4 && STOCK_HALLUCINATIONS.some((phrase) => text === phrase);
}

const CORRECTION_SYSTEM_PROMPT = `คุณคือผู้ตรวจทานซับไตเติลภาษาไทยที่ได้จากระบบถอดเสียงอัตโนมัติ

ระบบถอดเสียงมักสะกดคำไทยผิด เลือกคำพ้องเสียงผิด หรือแบ่งคำผิด หน้าที่ของคุณคือแก้ให้เป็นคำที่ผู้พูดน่าจะพูดจริง โดยดูจากบริบทของบรรทัดรอบข้าง

ซับไตเติลแต่ละบรรทัดผูกกับช่วงเวลาในวิดีโอ จึงต้องคงจำนวนบรรทัดและเนื้อหาของแต่ละบรรทัดไว้:
- แก้เฉพาะการสะกด คำพ้องเสียง และการเว้นวรรค
- ห้ามเพิ่ม ตัด เรียบเรียงใหม่ หรือย้ายคำข้ามบรรทัด
- คงภาษาพูด คำแสลง คำลงท้าย (ครับ ค่ะ นะ) คำภาษาอังกฤษ ชื่อเฉพาะ และตัวเลขไว้ตามเดิม
- ถ้าไม่แน่ใจว่าผิด ให้คงข้อความเดิม

ตอบกลับทุกบรรทัดด้วยเลข i เดิม`;

const CORRECTION_SCHEMA = {
  type: "object",
  properties: {
    lines: {
      type: "array",
      items: {
        type: "object",
        properties: { i: { type: "integer" }, text: { type: "string" } },
        required: ["i", "text"],
        additionalProperties: false,
      },
    },
  },
  required: ["lines"],
  additionalProperties: false,
};

async function correctBatch(client: Anthropic, lines: TimedLine[]): Promise<TimedLine[]> {
  const response = await client.beta.messages.create({
    model: CORRECTION_MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema: CORRECTION_SCHEMA } },
    system: CORRECTION_SYSTEM_PROMPT,
    messages: [
      { role: "user", content: JSON.stringify(lines.map((line, i) => ({ i, text: line.text }))) },
    ],
  });

  if (response.stop_reason !== "end_turn") return lines;
  const text = response.content.find((block) => block.type === "text")?.text;
  if (!text) return lines;

  const parsed = JSON.parse(text) as { lines: { i: number; text: string }[] };
  const corrected = [...lines];
  for (const item of parsed.lines) {
    const original = lines[item.i];
    const next = item.text.trim();
    if (original && isSafeCorrection(original.text, next)) {
      corrected[item.i] = { ...original, text: next };
    }
  }
  return corrected;
}

// Fixes Thai misspellings in the transcript. Timing is untouched, and any
// failure falls back to the raw transcript rather than failing the whole job.
async function correctSpelling(lines: TimedLine[]): Promise<TimedLine[]> {
  if (!process.env.ANTHROPIC_API_KEY || lines.length === 0) return lines;

  const client = new Anthropic({ timeout: 90_000, maxRetries: 1 });
  const batches: TimedLine[][] = [];
  for (let i = 0; i < lines.length; i += CORRECTION_BATCH_SIZE) {
    batches.push(lines.slice(i, i + CORRECTION_BATCH_SIZE));
  }

  const results = await Promise.all(
    batches.map((batch) =>
      correctBatch(client, batch).catch((err) => {
        console.error("Subtitle spelling correction failed", err);
        return batch;
      })
    )
  );
  return results.flat();
}

/**
 * `audioExtension` says the browser has already uploaded an audio-only copy of
 * the asset (see createTranscriptionAudioUploadUrl); that copy is transcribed
 * instead of the full video file.
 */
export async function transcribeAsset(
  projectId: string,
  assetId: string,
  audioExtension?: "m4a" | "wav"
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
  if (!audioExtension && asset.file_size && asset.file_size > MAX_TRANSCRIBABLE_FILE_SIZE) {
    throw new Error("วิดีโอมีขนาดใหญ่เกินไปสำหรับการถอดเสียงอัตโนมัติ (จำกัด 25MB)");
  }
  if (!process.env.GROQ_API_KEY) {
    throw new Error("ยังไม่ได้ตั้งค่า GROQ_API_KEY บนเซิร์ฟเวอร์");
  }

  // The key is rebuilt from the verified project and asset ids, never taken from the client.
  const sourceKey =
    audioExtension === "m4a" || audioExtension === "wav"
      ? transcriptionAudioKey(projectId, assetId, audioExtension)
      : asset.storage_key;

  const object = await r2Client.send(new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: sourceKey }));
  const bytes = await object.Body?.transformToByteArray();
  if (!bytes) {
    throw new Error("ไม่สามารถโหลดไฟล์วิดีโอจากที่จัดเก็บได้");
  }
  if (bytes.length > MAX_TRANSCRIBABLE_FILE_SIZE) {
    throw new Error("เสียงในวิดีโอยาวเกินไปสำหรับการถอดเสียงอัตโนมัติ");
  }

  const extension = sourceKey.split(".").pop() || "mp4";

  const form = new FormData();
  form.append("file", new Blob([Buffer.from(bytes)]), `audio.${extension}`);
  form.append("model", MODEL);
  form.append("language", "th");
  form.append("temperature", "0");
  form.append("prompt", TRANSCRIPTION_PROMPT);
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  form.append("timestamp_granularities[]", "segment");

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

  const segments = json.segments ?? [];
  const invented = segments.filter(isHallucinated);
  const spoken = segments.filter((s) => !isHallucinated(s));

  const lines: TimedLine[] =
    json.words && json.words.length > 0
      ? buildSubtitleLines(
          json.words.filter((w) => {
            const middle = (w.start + w.end) / 2;
            return !invented.some((s) => middle >= s.start && middle <= s.end);
          })
        )
      : spoken.map((s) => ({ start: s.start, end: s.end, text: s.text.trim() }));

  const corrected = await correctSpelling(lines);

  return corrected
    .map((line) => ({ assetId, start: line.start, end: line.end, text: line.text.trim() }))
    .filter((line) => line.text.length > 0);
}
