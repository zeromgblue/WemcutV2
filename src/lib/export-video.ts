import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import type { TimelineClip } from "@/app/actions/timeline";
import type { SubtitleSegment } from "@/app/actions/subtitles";
import { SUBTITLE_FONT_OPTIONS, hexToRgba, type SubtitleStyle } from "@/lib/subtitle-style";
import { loadAudioBuffer } from "@/lib/audio-loader";

export type ExportAsset = { id: string; videoUrl: string };

const OUTPUT_FPS = 30;
const PLAYBACK_SPEED = 16; // decode this many times faster than real time
const AUDIO_CHUNK_FRAMES = 4096;

// requestVideoFrameCallback isn't in TS's default DOM lib yet.
type VideoFrameCallbackMetadata = { mediaTime: number };
type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback(cb: (now: number, metadata: VideoFrameCallbackMetadata) => void): number;
};

export function isExportSupported(): boolean {
  return (
    typeof VideoEncoder !== "undefined" &&
    typeof AudioEncoder !== "undefined" &&
    typeof VideoFrame !== "undefined" &&
    "requestVideoFrameCallback" in HTMLVideoElement.prototype
  );
}

function resolveFontFamily(cssVarFontFamily: string): string {
  const probe = document.createElement("span");
  probe.style.fontFamily = cssVarFontFamily;
  probe.style.position = "fixed";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).fontFamily;
  document.body.removeChild(probe);
  return resolved;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  style: SubtitleStyle,
  fontFamily: string,
  canvasWidth: number,
  canvasHeight: number
) {
  const scale = canvasHeight / 720;
  const fontSize = style.fontSize * scale;
  ctx.font = `${style.bold ? "700" : "400"} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const maxWidth = canvasWidth * 0.85;
  const lines = wrapText(ctx, text, maxWidth);
  const lineHeight = fontSize * 1.35;
  const paddingX = fontSize * 0.5;
  const paddingY = fontSize * 0.3;

  const centerX = (style.x / 100) * canvasWidth;
  const centerY = (style.y / 100) * canvasHeight;
  const blockHeight = lines.length * lineHeight;
  const widestLine = Math.max(...lines.map((l) => ctx.measureText(l).width));

  ctx.fillStyle = hexToRgba(style.backgroundColor, style.backgroundOpacity);
  const boxX = centerX - widestLine / 2 - paddingX;
  const boxY = centerY - blockHeight / 2 - paddingY;
  const boxW = widestLine + paddingX * 2;
  const boxH = blockHeight + paddingY * 2;
  const radius = Math.min(8 * scale, boxH / 2);
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, radius);
  ctx.fill();

  ctx.fillStyle = style.color;
  lines.forEach((line, i) => {
    const y = centerY - blockHeight / 2 + lineHeight * (i + 0.5);
    ctx.fillText(line, centerX, y);
  });
}

/** Loads a video via a same-origin blob: URL — drawing a cross-origin <video>
 * straight from an R2 signed URL taints the canvas / fails under
 * crossOrigin="anonymous", so the bytes are fetched first. */
async function fetchAsBlobUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("โหลดวิดีโอไม่สำเร็จ");
  return URL.createObjectURL(await res.blob());
}

export async function exportVideo({
  clips,
  assetsById,
  subtitles,
  subtitleStyle,
  onProgress,
}: {
  clips: TimelineClip[];
  assetsById: Record<string, ExportAsset>;
  subtitles: SubtitleSegment[];
  subtitleStyle: SubtitleStyle;
  onProgress?: (seconds: number, totalDuration: number) => void;
}): Promise<Blob> {
  if (clips.length === 0) throw new Error("ไม่มีคลิปให้ส่งออก");
  if (!isExportSupported()) {
    throw new Error("เบราว์เซอร์นี้ไม่รองรับการส่งออก กรุณาใช้ Chrome หรือ Edge เวอร์ชันล่าสุด");
  }

  const totalDuration = clips.reduce((sum, c) => sum + (c.end - c.start), 0);
  const firstAsset = assetsById[clips[0].assetId];
  if (!firstAsset) throw new Error("ไม่พบไฟล์วิดีโอต้นทาง");

  await document.fonts.ready;
  const fontFamily = resolveFontFamily(
    SUBTITLE_FONT_OPTIONS.find((f) => f.value === subtitleStyle.fontFamily)?.cssVar ?? "sans-serif"
  );

  const video = document.createElement("video") as VideoWithFrameCallback;
  video.muted = true;
  video.playsInline = true;
  document.body.appendChild(video);

  let currentBlobUrl: string | null = null;
  async function loadAsset(url: string) {
    const nextBlobUrl = await fetchAsBlobUrl(url);
    if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = nextBlobUrl;
    video.src = nextBlobUrl;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("โหลดวิดีโอไม่สำเร็จ"));
    });
  }
  await loadAsset(firstAsset.videoUrl);

  const MAX_WIDTH = 1920;
  const scaleDown = Math.min(1, MAX_WIDTH / video.videoWidth);
  const width = Math.round(video.videoWidth * scaleDown / 2) * 2;
  const height = Math.round(video.videoHeight * scaleDown / 2) * 2;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("สร้าง canvas ไม่สำเร็จ");

  const videoCodecCandidates = ["avc1.640028", "avc1.42001f"];
  let videoCodec: string | null = null;
  for (const codec of videoCodecCandidates) {
    const support = await VideoEncoder.isConfigSupported({ codec, width, height, bitrate: 8_000_000 });
    if (support.supported) {
      videoCodec = codec;
      break;
    }
  }
  if (!videoCodec) throw new Error("เบราว์เซอร์นี้ไม่รองรับการเข้ารหัสวิดีโอ H.264");

  const audioCodecCandidates: { codec: string; muxerCodec: "aac" | "opus" }[] = [
    { codec: "mp4a.40.2", muxerCodec: "aac" },
    { codec: "opus", muxerCodec: "opus" },
  ];
  let audioCodec: { codec: string; muxerCodec: "aac" | "opus" } | null = null;
  const audioSampleRate = 48000;
  const audioChannels = 2;
  for (const candidate of audioCodecCandidates) {
    const support = await AudioEncoder.isConfigSupported({
      codec: candidate.codec,
      sampleRate: audioSampleRate,
      numberOfChannels: audioChannels,
      bitrate: 128_000,
    });
    if (support.supported) {
      audioCodec = candidate;
      break;
    }
  }
  if (!audioCodec) throw new Error("เบราว์เซอร์นี้ไม่รองรับการเข้ารหัสเสียง");

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: "avc", width, height },
    audio: { codec: audioCodec.muxerCodec, numberOfChannels: audioChannels, sampleRate: audioSampleRate },
    fastStart: "in-memory",
  });

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error("VideoEncoder error", e),
  });
  videoEncoder.configure({ codec: videoCodec, width, height, bitrate: 8_000_000, framerate: OUTPUT_FPS });

  const audioEncoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: (e) => console.error("AudioEncoder error", e),
  });
  audioEncoder.configure({
    codec: audioCodec.codec,
    sampleRate: audioSampleRate,
    numberOfChannels: audioChannels,
    bitrate: 128_000,
  });

  const audioBufferCache: Record<string, AudioBuffer> = {};
  async function getAudioBuffer(asset: ExportAsset): Promise<AudioBuffer | null> {
    if (audioBufferCache[asset.id]) return audioBufferCache[asset.id];
    try {
      const buffer = await loadAudioBuffer(asset.videoUrl);
      audioBufferCache[asset.id] = buffer;
      return buffer;
    } catch {
      return null;
    }
  }

  function encodeAudioForClip(buffer: AudioBuffer, clip: TimelineClip, outputStartSeconds: number) {
    const startSample = Math.floor(clip.start * buffer.sampleRate);
    const endSample = Math.min(Math.floor(clip.end * buffer.sampleRate), buffer.length);
    const channelData: Float32Array[] = [];
    for (let ch = 0; ch < audioChannels; ch++) {
      channelData.push(buffer.getChannelData(Math.min(ch, buffer.numberOfChannels - 1)));
    }

    for (let offset = startSample; offset < endSample; offset += AUDIO_CHUNK_FRAMES) {
      const frames = Math.min(AUDIO_CHUNK_FRAMES, endSample - offset);
      const planar = new Float32Array(frames * audioChannels);
      for (let ch = 0; ch < audioChannels; ch++) {
        planar.set(channelData[ch].subarray(offset, offset + frames), ch * frames);
      }
      const timestamp = Math.round((outputStartSeconds + (offset - startSample) / buffer.sampleRate) * 1e6);
      const audioData = new AudioData({
        format: "f32-planar",
        sampleRate: buffer.sampleRate,
        numberOfFrames: frames,
        numberOfChannels: audioChannels,
        timestamp,
        data: planar,
      });
      audioEncoder.encode(audioData);
      audioData.close();
    }
  }

  async function encodeVideoForClip(clip: TimelineClip, outputStartSeconds: number) {
    video.currentTime = clip.start;
    await new Promise<void>((resolve) => {
      function onSeeked() {
        video.removeEventListener("seeked", onSeeked);
        resolve();
      }
      video.addEventListener("seeked", onSeeked);
    });

    video.playbackRate = PLAYBACK_SPEED;
    let framesDone = 0;
    let keepGoing = true;

    await new Promise<void>((resolve, reject) => {
      function onFrame(_now: number, metadata: VideoFrameCallbackMetadata) {
        if (!keepGoing) return;
        if (metadata.mediaTime >= clip.end - 0.001) {
          keepGoing = false;
          video.pause();
          resolve();
          return;
        }

        ctx!.drawImage(video, 0, 0, width, height);
        const active = subtitles.find(
          (s) => s.assetId === clip.assetId && metadata.mediaTime >= s.start && metadata.mediaTime <= s.end
        );
        if (active) drawSubtitle(ctx!, active.text, subtitleStyle, fontFamily, width, height);

        const outputSeconds = outputStartSeconds + (metadata.mediaTime - clip.start);
        const frame = new VideoFrame(canvas, {
          timestamp: Math.round(outputSeconds * 1e6),
          duration: Math.round((1 / OUTPUT_FPS) * 1e6),
        });
        videoEncoder.encode(frame, { keyFrame: framesDone === 0 });
        frame.close();
        framesDone++;

        onProgress?.(Math.min(outputSeconds, totalDuration), totalDuration);
        video.requestVideoFrameCallback(onFrame);
      }
      video.requestVideoFrameCallback(onFrame);
      video.play().catch(reject);
    });
  }

  let acc = 0;
  for (const clip of clips) {
    const asset = assetsById[clip.assetId];
    if (!asset) {
      acc += clip.end - clip.start;
      continue;
    }

    // Reload only if this clip's asset differs from what's currently loaded,
    // since re-fetching the same asset's blob on every clip would be wasteful.
    const alreadyLoaded = (video as unknown as { __assetId?: string }).__assetId === asset.id;
    if (!alreadyLoaded) {
      await loadAsset(asset.videoUrl);
      (video as unknown as { __assetId?: string }).__assetId = asset.id;
    }

    await encodeVideoForClip(clip, acc);

    const audioBuffer = await getAudioBuffer(asset);
    if (audioBuffer) encodeAudioForClip(audioBuffer, clip, acc);

    acc += clip.end - clip.start;
  }

  await videoEncoder.flush();
  await audioEncoder.flush();
  muxer.finalize();

  video.pause();
  document.body.removeChild(video);
  if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);

  const { buffer } = muxer.target;
  return new Blob([buffer], { type: "video/mp4" });
}
