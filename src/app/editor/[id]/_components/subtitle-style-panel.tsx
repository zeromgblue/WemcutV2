"use client";

import { useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUBTITLE_FONT_OPTIONS, type SubtitleStyle } from "@/lib/subtitle-style";

const POSITION_PRESETS: { label: string; x: number; y: number }[] = [
  { label: "บน", x: 50, y: 10 },
  { label: "กลาง", x: 50, y: 50 },
  { label: "ล่าง", x: 50, y: 88 },
];

const ANIMATION_LABELS: Record<SubtitleStyle["animation"], string> = {
  none: "ไม่มี",
  fade: "Fade",
  "slide-up": "เลื่อนขึ้น",
  pop: "Pop",
};

export function SubtitleStylePanel({
  style,
  onChange,
  disabled,
}: {
  style: SubtitleStyle;
  onChange: (next: SubtitleStyle) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);

  function set<K extends keyof SubtitleStyle>(key: K, value: SubtitleStyle[K]) {
    onChange({ ...style, [key]: value });
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 h-9 px-3 font-normal text-muted-foreground hover:text-foreground"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
      >
        <Palette className="w-4 h-4" />
        แต่งซับไตเติล
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 left-full top-0 ml-2 w-64 rounded-lg border border-border bg-sidebar p-3 shadow-2xl space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">ฟอนต์</label>
              <select
                value={style.fontFamily}
                onChange={(e) => set("fontFamily", e.target.value as SubtitleStyle["fontFamily"])}
                className="mt-1 w-full h-8 rounded-md bg-background border border-border text-sm px-2 text-foreground"
              >
                {SUBTITLE_FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">ขนาดตัวอักษร: {style.fontSize}px</label>
              <input
                type="range"
                min={14}
                max={40}
                step={1}
                value={style.fontSize}
                onChange={(e) => set("fontSize", Number(e.target.value))}
                className="mt-1 w-full accent-amber-500"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={style.bold}
                onChange={(e) => set("bold", e.target.checked)}
                className="accent-amber-500"
              />
              ตัวหนา
            </label>

            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">สีข้อความ</label>
              <input
                type="color"
                value={style.color}
                onChange={(e) => set("color", e.target.value)}
                className="h-7 w-10 rounded border border-border bg-transparent"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">สีกรอบ</label>
              <input
                type="color"
                value={style.backgroundColor}
                onChange={(e) => set("backgroundColor", e.target.value)}
                className="h-7 w-10 rounded border border-border bg-transparent"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">
                ความทึบกรอบ: {Math.round(style.backgroundOpacity * 100)}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(style.backgroundOpacity * 100)}
                onChange={(e) => set("backgroundOpacity", Number(e.target.value) / 100)}
                className="mt-1 w-full accent-amber-500"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">ตำแหน่ง</label>
              <div className="mt-1 grid grid-cols-3 gap-1">
                {POSITION_PRESETS.map((preset) => {
                  const active = Math.abs(style.x - preset.x) < 1 && Math.abs(style.y - preset.y) < 1;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => onChange({ ...style, x: preset.x, y: preset.y })}
                      className={`h-7 rounded-md text-xs border transition-colors ${
                        active
                          ? "border-amber-500 text-amber-400 bg-amber-500/10"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground leading-snug">
                หรือกด-ลากที่ตัวซับไตเติลบนหน้าพรีวิวเพื่อขยับตำแหน่งอิสระ (ใช้นิ้วบนมือถือได้)
              </p>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">อนิเมชัน</label>
              <select
                value={style.animation}
                onChange={(e) => set("animation", e.target.value as SubtitleStyle["animation"])}
                className="mt-1 w-full h-8 rounded-md bg-background border border-border text-sm px-2 text-foreground"
              >
                {(Object.keys(ANIMATION_LABELS) as SubtitleStyle["animation"][]).map((a) => (
                  <option key={a} value={a}>
                    {ANIMATION_LABELS[a]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
