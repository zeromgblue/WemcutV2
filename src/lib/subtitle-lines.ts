// Turns Whisper's timed tokens into readable subtitle lines.
//
// Thai is written without spaces, so Whisper's "words" are really tokens that
// can end in the middle of a word. Lines are therefore built from real word
// boundaries (Intl.Segmenter) and timed by mapping each character back to the
// token it came from.

export type TimedToken = { word: string; start: number; end: number };
export type TimedLine = { start: number; end: number; text: string };

// A pause this long between tokens always starts a new line.
const MAX_GAP_SECONDS = 0.5;
// Whisper sometimes stretches one token across a silence. Thai tokens are about
// a syllable long, so anything slower than this is silence, not speech.
const MAX_TOKEN_SECONDS = 0.7;

// Line length in visible columns (Thai vowel/tone marks stack and take no width).
const TARGET_LINE_WIDTH = 12;
const MAX_LINE_WIDTH = 24;
// A leftover this short is kept on the previous line instead of becoming its own.
const MIN_TAIL_WIDTH = 6;
const MAX_LINE_SECONDS = 5;

const MIN_LINE_SECONDS = 0.7;
// Keep a line on screen briefly after the last syllable so it doesn't flash away.
const LINGER_SECONDS = 0.12;
const MIN_LINE_GAP_SECONDS = 0.04;

const COMBINING_MARK = /[ัิ-ฺ็-๎̀-ͯ]/;
const BREAK_AFTER_PUNCTUATION = /[.!?…,ๆฯ]$/;

const segmenter = new Intl.Segmenter("th", { granularity: "word" });

function displayWidth(text: string) {
  let width = 0;
  for (const ch of text) {
    if (!COMBINING_MARK.test(ch)) width++;
  }
  return width;
}

// Splits tokens into runs of continuous speech and trims over-long tokens.
function splitIntoRuns(tokens: TimedToken[]): TimedToken[][] {
  const runs: TimedToken[][] = [];
  let current: TimedToken[] = [];

  const valid = tokens.filter((token) => token.word && token.end >= token.start);

  valid.forEach((raw, i) => {
    const token = { ...raw };
    if (token.end - token.start > MAX_TOKEN_SECONDS) {
      // The real syllable sits on the side that touches other speech; the
      // stretch is on the side facing the silence. Whisper usually stretches
      // backwards, so that is the default when both sides look the same.
      const next = valid[i + 1];
      const speechFollows = next !== undefined && next.start - token.end <= MAX_GAP_SECONDS;
      const last = current[current.length - 1];
      const speechPrecedes = last !== undefined && token.start - last.end <= MAX_GAP_SECONDS;
      if (speechFollows || !speechPrecedes) token.start = token.end - MAX_TOKEN_SECONDS;
      else token.end = token.start + MAX_TOKEN_SECONDS;
    }

    const last = current[current.length - 1];
    if (last && token.start - last.end > MAX_GAP_SECONDS) {
      runs.push(current);
      current = [];
    }
    current.push(token);
  });
  if (current.length > 0) runs.push(current);

  return runs;
}

// One entry per UTF-16 unit of the run's text: when that character starts and ends.
function buildCharTimes(run: TimedToken[]) {
  let text = "";
  const starts: number[] = [];
  const ends: number[] = [];

  for (const token of run) {
    const units = token.word.length;
    const timed = Math.max(1, displayWidth(token.word.trim()));
    const perColumn = (token.end - token.start) / timed;
    let column = 0;

    for (let i = 0; i < units; i++) {
      const ch = token.word[i];
      const takesTime = ch.trim() !== "" && !COMBINING_MARK.test(ch);
      const at = token.start + perColumn * Math.min(column, timed);
      starts.push(at);
      if (takesTime) column++;
      ends.push(token.start + perColumn * Math.min(column, timed));
    }
    text += token.word;
  }

  return { text, starts, ends };
}

function runToLines(run: TimedToken[]): TimedLine[] {
  const { text, starts, ends } = buildCharTimes(run);
  const words = Array.from(segmenter.segment(text), (s) => ({ text: s.segment, index: s.index }));

  const lines: TimedLine[] = [];
  let lineStart = -1;
  let lineEnd = -1;
  let width = 0;

  function flush() {
    if (lineStart < 0) return;
    const lineText = text.slice(lineStart, lineEnd).trim();
    if (lineText) lines.push({ start: starts[lineStart], end: ends[lineEnd - 1], text: lineText });
    lineStart = -1;
    lineEnd = -1;
    width = 0;
  }

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const isSpace = word.text.trim() === "";

    if (isSpace) {
      // Whisper puts spaces at phrase boundaries, which are the natural places to break.
      const remaining = displayWidth(text.slice(word.index).trim());
      if (width >= TARGET_LINE_WIDTH && remaining >= MIN_TAIL_WIDTH) flush();
      else if (lineStart >= 0) lineEnd = word.index + word.text.length;
      continue;
    }

    const wordWidth = displayWidth(word.text);
    const wordEnd = word.index + word.text.length;
    const tooWide = width + wordWidth > MAX_LINE_WIDTH;
    const tooLong = lineStart >= 0 && ends[wordEnd - 1] - starts[lineStart] > MAX_LINE_SECONDS;
    if (lineStart >= 0 && (tooWide || tooLong)) flush();

    if (lineStart < 0) lineStart = word.index;
    lineEnd = wordEnd;
    width += wordWidth;

    const remaining = displayWidth(text.slice(wordEnd).trim());
    if (width >= TARGET_LINE_WIDTH && BREAK_AFTER_PUNCTUATION.test(word.text) && remaining >= MIN_TAIL_WIDTH) {
      flush();
    }
  }
  flush();

  return lines;
}

// Gives every line enough time on screen without running into the next one.
function padLineTimes(lines: TimedLine[]): TimedLine[] {
  return lines.map((line, i) => {
    const limit = lines[i + 1] ? lines[i + 1].start - MIN_LINE_GAP_SECONDS : Infinity;
    const wanted = Math.max(line.end + LINGER_SECONDS, line.start + MIN_LINE_SECONDS);
    return { ...line, end: Math.max(line.end, Math.min(wanted, limit)) };
  });
}

export function buildSubtitleLines(tokens: TimedToken[]): TimedLine[] {
  const sorted = [...tokens].sort((a, b) => a.start - b.start);
  const lines = splitIntoRuns(sorted).flatMap(runToLines);
  return padLineTimes(lines);
}

// True when a corrected line is still recognisably the same line, i.e. the
// correction fixed spelling rather than rewriting or dropping content.
export function isSafeCorrection(original: string, corrected: string) {
  const before = displayWidth(original.replace(/\s/g, ""));
  const after = displayWidth(corrected.replace(/\s/g, ""));
  if (after === 0) return false;
  return Math.abs(after - before) <= Math.max(3, before * 0.35);
}
