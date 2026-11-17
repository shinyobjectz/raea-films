// Where the cursor and a comment's card are in the space, and where a point lands on the frame. Pure (no raea
// imports), so tools/aim.ts can check every card is in frame without a render. kit.tsx draws what this places.
import { fovOf, type Cam } from "./cams";
import { PICTURES } from "./captures.gen";
import { W, H, type Comment } from "./plan";

export type V3 = [number, number, number];
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (u: number) => (u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2);
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };
export const dist = (a: V3, b: V3) => Math.hypot(...sub(a, b));
export const yawTo = (from: V3, to: V3) => Math.atan2(to[0] - from[0], to[2] - from[2]);
/** the frame's height (metres) at a point's distance from the camera */
export const frameHigh = (cam: Cam, p: V3) => 2 * dist(cam.pos, p) * Math.tan(fovOf(cam.mm) / 2);
/** "right" across the frame, flat, as an eye at `eye` looking at `p` sees it */
export const rightOf = (eye: V3, p: V3): V3 => norm([-(p[2] - eye[2]), 0, p[0] - eye[0]]);

/** where a point lands on the frame: 0..1 across and down, and whether it's in front of the camera */
export function project(cam: Cam, p: V3): { x: number; y: number; front: boolean } {
  const f = norm(sub(cam.look, cam.pos));
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  const v = sub(p, cam.pos);
  const z = dot(v, f);
  const half = Math.tan(fovOf(cam.mm) / 2);
  return { x: 0.5 + dot(v, r) / z / (2 * half * (W / H)), y: 0.5 - dot(v, u) / z / (2 * half), front: z > 0 };
}

/** the cursor's tip at `t` for comment `c`: in from the right and above the camera's view of the target, easing onto
 *  it for the click; after the send it drifts off */
export function cursorAt(c: Comment, t: number, cam: Cam): V3 | null {
  if (t < c.enter || t > c.sent + 0.9) return null;
  const fh = frameHigh(cam, c.at), fw = fh * (W / H);
  const right = rightOf(cam.pos, c.at);
  const off = (k: number, up: number): V3 => [c.at[0] + right[0] * k * fw, c.at[1] + up * fh, c.at[2] + right[2] * k * fw];
  const start = off(0.6, 0.15), away = off(0.6, 0.2);
  const lerp = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const tip = t <= c.click ? lerp(start, c.at, ease(clamp01((t - c.enter) / Math.max(0.3, c.click - c.enter)))) : t <= c.sent ? c.at : lerp(c.at, away, ease(clamp01((t - c.sent) / 0.9)));
  // in front of what it's on: toward the camera along its ray (the same place on the frame; its size follows)
  const s = 1 - CURSOR_FORWARD, e = cam.pos;
  return [e[0] + (tip[0] - e[0]) * s, e[1] + (tip[1] - e[1]) * s, e[2] + (tip[2] - e[2]) * s];
}
/** how far toward the camera the cursor stands, as a share of its distance: clear of the leaves and fixtures it's on */
const CURSOR_FORWARD = 0.15;
/** the cursor's height (metres) at its tip: 6% of the frame's height, whatever the lens */
export const cursorSize = (cam: Cam, tip: V3) => 0.06 * frameHigh(cam, tip);

/** a card is 30% of the frame's width, as tall as its picture (the app's capture, or its placeholder) says; the gap
 *  and the room left for the cursor's body are fractions of the frame's width too */
const CARD_W = 0.3, GAP = 0.03, CLEAR = 0.05;
const aspectOf = (c: Comment) => { const s = PICTURES[`comment-${c.n}`]?.size ?? [900, 300]; return s[0] / s[1]; };
/** how far toward the camera a card stands, as a share of its distance, so it is in front of what it's on (a card
 *  beside a point on a surface the camera sees at an angle would otherwise cut into it) */
const FORWARD = 0.2;
/** the frame a card must sit inside (title safe) */
export const SAFE = { lo: 0.04, hi: 0.96 };
/** a comment's card stays until its change has landed (or its own `until`, ahead of a camera move) */
export const cardUntil = (c: Comment) => c.until ?? c.sent + 1.6;

type Side = { s: 1 | -1; up: boolean };
/** the card's centre for a side and a width (a near corner pinned beside the point, clear of the cursor's body, which
 *  hangs down and right of its tip) */
const fullW = (c: Comment, cam: Cam) => CARD_W * frameHigh(cam, c.at) * (W / H);
function centre(c: Comment, cam: Cam, side: Side, w: number): V3 {
  const fw = frameHigh(cam, c.at) * (W / H);
  const right = rightOf(cam.pos, c.at);
  const h = w / aspectOf(c);
  const across = side.s * ((side.s > 0 && !side.up ? CLEAR : GAP) * fw + w / 2);
  const y = side.up ? GAP * fw + h / 2 : -(0.01 * fw + h / 2);
  return [c.at[0] + right[0] * across, c.at[1] + y, c.at[2] + right[2] * across];
}
function corners(c: Comment, cam: Cam, side: Side): V3[] {
  const w = fullW(c, cam), h = w / aspectOf(c);
  const m = centre(c, cam, side, w);
  const rr = rightOf(cam.pos, c.at);
  const r: V3 = [rr[0] * w / 2, 0, rr[2] * w / 2];
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [m[0] + a * r[0], m[1] + (b * h) / 2, m[2] + a * r[2]] as V3);
}
const SIDES: Side[] = [{ s: 1, up: true }, { s: 1, up: false }, { s: -1, up: true }, { s: -1, up: false }];
/** the side the card opens on: the first (right and above, then below, then left) whose whole card is in the safe frame
 *  as the camera sees it at the click; `fits` false when none is */
export function cardSide(c: Comment, cam: Cam): { side: Side; fits: boolean } {
  const inside = (side: Side) => corners(c, cam, side).every((p) => { const q = project(cam, p); return q.front && q.x >= SAFE.lo && q.x <= SAFE.hi && q.y >= SAFE.lo && q.y <= SAFE.hi; });
  const ok = SIDES.find(inside);
  return { side: ok ?? SIDES[0], fits: !!ok };
}
/** the card at `t`: its centre, its turn, its full width as the camera saw it at the click (`base`: an engine render
 *  keeps a card's first size, so the card is made at that width for its whole shot) and its scale now, which grows it
 *  from its corner by the point on the click and folds it back (all but nothing before and after) */
export function cardAt(c: Comment, t: number, cam: Cam, clickCam: Cam): { at: V3; base: number; scale: number; yaw: number } {
  const until = cardUntil(c);
  const up = t >= c.click && t < until;
  const view = up ? cam : clickCam;
  const k = up ? clamp01((t - c.click) / 0.18) * clamp01((until - t) / 0.25) : 0;
  const s = 1 - FORWARD;
  const full = fullW(c, view) * s, base = fullW(c, clickCam) * s;
  const w = Math.max(1e-4 * base, full * k);
  const m = centre(c, view, cardSide(c, clickCam).side, w / s);
  const e = view.pos;
  return { at: [e[0] + (m[0] - e[0]) * s, e[1] + (m[1] - e[1]) * s, e[2] + (m[2] - e[2]) * s], base, scale: w / base, yaw: yawTo(c.at, view.pos) };
}
/** the card's corners at full size, for the check */
export const cardCorners = (c: Comment, cam: Cam, clickCam: Cam) => corners(c, cam, cardSide(c, clickCam).side);
