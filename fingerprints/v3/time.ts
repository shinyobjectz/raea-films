// Fingerprint v3's clock: 24 fps at 96 beats a minute (a beat is 15 frames, a bar of four 60, 2.5 s), as many bars
// as the narration needs (about two minutes). The lines start where LINE_AT puts them (seconds); said() is the second a word is spoken, read
// from the transcript's word times, so a cue follows a new take.
import lines from "../media/voice3/lines.json";

export const FPS = 24;
export const BPM = 96;
export const BEAT = 60 / BPM;
export const BAR = BEAT * 4;
type Line = { id: string; text: string; seconds: number; words: [string, number, number][] };
export const LINES = lines as unknown as Line[];
// each line starts a breath after the one before; the brain's pop gets room after "Don't touch it", and the cat
// a beat before it is explained
const GAP: Record<string, number> = { "03": 1.4, "04": 0.8, "05": 0.6, "14": 0.6, "15": 0.55 };
export const LINE_AT: Record<string, number> = {};
{
  let t = 1.0;
  for (const l of LINES) { LINE_AT[l.id] = Math.round(t * 100) / 100; t += l.seconds + (GAP[l.id] ?? 0.36); }
}
const LAST = LINES[LINES.length - 1];
export const BARS = Math.ceil((LINE_AT[LAST.id] + LAST.seconds + 1.6) / BAR);
export const SECONDS = BARS * BAR;
export const DURATION = Math.round(SECONDS * FPS);

const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
export function said(id: string, w: string, nth = 0): number {
  const line = LINES.find((l) => l.id === id);
  if (!line) throw new Error(`time: no line ${id}`);
  const hits = line.words.filter((x) => clean(x[0]) === clean(w));
  if (!hits[nth]) throw new Error(`time: line ${id} doesn't say "${w}" (${nth}): ${line.words.map((x) => x[0]).join(" ")}`);
  return LINE_AT[id] + hits[nth][1];
}
export const lineEnd = (id: string) => LINE_AT[id] + LINES.find((l) => l.id === id)!.seconds;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const smooth = (x: number) => { const k = clamp01(x); return k * k * (3 - 2 * k); };
export const ramp = (t: number, a: number, b: number) => smooth(span(t, a, b));
export const hold = (t: number, a: number, b: number, rise = 0.4, fall = 0.4) => ramp(t, a, a + rise) * (1 - ramp(t, b - fall, b));
export const bump = (t: number, c: number, w: number) => smooth(1 - Math.abs(t - c) / (w / 2));

/** the cues the picture and the sound share (seconds) */
export const CUE = {
  nothing: said("01", "nothing"), colourful: said("01", "colorful"), stayed: said("01", "stayed"),
  hand: said("02", "hand"), bold: said("02", "bold"),
  trouble: said("03", "trouble"), dont: said("03", "don't"), touchEnd: lineEnd("03"),
  pop: lineEnd("03") + 0.55, // the brain goes
  touched: said("04", "you"), fine: said("05", "fine"), anyway: said("05", "anyway"),
  lightning: said("06", "lightning"), this: said("06", "this"), looping: said("06", "looping"), chaos: said("06", "chaos"), opinions: said("06", "opinions"),
  taste: said("07", "taste"), refusals: said("07", "refusals"), blue: said("07", "blue"), notVase: said("07", "not", 1), vase: said("07", "vase"), thatOne: said("07", "that", 2), why: said("07", "why"), know: said("07", "know", 1),
  pattern: said("08", "pattern"), yours: said("08", "yours"), biometrics: said("08", "biometrics"),
  videos: said("09", "videos"), ai: said("09", "ai"), wrong: said("09", "wrong"), red: said("09", "red"), dark: said("09", "dark"), hiss: said("09", "hiss"), notes: said("09", "notes"),
  name: said("10", "fingerprint"), learns: said("10", "learns"), approve: said("10", "approve"), pick: said("10", "pick"), leave: said("10", "leave"), words: said("10", "words"),
  reads: said("11", "reads"), flag: said("11", "flag"), fixed: said("11", "fixed"),
  hides: said("12", "hides"), there: said("12", "there"), noticed: said("12", "noticed"), insufferable: said("12", "insufferable"),
  machine: said("13", "machine"), leaves: said("13", "leaves"), team: said("13", "team"), never: said("13", "never", 1),
  creativity: said("14", "creativity"), chaos2: said("14", "chaos"), refusals2: said("14", "refusals"), pattern2: said("14", "pattern"),
  cat: said("15", "cat"), consulted: said("15", "consulted"),
  end: said("16", "fingerprint"), raea: said("16", "in"), staring: said("16", "staring"),
};
