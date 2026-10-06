"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveTimeline, type TimelineClip } from "@/app/actions/timeline";
import { transcribeAsset, type SubtitleSegment } from "@/app/actions/subtitles";
import { createUploadUrl, confirmAssetUpload, getAssetPlaybackUrl } from "@/app/actions/assets";
import { probeDuration } from "@/lib/probe-duration";
import { loadAudioBuffer, MAX_ANALYZABLE_DURATION_SECONDS } from "@/lib/audio-loader";
import { detectSilentRanges } from "@/lib/silence-detection";
import { removeSilentRangesFromClips } from "@/lib/apply-silence-to-clips";
import { generateThumbnails, type Thumbnail } from "@/lib/generate-thumbnails";
import { computeWaveformPeaks } from "@/lib/waveform";
import { exportVideo } from "@/lib/export-video";
import { renameProject } from "@/app/actions/projects";
import { DEFAULT_SUBTITLE_STYLE, type SubtitleStyle } from "@/lib/subtitle-style";
import { EditorHeader } from "./editor-header";
import { ToolsSidebar } from "./tools-sidebar";
import { PreviewPanel } from "./preview-panel";
import { AIChatPanel } from "./ai-chat-panel";
import { TimelinePanel } from "./timeline-panel";

const MIN_CLIP_DURATION = 0.2;

export type EditorAsset = { id: string; duration: number | null; videoUrl: string };

function seedClips(asset: EditorAsset | null, initialClips: TimelineClip[]): TimelineClip[] {
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
  projectName: initialProjectName,
  assets: initialAssets,
  initialClips,
  initialSubtitles,
  initialSubtitleStyle,
}: {
  projectId: string;
  projectName: string;
  assets: EditorAsset[];
  initialClips: TimelineClip[];
  initialSubtitles: SubtitleSegment[];
  initialSubtitleStyle: SubtitleStyle;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [projectName, setProjectName] = useState(initialProjectName);
  const [assets, setAssets] = useState<EditorAsset[]>(initialAssets);
  const [clips, setClips] = useState<TimelineClip[]>(() => seedClips(initialAssets[0] ?? null, initialClips));
  const [activeAssetId, setActiveAssetId] = useState<string | null>(
    () => seedClips(initialAssets[0] ?? null, initialClips)[0]?.assetId ?? null
  );
  const [history, setHistory] = useState<TimelineClip[][]>([]);
  const [future, setFuture] = useState<TimelineClip[][]>([]);
  const [playhead, setPlayhead] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingSilence, setRemovingSilence] = useState(false);
  const [silenceError, setSilenceError] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>(initialSubtitles);
  const [generatingSubtitles, setGeneratingSubtitles] = useState(false);
  const [subtitleError, setSubtitleError] = useState<string | null>(null);
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string | null>(null);
  const [currentSubtitleKey, setCurrentSubtitleKey] = useState<string | null>(null);
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>(initialSubtitleStyle ?? DEFAULT_SUBTITLE_STYLE);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [assetThumbnails, setAssetThumbnails] = useState<Record<string, Thumbnail[]>>({});
  const [assetPeaks, setAssetPeaks] = useState<Record<string, number[]>>({});
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);

  const processedForPreviewRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const asset of assets) {
      if (!asset.duration || processedForPreviewRef.current.has(asset.id)) continue;
      processedForPreviewRef.current.add(asset.id);

      const thumbCount = Math.min(40, Math.max(8, Math.round(asset.duration / 4)));
      generateThumbnails(asset.videoUrl, asset.duration, thumbCount)
        .then((thumbs) => setAssetThumbnails((prev) => ({ ...prev, [asset.id]: thumbs })))
        .catch((err) => console.error("generateThumbnails failed", err));

      if (asset.duration <= MAX_ANALYZABLE_DURATION_SECONDS) {
        loadAudioBuffer(asset.videoUrl)
          .then((buffer) => {
            const peaks = computeWaveformPeaks(buffer, 400);
            setAssetPeaks((prev) => ({ ...prev, [asset.id]: peaks }));
          })
          .catch((err) => console.error("computeWaveformPeaks failed", err));
      }
    }
  }, [assets]);

  const assetsById = useMemo(() => {
    const map: Record<string, EditorAsset> = {};
    for (const a of assets) map[a.id] = a;
    return map;
  }, [assets]);

  const activeVideoUrl = (activeAssetId && assetsById[activeAssetId]?.videoUrl) || assets[0]?.videoUrl || null;

  const firstAssetIdRef = useRef(initialAssets[0]?.id ?? null);
  useEffect(() => {
    const nowFirstId = assets[0]?.id ?? null;
    if (nowFirstId !== firstAssetIdRef.current && firstAssetIdRef.current === null) {
      firstAssetIdRef.current = nowFirstId;
      const seeded = seedClips(assets[0] ?? null, initialClips);
      setClips(seeded);
      setActiveAssetId(seeded[0]?.assetId ?? null);
      setHistory([]);
      setFuture([]);
      setPlayhead(0);
      setSelectedClipId(null);
      setDirty(false);
      setSubtitles([]);
      setCurrentSubtitleText(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets]);

  const commitClips = useCallback(
    (next: TimelineClip[]) => {
      setHistory((h) => [...h, clips]);
      setFuture([]);
      setClips(next);
      setDirty(true);
    },
    [clips]
  );

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prevClips = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [clips, ...f]);
    setClips(prevClips);
    setDirty(true);
    setSelectedClipId(null);
  }, [history, clips]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const nextClips = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => [...h, clips]);
    setClips(nextClips);
    setDirty(true);
    setSelectedClipId(null);
  }, [future, clips]);

  const handleRename = useCallback(
    async (name: string) => {
      const result = await renameProject(projectId, name);
      setProjectName(result.name);
    },
    [projectId]
  );

  const totalDuration = clips.reduce((sum, c) => sum + (c.end - c.start), 0);

  const pendingSourceSeek = useRef<{ sourceTime: number; shouldPlay: boolean } | null>(null);

  const seek = useCallback(
    (seqTime: number) => {
      const clamped = Math.min(Math.max(seqTime, 0), totalDuration);
      setPlayhead(clamped);
      const loc = locate(clips, clamped);
      const video = videoRef.current;
      if (!loc || !video) return;
      if (loc.clip.assetId === activeAssetId) {
        video.currentTime = loc.sourceTime;
      } else {
        pendingSourceSeek.current = { sourceTime: loc.sourceTime, shouldPlay: !video.paused };
        setActiveAssetId(loc.clip.assetId);
      }
    },
    [clips, totalDuration, activeAssetId]
  );

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || clips.length === 0) return;
    if (video.paused) {
      const loc = locate(clips, playhead);
      if (loc) {
        if (loc.clip.assetId !== activeAssetId) {
          pendingSourceSeek.current = { sourceTime: loc.sourceTime, shouldPlay: true };
          setActiveAssetId(loc.clip.assetId);
          return;
        }
        video.currentTime = loc.sourceTime;
      }
      video.play();
    } else {
      video.pause();
    }
  }, [clips, playhead, activeAssetId]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    const pending = pendingSourceSeek.current;
    if (!video || !pending) return;
    video.currentTime = pending.sourceTime;
    if (pending.shouldPlay) video.play();
    pendingSourceSeek.current = null;
  }, []);

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
        if (next.assetId !== activeAssetId) {
          pendingSourceSeek.current = { sourceTime: next.start, shouldPlay: !video.paused };
          setActiveAssetId(next.assetId);
        } else {
          video.currentTime = next.start;
        }
        setPlayhead(cumulativeBefore + clipLen);
      } else {
        video.pause();
        setPlayhead(cumulativeBefore + clipLen);
      }
      return;
    }

    const offset = Math.max(video.currentTime - clip.start, 0);
    setPlayhead(cumulativeBefore + offset);

    const active = subtitles.find(
      (s) => s.assetId === activeAssetId && video.currentTime >= s.start && video.currentTime <= s.end
    );
    setCurrentSubtitleText(active?.text ?? null);
    setCurrentSubtitleKey(active ? `${active.assetId}-${active.start}` : null);
  }, [clips, playhead, subtitles, activeAssetId]);

  const splitAtPlayhead = useCallback(() => {
    const loc = locate(clips, playhead);
    if (!loc) return;
    const { clip, offset } = loc;
    const clipLen = clip.end - clip.start;
    if (offset < MIN_CLIP_DURATION || offset > clipLen - MIN_CLIP_DURATION) return;

    const splitSource = clip.start + offset;
    const next = clips.flatMap((c) =>
      c.id === clip.id
        ? [
            { ...c, end: splitSource },
            { ...c, id: crypto.randomUUID(), start: splitSource },
          ]
        : [c]
    );
    commitClips(next);
  }, [clips, playhead, commitClips]);

  const deleteSelectedClip = useCallback(() => {
    if (!selectedClipId || clips.length <= 1) return;
    const next = clips.filter((c) => c.id !== selectedClipId);
    const newTotal = next.reduce((sum, c) => sum + (c.end - c.start), 0);
    commitClips(next);
    setSelectedClipId(null);
    setPlayhead((p) => Math.min(p, newTotal));
  }, [selectedClipId, clips, commitClips]);

  const reorderClips = useCallback(
    (draggedId: string, targetId: string) => {
      if (draggedId === targetId) return;
      const fromIndex = clips.findIndex((c) => c.id === draggedId);
      const toIndex = clips.findIndex((c) => c.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return;
      const next = [...clips];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      commitClips(next);
    },
    [clips, commitClips]
  );

  // Trimming fires on every mousemove during a drag (see timeline-panel.tsx),
  // so it updates `clips` live without pushing history per-pixel. The drag's
  // start/end handlers below bracket the whole gesture into a single undo step.
  const trimHistoryBase = useRef<TimelineClip[] | null>(null);

  const trimClip = useCallback(
    (clipId: string, edge: "start" | "end", newSourceTime: number) => {
      const next = clips.map((c) => {
        if (c.id !== clipId) return c;
        if (edge === "start") {
          const start = Math.min(Math.max(newSourceTime, 0), c.end - MIN_CLIP_DURATION);
          return { ...c, start };
        }
        const maxEnd = assetsById[c.assetId]?.duration ?? c.end;
        const end = Math.max(Math.min(newSourceTime, maxEnd), c.start + MIN_CLIP_DURATION);
        return { ...c, end };
      });
      setClips(next);
      setDirty(true);
    },
    [clips, assetsById]
  );

  const beginTrim = useCallback(() => {
    trimHistoryBase.current = clips;
  }, [clips]);

  const endTrim = useCallback(() => {
    if (trimHistoryBase.current) {
      setHistory((h) => [...h, trimHistoryBase.current!]);
      setFuture([]);
      trimHistoryBase.current = null;
    }
  }, []);

  const removeSilence = useCallback(async () => {
    const assetIds = Array.from(new Set(clips.map((c) => c.assetId)));
    if (assetIds.length === 0) {
      setSilenceError("ไม่พบวิดีโอสำหรับวิเคราะห์");
      return;
    }
    setSilenceError(null);
    setRemovingSilence(true);
    try {
      let next = clips;
      for (const assetId of assetIds) {
        const a = assetsById[assetId];
        if (!a) continue;
        if (a.duration && a.duration > MAX_ANALYZABLE_DURATION_SECONDS) {
          throw new Error("วิดีโอยาวเกินไปสำหรับการวิเคราะห์อัตโนมัติ (จำกัด 30 นาที)");
        }
        const audioBuffer = await loadAudioBuffer(a.videoUrl);
        const silentRanges = detectSilentRanges(audioBuffer);
        next = removeSilentRangesFromClips(next, assetId, silentRanges, MIN_CLIP_DURATION);
      }
      if (next.length === 0) {
        setSilenceError("ไม่พบส่วนที่ไม่เงียบเพียงพอ จึงไม่มีการเปลี่ยนแปลง");
        return;
      }
      const newTotal = next.reduce((sum, c) => sum + (c.end - c.start), 0);
      commitClips(next);
      setSelectedClipId(null);
      setPlayhead((p) => Math.min(p, newTotal));
    } catch (err) {
      setSilenceError(err instanceof Error ? err.message : "การวิเคราะห์เสียงล้มเหลว");
    } finally {
      setRemovingSilence(false);
    }
  }, [clips, assetsById, commitClips]);

  const generateSubtitles = useCallback(async () => {
    const assetIds = Array.from(new Set(clips.map((c) => c.assetId)));
    if (assetIds.length === 0) {
      setSubtitleError("ไม่พบวิดีโอสำหรับถอดเสียง");
      return;
    }
    setSubtitleError(null);
    setGeneratingSubtitles(true);
    try {
      const results = await Promise.all(assetIds.map((id) => transcribeAsset(projectId, id)));
      const flat = results.flat();
      if (flat.length === 0) {
        setSubtitleError("ไม่พบคำพูดในวิดีโอ จึงไม่มีการเปลี่ยนแปลง");
        return;
      }
      setSubtitles(flat);
      setDirty(true);
    } catch (err) {
      setSubtitleError(err instanceof Error ? err.message : "การถอดเสียงล้มเหลว");
    } finally {
      setGeneratingSubtitles(false);
    }
  }, [projectId, clips]);

  const addVideo = useCallback(
    async (file: File) => {
      setUploadError(null);
      setUploadingVideo(true);
      try {
        const duration = await probeDuration(file);
        if (!duration) {
          throw new Error("ไม่สามารถอ่านความยาววิดีโอได้");
        }
        const { uploadUrl, storageKey } = await createUploadUrl(projectId, file.name, file.type);

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed with status ${xhr.status}`));
          };
          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.send(file);
        });

        const { id } = await confirmAssetUpload({
          projectId,
          storageKey,
          type: file.type.startsWith("video/") ? "video" : file.type,
          fileSize: file.size,
          duration,
        });

        const videoUrl = await getAssetPlaybackUrl(projectId, id);
        setAssets((prev) => [...prev, { id, duration, videoUrl }]);

        const newClip: TimelineClip = { id: crypto.randomUUID(), assetId: id, start: 0, end: duration };
        commitClips([...clips, newClip]);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "อัปโหลดวิดีโอไม่สำเร็จ");
      } finally {
        setUploadingVideo(false);
      }
    },
    [projectId, clips, commitClips]
  );

  const handleSubtitleStyleChange = useCallback((next: SubtitleStyle) => {
    setSubtitleStyle(next);
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveTimeline(projectId, clips, subtitles, subtitleStyle);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }, [projectId, clips, subtitles, subtitleStyle]);

  const handleExport = useCallback(async () => {
    if (clips.length === 0) return;
    setExportError(null);
    setExportProgress(0);
    setExporting(true);
    try {
      const blob = await exportVideo({
        clips,
        assetsById,
        subtitles,
        subtitleStyle,
        onProgress: (seconds, total) => setExportProgress(total > 0 ? seconds / total : 0),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName || "wemcut"}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "ส่งออกวิดีโอไม่สำเร็จ");
    } finally {
      setExporting(false);
    }
  }, [clips, assetsById, subtitles, subtitleStyle, projectName]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))
      ) {
        e.preventDefault();
        redo();
      } else if (e.key.toLowerCase() === "s") {
        splitAtPlayhead();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelectedClip();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePlay, splitAtPlayhead, deleteSelectedClip, undo, redo]);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col overflow-hidden">
      <EditorHeader
        projectName={projectName}
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
        onRename={handleRename}
        onExport={handleExport}
        exporting={exporting}
        exportProgress={exportProgress}
        exportError={exportError}
        canExport={clips.length > 0}
      />

      <main className="flex-1 flex overflow-hidden">
        <ToolsSidebar
          onRemoveSilence={removeSilence}
          removingSilence={removingSilence}
          silenceError={silenceError}
          onGenerateSubtitles={generateSubtitles}
          generatingSubtitles={generatingSubtitles}
          subtitleError={subtitleError}
          hasSubtitles={subtitles.length > 0}
          subtitleStyle={subtitleStyle}
          onSubtitleStyleChange={handleSubtitleStyleChange}
          onAddVideo={addVideo}
          uploadingVideo={uploadingVideo}
          uploadError={uploadError}
          disabled={clips.length === 0}
        />
        <PreviewPanel
          videoUrl={activeVideoUrl}
          projectId={projectId}
          videoRef={videoRef}
          subtitleText={currentSubtitleText}
          subtitleKey={currentSubtitleKey}
          subtitleStyle={subtitleStyle}
          onSubtitlePositionChange={(x, y) => handleSubtitleStyleChange({ ...subtitleStyle, x, y })}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTogglePlay={togglePlay}
        />
        <AIChatPanel
          projectId={projectId}
          clipCount={clips.length}
          totalDuration={totalDuration}
          playhead={playhead}
          onRemoveSilence={removeSilence}
          onSplitAtPlayhead={splitAtPlayhead}
          onSeek={seek}
        />
      </main>

      <TimelinePanel
        clips={clips}
        assetThumbnails={assetThumbnails}
        assetPeaks={assetPeaks}
        assetDurations={Object.fromEntries(assets.map((a) => [a.id, a.duration ?? 0]))}
        subtitles={subtitles}
        playhead={playhead}
        totalDuration={totalDuration}
        selectedClipId={selectedClipId}
        isPlaying={isPlaying}
        onSeek={seek}
        onSelectClip={setSelectedClipId}
        onTrim={trimClip}
        onTrimStart={beginTrim}
        onTrimEnd={endTrim}
        onSplit={splitAtPlayhead}
        onDelete={deleteSelectedClip}
        onReorderClips={reorderClips}
        onTogglePlay={togglePlay}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        onUndo={undo}
        onRedo={redo}
      />
    </div>
  );
}
