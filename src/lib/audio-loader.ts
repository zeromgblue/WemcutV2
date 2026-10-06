export const MAX_ANALYZABLE_DURATION_SECONDS = 30 * 60;

export async function loadAudioBuffer(url: string): Promise<AudioBuffer> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error("ไม่สามารถดาวน์โหลดวิดีโอเพื่อวิเคราะห์เสียงได้");
  }
  if (!res.ok) {
    throw new Error("ไม่สามารถดาวน์โหลดวิดีโอเพื่อวิเคราะห์เสียงได้");
  }

  const arrayBuffer = await res.arrayBuffer();
  const ctx = new AudioContext();
  try {
    return await ctx.decodeAudioData(arrayBuffer);
  } catch {
    throw new Error("ไม่พบเสียงในวิดีโอ หรือไฟล์ไม่รองรับการวิเคราะห์");
  } finally {
    ctx.close();
  }
}
