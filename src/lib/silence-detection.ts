export type SilentRange = { start: number; end: number };

export const DEFAULT_SILENCE_THRESHOLD_DB = -40;
export const DEFAULT_MIN_SILENCE_DURATION = 0.5;
export const DEFAULT_SILENCE_PADDING = 0.15;

const WINDOW_SECONDS = 0.05;

export function detectSilentRanges(
  buffer: AudioBuffer,
  opts?: { thresholdDb?: number; minSilenceDuration?: number; padding?: number }
): SilentRange[] {
  const thresholdDb = opts?.thresholdDb ?? DEFAULT_SILENCE_THRESHOLD_DB;
  const minSilenceDuration = opts?.minSilenceDuration ?? DEFAULT_MIN_SILENCE_DURATION;
  const padding = opts?.padding ?? DEFAULT_SILENCE_PADDING;

  const sampleRate = buffer.sampleRate;
  const channelCount = buffer.numberOfChannels;
  const length = buffer.length;

  const windowSize = Math.max(1, Math.round(WINDOW_SECONDS * sampleRate));
  const thresholdAmplitude = 10 ** (thresholdDb / 20);

  const channels: Float32Array[] = [];
  for (let ch = 0; ch < channelCount; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  const candidates: SilentRange[] = [];
  let silenceStart: number | null = null;

  for (let start = 0; start < length; start += windowSize) {
    const end = Math.min(start + windowSize, length);
    let sumSquares = 0;
    let count = 0;
    for (let ch = 0; ch < channelCount; ch++) {
      const data = channels[ch];
      for (let i = start; i < end; i++) {
        sumSquares += data[i] * data[i];
        count++;
      }
    }
    const rms = count > 0 ? Math.sqrt(sumSquares / count) : 0;
    const isSilent = rms < thresholdAmplitude;

    if (isSilent && silenceStart === null) {
      silenceStart = start;
    } else if (!isSilent && silenceStart !== null) {
      candidates.push({ start: silenceStart / sampleRate, end: start / sampleRate });
      silenceStart = null;
    }
  }
  if (silenceStart !== null) {
    candidates.push({ start: silenceStart / sampleRate, end: length / sampleRate });
  }

  return candidates
    .filter((range) => range.end - range.start >= minSilenceDuration)
    .map((range) => ({ start: range.start + padding, end: range.end - padding }))
    .filter((range) => range.end > range.start)
    .sort((a, b) => a.start - b.start);
}
