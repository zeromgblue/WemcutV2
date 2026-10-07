/** Output frame of a project, in pixels. */
export type CanvasSize = { width: number; height: number };

export const MIN_CANVAS_SIDE = 240;
// The export encodes H.264 in the browser, which is only reliably available up to 1080p.
export const MAX_CANVAS_SIDE = 1920;

export const CANVAS_PRESETS: { id: string; label: string; hint: string; ratio: string; size: CanvasSize }[] = [
  { id: "vertical", label: "แนวตั้ง", hint: "TikTok, Reels, Shorts", ratio: "9:16", size: { width: 1080, height: 1920 } },
  { id: "horizontal", label: "แนวนอน", hint: "YouTube", ratio: "16:9", size: { width: 1920, height: 1080 } },
  { id: "square", label: "จัตุรัส", hint: "Instagram, Facebook", ratio: "1:1", size: { width: 1080, height: 1080 } },
  { id: "portrait", label: "โพสต์แนวตั้ง", hint: "ฟีด Instagram", ratio: "4:5", size: { width: 1080, height: 1350 } },
  { id: "classic", label: "คลาสสิก", hint: "งานนำเสนอ", ratio: "4:3", size: { width: 1440, height: 1080 } },
  { id: "cinema", label: "ภาพยนตร์", hint: "จอกว้างพิเศษ", ratio: "21:9", size: { width: 1920, height: 822 } },
];

/** Video encoders need even dimensions. */
function toEvenInRange(value: number) {
  const clamped = Math.min(Math.max(Math.round(value), MIN_CANVAS_SIDE), MAX_CANVAS_SIDE);
  return clamped - (clamped % 2);
}

/** A usable canvas size from untrusted input (form fields, saved JSON), or null if it isn't one. */
export function parseCanvasSize(width: unknown, height: unknown): CanvasSize | null {
  if (width === "" || height === "" || width == null || height == null) return null;
  const w = Number(width);
  const h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return { width: toEvenInRange(w), height: toEvenInRange(h) };
}
