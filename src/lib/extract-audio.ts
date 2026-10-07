import { Muxer, ArrayBufferTarget } from "mp4-muxer";

// Turns a video's decoded audio into a small speech-quality file for
// transcription. The transcription API caps uploads at 25 MB, which a video
// hits within a minute or two; mono Opus at 32 kbps fits well over an hour.

export type SpeechAudio = { blob: Blob; extension: "m4a" | "wav"; contentType: string };

// Tried in order; the first one this browser can encode is used. Which AAC
// bitrates exist depends on the platform encoder (Windows has no 64 kbps mono).
const ENCODINGS: { codec: string; muxerCodec: "opus" | "aac"; bitrate: number }[] = [
  { codec: "opus", muxerCodec: "opus", bitrate: 32_000 },
  { codec: "mp4a.40.2", muxerCodec: "aac", bitrate: 64_000 },
  { codec: "mp4a.40.2", muxerCodec: "aac", bitrate: 96_000 },
  { codec: "mp4a.40.2", muxerCodec: "aac", bitrate: 128_000 },
];
const CHUNK_FRAMES = 4096;
// Stop feeding the encoder while this many chunks are waiting, so a long
// recording isn't queued in memory all at once.
const MAX_QUEUED_CHUNKS = 64;
const WAV_SAMPLE_RATE = 16_000;

function mixToMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0);
  const mono = new Float32Array(buffer.length);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) mono[i] += data[i];
  }
  for (let i = 0; i < mono.length; i++) mono[i] /= buffer.numberOfChannels;
  return mono;
}

async function pickEncoding(sampleRate: number) {
  if (typeof AudioEncoder === "undefined") return null;
  for (const encoding of ENCODINGS) {
    const config = { codec: encoding.codec, sampleRate, numberOfChannels: 1, bitrate: encoding.bitrate };
    const supported = await AudioEncoder.isConfigSupported(config)
      .then((result) => result.supported === true)
      .catch(() => false);
    if (supported) return { config, muxerCodec: encoding.muxerCodec };
  }
  return null;
}

async function encodeCompressed(samples: Float32Array, sampleRate: number): Promise<Blob> {
  const encoding = await pickEncoding(sampleRate);
  if (!encoding) throw new Error("No supported audio encoder in this browser");
  const { config } = encoding;

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    audio: { codec: encoding.muxerCodec, numberOfChannels: 1, sampleRate },
    fastStart: "in-memory",
  });

  let failure: unknown = null;
  const encoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: (e) => {
      failure = e;
    },
  });
  encoder.configure(config);

  for (let offset = 0; offset < samples.length; offset += CHUNK_FRAMES) {
    if (failure) break;
    const frames = Math.min(CHUNK_FRAMES, samples.length - offset);
    const data = new AudioData({
      format: "f32-planar",
      sampleRate,
      numberOfFrames: frames,
      numberOfChannels: 1,
      timestamp: Math.round((offset / sampleRate) * 1e6),
      data: samples.slice(offset, offset + frames),
    });
    encoder.encode(data);
    data.close();

    while (encoder.encodeQueueSize > MAX_QUEUED_CHUNKS) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  if (!failure) await encoder.flush();
  encoder.close();
  if (failure) throw failure;

  muxer.finalize();
  return new Blob([muxer.target.buffer], { type: "audio/mp4" });
}

// Fallback for browsers without a usable encoder: 16 kHz 16-bit mono WAV.
// Much larger (about 13 minutes per 25 MB) but needs no codec support.
async function encodeWav(buffer: AudioBuffer): Promise<Blob> {
  const offline = new OfflineAudioContext(1, Math.ceil(buffer.duration * WAV_SAMPLE_RATE), WAV_SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = buffer;
  source.connect(offline.destination);
  source.start();
  const samples = (await offline.startRendering()).getChannelData(0);

  const header = new DataView(new ArrayBuffer(44));
  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) header.setUint8(offset + i, text.charCodeAt(i));
  };
  const dataBytes = samples.length * 2;
  writeText(0, "RIFF");
  header.setUint32(4, 36 + dataBytes, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  header.setUint32(16, 16, true);
  header.setUint16(20, 1, true); // PCM
  header.setUint16(22, 1, true); // mono
  header.setUint32(24, WAV_SAMPLE_RATE, true);
  header.setUint32(28, WAV_SAMPLE_RATE * 2, true);
  header.setUint16(32, 2, true);
  header.setUint16(34, 16, true);
  writeText(36, "data");
  header.setUint32(40, dataBytes, true);

  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return new Blob([header.buffer, pcm.buffer], { type: "audio/wav" });
}

export async function encodeSpeechAudio(buffer: AudioBuffer): Promise<SpeechAudio> {
  try {
    const blob = await encodeCompressed(mixToMono(buffer), buffer.sampleRate);
    return { blob, extension: "m4a", contentType: "audio/mp4" };
  } catch {
    return { blob: await encodeWav(buffer), extension: "wav", contentType: "audio/wav" };
  }
}
