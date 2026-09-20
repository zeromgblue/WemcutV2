import type { RefObject } from "react";
import { VideoUploader } from "./video-uploader";

export function PreviewPanel({
  videoUrl,
  projectId,
  videoRef,
  onTimeUpdate,
  onPlay,
  onPause,
  onEnded,
  onTogglePlay,
}: {
  videoUrl: string | null;
  projectId: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  onTimeUpdate: () => void;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onTogglePlay: () => void;
}) {
  return (
    <section className="flex-1 min-w-0 flex items-center justify-center bg-background p-8">
      <div className="aspect-video w-full max-w-4xl bg-black rounded-xl border border-border shadow-2xl shadow-black/40 flex items-center justify-center overflow-hidden">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full cursor-pointer"
            onTimeUpdate={onTimeUpdate}
            onPlay={onPlay}
            onPause={onPause}
            onEnded={onEnded}
            onClick={onTogglePlay}
          />
        ) : (
          <VideoUploader projectId={projectId} />
        )}
      </div>
    </section>
  );
}
