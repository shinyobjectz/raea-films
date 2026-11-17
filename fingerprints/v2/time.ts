// Fingerprint v2's clock: 24 fps and a waltz at 144 beats a minute, so a beat is 10 frames and a bar of three is 30
// (1.25 s); 78 bars, 97.5 s. The narration's lines start where LINE_AT says (seconds); said() is the second a word is
// spoken, read from the transcript's word times, so a cue follows a new take.
import lines from "../media/voice2/lines.json";

export const FPS = 24;
export const BPM = 144;
export const BEAT = 60 / BPM;
export const BAR = BEAT * 3;
export const BARS = 78;
export const SECONDS = BARS * BAR;
export const DURATION = Math.round(SECONDS * FPS);
/** the second bar b, beat q (both from 0) starts */
export const bar = (b: number, q = 0) => (b * 3 + q) * BEAT;

type Line = { id: string; text: string; seconds: number; words: [string, number, number][] };
export const LINES = lines as unknown as Line[];
export const LINE_AT: Record<string, number> = {
  "01": 2.5, "02": 8.0, "03": 13.0, "04": 18.0, "05": 24.5, "06": 35.75, "07": 42.0, "08": 47.0, "09": 63.25, "10": 70.0, "11": 78.25, "12": 88.0, "13": 92.0,
};
const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
export function said(id: string, w: string, nth = 0): number {
  const line = LINES.find((l) => l.id === id);
  if (!line) throw new Error(`time: no line ${id}`);
  const hits = line.words.filter((x) => clean(x[0]) === clean(w));
  if (!hits[nth]) throw new Error(`time: line ${id} doesn't say "${w}" (${nth}): ${line.words.map((x) => x[0]).join(" ")}`);
  return LINE_AT[id] + hits[nth][1];
}
export const lineEnd = (id: string) => LINE_AT[id] + LINES.find((l) => l.id === id)!.seconds;

/** the shots: [name, from, to] in seconds; every cut is on a bar line */
export const SHOTS = [
  ["hand", 0, 7.5],
  ["draw", 7.5, 12.5],
  ["paint", 12.5, 17.5],
  ["conduct", 17.5, 23.75],
  ["notes", 23.75, 35.0],
  ["machine", 35.0, 41.25],
  ["print", 41.25, 46.25],
  ["approve", 46.25, 52.5],
  ["pick", 52.5, 57.5],
  ["hotel", 57.5, 62.5],
  ["strip", 62.5, 77.5],
  ["cover", 77.5, 87.5],
  ["work", 87.5, 91.25],
  ["end", 91.25, 97.5],
] as const;
export type ShotName = (typeof SHOTS)[number][0];
export const shot = (n: ShotName) => { const s = SHOTS.find((x) => x[0] === n)!; return { from: s[1] as number, to: s[2] as number }; };
export const shotAt = (t: number): number => { const i = SHOTS.findIndex((s) => t >= s[1] && t < s[2]); return i < 0 ? SHOTS.length - 1 : i; };

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const smooth = (x: number) => { const k = clamp01(x); return k * k * (3 - 2 * k); };
export const ramp = (t: number, a: number, b: number) => smooth(span(t, a, b));
/** up at a (over `rise`), held, down by b (over `fall`) */
export const hold = (t: number, a: number, b: number, rise = 0.4, fall = 0.4) => ramp(t, a, a + rise) * (1 - ramp(t, b - fall, b));
/** a bump: up and back down, centred at c, `w` wide */
export const bump = (t: number, c: number, w: number) => smooth(1 - Math.abs(t - c) / (w / 2));
