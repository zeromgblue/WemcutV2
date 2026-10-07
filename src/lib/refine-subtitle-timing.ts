// Snaps subtitle start/end times to where speech actually starts and stops in
// the audio. Whisper's timestamps are close but drift around pauses: a line
// often appears before the first syllable or hangs on after the last one.

type Timed = { start: number; end: number };

const FRAME_SECONDS = 0.01;
// Speech must hold for this long to count as an onset, and silence for this
// long to count as a pause, so single clicks and breaths are ignored.
const MIN_SPEECH_FRAMES = 4;
const MIN_SILENCE_FRAMES = 8;

// How far from Whisper's timestamp an edge may move.
const START_SEARCH_BACK = 0.3;
const START_SEARCH_FORWARD = 0.4;
const END_SEARCH_BACK = 0.4;
const END_SEARCH_FORWARD = 0.45;

// Show the line just before the first syllable and hold it just past the last.
const LEAD_IN_SECONDS = 0.04;
const HOLD_SECONDS = 0.1;
const MIN_DURATION_SECONDS = 0.5;
const MIN_GAP_SECONDS = 0.04;

// Per-frame "is someone speaking" flags from the loudness of the mixed-down audio.
function detectSpeechFrames(buffer: AudioBuffer): Uint8Array {
  const frameSize = Math.max(1, Math.round(FRAME_SECONDS * buffer.sampleRate));
  const frameCount = Math.ceil(buffer.length / frameSize);
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) channels.push(buffer.getChannelData(ch));

  const rms = new Float32Array(frameCount);
  for (let f = 0; f < frameCount; f++) {
    const from = f * frameSize;
    const to = Math.min(from + frameSize, buffer.length);
    let sum = 0;
    for (const data of channels) {
      for (let i = from; i < to; i++) sum += data[i] * data[i];
    }
    rms[f] = Math.sqrt(sum / Math.max(1, (to - from) * channels.length));
  }

  // The threshold adapts to the recording: a bit above its own noise floor,
  // but never so low that room tone counts as speech.
  const sorted = Float32Array.from(rms).sort();
  const noiseFloor = sorted[Math.floor(sorted.length * 0.1)] ?? 0;
  const loud = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
  const threshold = Math.max(0.004, noiseFloor * 3, loud * 0.06);

  const speech = new Uint8Array(frameCount);
  for (let f = 0; f < frameCount; f++) speech[f] = rms[f] > threshold ? 1 : 0;
  return speech;
}

function allEqual(frames: Uint8Array, from: number, count: number, value: number) {
  if (from < 0 || from + count > frames.length) return false;
  for (let i = from; i < from + count; i++) {
    if (frames[i] !== value) return false;
  }
  return true;
}

// Frame nearest to `target` (within [lo, hi]) where silence turns into speech.
function nearestOnset(frames: Uint8Array, target: number, lo: number, hi: number) {
  let best = -1;
  for (let f = Math.max(MIN_SILENCE_FRAMES, lo); f <= Math.min(frames.length - MIN_SPEECH_FRAMES, hi); f++) {
    if (
      allEqual(frames, f - MIN_SILENCE_FRAMES, MIN_SILENCE_FRAMES, 0) &&
      allEqual(frames, f, MIN_SPEECH_FRAMES, 1) &&
      (best < 0 || Math.abs(f - target) < Math.abs(best - target))
    ) {
      best = f;
    }
  }
  return best;
}

// Frame nearest to `target` (within [lo, hi]) where speech turns into silence.
function nearestOffset(frames: Uint8Array, target: number, lo: number, hi: number) {
  let best = -1;
  for (let f = Math.max(MIN_SPEECH_FRAMES, lo); f <= Math.min(frames.length - MIN_SILENCE_FRAMES, hi); f++) {
    if (
      allEqual(frames, f - MIN_SPEECH_FRAMES, MIN_SPEECH_FRAMES, 1) &&
      allEqual(frames, f, MIN_SILENCE_FRAMES, 0) &&
      (best < 0 || Math.abs(f - target) < Math.abs(best - target))
    ) {
      best = f;
    }
  }
  return best;
}

// `segments` must all belong to the asset `buffer` was decoded from. Edges with
// no clear pause nearby (continuous speech) are left exactly as Whisper gave them.
export function refineSubtitleTiming<T extends Timed>(segments: T[], buffer: AudioBuffer): T[] {
  if (segments.length === 0) return segments;

  const frames = detectSpeechFrames(buffer);
  const toFrame = (seconds: number) => Math.round(seconds / FRAME_SECONDS);
  const sorted = [...segments].sort((a, b) => a.start - b.start);

  const refined = sorted.map((segment) => {
    let { start, end } = segment;

    const onset = nearestOnset(
      frames,
      toFrame(start),
      toFrame(start - START_SEARCH_BACK),
      toFrame(start + START_SEARCH_FORWARD)
    );
    if (onset >= 0) start = Math.max(0, onset * FRAME_SECONDS - LEAD_IN_SECONDS);

    const offset = nearestOffset(
      frames,
      toFrame(end),
      toFrame(end - END_SEARCH_BACK),
      toFrame(end + END_SEARCH_FORWARD)
    );
    if (offset >= 0) end = offset * FRAME_SECONDS + HOLD_SECONDS;

    // A bad snap must never collapse or invert a line.
    if (end - start < MIN_DURATION_SECONDS) return segment;
    return { ...segment, start, end };
  });

  for (let i = 0; i < refined.length - 1; i++) {
    const limit = refined[i + 1].start - MIN_GAP_SECONDS;
    if (refined[i].end > limit && limit > refined[i].start) {
      refined[i] = { ...refined[i], end: limit };
    }
  }

  return refined;
}
