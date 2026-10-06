import { useRef, type RefObject } from "react";
import {
  SUBTITLE_FONT_OPTIONS,
  SUBTITLE_ANIMATION_CLASSES,
  hexToRgba,
  type SubtitleStyle,
} from "@/lib/subtitle-style";
import { cn } from "@/lib/utils";
import { VideoUploader } from "./video-uploader";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function PreviewPanel({
  videoUrl,
  projectId,
  videoRef,
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
  const fontVar = SUBTITLE_FONT_OPTIONS.find((f) => f.value === subtitleStyle.fontFamily)?.cssVar ?? "inherit";
  const frameRef = useRef<HTMLDivElement>(null);

  function handleSubtitlePointerDown(e: React.PointerEvent<HTMLSpanElement>) {
    const frame = frameRef.current;
    if (!frame) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    function moveTo(clientX: number, clientY: number) {
      const rect = frame!.getBoundingClientRect();
      const x = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
      const y = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);
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

  return (
    <section className="flex-1 min-w-0 flex items-center justify-center bg-background p-4 overflow-hidden">
      {videoUrl ? (
        <div ref={frameRef} className="relative grid max-w-full max-h-full">
          <video
            ref={videoRef}
            src={videoUrl}
            className="[grid-area:1/1] max-w-full max-h-full w-auto h-auto rounded-xl border border-border shadow-2xl shadow-black/40 cursor-pointer"
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onPlay={onPlay}
            onPause={onPause}
            onEnded={onEnded}
            onClick={onTogglePlay}
          />
          {subtitleText && (
            <div
              className="absolute max-w-[90%] pointer-events-none"
              style={{
                left: `${subtitleStyle.x}%`,
                top: `${subtitleStyle.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <span
                key={subtitleKey}
                onPointerDown={handleSubtitlePointerDown}
                className={cn(
                  "block text-center px-3 py-1.5 rounded-md leading-snug cursor-grab active:cursor-grabbing touch-none select-none pointer-events-auto",
                  SUBTITLE_ANIMATION_CLASSES[subtitleStyle.animation]
                )}
                style={{
                  fontFamily: fontVar,
                  fontSize: subtitleStyle.fontSize,
                  color: subtitleStyle.color,
                  backgroundColor: hexToRgba(subtitleStyle.backgroundColor, subtitleStyle.backgroundOpacity),
                  fontWeight: subtitleStyle.bold ? 700 : 400,
                }}
              >
                {subtitleText}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video w-full max-w-4xl bg-black rounded-xl border border-border shadow-2xl shadow-black/40 flex items-center justify-center overflow-hidden">
          <VideoUploader projectId={projectId} />
        </div>
      )}
    </section>
  );
}
