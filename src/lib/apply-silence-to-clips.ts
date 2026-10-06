import type { TimelineClip } from "@/app/actions/timeline";
import type { SilentRange } from "./silence-detection";

export function removeSilentRangesFromClips(
  clips: TimelineClip[],
  assetId: string,
  silentRanges: SilentRange[],
  minClipDuration: number
): TimelineClip[] {
  const ranges = [...silentRanges].sort((a, b) => a.start - b.start);

  return clips.flatMap((clip) => {
    if (clip.assetId !== assetId) return [clip];

    const overlapping = ranges.filter((r) => r.end > clip.start && r.start < clip.end);
    if (overlapping.length === 0) return [clip];

    const segments: { start: number; end: number }[] = [];
    let cursor = clip.start;
    for (const r of overlapping) {
      const silStart = Math.max(r.start, clip.start);
      const silEnd = Math.min(r.end, clip.end);
      if (silStart > cursor) segments.push({ start: cursor, end: silStart });
      cursor = Math.max(cursor, silEnd);
    }
    if (cursor < clip.end) segments.push({ start: cursor, end: clip.end });

    return segments
      .filter((seg) => seg.end - seg.start >= minClipDuration)
      .map((seg, i) => ({
        id: i === 0 ? clip.id : crypto.randomUUID(),
        assetId: clip.assetId,
        start: seg.start,
        end: seg.end,
      }));
  });
}
