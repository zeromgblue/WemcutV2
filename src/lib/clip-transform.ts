/** How a clip sits in the output frame. `scale` 1 means "fit inside the frame";
 * `x`/`y` move the centre, as a percentage of the frame's width/height. */
export type ClipTransform = { x: number; y: number; scale: number };

export const DEFAULT_CLIP_TRANSFORM: ClipTransform = { x: 0, y: 0, scale: 1 };

export const MIN_CLIP_SCALE = 0.1;
export const MAX_CLIP_SCALE = 6;

export function clampScale(scale: number) {
  return Math.min(Math.max(scale, MIN_CLIP_SCALE), MAX_CLIP_SCALE);
}

/** Size of a video shown at scale 1 (fitted inside the frame, aspect kept). */
export function fittedSize(videoWidth: number, videoHeight: number, frameWidth: number, frameHeight: number) {
  if (!videoWidth || !videoHeight) return { width: frameWidth, height: frameHeight };
  const ratio = Math.min(frameWidth / videoWidth, frameHeight / videoHeight);
  return { width: videoWidth * ratio, height: videoHeight * ratio };
}

/** Scale at which the video covers the whole frame with no bars. */
export function coverScale(videoWidth: number, videoHeight: number, frameWidth: number, frameHeight: number) {
  const fitted = fittedSize(videoWidth, videoHeight, frameWidth, frameHeight);
  return Math.max(frameWidth / fitted.width, frameHeight / fitted.height);
}

/** Where the transformed video lands in the frame, in frame pixels. */
export function transformedRect(
  transform: ClipTransform,
  videoWidth: number,
  videoHeight: number,
  frameWidth: number,
  frameHeight: number
) {
  const fitted = fittedSize(videoWidth, videoHeight, frameWidth, frameHeight);
  const width = fitted.width * transform.scale;
  const height = fitted.height * transform.scale;
  const centerX = frameWidth / 2 + (transform.x / 100) * frameWidth;
  const centerY = frameHeight / 2 + (transform.y / 100) * frameHeight;
  return { x: centerX - width / 2, y: centerY - height / 2, width, height, centerX, centerY };
}
