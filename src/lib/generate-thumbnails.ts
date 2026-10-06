export type Thumbnail = { time: number; dataUrl: string };

export async function generateThumbnails(
  videoUrl: string,
  duration: number,
  count: number
): Promise<Thumbnail[]> {
  if (duration <= 0 || count <= 0) return [];

  // Drawing a cross-origin <video> straight from the R2 signed URL taints the
  // canvas (toDataURL throws SecurityError) even though the URL itself is
  // fetchable. Fetching the bytes first and using a same-origin blob: URL
  // avoids that entirely.
  const res = await fetch(videoUrl);
  if (!res.ok) throw new Error("ไม่สามารถโหลดวิดีโอเพื่อสร้างภาพย่อได้");
  const blobUrl = URL.createObjectURL(await res.blob());

  try {
    const video = document.createElement("video");
    video.src = blobUrl;
    video.muted = true;
    video.preload = "auto";

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("โหลดวิดีโอเพื่อสร้างภาพย่อไม่สำเร็จ"));
    });

    const targetHeight = 64;
    const aspect = video.videoWidth / video.videoHeight || 16 / 9;
    const canvas = document.createElement("canvas");
    canvas.height = targetHeight;
    canvas.width = Math.max(1, Math.round(targetHeight * aspect));
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];

    const thumbnails: Thumbnail[] = [];
    const step = duration / count;

    for (let i = 0; i < count; i++) {
      const time = Math.min(i * step, Math.max(duration - 0.05, 0));
      await new Promise<void>((resolve) => {
        function onSeeked() {
          video.removeEventListener("seeked", onSeeked);
          resolve();
        }
        video.addEventListener("seeked", onSeeked);
        video.currentTime = time;
      });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      thumbnails.push({ time, dataUrl: canvas.toDataURL("image/jpeg", 0.6) });
    }

    return thumbnails;
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
