"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveTimeline, type TimelineClip } from "@/app/actions/timeline";
import { EditorHeader } from "./editor-header";
import { ToolsSidebar } from "./tools-sidebar";
import { PreviewPanel } from "./preview-panel";
import { AIChatPanel } from "./ai-chat-panel";
import { TimelinePanel } from "./timeline-panel";

const MIN_CLIP_DURATION = 0.2;

type Asset = { id: string; duration: number | null } | null;

function seedClips(asset: Asset, initialClips: TimelineClip[]): TimelineClip[] {
  if (initialClips.length > 0) return initialClips;
  if (asset && asset.duration) {
    return [{ id: crypto.randomUUID(), assetId: asset.id, start: 0, end: asset.duration }];
  }
  return [];
}

function locate(clips: TimelineClip[], seqTime: number) {
  let acc = 0;
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const len = clip.end - clip.start;
    const isLast = i === clips.length - 1;
    if (seqTime <= acc + len || isLast) {
      const offset = Math.min(Math.max(seqTime - acc, 0), len);
      return { clip, index: i, offset, sourceTime: clip.start + offset, cumulativeBefore: acc };
    }
    acc += len;
  }
  return null;
}

export function EditorWorkspace({
  projectId,
  projectName,
  videoUrl,
  asset,
  initialClips,
}: {
  projectId: string;
  projectName: string;
  videoUrl: string | null;
  asset: Asset;
  initialClips: TimelineClip[];
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [clips, setClips] = useState<TimelineClip[]>(() => seedClips(asset, initialClips));
  const [playhead, setPlayhead] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const assetIdRef = useRef(asset?.id ?? null);
  useEffect(() => {
    if ((asset?.id ?? null) !== assetIdRef.current) {
      assetIdRef.current = asset?.id ?? null;
      setClips(seedClips(asset, initialClips));
      setPlayhead(0);
      setSelectedClipId(null);
      setDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.id]);

  const totalDuration = clips.reduce((sum, c) => sum + (c.end - c.start), 0);

  const seek = useCallback(
    (seqTime: number) => {
      const clamped = Math.min(Math.max(seqTime, 0), totalDuration);
      const loc = locate(clips, clamped);
      if (loc && videoRef.current) {
        videoRef.current.currentTime = loc.sourceTime;
      }
      setPlayhead(clamped);
    },
    [clips, totalDuration]
  );

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || clips.length === 0) return;
    if (video.paused) {
      const loc = locate(clips, playhead);
      if (loc) video.currentTime = loc.sourceTime;
      video.play();
    } else {
      video.pause();
    }
  }, [clips, playhead]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const loc = locate(clips, playhead);
    if (!loc) return;
    const { clip, index, cumulativeBefore } = loc;
    const clipLen = clip.end - clip.start;

    if (video.currentTime >= clip.end - 0.03) {
      const next = clips[index + 1];
      if (next) {
        video.currentTime = next.start;
        setPlayhead(cumulativeBefore + clipLen);
      } else {
        video.pause();
        setPlayhead(cumulativeBefore + clipLen);
      }
      return;
    }

    const offset = Math.max(video.currentTime - clip.start, 0);
    setPlayhead(cumulativeBefore + offset);
  }, [clips, playhead]);

  const splitAtPlayhead = useCallback(() => {
    const loc = locate(clips, playhead);
    if (!loc) return;
    const { clip, offset } = loc;
    const clipLen = clip.end - clip.start;
    if (offset < MIN_CLIP_DURATION || offset > clipLen - MIN_CLIP_DURATION) return;

    const splitSource = clip.start + offset;
    setClips((prev) =>
      prev.flatMap((c) =>
        c.id === clip.id
          ? [
              { ...c, end: splitSource },
              { ...c, id: crypto.randomUUID(), start: splitSource },
            ]
          : [c]
      )
    );
    setDirty(true);
  }, [clips, playhead]);

  const deleteSelectedClip = useCallback(() => {
    if (!selectedClipId || clips.length <= 1) return;
    const next = clips.filter((c) => c.id !== selectedClipId);
    const newTotal = next.reduce((sum, c) => sum + (c.end - c.start), 0);
    setClips(next);
    setSelectedClipId(null);
    setPlayhead((p) => Math.min(p, newTotal));
    setDirty(true);
  }, [selectedClipId, clips]);

  const trimClip = useCallback(
    (clipId: string, edge: "start" | "end", newSourceTime: number) => {
      setClips((prev) =>
        prev.map((c) => {
          if (c.id !== clipId) return c;
          if (edge === "start") {
            const start = Math.min(Math.max(newSourceTime, 0), c.end - MIN_CLIP_DURATION);
            return { ...c, start };
          }
          const maxEnd = asset?.duration ?? c.end;
          const end = Math.max(Math.min(newSourceTime, maxEnd), c.start + MIN_CLIP_DURATION);
          return { ...c, end };
        })
      );
      setDirty(true);
    },
    [asset?.duration]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveTimeline(projectId, clips);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }, [projectId, clips]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key.toLowerCase() === "s") {
        splitAtPlayhead();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelectedClip();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePlay, splitAtPlayhead, deleteSelectedClip]);

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col overflow-hidden">
      <EditorHeader
        projectName={projectName}
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
      />

      <main className="flex-1 flex overflow-hidden">
        <ToolsSidebar />
        <PreviewPanel
          videoUrl={videoUrl}
          projectId={projectId}
          videoRef={videoRef}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTogglePlay={togglePlay}
        />
        <AIChatPanel />
      </main>

      <TimelinePanel
        clips={clips}
        playhead={playhead}
        totalDuration={totalDuration}
        selectedClipId={selectedClipId}
        isPlaying={isPlaying}
        onSeek={seek}
        onSelectClip={setSelectedClipId}
        onTrim={trimClip}
        onSplit={splitAtPlayhead}
        onDelete={deleteSelectedClip}
        onTogglePlay={togglePlay}
      />
    </div>
  );
}
