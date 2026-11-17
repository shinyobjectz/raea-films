// The thermal film's clock: 30 fps, the score at 90 BPM (a bar 2.667 s). Each narration line (media/voice-thermal,
// Fish's Deep Cinematic Narrator) starts on the half bar after the line before has ended and its breath has passed, a
// longer breath where a section turns. said(line, word) is the second a word is spoken, from parakeet's word times, so
// cuts and hits follow the take.
import lines from "../media/voice-thermal/lines.json";

export const FPS = 30;
export const BPM = 90;
export const BEAT = 60 / BPM;
export const BAR = BEAT * 4;
const HALF = BAR / 2;

type Line = { id: string; text: string; seconds: number; words: [string, number, number][] };
export const LINES = lines as unknown as Line[];

/** the breath before each line (seconds), longer where a section starts */
// X caps a video at 2:20, so the breaths are short and lines start on the next half beat (v3: 24 lines)
const BREATH: Record<string, number> = { "01": 0, "03": 0.6, "04a": 0.5, "05": 0.6, "06": 0.4, "11a": 0.4, "14": 0.7, "17": 0.6, "18": 0.7 };
const SNAP = BEAT / 2;
const PRE = HALF; // a half bar of picture and pulse before the first word

export const START: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let t = PRE;
  for (const l of LINES) {
    const b = BREATH[l.id] ?? 0.15;
    const s = l.id === "01" ? PRE : Math.ceil((t + b) / SNAP - 1e-6) * SNAP;
    out[l.id] = s;
    t = s + l.seconds;
  }
  return out;
})();

/** when the last line ends, and the film's length: a second and a half after it, on the beat (X's 2:20 cap) */
export const LAST_END = START["18"] + LINES[LINES.length - 1].seconds;
export const SECONDS = Math.ceil((LAST_END + 1.5) / BEAT) * BEAT;
export const DURATION = Math.round(SECONDS * FPS);

/** the second a word (its first match from `from`, without punctuation, any case) is said in a line */
export function said(id: string, word: string, end = false, nth = 0): number {
  const l = LINES.find((x) => x.id === id)!;
  const clean = (w: string) => w.toLowerCase().replace(/[^a-z']/g, "");
  const hits = l.words.filter((w) => clean(w[0]) === clean(word));
  const w = hits[nth];
  if (!w) throw new Error(`line ${id} has no "${word}" (#${nth}): ${l.words.map((x) => x[0]).join(" ")}`);
  return START[id] + (end ? w[2] : w[1]);
}
/** when a line ends */
export const ends = (id: string) => START[id] + LINES.find((x) => x.id === id)!.seconds;
