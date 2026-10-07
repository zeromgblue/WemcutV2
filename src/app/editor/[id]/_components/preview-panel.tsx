import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Maximize, Minimize, Minus, Plus } from "lucide-react";
import { subtitleAnimationStyle, subtitleTextStyle, type SubtitleStyle } from "@/lib/subtitle-style";
import { subtitleFontFamily } from "@/lib/subtitle-fonts";
import {
  DEFAULT_CLIP_TRANSFORM,
  clampScale,
  coverScale,
  transformedRect,
  type ClipTransform,
} from "@/lib/clip-transform";
import { cn } from "@/lib/utils";
import { VideoUploader } from "./video-uploader";

// Space kept free around the frame: panel padding, plus room for the toolbar below.
const PANEL_PADDING = 16;
const TOOLBAR_HEIGHT = 44;
// A press that moves less than this is a click, not a drag.
const DRAG_THRESHOLD_PX = 3;
// The video snaps to the centre when dragged within this many % of it.
const SNAP_PERCENT = 1.5;
const ZOOM_STEP = 1.1;

type Size = { width: number; height: number };
type Corner = "nw" | "ne" | "sw" | "se";

const CORNERS: { id: Corner; className: string }[] = [
  { id: "nw", className: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize" },
  { id: "ne", className: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize" },
  { id: "sw", className: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize" },
  { id: "se", className: "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize" },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function snap(value: number) {
  return Math.abs(value) < SNAP_PERCENT ? 0 : value;
}

export function PreviewPanel({
  videoUrl,
  projectId,
  videoRef,
  frameAspect,
  transform,
  onTransformStart,
  onTransformChange,
  onTransformEnd,
  onVideoDimensions,
  onVideoUploaded,
  subtitleText,
  subtitleKey,
  subtitleStyle,
  onSubtitlePositionChange,
  onTimeUpdate,
  onLoadedMetadata,
  onPlay,
  onPause,
  onEnded,
  onTogglePlay,
}: {
  videoUrl: string | null;
  projectId: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Width / height of the output frame. */
  frameAspect: number;
  /** Transform of the clip under the playhead; null when there is no clip to edit. */
  transform: ClipTransform | null;
  onTransformStart: () => void;
  onTransformChange: (next: ClipTransform) => void;
  onTransformEnd: () => void;
  onVideoDimensions: (width: number, height: number) => void;
  onVideoUploaded: (asset: { id: string; duration: number | null; videoUrl: string }) => void;
  subtitleText: string | null;
  subtitleKey: string | null;
  subtitleStyle: SubtitleStyle;
  onSubtitlePositionChange: (x: number, y: number) => void;
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onTogglePlay: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [panelSize, setPanelSize] = useState<Size>({ width: 0, height: 0 });
  const [videoSize, setVideoSize] = useState<Size>({ width: 0, height: 0 });
  const [selected, setSelected] = useState(false);
  const [dragging, setDragging] = useState(false);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const measure = () => setPanelSize({ width: panel.clientWidth, height: panel.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  // The largest frame of the output aspect ratio that fits in the panel.
  const availableWidth = Math.max(0, panelSize.width - PANEL_PADDING * 2);
  const availableHeight = Math.max(0, panelSize.height - PANEL_PADDING * 2 - TOOLBAR_HEIGHT);
  const frameWidth = Math.min(availableWidth, availableHeight * frameAspect);
  const frameHeight = frameWidth / frameAspect;

  const current = transform ?? DEFAULT_CLIP_TRANSFORM;
  const editable = transform !== null;
  const rect = transformedRect(current, videoSize.width, videoSize.height, frameWidth, frameHeight);

  // The latest values, for listeners that outlive a render (drag, wheel).
  const live = useRef({ current, frameWidth, frameHeight, onTransformStart, onTransformChange, onTransformEnd });
  useEffect(() => {
    live.current = { current, frameWidth, frameHeight, onTransformStart, onTransformChange, onTransformEnd };
  });

  // Wheel zoom. The listener must be non-passive to stop the page scrolling,
  // and a burst of wheel events is grouped into a single undo step.
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !selected || !editable) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const state = live.current;
      if (wheelTimer.current === null) state.onTransformStart();
      else clearTimeout(wheelTimer.current);
      wheelTimer.current = setTimeout(() => {
        wheelTimer.current = null;
        live.current.onTransformEnd();
      }, 350);
      state.onTransformChange({
        ...state.current,
        scale: clampScale(state.current.scale * Math.exp(-e.deltaY * 0.0015)),
      });
    }

    frame.addEventListener("wheel", onWheel, { passive: false });
    return () => frame.removeEventListener("wheel", onWheel);
  }, [selected, editable]);

  function commit(next: ClipTransform) {
    onTransformStart();
    onTransformChange(next);
    onTransformEnd();
  }

  function handleMovePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.preventDefault();
    const wasSelected = selected;
    setSelected(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const origin = live.current.current;
    let moved = false;

    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved) {
        if (!editable || Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
        moved = true;
        setDragging(true);
        live.current.onTransformStart();
      }
      const { frameWidth: fw, frameHeight: fh } = live.current;
      live.current.onTransformChange({
        ...origin,
        x: snap(origin.x + (dx / fw) * 100),
        y: snap(origin.y + (dy / fh) * 100),
      });
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (moved) {
        setDragging(false);
        live.current.onTransformEnd();
      } else if (wasSelected) {
        // First click selects; clicking the selected video plays or pauses it.
        onTogglePlay();
      }
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function handleCornerPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    const frame = frameRef.current;
    if (!frame || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    // Scaling is measured from the video's centre, so it grows evenly from the middle.
    const bounds = frame.getBoundingClientRect();
    const origin = live.current.current;
    const centerX = bounds.left + bounds.width / 2 + (origin.x / 100) * bounds.width;
    const centerY = bounds.top + bounds.height / 2 + (origin.y / 100) * bounds.height;
    const startDistance = Math.max(1, Math.hypot(e.clientX - centerX, e.clientY - centerY));
    live.current.onTransformStart();

    function onMove(ev: PointerEvent) {
      const distance = Math.hypot(ev.clientX - centerX, ev.clientY - centerY);
      live.current.onTransformChange({ ...origin, scale: clampScale(origin.scale * (distance / startDistance)) });
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      live.current.onTransformEnd();
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function handleSubtitlePointerDown(e: React.PointerEvent<HTMLSpanElement>) {
    const frame = frameRef.current;
    if (!frame) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    function moveTo(clientX: number, clientY: number) {
      const bounds = frame!.getBoundingClientRect();
      const x = clamp(((clientX - bounds.left) / bounds.width) * 100, 0, 100);
      const y = clamp(((clientY - bounds.top) / bounds.height) * 100, 0, 100);
      onSubtitlePositionChange(x, y);
    }

    function onMove(ev: PointerEvent) {
      moveTo(ev.clientX, ev.clientY);
    }
    function onUp(ev: PointerEvent) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      moveTo(ev.clientX, ev.clientY);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const fillScale = coverScale(videoSize.width, videoSize.height, frameWidth, frameHeight);
  const showSelection = selected && editable && frameWidth > 0;

  return (
    <section
      ref={panelRef}
      className="flex-1 min-w-0 relative flex flex-col items-center justify-center bg-background overflow-hidden"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) setSelected(false);
      }}
    >
      {videoUrl ? (
        <>
          <div ref={frameRef} className="relative shrink-0" style={{ width: frameWidth, height: frameHeight }}>
            {/* The output frame: anything outside it is cropped, exactly as in the export. */}
            <div className="absolute inset-0 overflow-hidden rounded-lg bg-black border border-border shadow-2xl shadow-black/40">
              <video
                ref={videoRef}
                src={videoUrl}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{ transform: `translate(${current.x}%, ${current.y}%) scale(${current.scale})` }}
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={(e) => {
                  const video = e.currentTarget;
                  setVideoSize({ width: video.videoWidth, height: video.videoHeight });
                  onVideoDimensions(video.videoWidth, video.videoHeight);
                  onLoadedMetadata();
                }}
                onPlay={onPlay}
                onPause={onPause}
                onEnded={onEnded}
              />
              {dragging && current.x === 0 && (
                <div className="absolute inset-y-0 left-1/2 w-px bg-brand-400 pointer-events-none" />
              )}
              {dragging && current.y === 0 && (
                <div className="absolute inset-x-0 top-1/2 h-px bg-brand-400 pointer-events-none" />
              )}
            </div>

            {/* Hit area for selecting and dragging the video. */}
            <div
              className={cn("absolute inset-0 touch-none", dragging ? "cursor-grabbing" : selected ? "cursor-grab" : "cursor-pointer")}
              onPointerDown={handleMovePointerDown}
              onDoubleClick={() => editable && commit(DEFAULT_CLIP_TRANSFORM)}
            />

            {showSelection && (
              <div
                className="absolute border-2 border-brand-400 pointer-events-none"
                style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
              >
                {CORNERS.map((corner) => (
                  <button
                    key={corner.id}
                    type="button"
                    aria-label="ปรับขนาดวิดีโอ"
                    onPointerDown={handleCornerPointerDown}
                    className={cn(
                      "absolute size-3.5 rounded-full bg-white border-2 border-brand-500 pointer-events-auto touch-none",
                      corner.className
                    )}
                  />
                ))}
              </div>
            )}

            {subtitleText && (
              <div
                className="absolute max-w-[90%] w-max pointer-events-none"
                style={{
                  left: `${subtitleStyle.x}%`,
                  top: `${subtitleStyle.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <span
                  key={subtitleKey}
                  onPointerDown={handleSubtitlePointerDown}
                  className="block text-center cursor-grab active:cursor-grabbing touch-none select-none pointer-events-auto"
                  style={{
                    ...subtitleTextStyle(subtitleStyle, subtitleFontFamily(subtitleStyle.fontFamily), frameHeight),
                    ...subtitleAnimationStyle(subtitleStyle.animation),
                  }}
                >
                  {subtitleText}
                </span>
              </div>
            )}
          </div>

          <div className="shrink-0 flex items-center justify-center gap-1" style={{ height: TOOLBAR_HEIGHT }}>
            {showSelection ? (
              <>
                <ToolbarButton label="ซูมออก" onClick={() => commit({ ...current, scale: clampScale(current.scale / ZOOM_STEP) })}>
                  <Minus className="size-3.5" />
                </ToolbarButton>
                <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">
                  {Math.round(current.scale * 100)}%
                </span>
                <ToolbarButton label="ซูมเข้า" onClick={() => commit({ ...current, scale: clampScale(current.scale * ZOOM_STEP) })}>
                  <Plus className="size-3.5" />
                </ToolbarButton>
                <span className="mx-1 h-4 w-px bg-border" />
                <ToolbarButton label="พอดีกรอบ" onClick={() => commit(DEFAULT_CLIP_TRANSFORM)}>
                  <Minimize className="size-3.5" /> พอดีกรอบ
                </ToolbarButton>
                <ToolbarButton label="เต็มกรอบ" onClick={() => commit({ x: 0, y: 0, scale: fillScale })}>
                  <Maximize className="size-3.5" /> เต็มกรอบ
                </ToolbarButton>
              </>
            ) : (
              <p className="text-[11px] text-muted-foreground">คลิกที่วิดีโอเพื่อย้าย ซูม หรือปรับขนาด</p>
            )}
          </div>
        </>
      ) : (
        <div className="m-4 aspect-video w-full max-w-4xl bg-black rounded-xl border border-border shadow-2xl shadow-black/40 flex items-center justify-center overflow-hidden">
          <VideoUploader projectId={projectId} onUploaded={onVideoUploaded} />
        </div>
      )}
    </section>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="h-7 px-2 inline-flex items-center gap-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {children}
    </button>
  );
}
