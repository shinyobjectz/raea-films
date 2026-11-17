// The one clock the picture and the score share: 24 fps, 96 bpm (a beat is 15 frames, a bar 60), 32 bars, 80 s.
// Each narration line starts on a frame; a cue tied to a word reads that word's frame from the transcript
// (media/voice/lines.json, parakeet's times), so a new take moves its cues with it.
import lines from "../media/voice/lines.json";

export const FPS = 24;
export const BPM = 96;
export const BEAT = (FPS * 60) / BPM; // 15 frames
export const BAR = BEAT * 4; // 60 frames
export const BARS = 32;
export const DURATION = BAR * BARS; // 1920 frames, 80 s
export const SEC = (frames: number) => frames / FPS;
export const at = (bar: number, beat = 0) => Math.round((bar * 4 + beat) * BEAT); // a frame on the grid

// scenes, by bar: each cuts on a downbeat
export const SCENES = {
  eye: { from: at(0), to: at(4) },
  notes: { from: at(4), to: at(8) },
  print: { from: at(8), to: at(14) },
  words: { from: at(14), to: at(18) },
  check: { from: at(18), to: at(24) },
  yours: { from: at(24), to: at(29) },
  end: { from: at(29), to: at(32) },
} as const;
export type SceneName = keyof typeof SCENES;

type Line = { id: string; text: string; seconds: number; words: [string, number, number][] };
export const LINES = lines as Line[];

// where each line starts (frame), chosen against the bars so each scene breathes before and after its words
export const LINE_AT: Record<string, number> = {
  "01": 30,
  "02": 84,
  "03": 252,
  "04": 312,
  "05": 492,
  "06": 588,
  "07": 852,
  "08": 1092,
  "09": 1308,
  "10": 1452,
  "11": 1572,
  "12": 1764,
};

const clean = (w: string) => w.toLowerCase().replace(/[^a-z']/g, "");

/** the frame where line `id` says `word` (its nth time, from 0); throws if the transcript doesn't have it */
export function word(id: string, w: string, nth = 0): number {
  const line = LINES.find((l) => l.id === id);
  if (!line) throw new Error(`no line ${id}`);
  const hits = line.words.filter((x) => clean(x[0]) === clean(w));
  if (!hits[nth]) throw new Error(`line ${id} doesn't say "${w}" (${nth})`);
  return LINE_AT[id] + Math.round(hits[nth][1] * FPS);
}

/** the frame where line `id` ends */
export function lineEnd(id: string): number {
  const line = LINES.find((l) => l.id === id)!;
  return LINE_AT[id] + Math.round(line.seconds * FPS);
}

/** a scene's board slides in from this many frames before its downbeat, landing two frames before it (parts/stage.tsx);
 * the score's paper-slide starts with it */
export const BOARD_LEAD = 10;
