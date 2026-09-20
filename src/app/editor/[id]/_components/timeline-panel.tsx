"use client";

import { useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Split, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTimecode } from "@/lib/utils";
import type { TimelineClip } from "@/app/actions/timeline";

const PIXELS_PER_SECOND = 60;
const TICK_INTERVAL = 5;

export function TimelinePanel({
  clips,
  playhead,
  totalDuration,
  selectedClipId,
  isPlaying,
  onSeek,
  onSelectClip,
  onTrim,
  onSplit,
  onDelete,
  onTogglePlay,
}: {
  clips: TimelineClip[];
  playhead: number;
  totalDuration: number;
  selectedClipId: string | null;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
  onSelectClip: (id: string | null) => void;
  onTrim: (clipId: string, edge: "start" | "end", newSourceTime: number) => void;
  onSplit: () => void;
  onDelete: () => void;
  onTogglePlay: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

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

    function onMove(ev: MouseEvent) {
      const deltaSeconds = (ev.clientX - startX) / PIXELS_PER_SECOND;
      onTrim(clip.id, edge, initial + deltaSeconds);
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
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

  return (
    <footer className="h-64 border-t border-border bg-sidebar flex flex-col shrink-0">
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

      <div className="flex-1 overflow-x-auto">
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

            <div className="p-4 pt-3">
              <div className="h-16 bg-muted/60 rounded-md border border-border relative">
                {positionedClips.map(({ clip, left, width }) => (
                  <div
                    key={clip.id}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onSelectClip(clip.id);
                    }}
                    className={`absolute top-0.5 bottom-0.5 rounded flex items-center justify-center text-xs truncate px-2 transition-colors cursor-pointer group ${
                      selectedClipId === clip.id
                        ? "bg-amber-500/25 border-2 border-amber-400 text-amber-100"
                        : "bg-amber-500/15 border border-amber-500/30 text-amber-200/90 hover:bg-amber-500/20"
                    }`}
                    style={{ left, width }}
                  >
                    <span
                      onMouseDown={(e) => handleTrimStart(e, clip, "start")}
                      className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-amber-300/40"
                    />
                    {formatTimecode(clip.end - clip.start)}
                    <span
                      onMouseDown={(e) => handleTrimStart(e, clip, "end")}
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-amber-300/40"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div
              className="absolute top-0 bottom-0 w-px bg-amber-400 z-10 pointer-events-none"
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
