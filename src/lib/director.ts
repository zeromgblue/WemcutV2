// The AI director: turns a chat message into editor actions. Server-only
// (it holds the API key); the authenticated entry point is the
// interpretCommand server action.
import Anthropic from "@anthropic-ai/sdk";
import { SUBTITLE_ANIMATIONS, SUBTITLE_PRESETS, type SubtitleStyle } from "@/lib/subtitle-style";
import { SUBTITLE_FONTS } from "@/lib/subtitle-fonts";
import { MAX_CLIP_SCALE, MIN_CLIP_SCALE } from "@/lib/clip-transform";

const MODEL = "claude-haiku-4-5";

const FONT_IDS = SUBTITLE_FONTS.map((f) => f.value);
const ANIMATION_IDS = SUBTITLE_ANIMATIONS.map((a) => a.id);
const PRESET_IDS = SUBTITLE_PRESETS.map((p) => p.id);

const noInput = { type: "object" as const, properties: {}, additionalProperties: false };

const tools: Anthropic.Tool[] = [
  {
    name: "remove_silence",
    description: "ลบช่วงเงียบ (ไม่มีเสียงพูด) ออกจากทั้งไทม์ไลน์โดยอัตโนมัติ",
    input_schema: noInput,
  },
  {
    name: "split_at_playhead",
    description: "แยกคลิปตรงตำแหน่งเพลย์เฮดปัจจุบันออกเป็นสองส่วน",
    input_schema: noInput,
  },
  {
    name: "delete_current_clip",
    description: "ลบคลิปทั้งคลิปที่เพลย์เฮดอยู่ออกจากไทม์ไลน์",
    input_schema: noInput,
  },
  {
    name: "delete_range",
    description:
      "ตัดช่วงเวลาหนึ่งออกจากไทม์ไลน์ เช่น 'ตัดวินาทีที่ 20 ถึง 30 ออก' หรือ 'ตัด 5 วินาทีแรกทิ้ง' ใช้เครื่องมือนี้แทนการ split แล้วลบเอง",
    input_schema: {
      type: "object",
      properties: {
        start: { type: "number", description: "วินาทีเริ่มต้นของช่วงที่จะตัดออก" },
        end: { type: "number", description: "วินาทีสิ้นสุดของช่วงที่จะตัดออก" },
      },
      required: ["start", "end"],
      additionalProperties: false,
    },
  },
  {
    name: "seek",
    description: "ย้ายเพลย์เฮดไปยังวินาทีที่ระบุในไทม์ไลน์",
    input_schema: {
      type: "object",
      properties: { seconds: { type: "number", description: "ตำแหน่งเวลาเป็นวินาที" } },
      required: ["seconds"],
      additionalProperties: false,
    },
  },
  { name: "play", description: "เล่นวิดีโอ", input_schema: noInput },
  { name: "pause", description: "หยุดวิดีโอชั่วคราว", input_schema: noInput },
  { name: "undo", description: "ย้อนการแก้ไขไทม์ไลน์ครั้งล่าสุด", input_schema: noInput },
  { name: "redo", description: "ทำซ้ำการแก้ไขที่เพิ่งย้อนไป", input_schema: noInput },
  {
    name: "generate_subtitles",
    description: "ถอดเสียงพูดในวิดีโอแล้วสร้างซับไตเติลภาษาไทยอัตโนมัติ (ใช้เวลาสักครู่ และแทนที่ซับเดิมทั้งหมด)",
    input_schema: noInput,
  },
  { name: "clear_subtitles", description: "ลบซับไตเติลทั้งหมดออก", input_schema: noInput },
  {
    name: "apply_subtitle_preset",
    description: `ใช้สไตล์ซับไตเติลสำเร็จรูป: ${SUBTITLE_PRESETS.map((p) => `${p.id} (${p.label})`).join(", ")}`,
    input_schema: {
      type: "object",
      properties: { preset: { type: "string", enum: PRESET_IDS } },
      required: ["preset"],
      additionalProperties: false,
    },
  },
  {
    name: "set_subtitle_style",
    description:
      "ปรับหน้าตาซับไตเติล ส่งมาเฉพาะค่าที่ต้องการเปลี่ยน สีเป็นรหัส hex เช่น #ffcc00 ตำแหน่ง x/y เป็นเปอร์เซ็นต์ของเฟรม (x 50 = กึ่งกลางแนวนอน, y 10 = บน, 50 = กลาง, 88 = ล่าง)",
    input_schema: {
      type: "object",
      properties: {
        fontFamily: { type: "string", enum: FONT_IDS },
        fontSize: { type: "number", description: "ขนาดตัวอักษร 12-64" },
        color: { type: "string" },
        bold: { type: "boolean" },
        shadow: { type: "boolean" },
        outlineWidth: { type: "number", description: "ความหนาขอบตัวอักษร 0-8 (0 = ไม่มีขอบ)" },
        outlineColor: { type: "string" },
        backgroundColor: { type: "string" },
        backgroundOpacity: { type: "number", description: "ความทึบของกรอบพื้นหลัง 0-1 (0 = ไม่มีกรอบ)" },
        boxRadius: { type: "number", description: "มุมโค้งของกรอบ 0-32" },
        x: { type: "number" },
        y: { type: "number" },
        animation: {
          type: "string",
          enum: ANIMATION_IDS,
          description: SUBTITLE_ANIMATIONS.map((a) => `${a.id} = ${a.label}`).join(", "),
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "set_video_transform",
    description:
      "ซูมหรือย้ายตำแหน่งวิดีโอของคลิปที่เพลย์เฮดอยู่ ใช้ mode 'fit' เพื่อให้เห็นทั้งภาพพอดีกรอบ หรือ 'fill' เพื่อให้เต็มกรอบไม่มีขอบดำ หรือระบุ scale (1 = พอดีกรอบ, 2 = ซูมสองเท่า) และ x/y เป็นเปอร์เซ็นต์ที่เลื่อนจากกึ่งกลาง (x บวก = ไปทางขวา, y บวก = ลงล่าง)",
    input_schema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["fit", "fill"] },
        scale: { type: "number" },
        x: { type: "number" },
        y: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  { name: "save_project", description: "บันทึกโปรเจกต์", input_schema: noInput },
  { name: "export_video", description: "ส่งออกวิดีโอเป็นไฟล์ MP4 แล้วดาวน์โหลด", input_schema: noInput },
];

export type DirectorContext = {
  clipCount: number;
  totalDuration: number;
  playhead: number;
  isPlaying: boolean;
  subtitleCount: number;
  subtitleStyle: SubtitleStyle;
  videoTransform: { x: number; y: number; scale: number } | null;
};

function buildSystemPrompt(ctx: DirectorContext) {
  return `คุณคือ "ผู้กำกับ AI" ผู้ช่วยตัดต่อวิดีโอในแอป WemCut คุณทำงานโดยเรียกเครื่องมือของตัวแก้ไขแทนผู้ใช้

สถานะปัจจุบันของโปรเจกต์:
- จำนวนคลิป: ${ctx.clipCount}
- ความยาวรวม: ${ctx.totalDuration.toFixed(1)} วินาที
- เพลย์เฮด: ${ctx.playhead.toFixed(1)} วินาที (${ctx.isPlaying ? "กำลังเล่น" : "หยุดอยู่"})
- ซับไตเติล: ${ctx.subtitleCount > 0 ? `${ctx.subtitleCount} บรรทัด` : "ยังไม่มี"}
- สไตล์ซับไตเติล: ${JSON.stringify(ctx.subtitleStyle)}
- การซูม/ตำแหน่งของคลิปปัจจุบัน: ${ctx.videoTransform ? JSON.stringify(ctx.videoTransform) : "ไม่มีคลิป"}

วิธีทำงาน:
- ถ้าคำขอทำได้ด้วยเครื่องมือ ให้เรียกเครื่องมือทันทีโดยไม่ต้องขออนุญาตหรือบอกแผนก่อน คำขอที่มีหลายอย่างให้เรียกเครื่องมือให้ครบทุกอย่าง
- เครื่องมือจะถูกเข้าคิวไว้ แล้วตัวแก้ไขจะทำตามลำดับที่คุณเรียกหลังจากคุณตอบเสร็จ คุณจึงไม่เห็นผลลัพธ์จริง อย่าอ้างผลที่ยังไม่รู้ เช่น จำนวนช่วงเงียบที่ตัดไป
- เมื่อเรียกเครื่องมือครบแล้ว ให้สรุปสั้นๆ ว่าสั่งอะไรไปบ้าง
- การปรับสไตล์ซับไตเติลทำได้แม้ยังไม่มีซับ แต่ควรบอกผู้ใช้ว่าต้องสร้างซับก่อนถึงจะเห็นผล
- สิ่งที่ยังทำไม่ได้: หาไฮไลต์อัตโนมัติ, เสียงพากย์ AI, ใส่เพลงหรือเสียงประกอบ, ใส่รูปภาพหรือข้อความอื่นนอกจากซับไตเติล, อัปโหลดไฟล์แทนผู้ใช้ ถ้าถูกขอ ให้บอกตรงๆ ว่ายังไม่รองรับ อย่าทำเป็นว่าทำสำเร็จ
- ถ้าคำขอกำกวม ให้ถามกลับสั้นๆ แทนการเดา
- ตอบเป็นภาษาไทย ใช้สรรพนาม "ผม" และลงท้าย "ครับ" กระชับไม่เกิน 2 ประโยค เป็นข้อความธรรมดา ไม่ใช้อีโมจิ หัวข้อ หรือรายการ`;
}

export type DirectorAction =
  | { tool: "remove_silence" | "split_at_playhead" | "delete_current_clip" }
  | { tool: "play" | "pause" | "undo" | "redo" }
  | { tool: "generate_subtitles" | "clear_subtitles" | "save_project" | "export_video" }
  | { tool: "seek"; seconds: number }
  | { tool: "delete_range"; start: number; end: number }
  | { tool: "apply_subtitle_preset"; preset: string }
  | { tool: "set_subtitle_style"; style: Partial<SubtitleStyle> }
  | { tool: "set_video_transform"; mode?: "fit" | "fill"; scale?: number; x?: number; y?: number };

export type DirectorReply = { message: string; actions: DirectorAction[] };

const SIMPLE_TOOLS = new Set([
  "remove_silence",
  "split_at_playhead",
  "delete_current_clip",
  "play",
  "pause",
  "undo",
  "redo",
  "generate_subtitles",
  "clear_subtitles",
  "save_project",
  "export_video",
]);

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// The model's tool input is untrusted: keep only known fields, in valid ranges.
function sanitizeSubtitleStyle(input: Record<string, unknown>): Partial<SubtitleStyle> {
  const style: Partial<SubtitleStyle> = {};
  const num = (key: string) => (typeof input[key] === "number" && Number.isFinite(input[key]) ? (input[key] as number) : null);
  const color = (key: string) => (typeof input[key] === "string" && HEX_COLOR.test(input[key] as string) ? (input[key] as string) : null);

  if (typeof input.fontFamily === "string" && FONT_IDS.includes(input.fontFamily)) style.fontFamily = input.fontFamily;
  if (typeof input.animation === "string" && ANIMATION_IDS.includes(input.animation)) style.animation = input.animation;
  if (typeof input.bold === "boolean") style.bold = input.bold;
  if (typeof input.shadow === "boolean") style.shadow = input.shadow;

  const fontSize = num("fontSize");
  if (fontSize !== null) style.fontSize = Math.round(clamp(fontSize, 12, 64));
  const outlineWidth = num("outlineWidth");
  if (outlineWidth !== null) style.outlineWidth = clamp(outlineWidth, 0, 8);
  const backgroundOpacity = num("backgroundOpacity");
  if (backgroundOpacity !== null) style.backgroundOpacity = clamp(backgroundOpacity, 0, 1);
  const boxRadius = num("boxRadius");
  if (boxRadius !== null) style.boxRadius = clamp(boxRadius, 0, 32);
  const x = num("x");
  if (x !== null) style.x = clamp(x, 0, 100);
  const y = num("y");
  if (y !== null) style.y = clamp(y, 0, 100);

  const textColor = color("color");
  if (textColor) style.color = textColor;
  const outlineColor = color("outlineColor");
  if (outlineColor) style.outlineColor = outlineColor;
  const backgroundColor = color("backgroundColor");
  if (backgroundColor) style.backgroundColor = backgroundColor;

  return style;
}

function toAction(name: string, rawInput: unknown): DirectorAction | null {
  const input = (rawInput && typeof rawInput === "object" ? rawInput : {}) as Record<string, unknown>;

  if (SIMPLE_TOOLS.has(name)) return { tool: name } as DirectorAction;

  if (name === "seek") {
    return typeof input.seconds === "number" && Number.isFinite(input.seconds)
      ? { tool: "seek", seconds: Math.max(0, input.seconds) }
      : null;
  }
  if (name === "delete_range") {
    const { start, end } = input;
    return typeof start === "number" && typeof end === "number" && Number.isFinite(start) && end > start
      ? { tool: "delete_range", start: Math.max(0, start), end }
      : null;
  }
  if (name === "apply_subtitle_preset") {
    return typeof input.preset === "string" && PRESET_IDS.includes(input.preset)
      ? { tool: "apply_subtitle_preset", preset: input.preset }
      : null;
  }
  if (name === "set_subtitle_style") {
    const style = sanitizeSubtitleStyle(input);
    return Object.keys(style).length > 0 ? { tool: "set_subtitle_style", style } : null;
  }
  if (name === "set_video_transform") {
    const action: DirectorAction = { tool: "set_video_transform" };
    if (input.mode === "fit" || input.mode === "fill") action.mode = input.mode;
    if (typeof input.scale === "number" && Number.isFinite(input.scale)) {
      action.scale = clamp(input.scale, MIN_CLIP_SCALE, MAX_CLIP_SCALE);
    }
    if (typeof input.x === "number" && Number.isFinite(input.x)) action.x = clamp(input.x, -200, 200);
    if (typeof input.y === "number" && Number.isFinite(input.y)) action.y = clamp(input.y, -200, 200);
    return Object.keys(action).length > 1 ? action : null;
  }
  return null;
}

// The editor runs the actions in the browser after the model has finished, so
// the model never sees real tool results. Each call is acknowledged with this
// instead, which lets it go on to queue the next step of a multi-step request.
const QUEUED_RESULT = "รับคำสั่งแล้ว จะทำงานตามลำดับที่สั่ง";
const MAX_TURNS = 8;

export async function runDirector(
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
  context: DirectorContext
): Promise<DirectorReply> {
  const client = new Anthropic();
  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  const actions: DirectorAction[] = [];
  let message = "";

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: buildSystemPrompt(context),
      tools,
      tool_choice: { type: "auto" },
      messages,
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();
    if (text) message = text;

    const toolUses = response.content.filter((block) => block.type === "tool_use");
    for (const block of toolUses) {
      const action = toAction(block.name, block.input);
      if (action) actions.push(action);
    }

    if (response.stop_reason !== "tool_use" || toolUses.length === 0) break;

    messages.push({ role: "assistant", content: response.content });
    messages.push({
      role: "user",
      content: toolUses.map((block) => ({ type: "tool_result" as const, tool_use_id: block.id, content: QUEUED_RESULT })),
    });
  }

  if (!message) {
    message = actions.length > 0 ? "ทำให้เรียบร้อยแล้วครับ" : "ขออภัยครับ ผมไม่แน่ใจว่าต้องทำอะไร ลองอธิบายเพิ่มอีกนิดได้ไหมครับ";
  }
  return { message, actions };
}
