"use client";

import { useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Split, Trash2, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTimecode } from "@/lib/utils";
import type { TimelineClip } from "@/app/actions/timeline";
import type { SubtitleSegment } from "@/app/actions/subtitles";
import type { Thumbnail } from "@/lib/generate-thumbnails";

const PIXELS_PER_SECOND = 60;
const TICK_INTERVAL = 5;

function sourceToSeqRange(
  clips: TimelineClip[],
  assetId: string,
  srcStart: number,
  srcEnd: number
): { seqStart: number; seqEnd: number } | null {
  let acc = 0;
  for (const clip of clips) {
    const clipLen = clip.end - clip.start;
    if (clip.assetId === assetId) {
      const overlapStart = Math.max(srcStart, clip.start);
      const overlapEnd = Math.min(srcEnd, clip.end);
      if (overlapEnd > overlapStart) {
        return { seqStart: acc + (overlapStart - clip.start), seqEnd: acc + (overlapEnd - clip.start) };
      }
    }
    acc += clipLen;
  }
  return null;
}

function ClipThumbnails({ thumbnails, start, end }: { thumbnails: Thumbnail[]; start: number; end: number }) {
  if (thumbnails.length === 0) return null;
  const tileCount = Math.max(1, Math.min(12, Math.round((end - start) / 1.5)));
  const tiles = Array.from({ length: tileCount }, (_, i) => {
    const t = start + ((i + 0.5) / tileCount) * (end - start);
    let nearest = thumbnails[0];
    for (const th of thumbnails) {
      if (Math.abs(th.time - t) < Math.abs(nearest.time - t)) nearest = th;
    }
    return nearest;
  });

  return (
    <div className="absolute inset-0 flex overflow-hidden rounded">
      {tiles.map((th, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={th.dataUrl}
          alt=""
          draggable={false}
          className="h-full flex-1 object-cover opacity-70"
        />
      ))}
    </div>
  );
}

function ClipWaveform({ peaks, start, end, duration }: { peaks: number[]; start: number; end: number; duration: number }) {
  if (peaks.length === 0 || duration <= 0) return null;
  const perSecond = peaks.length / duration;
  const startIdx = Math.max(0, Math.floor(start * perSecond));
  const endIdx = Math.min(peaks.length, Math.ceil(end * perSecond));
  const slice = peaks.slice(startIdx, endIdx);
  if (slice.length < 2) return null;

  const points = slice
    .map((p, i) => `${(i / (slice.length - 1)) * 100},${50 - Math.min(p, 1) * 48}`)
    .concat(
      slice
        .map((p, i) => `${(i / (slice.length - 1)) * 100},${50 + Math.min(p, 1) * 48}`)
        .reverse()
    )
    .join(" ");

  return (
    <svg
      className="absolute bottom-0 left-0 w-full h-6 opacity-60"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <polygon points={points} fill="currentColor" className="text-amber-200" />
    </svg>
  );
}

export function TimelinePanel({
  clips,
  assetThumbnails,
  assetPeaks,
  assetDurations,
  subtitles,
  playhead,
  totalDuration,
  selectedClipId,
  isPlaying,
  onSeek,
  onSelectClip,
  onTrim,
  onTrimStart,
  onTrimEnd,
  onSplit,
  onDelete,
  onReorderClips,
  onTogglePlay,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  clips: TimelineClip[];
  assetThumbnails: Record<string, Thumbnail[]>;
  assetPeaks: Record<string, number[]>;
  assetDurations: Record<string, number>;
  subtitles: SubtitleSegment[];
  playhead: number;
  totalDuration: number;
  selectedClipId: string | null;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
  onSelectClip: (id: string | null) => void;
  onTrim: (clipId: string, edge: "start" | "end", newSourceTime: number) => void;
  onTrimStart: () => void;
  onTrimEnd: () => void;
  onSplit: () => void;
  onDelete: () => void;
  onReorderClips: (draggedId: string, targetId: string) => void;
  onTogglePlay: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
  const [dragOverClipId, setDragOverClipId] = useState<string | null>(null);

  function xToSeconds(clientX: number) {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left + el.scrollLeft;
    return Math.min(Math.max(x / PIXELS_PER_SECOND, 0), totalDuration);
  }

  function handleTrackMouseDown(e: React.MouseEvent) {
    onSelectClip(null);
    onSeek(xToSeconds(e.clientX));

    function onMove(ev: MouseEvent) {
      onSeek(xToSeconds(ev.clientX));
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function handleTrimStart(
    e: React.MouseEvent,
    clip: TimelineClip,
    edge: "start" | "end"
  ) {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const initial = edge === "start" ? clip.start : clip.end;
    onTrimStart();

    function onMove(ev: MouseEvent) {
      const deltaSeconds = (ev.clientX - startX) / PIXELS_PER_SECOND;
      onTrim(clip.id, edge, initial + deltaSeconds);
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      onTrimEnd();
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const trackWidth = Math.max(totalDuration * PIXELS_PER_SECOND, 1);
  const ticks: number[] = [];
  for (let t = 0; t <= totalDuration; t += TICK_INTERVAL) ticks.push(t);

  const positionedClips = clips.reduce<{
    items: { clip: TimelineClip; left: number; width: number }[];
    cumulative: number;
  }>(
    (acc, clip) => {
      const left = acc.cumulative * PIXELS_PER_SECOND;
      const width = Math.max((clip.end - clip.start) * PIXELS_PER_SECOND, 2);
      return {
        items: [...acc.items, { clip, left, width }],
        cumulative: acc.cumulative + (clip.end - clip.start),
      };
    },
    { items: [], cumulative: 0 }
  ).items;

  const assetIdsInUse = Array.from(new Set(clips.map((c) => c.assetId)));
  const positionedSubtitles = subtitles.flatMap((s) => {
    if (!assetIdsInUse.includes(s.assetId)) return [];
    const range = sourceToSeqRange(clips, s.assetId, s.start, s.end);
    if (!range) return [];
    return [
      {
        key: `${s.assetId}-${s.start}`,
        text: s.text,
        left: range.seqStart * PIXELS_PER_SECOND,
        width: Math.max((range.seqEnd - range.seqStart) * PIXELS_PER_SECOND, 2),
        seqStart: range.seqStart,
      },
    ];
  });

  return (
    <footer className="h-72 border-t border-border bg-sidebar flex flex-col shrink-0">
      <div className="h-10 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={onSplit}
            disabled={clips.length === 0}
            title="แยกคลิปที่ตำแหน่งเพลย์เฮด (S)"
          >
            <Split className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            disabled={!selectedClipId || clips.length <= 1}
            title="ลบคลิปที่เลือก (Delete)"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={onUndo}
            disabled={!canUndo}
            title="เลิกทำ (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={onRedo}
            disabled={!canRedo}
            title="ทำซ้ำ (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => onSeek(0)}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            className="bg-amber-500 text-black hover:bg-amber-400"
            onClick={onTogglePlay}
            disabled={clips.length === 0}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" fill="currentColor" />
            ) : (
              <Play className="w-4 h-4" fill="currentColor" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => onSeek(totalDuration)}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-xs font-mono text-muted-foreground tabular-nums">
          {formatTimecode(playhead)} / {formatTimecode(totalDuration)}
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto">
        {clips.length > 0 ? (
          <div
            ref={trackRef}
            onMouseDown={handleTrackMouseDown}
            className="relative h-full min-w-full cursor-pointer"
            style={{ width: trackWidth + 32 }}
          >
            <div className="h-6 relative border-b border-border/60">
              {ticks.map((t) => (
                <div
                  key={t}
                  className="absolute top-0 h-full flex items-center"
                  style={{ left: t * PIXELS_PER_SECOND }}
                >
                  <div className="w-px h-2 bg-border" />
                  <span className="ml-1 text-[10px] text-muted-foreground font-mono">
                    {formatTimecode(t)}
                  </span>
                </div>
              ))}
            </div>

            <div className="px-4 pt-3 space-y-2">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">วิดีโอ</p>
                <div className="h-20 bg-muted/60 rounded-md border border-border relative">
                  {positionedClips.map(({ clip, left, width }) => {
                    const isDragOver = dragOverClipId === clip.id && draggingClipId !== clip.id;
                    return (
                      <div
                        key={clip.id}
                        draggable
                        onDragStart={() => setDraggingClipId(clip.id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (draggingClipId && draggingClipId !== clip.id) setDragOverClipId(clip.id);
                        }}
                        onDragLeave={() => setDragOverClipId((id) => (id === clip.id ? null : id))}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggingClipId) onReorderClips(draggingClipId, clip.id);
                          setDraggingClipId(null);
                          setDragOverClipId(null);
                        }}
                        onDragEnd={() => {
                          setDraggingClipId(null);
                          setDragOverClipId(null);
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          onSelectClip(clip.id);
                        }}
                        className={`absolute top-0.5 bottom-0.5 rounded overflow-hidden text-xs transition-colors cursor-grab active:cursor-grabbing group ${
                          selectedClipId === clip.id
                            ? "border-2 border-amber-400"
                            : "border border-amber-500/30 hover:border-amber-500/60"
                        } ${isDragOver ? "ring-2 ring-amber-300" : ""} ${
                          draggingClipId === clip.id ? "opacity-40" : ""
                        }`}
                        style={{ left, width }}
                      >
                        <div className="absolute inset-0 bg-amber-950" />
                        <ClipThumbnails
                          thumbnails={assetThumbnails[clip.assetId] ?? []}
                          start={clip.start}
                          end={clip.end}
                        />
                        <ClipWaveform
                          peaks={assetPeaks[clip.assetId] ?? []}
                          start={clip.start}
                          end={clip.end}
                          duration={assetDurations[clip.assetId] ?? 0}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
                        <span className="absolute top-1 left-1.5 text-[10px] font-mono text-white drop-shadow pointer-events-none">
                          {formatTimecode(clip.end - clip.start)}
                        </span>
                        <span
                          draggable={false}
                          onDragStart={(e) => e.preventDefault()}
                          onMouseDown={(e) => handleTrimStart(e, clip, "start")}
                          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-amber-300/40 z-10"
                        />
                        <span
                          draggable={false}
                          onDragStart={(e) => e.preventDefault()}
                          onMouseDown={(e) => handleTrimStart(e, clip, "end")}
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-amber-300/40 z-10"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">ซับไตเติล</p>
                <div className="h-9 bg-muted/40 rounded-md border border-border relative">
                  {positionedSubtitles.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        onSeek(s.seqStart);
                      }}
                      className="absolute top-0.5 bottom-0.5 rounded bg-sky-500/20 border border-sky-500/40 text-sky-100 text-[10px] px-1.5 flex items-center truncate hover:bg-sky-500/30"
                      style={{ left: s.left, width: s.width }}
                      title={s.text}
                    >
                      {s.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="absolute top-6 bottom-0 w-px bg-amber-400 z-20 pointer-events-none"
              style={{ left: playhead * PIXELS_PER_SECOND }}
            >
              <div className="w-2.5 h-2.5 bg-amber-400 rotate-45 -translate-x-1/2 translate-y-0.5 rounded-[2px]" />
            </div>
          </div>
        ) : (
          <div className="h-16 bg-muted/30 rounded-md border border-dashed border-border m-4 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">
              ยังไม่มี Timeline — อัปโหลดวิดีโอเพื่อเริ่มตัดต่อ
            </p>
          </div>
        )}
      </div>
    </footer>
  );
}
