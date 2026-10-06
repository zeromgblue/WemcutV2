"use server";

import Anthropic from "@anthropic-ai/sdk";
import { assertProjectOwner } from "@/lib/supabase/authz";

const MODEL = "claude-haiku-4-5";

const tools: Anthropic.Tool[] = [
  {
    name: "remove_silence",
    description:
      "ลบช่วงเงียบ (ไม่มีเสียงพูด) ออกจากทั้งไทม์ไลน์โดยอัตโนมัติ ใช้เมื่อผู้ใช้ขอให้ตัดความเงียบ/ช่วงที่ไม่มีเสียงพูดออก",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "split_at_playhead",
    description:
      "แยกคลิปตรงตำแหน่งเพลย์เฮดปัจจุบันออกเป็นสองส่วน ใช้เมื่อผู้ใช้ขอให้ตัด/แบ่งคลิปตรงจุดที่กำลังดูอยู่ตอนนี้",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "seek",
    description: "ย้ายตำแหน่งเพลย์เฮดไปยังวินาทีที่ระบุในไทม์ไลน์",
    input_schema: {
      type: "object",
      properties: {
        seconds: { type: "number", description: "ตำแหน่งเวลาเป็นวินาทีที่ต้องการย้ายไป" },
      },
      required: ["seconds"],
      additionalProperties: false,
    },
  },
];

function buildSystemPrompt(ctx: { clipCount: number; totalDuration: number; playhead: number }) {
  return `คุณคือ "ผู้กำกับ AI" ผู้ช่วยตัดต่อวิดีโอในแอป WemCut แปลความต้องการของผู้ใช้เป็นการเรียกเครื่องมือที่มีให้เท่านั้น

บริบทไทม์ไลน์ปัจจุบัน:
- จำนวนคลิป: ${ctx.clipCount}
- ความยาวรวม: ${ctx.totalDuration.toFixed(1)} วินาที
- ตำแหน่งเพลย์เฮดปัจจุบัน: ${ctx.playhead.toFixed(1)} วินาที

กฎ:
- ถ้าคำขอตรงกับเครื่องมือที่มี ให้เรียกเครื่องมือนั้น พร้อมข้อความสั้นๆ บอกผู้ใช้ว่ากำลังทำอะไร
- ถ้าคำขอเป็นฟีเจอร์ที่ยังไม่รองรับ (เช่น ใส่ซับไตเติล, หาไฮไลต์อัตโนมัติ) ให้ตอบตรงๆ ว่ายังไม่รองรับ ห้ามแสร้งทำเป็นว่าทำสำเร็จ
- ตอบเป็นภาษาไทยเสมอ กระชับ ไม่เกิน 2 ประโยค`;
}

export type DirectorReply =
  | { type: "action"; tool: "remove_silence" | "split_at_playhead"; message: string }
  | { type: "action"; tool: "seek"; input: { seconds: number }; message: string }
  | { type: "message"; message: string };

export async function interpretCommand(
  projectId: string,
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
  context: { clipCount: number; totalDuration: number; playhead: number }
): Promise<DirectorReply> {
  await assertProjectOwner(projectId);

  const client = new Anthropic();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(context),
    tools,
    tool_choice: { type: "auto" },
    messages: [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: userMessage },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const toolBlock = response.content.find((b) => b.type === "tool_use");
  const message = (textBlock && "text" in textBlock ? textBlock.text : "") || "ทำให้เรียบร้อยแล้วครับ";

  if (toolBlock && "name" in toolBlock) {
    if (toolBlock.name === "remove_silence" || toolBlock.name === "split_at_playhead") {
      return { type: "action", tool: toolBlock.name, message };
    }
    if (toolBlock.name === "seek") {
      const input = toolBlock.input as { seconds?: number };
      if (typeof input.seconds === "number") {
        return { type: "action", tool: "seek", input: { seconds: input.seconds }, message };
      }
    }
  }

  return { type: "message", message };
}
