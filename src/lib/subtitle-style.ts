export type SubtitleStyle = {
  fontFamily: "kanit" | "prompt" | "sarabun";
  fontSize: number;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  /** Center position as a percentage of the video frame, 0-100. */
  x: number;
  y: number;
  animation: "none" | "fade" | "slide-up" | "pop";
  bold: boolean;
};

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  fontFamily: "kanit",
  fontSize: 22,
  color: "#ffffff",
  backgroundColor: "#000000",
  backgroundOpacity: 0.7,
  x: 50,
  y: 88,
  animation: "fade",
  bold: true,
};

const LEGACY_POSITION_Y: Record<string, number> = { top: 10, middle: 50, bottom: 88 };

/** Older saved styles used a top/middle/bottom preset instead of x/y percentages. */
export function migrateSubtitleStyle(raw: Record<string, unknown>): SubtitleStyle {
  const merged = { ...DEFAULT_SUBTITLE_STYLE, ...raw } as SubtitleStyle & { position?: string };
  if (typeof merged.position === "string" && typeof raw.x !== "number") {
    merged.x = 50;
    merged.y = LEGACY_POSITION_Y[merged.position] ?? DEFAULT_SUBTITLE_STYLE.y;
  }
  return merged;
}

export const SUBTITLE_FONT_OPTIONS: { value: SubtitleStyle["fontFamily"]; label: string; cssVar: string }[] = [
  { value: "kanit", label: "Kanit", cssVar: "var(--font-kanit)" },
  { value: "prompt", label: "Prompt", cssVar: "var(--font-prompt)" },
  { value: "sarabun", label: "Sarabun", cssVar: "var(--font-sarabun)" },
];

export const SUBTITLE_ANIMATION_CLASSES: Record<SubtitleStyle["animation"], string> = {
  none: "",
  fade: "animate-in fade-in duration-300",
  "slide-up": "animate-in slide-in-from-bottom-4 fade-in duration-300",
  pop: "animate-in zoom-in-50 fade-in duration-200",
};

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const value = parseInt(clean, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
