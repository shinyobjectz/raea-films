// The drawn layer: brush lettering, handwriting, arrows and strokes over the picture (tools/ink.sh draws each three
// times; cycling them every few frames is the boil). Each cue wipes on like a stroke, wobbles on the beat and is gone.
import { staticFile } from "raea";
import sizes from "./ink.json";
import { G, gooseBox } from "./plan";
import { SAFE, TALL, tallGooseBox, wideToTall } from "./tall";
type Cue = { n: string; from: number; to: number; x: number; y: number; h: number; rot?: number; wipe?: "l" | "r" | "t" | "b" | "pop"; pulse?: number; head?: boolean; behind?: boolean; ta?: [number, number, number] };
const C = (n: string, from: number, to: number, x: number, y: number, h: number, o: Partial<Cue> = {}): Cue => ({ n, from, to, x, y, h, ...o });
// x, y: the middle, as fractions of the frame (or, with head, an offset from where the goose's head is on screen);
// h: height as a fraction of the frame's. Sparse: the title, the hook's words as they're sung (QUACK, MUD FEET?, POP!,
// DUCK?, SOUP.), the key it hits and the splash it makes; impact marks on the stomps. No asides: the director couldn't read
// the goose's "ga~", the "brrr" or the "the mayor" tag (11-16), so they're gone.
export const CUES: Cue[] = [
  // v9 (the director 11-16: "cut to the upward angle when it says SCHLOP and have that in text in the sky behind the goose"):
  // "slap" is sung 12.88-13.20 s (b 18.8); the shot from below cuts in on it and the word stands in the sky behind it
  C("schlop", 18.8, 19.95, 0.5, 0.3, 0.3, { rot: -4, pulse: 1, behind: true }),
  // (9:16: the title stacked in the sky over the goose swimming, its head at 0.4 down the tall frame)
  C("title1", 9.0, 12.4, 0.5, 0.24, 0.15, { rot: -3, pulse: 1, ta: [0.46, 0.19, 1] }), C("title2", 9.5, 12.4, 0.5, 0.46, 0.26, { rot: 2, pulse: 1, ta: [0.46, 0.285, 1] }), C("under", 10.2, 12.4, 0.5, 0.66, 0.07, { ta: [0.46, 0.36, 1] }),
  // on the feet coming down, each out beside its own foot: the goose faces the lens, so its left foot is right of centre
  // (x 0.53 at 40.43) and its right foot left of it (0.47). v8: they were swapped (the director 11-16, "the lines are on the wrong foot sides")
  C("burst", 40.42, 41.0, 0.6, 0.72, 0.42, { wipe: "pop" }), C("burst", 41.39, 41.95, 0.4, 0.72, 0.42, { wipe: "pop" }),
  C("quack", 50.4, 51.7, 0.24, 0.28, 0.2, { rot: -7, wipe: "pop", pulse: 1 }), C("quackw", 51.0, 51.7, 0.76, 0.66, 0.17, { rot: 6, wipe: "pop", pulse: 1 }),
  C("mudfeet", 53.0, 54.15, 0.5, 0.2, 0.18, { rot: -3, wipe: "pop" }),
  // (9:16: the three stacked down over its head as they're sung; the third had no room beside it, only on a wing)
  C("quack", 54.2, 55.8, 0.2, 0.24, 0.14, { rot: -9, wipe: "pop", ta: [0.4, 0.165, 0.8] }), C("quackw", 54.8, 55.8, 0.78, 0.3, 0.13, { rot: 7, wipe: "pop", ta: [0.58, 0.252, 0.8] }), C("quack", 55.3, 55.8, 0.5, 0.8, 0.15, { rot: -2, wipe: "pop", ta: [0.44, 0.33, 0.7] }),
  C("pop", 60.5, 61.2, 0.72, 0.3, 0.22, { rot: 9, wipe: "pop", pulse: 1 }), C("spark", 60.5, 61.2, 0.28, 0.62, 0.14, { wipe: "pop" }),
  // (ta, the 9:16 only: x, y and scale set by hand where the placer's padded head box leaves no room; the held close-up
  // fills the tall frame from the middle down, and the card shows above its head)
  C("duck", 64.1, 65.3, 0.3, 0.28, 0.36, { rot: -5, wipe: "pop", pulse: 1, ta: [0.46, 0.2, 1] }),   // on the held frame, over its card
  C("duck", 115.93, 117.1, 0.72, 0.26, 0.34, { rot: 7, wipe: "pop", pulse: 1 }),   // v9: the second, on its blue card
  C("soup", 66.0, 66.9, 0.68, 0.32, 0.24, { rot: 5, wipe: "pop", pulse: 1 }),
  C("title1", 67.8, 71.6, 0.5, 0.12, 0.11, { rot: -2, pulse: 1 }), C("title2", 68.4, 71.6, 0.5, 0.28, 0.19, { rot: 2, pulse: 1 }),
  // (9:16: the word and its burst together in the sky over it, as in the wide; the dodge had sent the word down to the key)
  C("enter", 91.6, 92.4, 0.5, 0.21, 0.26, { rot: -4, wipe: "pop", pulse: 1, ta: [0.46, 0.2, 1] }), C("burst", 91.9, 92.4, 0.5, 0.19, 0.46, { wipe: "pop", ta: [0.46, 0.2, 0.75] }),
  C("sploosh", 94.3, 95.5, 0.5, 0.24, 0.24, { rot: -4, wipe: "pop", pulse: 1 }),   // as it goes under
];
// The hook's words keep clear of the goose: a word that would land on it over its whole cue moves, once, to the side
// with room (painted in one colour with no outline, a word over the goose reads as a mess). The painted sprites are
// cropped tight, so words draw at 0.82 of the height they had with the sticker's margin.
const DODGE = new Set(["quack", "quackw", "mudfeet", "pop", "duck", "soup", "spark"]), WORD = 0.82;
type Box = [number, number, number, number];
const placed = new Map<number, { at: [number, number, number]; box: Box }>(), placedTall = new Map<number, { at: [number, number, number]; box: Box }>();
const meets = (a: Box, b: Box) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
// ---- 9:16 (compositions/tall.ts): each cue at the same size in pixels as in the wide (a share 0.6 of the tall frame's
// height for each of the wide's), where the tall lens puts its wide spot, inside the phone's safe zone (tall.ts SAFE);
// the titles and the big words centred in the safe zone, the impact marks beside the feet they mark
const TH = 0.6, SX0 = SAFE.left / TALL.w, SX1 = 1 - SAFE.right / TALL.w, SY0 = SAFE.top / TALL.h, SY1 = 1 - SAFE.bottom / TALL.h, SMID = (SX0 + SX1) / 2;
const TALL_FIT = (SX1 - SX0) * 0.97;
const MARK = new Set(["burst", "spark"]);
// (tall: ENTER, set over the goose in the wide, can land on it once the lens tips to follow it up: it dodges too)
const TALL_DODGE = new Set(["enter"]);
/** a cue's spot and size in the tall frame: x, y (0..1), h (a share of its height), and the widest it may be (a share of its width) */
export function tallCue(c: Cue, k: number): { x: number; y: number; h: number; wmax: number } {
  const [x, y] = place(c, k, TALL.w, TALL.h, true), h = c.h * TH;
  return { x, y, h, wmax: TALL_FIT };
}
function place(c: Cue, k: number, w: number, h: number, tall = false): [number, number, number] {
  const hit = (tall ? placedTall : placed).get(k); if (hit) return hit.at;
  const [sw, sh] = (sizes as Record<string, number[]>)[c.n], word = DODGE.has(c.n) ? WORD : 1, hs = tall ? TH : 1;
  if (tall && c.ta) { const [x, y, sc] = c.ta, ph = c.h * word * hs * sc, pw = Math.min(TALL_FIT, (ph * h * sw) / sh / w), at: [number, number, number] = [x, y, sc]; placedTall.set(k, { at, box: [x - pw / 2, y - ph / 2, x + pw / 2, y + ph / 2] }); return at; }
  if (tall && !DODGE.has(c.n) && !TALL_DODGE.has(c.n)) {
    // the marks where the lens puts them; the rest centred across the safe zone at the height the lens puts them, kept inside it
    const [mx, my] = wideToTall(c.x, c.y, G(c.from)), ph = c.h * hs, pw = Math.min(TALL_FIT, (ph * h * sw) / sh / w);
    const x = MARK.has(c.n) ? Math.min(SX1 - pw / 2, Math.max(SX0 + pw / 2, mx)) : SMID, yy = Math.min(SY1 - ph / 2, Math.max(SY0 + ph / 2, my));
    const at: [number, number, number] = [x, yy, 1]; placedTall.set(k, { at, box: [x - pw / 2, yy - ph / 2, x + pw / 2, yy + ph / 2] }); return at;
  }
  if (!DODGE.has(c.n) && !tall) return [c.x, c.y, 1];   // titles, marks and bursts stay where they're put
  const size = (s: number) => { const ph = c.h * word * hs * s, pw = (ph * h * sw) / sh / w; return tall && pw > TALL_FIT ? [TALL_FIT, (ph * TALL_FIT) / pw] : [pw, ph]; };
  const boxAt = (x: number, y: number, s: number): Box => { const [pw, ph] = size(s); return [x - pw / 2, y - ph / 2, x + pw / 2, y + ph / 2]; };
  const area = (a: Box, b: Box) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  // the words already set that share time with this one
  const pl = tall ? placedTall : placed, others = CUES.flatMap((o, j) => (j < k && o.from < c.to && c.from < o.to && DODGE.has(o.n) && pl.has(j) ? [pl.get(j)!.box] : []));
  // the head may never be covered; the body only at a cost (a word may cross a wing, never the face)
  const dodges = DODGE.has(c.n) || (tall && TALL_DODGE.has(c.n)), gb = tall ? tallGooseBox : gooseBox, hd = dodges ? gb(c.from, c.to, "head") : null, bd0 = dodges ? gb(c.from, c.to, "body") : null;
  // (tall: the body runs up the neck to the head, so a word over the white neck costs as one over the body)
  const bd: Box | null = tall && hd && bd0 ? [Math.min(hd[0], bd0[0]), Math.min(hd[1], bd0[1]), Math.max(hd[2], bd0[2]), Math.max(hd[3], bd0[3])] : bd0;
  const head: Box | null = hd && [hd[0] - 0.015, hd[1] - 0.03, hd[2] + 0.015, hd[3] + 0.02];
  const [bx0, by0, bx1, by1] = tall ? [SX0, SY0, SX1, SY1] : [0.03, 0.05, 0.97, 0.95];
  const ok = (bx: Box) => bx[0] >= bx0 && bx[2] <= bx1 && bx[1] >= by0 && bx[3] <= by1 && !(head && meets(bx, head)) && !others.some((o) => meets(bx, o));
  let best: { at: [number, number, number]; box: Box } | null = null, bestD = 1e9;
  const [cx0, cy0] = tall ? [SMID, wideToTall(c.x, c.y, G(c.from))[1]] : [c.x, c.y];
  for (const s of tall ? [1, 0.85, 0.72, 0.6, 0.5] : [1, 0.85, 0.72, 0.6]) {
    const [pw] = size(s), sides = [head, bd].flatMap((g) => (g ? [g[0] - pw / 2 - 0.02, g[2] + pw / 2 + 0.02] : []));
    for (const y of tall ? [cy0, ...Array.from({ length: 17 }, (_, i) => 0.14 + i * 0.04)] : [c.y, 0.12, 0.2, 0.3, 0.7, 0.82]) for (const x of [cx0, ...sides, bx0 + pw / 2, bx1 - pw / 2]) {
      const bx = boxAt(x, y, s); if (!ok(bx)) continue;
      const cover = bd ? area(bx, bd) / ((bx[2] - bx[0]) * (bx[3] - bx[1])) : 0, d = Math.hypot(x - cx0, (y - cy0) * 0.5) + (1 - s) * 0.6 + (tall ? 3 : 1.2) * cover;
      if (d < bestD) { bestD = d; best = { at: [x, y, s], box: bx }; }
    }
  }
  best ??= tall ? { at: [SMID, 0.2, 0.6], box: boxAt(SMID, 0.2, 0.6) } : { at: [c.x, 0.1, 0.6], box: boxAt(c.x, 0.1, 0.6) };
  pl.set(k, best); return best.at;
}
const ease = (u: number) => { const c = Math.max(0, Math.min(1, u)); return 1 - (1 - c) ** 3; };
/** The title over the shot where it climbs out (b 11.6 to 12.4) stands behind the goose (the director 11-16: the goose in front
 * there, the title behind it): the film draws those cues as cards in the world (film.tsx), so Ink leaves them out. */
export const TITLES_BEHIND: [number, number] = [11.6, 12.4];
const TITLE = new Set(["title1", "title2", "under"]);
const isBehind = (c: Cue, b: number) => c.behind || (TITLE.has(c.n) && b >= TITLES_BEHIND[0] && b < TITLES_BEHIND[1]);
export const titleCues = (b: number) => CUES.flatMap((c, k) => (b >= c.from && b < c.to && isBehind(c, b) ? [{ c, k }] : []));
export function Ink({ b, frame, head, w: w0 = 2160, h: h0 = 1080, tall = false }: { t: number; b: number; frame: number; head?: [number, number] | null; w?: number; h?: number; tall?: boolean }) {
  const w = tall ? TALL.w : w0, h = tall ? TALL.h : h0;
  const boil = Math.floor(frame / 4) % 3, ph = ((b % 1) + 1) % 1, hit = (0.5 + 0.5 * Math.cos(2 * Math.PI * ph)) ** 3;
  return (
    <>
      {CUES.map((c, k) => {
        if (b < c.from || b >= c.to || (c.head && !head) || isBehind(c, b)) return null;
        const [px, py, fitS] = place(c, k, w, h, tall), word = (DODGE.has(c.n) ? WORD : 1) * fitS * (tall ? TH : 1);
        const cx = c.head ? Math.min(0.88, Math.max(0.12, head![0] + c.x)) : px, cy = c.head ? Math.min(0.85, Math.max(0.12, head![1] + c.y)) : py;
        const [sw, sh] = (sizes as Record<string, number[]>)[c.n], ph0 = c.h * h * word, pw = (ph0 * sw) / sh, fit = Math.min(1, (w * (tall ? TALL_FIT : 0.94)) / pw);
        const on = ease((b - c.from) / 0.7), off = ease((c.to - b) / 0.25), wipe = c.wipe ?? "l", j = Math.floor(frame / 4) * 7 + k * 13;
        const jr = (Math.sin(j * 12.9898) * 43758.5453) % 1, jx = (Math.sin(j * 78.233) * 43758.5453) % 1;
        const clip = wipe === "pop" ? undefined : wipe === "l" ? `inset(-5% ${100 - on * 105}% -5% -5%)` : wipe === "r" ? `inset(-5% -5% -5% ${100 - on * 105}%)` : wipe === "t" ? `inset(-5% -5% ${100 - on * 105}% -5%)` : `inset(${100 - on * 105}% -5% -5% -5%)`;
        const s = fit * (wipe === "pop" ? 0.4 + 0.6 * ease((b - c.from) / 0.35) : 1) * (1 + (c.pulse ?? 0) * 0.07 * hit) * (0.6 + 0.4 * off);
        return <img key={k} src={staticFile(`ink/${c.n}-${boil}.png`)} style={{ position: "absolute", left: cx * w - pw / 2 + jx * 3, top: cy * h - ph0 / 2, width: pw, height: ph0, opacity: off, clipPath: clip,
          transform: `rotate(${(c.rot ?? 0) + jr * 1.2}deg) scale(${s})` }} />;
      })}
    </>
  );
}
