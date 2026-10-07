import type { CSSProperties } from "react";
import { SUBTITLE_FONTS } from "./subtitle-fonts";

export type SubtitleStyle = {
  /** A `value` from SUBTITLE_FONTS. */
  fontFamily: string;
  /** Font size in px on a frame whose shorter side is 720px; scales with the frame. */
  fontSize: number;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  /** Center position as a percentage of the video frame, 0-100. */
  x: number;
  y: number;
  /** An `id` from SUBTITLE_ANIMATIONS. */
  animation: string;
  bold: boolean;
  /** Outline thickness, on the same scale as fontSize; 0 turns it off. */
  outlineWidth: number;
  outlineColor: string;
  shadow: boolean;
  /** Corner radius of the background box, on the same scale as fontSize. */
  boxRadius: number;
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
  outlineWidth: 0,
  outlineColor: "#000000",
  shadow: false,
  boxRadius: 8,
};

/** fontSize, outlineWidth and boxRadius are in px on a frame whose shorter side
 * is this long. Using the shorter side keeps text the same size relative to
 * the frame whether the project is horizontal or vertical. */
export const SUBTITLE_REFERENCE_SIZE = 720;

// ─── Animations ───────────────────────────────────────────
// Every animation is an entrance: the line starts in the `from` state and
// settles into place. Describing them as data lets the preview (CSS) and the
// export (canvas) play the same motion.

type AnimationFrom = {
  opacity?: number;
  /** Offsets in em, so the motion scales with the font size. */
  x?: number;
  y?: number;
  scale?: number;
  /** Degrees. */
  rotate?: number;
  /** Blur radius in em. */
  blur?: number;
  /** Fraction of the line hidden from the right edge (typewriter-style reveal). */
  clip?: number;
};

export type SubtitleAnimation = {
  id: string;
  label: string;
  /** Seconds. */
  duration: number;
  easing: "smooth" | "back" | "linear";
  from: AnimationFrom;
};

export const SUBTITLE_ANIMATIONS: SubtitleAnimation[] = [
  { id: "none", label: "ไม่มี", duration: 0, easing: "linear", from: {} },
  { id: "fade", label: "ค่อยๆ ปรากฏ", duration: 0.3, easing: "smooth", from: { opacity: 0 } },
  { id: "slide-up", label: "เลื่อนขึ้น", duration: 0.35, easing: "smooth", from: { opacity: 0, y: 0.8 } },
  { id: "slide-down", label: "เลื่อนลง", duration: 0.35, easing: "smooth", from: { opacity: 0, y: -0.8 } },
  { id: "slide-left", label: "เข้าจากขวา", duration: 0.35, easing: "smooth", from: { opacity: 0, x: 1.6 } },
  { id: "slide-right", label: "เข้าจากซ้าย", duration: 0.35, easing: "smooth", from: { opacity: 0, x: -1.6 } },
  { id: "pop", label: "เด้ง", duration: 0.3, easing: "back", from: { opacity: 0, scale: 0.5 } },
  { id: "zoom-in", label: "ซูมเข้า", duration: 0.35, easing: "smooth", from: { opacity: 0, scale: 0.8 } },
  { id: "zoom-out", label: "ซูมออก", duration: 0.35, easing: "smooth", from: { opacity: 0, scale: 1.5 } },
  { id: "drop", label: "หล่นลงมา", duration: 0.45, easing: "back", from: { opacity: 0, y: -1.8 } },
  { id: "jump", label: "กระโดดขึ้น", duration: 0.45, easing: "back", from: { opacity: 0, y: 1.8 } },
  { id: "swing", label: "แกว่ง", duration: 0.45, easing: "back", from: { opacity: 0, rotate: -14 } },
  { id: "spin", label: "หมุนเข้า", duration: 0.45, easing: "smooth", from: { opacity: 0, rotate: 90, scale: 0.4 } },
  { id: "blur", label: "เบลอแล้วชัด", duration: 0.4, easing: "smooth", from: { opacity: 0, blur: 0.5 } },
  { id: "typewriter", label: "พิมพ์ทีละตัว", duration: 0.5, easing: "linear", from: { clip: 1 } },
  { id: "stamp", label: "ประทับ", duration: 0.25, easing: "smooth", from: { opacity: 0, scale: 2.2, rotate: -6 } },
];

export function getSubtitleAnimation(id: string) {
  return SUBTITLE_ANIMATIONS.find((a) => a.id === id) ?? SUBTITLE_ANIMATIONS[0];
}

const CSS_EASING: Record<SubtitleAnimation["easing"], string> = {
  smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
  back: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  linear: "linear",
};

/** Inline style that plays the animation through the `sub-enter` keyframes in globals.css. */
export function subtitleAnimationStyle(id: string): CSSProperties {
  const animation = getSubtitleAnimation(id);
  if (animation.duration === 0) return {};
  const { from } = animation;
  return {
    "--sub-o": from.opacity ?? 1,
    "--sub-x": `${from.x ?? 0}em`,
    "--sub-y": `${from.y ?? 0}em`,
    "--sub-s": from.scale ?? 1,
    "--sub-r": `${from.rotate ?? 0}deg`,
    "--sub-b": `${from.blur ?? 0}em`,
    // The clip box is 20% larger than the line so outlines and shadows aren't cut off.
    "--sub-c": `${from.clip ? from.clip * 100 : -20}%`,
    animation: `sub-enter ${animation.duration}s ${CSS_EASING[animation.easing]} both`,
  } as CSSProperties;
}

function ease(easing: SubtitleAnimation["easing"], t: number) {
  if (easing === "linear") return t;
  if (easing === "back") {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
  }
  return 1 - (1 - t) ** 4;
}

/** The animation's state `elapsed` seconds after the line appeared, for canvas rendering. */
export function subtitleAnimationState(id: string, elapsed: number) {
  const animation = getSubtitleAnimation(id);
  const raw = animation.duration > 0 ? Math.min(Math.max(elapsed / animation.duration, 0), 1) : 1;
  const p = ease(animation.easing, raw);
  const { from } = animation;
  const mix = (start: number, end: number) => start + (end - start) * p;
  return {
    opacity: Math.min(Math.max(mix(from.opacity ?? 1, 1), 0), 1),
    x: mix(from.x ?? 0, 0),
    y: mix(from.y ?? 0, 0),
    scale: mix(from.scale ?? 1, 1),
    rotate: mix(from.rotate ?? 0, 0),
    blur: Math.max(mix(from.blur ?? 0, 0), 0),
    clip: Math.min(Math.max(mix(from.clip ?? 0, 0), 0), 1),
  };
}

// ─── Presets ──────────────────────────────────────────────
export const SUBTITLE_PRESETS: { id: string; label: string; style: Partial<SubtitleStyle> }[] = [
  {
    id: "classic",
    label: "คลาสสิก",
    style: { fontFamily: "kanit", color: "#ffffff", backgroundColor: "#000000", backgroundOpacity: 0.7, outlineWidth: 0, shadow: false, bold: true, boxRadius: 8, animation: "fade" },
  },
  {
    id: "tiktok",
    label: "ไวรัล",
    style: { fontFamily: "mitr", color: "#ffe14d", backgroundOpacity: 0, outlineWidth: 4, outlineColor: "#000000", shadow: true, bold: true, animation: "pop" },
  },
  {
    id: "clean",
    label: "สะอาดตา",
    style: { fontFamily: "noto-sans-thai", color: "#ffffff", backgroundOpacity: 0, outlineWidth: 0, shadow: true, bold: false, animation: "slide-up" },
  },
  {
    id: "news",
    label: "ข่าว",
    style: { fontFamily: "sarabun", color: "#ffffff", backgroundColor: "#c9382c", backgroundOpacity: 1, outlineWidth: 0, shadow: false, bold: true, boxRadius: 0, animation: "slide-right" },
  },
  {
    id: "cute",
    label: "น่ารัก",
    style: { fontFamily: "mali", color: "#ff5fa2", backgroundColor: "#ffffff", backgroundOpacity: 0.95, outlineWidth: 0, shadow: false, bold: true, boxRadius: 20, animation: "jump" },
  },
  {
    id: "cinema",
    label: "ภาพยนตร์",
    style: { fontFamily: "noto-serif-thai", color: "#f4e9c9", backgroundOpacity: 0, outlineWidth: 1, outlineColor: "#000000", shadow: true, bold: false, animation: "blur" },
  },
  {
    id: "neon",
    label: "นีออน",
    style: { fontFamily: "chakra-petch", color: "#5ef2ff", backgroundColor: "#0b0b14", backgroundOpacity: 0.85, outlineWidth: 0, shadow: true, bold: true, boxRadius: 4, animation: "typewriter" },
  },
  {
    id: "handwritten",
    label: "ลายมือ",
    style: { fontFamily: "charm", color: "#ffffff", backgroundOpacity: 0, outlineWidth: 3, outlineColor: "#2a0c09", shadow: true, bold: true, animation: "swing" },
  },
];

const LEGACY_POSITION_Y: Record<string, number> = { top: 10, middle: 50, bottom: 88 };

/** Fills in fields missing from older saved styles and drops values that no longer exist. */
export function migrateSubtitleStyle(raw: Record<string, unknown>): SubtitleStyle {
  const merged = { ...DEFAULT_SUBTITLE_STYLE, ...raw } as SubtitleStyle & { position?: string };
  // Older styles used a top/middle/bottom preset instead of x/y percentages.
  if (typeof merged.position === "string" && typeof raw.x !== "number") {
    merged.x = 50;
    merged.y = LEGACY_POSITION_Y[merged.position] ?? DEFAULT_SUBTITLE_STYLE.y;
  }
  if (!SUBTITLE_FONTS.some((f) => f.value === merged.fontFamily)) {
    merged.fontFamily = DEFAULT_SUBTITLE_STYLE.fontFamily;
  }
  if (!SUBTITLE_ANIMATIONS.some((a) => a.id === merged.animation)) {
    merged.animation = DEFAULT_SUBTITLE_STYLE.animation;
  }
  return merged;
}

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const value = parseInt(clean, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Inline style for a subtitle line (everything except position and animation).
 * `frameShortSide` is the shorter side of the frame it is drawn on, in px. */
export function subtitleTextStyle(style: SubtitleStyle, fontFamily: string, frameShortSide: number): CSSProperties {
  const scale = frameShortSide / SUBTITLE_REFERENCE_SIZE;
  const outline = style.outlineWidth * scale;
  return {
    fontFamily,
    fontSize: style.fontSize * scale,
    color: style.color,
    backgroundColor: hexToRgba(style.backgroundColor, style.backgroundOpacity),
    fontWeight: style.bold ? 700 : 400,
    borderRadius: style.boxRadius * scale,
    padding: "0.3em 0.5em",
    lineHeight: 1.35,
    // The stroke is centred on the glyph edge and painted under the fill, so
    // twice the width leaves `outline` px visible outside the letters.
    WebkitTextStroke: outline > 0 ? `${outline * 2}px ${style.outlineColor}` : undefined,
    paintOrder: "stroke fill",
    textShadow: style.shadow ? `0 ${0.08}em ${0.25}em rgba(0, 0, 0, 0.75)` : undefined,
  };
}
