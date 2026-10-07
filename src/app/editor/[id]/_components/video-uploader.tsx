"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { probeDuration } from "@/lib/probe-duration";
import { createUploadUrl, confirmAssetUpload, getAssetPlaybackUrl } from "@/app/actions/assets";

export function VideoUploader({
  projectId,
  onUploaded,
}: {
  projectId: string;
  onUploaded: (asset: { id: string; duration: number | null; videoUrl: string }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setProgress(0);

    try {
      const duration = await probeDuration(file);
      const { uploadUrl, storageKey } = await createUploadUrl(
        projectId,
        file.name,
        file.type
      );

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
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

      // Hand the new asset straight to the editor. The editor keeps its asset
      // list in state, so a router.refresh() alone would never show the video.
      const videoUrl = await getAssetPlaybackUrl(projectId, id);
      setProgress(null);
      onUploaded({ id, duration: duration ?? null, videoUrl });
    } catch {
      setError("อัปโหลดไม่สำเร็จ ลองใหม่อีกครั้ง");
      setProgress(null);
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
      className={cn(
        "w-full h-full flex flex-col items-center justify-center gap-4 text-center rounded-xl border-2 border-dashed transition-colors",
        dragOver ? "border-brand-500 bg-brand-500/5" : "border-border"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) handleFile(file);
        }}
      />
      {progress !== null ? (
        <div className="w-48 space-y-2">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-brand-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            กำลังอัปโหลด... {progress}%
          </p>
        </div>
      ) : (
        <>
          <div className="size-12 rounded-full bg-brand-500/10 flex items-center justify-center">
            <UploadCloud className="w-5 h-5 text-brand-400" />
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => inputRef.current?.click()}
              className="bg-brand-500 text-white hover:bg-brand-400"
            >
              เลือกไฟล์วิดีโอ
            </Button>
            <p className="text-xs text-muted-foreground">
              หรือลากไฟล์มาวางที่นี่
            </p>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </>
      )}
    </div>
  );
}
