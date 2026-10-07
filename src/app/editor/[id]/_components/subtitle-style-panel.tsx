"use client";

import { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SUBTITLE_ANIMATIONS,
  SUBTITLE_PRESETS,
  subtitleAnimationStyle,
  subtitleTextStyle,
  type SubtitleStyle,
} from "@/lib/subtitle-style";
import { SUBTITLE_FONTS, subtitleFontFamily, type SubtitleFont } from "@/lib/subtitle-fonts";
import { cn } from "@/lib/utils";

const POSITION_PRESETS: { label: string; x: number; y: number }[] = [
  { label: "บน", x: 50, y: 10 },
  { label: "กลาง", x: 50, y: 50 },
  { label: "ล่าง", x: 50, y: 88 },
];

const FONT_GROUPS: SubtitleFont["group"][] = ["ทันสมัย", "เป็นกันเอง", "ลายมือ", "ทางการ"];

// Sample tiles render the subtitle style as it would look on a frame this small.
const SAMPLE_FRAME_SIZE = 420;
// How often the animation samples replay.
const REPLAY_INTERVAL_MS = 2200;

const tileClass = (active: boolean) =>
  cn(
    "rounded-md border transition-colors",
    active
      ? "border-brand-500 bg-brand-500/10 text-foreground"
      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
  );

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-xs text-muted-foreground">
      {label}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 block w-full accent-brand-500"
      />
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center justify-between text-xs text-muted-foreground">
      {label}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-10 rounded border border-border bg-transparent"
      />
    </label>
  );
}

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
  // Bumped on a timer while the panel is open so the animation samples replay.
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => setReplay((n) => n + 1), REPLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [open]);

  function set<K extends keyof SubtitleStyle>(key: K, value: SubtitleStyle[K]) {
    onChange({ ...style, [key]: value });
  }

  const sampleStyle = subtitleTextStyle(style, subtitleFontFamily(style.fontFamily), SAMPLE_FRAME_SIZE);

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
          <div className="absolute z-20 left-full top-0 ml-2 w-80 max-h-[min(78vh,720px)] overflow-y-auto rounded-lg border border-border bg-sidebar shadow-2xl">
            {/* Live sample of the current style, replaying the chosen animation. */}
            <div className="sticky top-0 z-10 flex h-20 items-center justify-center overflow-hidden border-b border-border bg-[repeating-conic-gradient(#1c1c1c_0_25%,#141414_0_50%)] bg-[length:16px_16px]">
              <span key={replay} className="block text-center" style={{ ...sampleStyle, ...subtitleAnimationStyle(style.animation) }}>
                สวัสดีครับ Hello
              </span>
            </div>

            <div className="space-y-4 p-3">
              <Section title="สไตล์สำเร็จรูป">
                <div className="grid grid-cols-4 gap-1">
                  {SUBTITLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onChange({ ...style, ...preset.style })}
                      className={cn(tileClass(false), "h-12 flex flex-col items-center justify-center gap-0.5 overflow-hidden")}
                    >
                      <span
                        className="leading-none"
                        style={{
                          ...subtitleTextStyle(
                            { ...style, ...preset.style, fontSize: 20 },
                            subtitleFontFamily(preset.style.fontFamily ?? style.fontFamily),
                            SAMPLE_FRAME_SIZE
                          ),
                          padding: "0.15em 0.35em",
                        }}
                      >
                        กข
                      </span>
                      <span className="text-[10px]">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="ฟอนต์">
                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {FONT_GROUPS.map((group) => (
                    <div key={group}>
                      <p className="mb-1 text-[10px] text-muted-foreground/70">{group}</p>
                      <div className="grid grid-cols-2 gap-1">
                        {SUBTITLE_FONTS.filter((font) => font.group === group).map((font) => (
                          <button
                            key={font.value}
                            type="button"
                            onClick={() => set("fontFamily", font.value)}
                            className={cn(tileClass(style.fontFamily === font.value), "px-2 py-1.5 text-left")}
                          >
                            <span className="block truncate text-base leading-tight" style={{ fontFamily: font.family }}>
                              สวัสดี Aa
                            </span>
                            <span className="block truncate text-[10px] opacity-70">{font.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="ตัวอักษร">
                <div className="space-y-2.5">
                  <Slider label={`ขนาด: ${style.fontSize}px`} value={style.fontSize} min={12} max={64} onChange={(v) => set("fontSize", v)} />
                  <ColorField label="สีข้อความ" value={style.color} onChange={(v) => set("color", v)} />
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={style.bold} onChange={(e) => set("bold", e.target.checked)} className="accent-brand-500" />
                      ตัวหนา
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={style.shadow} onChange={(e) => set("shadow", e.target.checked)} className="accent-brand-500" />
                      เงา
                    </label>
                  </div>
                </div>
              </Section>

              <Section title="ขอบตัวอักษร">
                <div className="space-y-2.5">
                  <Slider
                    label={style.outlineWidth > 0 ? `ความหนา: ${style.outlineWidth}px` : "ความหนา: ปิด"}
                    value={style.outlineWidth}
                    min={0}
                    max={8}
                    step={0.5}
                    onChange={(v) => set("outlineWidth", v)}
                  />
                  <ColorField label="สีขอบ" value={style.outlineColor} onChange={(v) => set("outlineColor", v)} />
                </div>
              </Section>

              <Section title="กรอบพื้นหลัง">
                <div className="space-y-2.5">
                  <ColorField label="สีกรอบ" value={style.backgroundColor} onChange={(v) => set("backgroundColor", v)} />
                  <Slider
                    label={`ความทึบ: ${Math.round(style.backgroundOpacity * 100)}%`}
                    value={Math.round(style.backgroundOpacity * 100)}
                    min={0}
                    max={100}
                    step={5}
                    onChange={(v) => set("backgroundOpacity", v / 100)}
                  />
                  <Slider label={`มุมโค้ง: ${style.boxRadius}px`} value={style.boxRadius} min={0} max={32} onChange={(v) => set("boxRadius", v)} />
                </div>
              </Section>

              <Section title="ตำแหน่ง">
                <div className="grid grid-cols-3 gap-1">
                  {POSITION_PRESETS.map((preset) => {
                    const active = Math.abs(style.x - preset.x) < 1 && Math.abs(style.y - preset.y) < 1;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => onChange({ ...style, x: preset.x, y: preset.y })}
                        className={cn(tileClass(active), "h-7 text-xs")}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[10px] text-muted-foreground leading-snug">
                  หรือกด-ลากที่ตัวซับไตเติลบนหน้าพรีวิวเพื่อขยับตำแหน่งอิสระ (ใช้นิ้วบนมือถือได้)
                </p>
              </Section>

              <Section title="อนิเมชัน">
                <div className="grid grid-cols-2 gap-1">
                  {SUBTITLE_ANIMATIONS.map((animation) => (
                    <button
                      key={animation.id}
                      type="button"
                      onClick={() => set("animation", animation.id)}
                      className={cn(tileClass(style.animation === animation.id), "overflow-hidden px-2 pt-2 pb-1.5")}
                    >
                      <span className="flex h-8 items-center justify-center">
                        <span
                          key={replay}
                          className="rounded bg-foreground/90 px-2 py-0.5 text-xs font-semibold text-background"
                          style={subtitleAnimationStyle(animation.id)}
                        >
                          ซับไตเติล
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-[10px]">{animation.label}</span>
                    </button>
                  ))}
                </div>
              </Section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
