"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { createProject } from "@/app/actions/projects";
import {
  CANVAS_PRESETS,
  MAX_CANVAS_SIDE,
  MIN_CANVAS_SIDE,
  parseCanvasSize,
  type CanvasSize,
} from "@/lib/canvas-size";
import { cn } from "@/lib/utils";

const CUSTOM = "custom";
// The shape drawn on each tile fits inside a box of this many pixels.
const THUMB_BOX = 44;

function RatioThumb({ size, active }: { size: CanvasSize; active: boolean }) {
  const scale = THUMB_BOX / Math.max(size.width, size.height);
  return (
    <span className="flex shrink-0 items-center justify-center" style={{ width: THUMB_BOX, height: THUMB_BOX }}>
      <span
        className="block rounded-[3px] transition-colors"
        style={{
          width: Math.max(8, size.width * scale),
          height: Math.max(8, size.height * scale),
          border: `1.5px solid ${active ? "var(--lp-red)" : "rgba(255,255,255,0.35)"}`,
          background: active ? "rgba(229,72,59,0.14)" : "rgba(255,255,255,0.04)",
        }}
      />
    </span>
  );
}

function SizeInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-[11px]" style={{ color: "var(--lp-text-3)" }}>
      {label}
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
        className="lp-mono mt-1 block h-9 w-24 rounded-md bg-white/[0.04] px-2.5 text-sm text-white outline-none focus:border-[color:var(--lp-red)]"
        style={{ border: "1px solid var(--lp-line)" }}
      />
    </label>
  );
}

export function NewProjectDialog() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(CANVAS_PRESETS[0].id);
  const [customWidth, setCustomWidth] = useState("1080");
  const [customHeight, setCustomHeight] = useState("1920");

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const isCustom = selected === CUSTOM;
  const preset = CANVAS_PRESETS.find((p) => p.id === selected);
  const size = preset ? preset.size : parseCanvasSize(customWidth, customHeight);
  // Custom sizes are rounded to an even number in range; show what will really be created.
  const adjusted =
    isCustom && size !== null && (String(size.width) !== customWidth || String(size.height) !== customHeight);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lp-btn-solid inline-flex h-11 items-center gap-2.5 rounded-xl px-6 text-sm font-bold"
      >
        <Plus className="w-4 h-4" />
        สร้างโปรเจกต์ใหม่
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <form
            action={createProject}
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-title"
            className="lp-card lp-rise relative max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto p-7 sm:p-8"
            style={{ border: "1px solid var(--lp-line)", background: "rgba(12,10,10,0.94)" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="lp-mono text-[11px] tracking-[0.2em]" style={{ color: "var(--lp-red)" }}>
                  โปรเจกต์ใหม่
                </p>
                <h2 id="new-project-title" className="mt-2 text-2xl font-bold tracking-tight">
                  เลือกขนาดวิดีโอ
                </h2>
              </div>
              <button
                type="button"
                aria-label="ปิด"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 transition-colors hover:bg-white/10"
                style={{ color: "var(--lp-text-2)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-6 block text-xs" style={{ color: "var(--lp-text-2)" }}>
              ชื่อโปรเจกต์
              <input
                name="name"
                maxLength={200}
                placeholder="Untitled Project"
                autoFocus
                className="mt-1.5 block h-10 w-full rounded-lg bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[color:var(--lp-red)]"
                style={{ border: "1px solid var(--lp-line)" }}
              />
            </label>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CANVAS_PRESETS.map((p) => {
                const active = selected === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelected(p.id)}
                    className={cn("flex items-center gap-3 rounded-lg p-3 text-left transition-colors", !active && "hover:bg-white/[0.04]")}
                    style={{
                      border: `1px solid ${active ? "rgba(229,72,59,0.7)" : "var(--lp-line)"}`,
                      background: active ? "rgba(229,72,59,0.08)" : undefined,
                    }}
                  >
                    <RatioThumb size={p.size} active={active} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {p.label} <span className="lp-mono text-[10px] font-normal opacity-60">{p.ratio}</span>
                      </span>
                      <span className="block truncate text-[11px]" style={{ color: "var(--lp-text-3)" }}>
                        {p.hint}
                      </span>
                      <span className="lp-mono block text-[10px]" style={{ color: "var(--lp-text-3)" }}>
                        {p.size.width}×{p.size.height}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              className="mt-2 rounded-lg p-3 transition-colors"
              style={{
                border: `1px solid ${isCustom ? "rgba(229,72,59,0.7)" : "var(--lp-line)"}`,
                background: isCustom ? "rgba(229,72,59,0.08)" : undefined,
              }}
            >
              <button
                type="button"
                aria-pressed={isCustom}
                onClick={() => setSelected(CUSTOM)}
                className="block w-full text-left text-sm font-semibold"
              >
                กำหนดเอง
                <span className="ml-2 text-[11px] font-normal" style={{ color: "var(--lp-text-3)" }}>
                  {MIN_CANVAS_SIDE}–{MAX_CANVAS_SIDE} พิกเซลต่อด้าน
                </span>
              </button>

              {isCustom && (
                <>
                  <div className="mt-3 flex items-end gap-2">
                    <SizeInput label="กว้าง" value={customWidth} onChange={setCustomWidth} />
                    <span className="pb-2 text-sm" style={{ color: "var(--lp-text-3)" }}>
                      ×
                    </span>
                    <SizeInput label="สูง" value={customHeight} onChange={setCustomHeight} />
                    {size && (
                      <span className="ml-auto">
                        <RatioThumb size={size} active />
                      </span>
                    )}
                  </div>
                  {!size && (
                    <p className="mt-2 text-xs" style={{ color: "#ff8a80" }}>
                      กรุณาใส่ความกว้างและความสูงเป็นตัวเลข
                    </p>
                  )}
                  {adjusted && size && (
                    <p className="mt-2 text-xs" style={{ color: "var(--lp-text-2)" }}>
                      จะสร้างเป็น {size.width}×{size.height} (ปรับเป็นเลขคู่และให้อยู่ในช่วงที่รองรับ)
                    </p>
                  )}
                </>
              )}
            </div>

            <input type="hidden" name="width" value={size?.width ?? ""} />
            <input type="hidden" name="height" value={size?.height ?? ""} />

            <div className="mt-7 flex items-center justify-between gap-4">
              <p className="lp-mono text-[11px]" style={{ color: "var(--lp-text-3)" }}>
                {size ? `${size.width} × ${size.height} px` : ""}
              </p>
              <SubmitButton
                disabled={!size}
                className="lp-btn-solid h-11 gap-2.5 rounded-xl border-0 px-6 text-sm font-bold text-[#0a0a0a] hover:bg-white"
              >
                สร้างโปรเจกต์
              </SubmitButton>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
