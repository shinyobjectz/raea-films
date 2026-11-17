// The 9:16 lens (the director 11-16 on v9: "can i also get a 9:16 version of this"). Not a crop of the 18:9: every shot is
// seen again from the same place through a tall frame, turned across onto its subject and given a taller field of
// view. `k` is the tall frame's width as a share of the wide frame's height (0.72: the goose 1.4 times as big as in the
// wide, and a quarter more of the world above and below it). A goose shot turns to keep the goose (its head, back and
// feet, steadied over 0.8 s) in the middle across, and tips half way toward it up and down; any other shot turns to
// `aim`, the point across the wide frame (0..1) its subject stands at. Where the screen has to fit across the tall frame, the field of view is held to a natural one
// (MAX_VFOV) and the lens drawn back along its line (`back`) instead. compositions/film.tsx#goose-9x16 draws it.
import { FPS, FRAMES, G, bodyAt, camera, root, upOf, worldT, type V3 } from "./plan";
import { WATER, height } from "./set";

export const TALL = { w: 1080, h: 1920 }, ASPECT = TALL.w / TALL.h;
/** what a phone's own buttons and captions cover, from each edge, at 1080 x 1920 (the floor, platform unknown) */
export const SAFE = { top: 220, bottom: 420, left: 60, right: 140 };
const MAX_VFOV = 68;
type Over = { k?: number; aim?: number; ay?: number; back?: number; maxv?: number };
// by the shot's beat (plan.ts SHOTS)
const OVER: Record<number, Over> = {
  0: { k: 0.95, aim: 0.42 },                // the aerial: the stones, the pond and the reeds round the "made in raea" sticker
  65.3: { k: 1.0 },                         // I say soup: it turns round, close
  24: { k: 1.0 },                           // high: the circle round the stones
  26: { k: 0.78, aim: 0.34, ay: 0.6 },     // the screen breaking the water, the goose watching it from the left (0.29 across the wide)
  29: { k: 0.85 },                          // the frog leaping for its pad
  31: { k: 1.0, aim: 0.33 },                // the deer by the drum, staring up at it
  32.5: { k: 0.9 },                         // the machine, dripping
  72: { k: 0.9 },                           // the keys bursting from the mud round it
  // its wings swinging close across the tall frame failed raea check's flash screen (8-10 changes in a second, WCAG
  // 2.3.1 allows 6) at the tall default; as wide as these make it, the goose is as big a share of the frame as in the wide
  74: { k: 1.1 },                           // it takes off
  76.5: { k: 1.1 },                         // from the side: a spin, a flip, key to key
  91.25: { k: 1.1 },                        // low on ENTER: it lands and bounces off it
  80.5: { k: 1.15 },                        // the screen: the words come (the whole monitor across)
  82: { k: 1.6 },                           // close: the chat box, the words landing in it
  50.4: { k: 1.25 }, 54.2: { k: 1.25 },       // QUACK QUACK, close on its face: room over and under it for the words
  51.8: { k: 1.15 }, 59.5: { k: 0.95 },     // mud feet, suction pop: the words beside it, not on its white body
  63: { k: 1.1, ay: 0.36 },                 // (tipped up: its head lower, the word over the card above it)                           // the crash in on its face and the DUCK? freeze: room on the card for the word
  94.25: { k: 0.68, ay: 0.3 },              // under the water: a taller frame looks up into the surface's window (tipped up: SPLOOSH over the goose as it comes in)
  96: { k: 0.62, maxv: 80 },                // from deep below: wide already, kept wide enough for the window round it
  97.5: { k: 1.0 },                         // the agent at work: its column of steps
  100: { k: 0.95 },                         // high and wide round the computer
  104.5: { k: 1.7, back: 1 },               // the film playing in the app, as clay: the whole player
  107: { k: 0.72 },                         // the orbit through the surface
  110.5: { k: 1.7, aim: 0.55 },             // its edit: the player and the timeline
  112: { k: 1.1, aim: 0.6 },                // the score and the scripts
  113.5: { k: 1.1 },                        // the second crash in and its freeze, on the blue card
  117.1: { k: 1.75, aim: 0.54 },            // the upload: each network's name, its bar and its share (drawn back)
  118.1: { k: 1.25, aim: 0.38 },            // the video page: the player and the title under it
  119: { k: 0.9 }, 120: { k: 0.9 }, 121: { k: 0.9 },   // the watchers' heroes: room over each for its views and likes
  122: { k: 0.9, aim: 0.27 },               // in on the video page: the player
  124: { k: 0.72 },                         // the rap video: low and wide already
  127: { k: 0.72 },                         // out of the water and into the lens
};
const over = (b: number) => OVER[b] ?? {};
type Cam = { eye: V3; at: V3; fov: number; up: V3 };
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const basis = (c: Cam) => { const f = norm(sub(c.at, c.eye)), r = norm(cross(f, c.up)), u = cross(r, f); return { f, r, u }; };
/** where a point lands on a lens's frame (0..1 across and down), at aspect `aspect`; null behind it */
function across(p: V3, c: Cam, aspect: number): [number, number] | null { const { f, r, u } = basis(c), d = sub(p, c.eye), z = dot(d, f); if (z < 0.05) return null; const th = Math.tan((c.fov * Math.PI) / 360); return [0.5 + dot(d, r) / (z * th * aspect) / 2, 0.5 - dot(d, u) / (z * th) / 2]; }
const wideCam = (t0: number): Cam => { const c = camera(t0); return { eye: c.eye, at: c.at, fov: c.fov, up: upOf(c) }; };
/** where the goose is across the wide frame at film frame f: its head counted twice, its back and its feet once */
function gooseXY(f: number): [number, number] | null {
  const t0 = f / FPS, t = worldT(t0), r = root(t), c = wideCam(t0);
  let sx = 0, sy = 0, n = 0; for (const [p, w] of [[bodyAt(t, "head", r), 2], [bodyAt(t, "back", r), 1], [r.p, 1]] as [V3, number][]) { const q = across(p, c, 2); if (!q || q[0] < -0.3 || q[0] > 1.3 || q[1] < -0.3 || q[1] > 1.3) continue; sx += q[0] * w; sy += q[1] * w; n += w; }
  return n ? [sx / n, sy / n] : null;
}
const PAN = new Map<number, [number, number]>();
/** where the tall frame's middle stands on the wide one (0..1 across and down) at film frame f */
export function pan(f: number): [number, number] {
  const hit = PAN.get(f); if (hit !== undefined) return hit;
  const c = camera(f / FPS), s = c.shot, o = over(s.b);
  let x = 0.5, y = 0.5;
  if (o.aim !== undefined) x = o.aim;
  else if (s.subject !== "other" && !s.hero && !s.tiles) {
    // steadied: a triangle over 0.8 s, inside the shot, so a hop or a wing doesn't swing the frame
    let sw = 0, ax = 0, ay = 0; for (let d = -12; d <= 12; d++) { const g = f + d; if (g < 0 || g >= FRAMES || camera(g / FPS).i !== c.i) continue; const q = gooseXY(g); if (!q) continue; const w = 13 - Math.abs(d); sw += w; ax += q[0] * w; ay += q[1] * w; }
    if (sw) { x = Math.min(0.82, Math.max(0.18, ax / sw)); y = Math.min(0.68, Math.max(0.32, 0.5 + 0.5 * (ay / sw - 0.5))); }
  }
  if (o.ay !== undefined) y = o.ay;
  const v: [number, number] = [x, y]; PAN.set(f, v); return v;
}
export const panX = (f: number) => pan(f)[0];
/** the tall lens for a wide one: turned across to `x` (and up or down to `y`) on the wide frame, its field of view
 * from k, drawn back along its new line by `back` (or as far as the field of view's cap needs) */
export function tallen(c: Cam, shotB: number, x: number, y = 0.5): Cam & { k: number } {
  const o = over(shotB), th = Math.tan((c.fov * Math.PI) / 360), { f, r, u } = basis(c);
  const dir = norm(add(add(f, r, (2 * x - 1) * th * 2), u, (1 - 2 * y) * th)), dist = Math.hypot(...sub(c.at, c.eye));
  let k = o.k ?? 0.72, back = o.back ?? 1;
  const vt = (kk: number) => (kk * th) / ASPECT, cap = Math.tan(((o.maxv ?? MAX_VFOV) * Math.PI) / 360);
  if (vt(k) > cap) { const k2 = (cap * ASPECT) / th; back *= k / k2; k = k2; }   // past a natural field of view: step back instead
  const at = add(c.eye, dir, dist);
  let eye = back !== 1 ? add(at, dir, -dist * back) : c.eye;
  if (back !== 1) eye = [eye[0], Math.max(eye[1], height(eye[0], eye[2]) + 0.12, WATER + 0.08), eye[2]];
  return { eye, at, fov: (2 * Math.atan(vt(k)) * 180) / Math.PI, up: c.up, k: k / back };
}
/** the film's own tall lens at film time t0 (every shot but the watchers' heroes, which film.tsx aims itself) */
export function tallCam(t0: number) { const c = camera(t0), [x, y] = pan(Math.round(t0 * FPS)); return tallen({ eye: c.eye, at: c.at, fov: c.fov, up: upOf(c) }, c.shot.b, x, y); }
/** a point on the tall frame (0..1 across and down) at film time t0; null behind the lens */
export function tallScreen(p: V3, t0: number, c = tallCam(t0)): [number, number] | null {
  const { f, r, u } = basis(c), d = sub(p, c.eye), z = dot(d, f); if (z < 0.05) return null; const th = Math.tan((c.fov * Math.PI) / 360);
  return [0.5 + dot(d, r) / (z * th * ASPECT) / 2, 0.5 - dot(d, u) / (z * th) / 2];
}
/** the goose's box on the tall frame over beats [from, to] (plan.ts gooseBox, through the tall lens) */
export function tallGooseBox(from: number, to: number, part: "head" | "body" = "head"): [number, number, number, number] | null {
  let x0 = 9, y0 = 9, x1 = -9, y1 = -9;
  for (let s = 0; s <= 8; s++) {
    const tt = G(from + ((to - from) * s) / 8), t = worldT(tt), r = root(t), cam = tallCam(tt);
    // (the head with its bill's tip: a close lens looks down the bill, and it reaches far across the tall frame)
    const pts: [V3, number][] = part === "head" ? [[bodyAt(t, "head", r), 0.22], [bodyAt(t, "tip", r), 0.08]] : [[bodyAt(t, "back", r), 0.3], [r.p, 0.25]];
    for (const [p, e] of pts) for (const o of [[0, 0, 0], [e, 0, 0], [-e, 0, 0], [0, 0, e], [0, 0, -e], [0, e * 0.8, 0]] as V3[]) {
      const q = tallScreen([p[0] + o[0], p[1] + o[1], p[2] + o[2]], tt, cam); if (!q) continue;
      x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]);
    }
  }
  return x1 < x0 ? null : [x0, y0, x1, y1];
}
/** how a wide frame point (0..1) lands on the tall frame at film time t0, through the turn and the field of view */
export function wideToTall(x: number, y: number, t0: number): [number, number] {
  const c = camera(t0), wc: Cam = { eye: c.eye, at: c.at, fov: c.fov, up: upOf(c) }, th = Math.tan((c.fov * Math.PI) / 360), { f, r, u } = basis(wc);
  const p = add(c.eye, norm(add(add(f, r, (2 * x - 1) * th * 2), u, (1 - 2 * y) * th)), 10);
  return tallScreen(p, t0) ?? [0.5, 0.5];
}
