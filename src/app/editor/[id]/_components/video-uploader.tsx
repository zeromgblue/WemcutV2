"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createUploadUrl, confirmAssetUpload } from "@/app/actions/assets";

function probeDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(Number.isFinite(video.duration) ? video.duration : undefined);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(undefined);
    };
    video.src = URL.createObjectURL(file);
  });
}

export function VideoUploader({ projectId }: { projectId: string }) {
  const router = useRouter();
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

      await confirmAssetUpload({
        projectId,
        storageKey,
        type: file.type.startsWith("video/") ? "video" : file.type,
        fileSize: file.size,
        duration,
      });

      setProgress(null);
      router.refresh();
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
        dragOver ? "border-amber-500 bg-amber-500/5" : "border-border"
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
              className="h-full bg-amber-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            กำลังอัปโหลด... {progress}%
          </p>
        </div>
      ) : (
        <>
          <div className="size-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <UploadCloud className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => inputRef.current?.click()}
              className="bg-amber-500 text-black hover:bg-amber-400"
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
