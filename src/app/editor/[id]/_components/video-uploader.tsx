"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createUploadUrl, confirmAssetUpload } from "@/app/actions/assets";

export function VideoUploader({ projectId }: { projectId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setProgress(0);

    try {
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
      });

      setProgress(null);
    } catch {
      setError("อัปโหลดไม่สำเร็จ ลองใหม่อีกครั้ง");
      setProgress(null);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        hidden
        onChange={handleFileChange}
      />
      {progress !== null ? (
        <p className="text-sm text-slate-400">กำลังอัปโหลด... {progress}%</p>
      ) : (
        <>
          <Button
            onClick={() => inputRef.current?.click()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            อัปโหลดวิดีโอ
          </Button>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </>
      )}
    </div>
  );
}
