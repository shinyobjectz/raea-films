// The cursor as a thing in the place (the director, 11-11: "the mouse shoudl be like animating in 3d space not 2d space" and
// "the mouse click ing is cleaner motion ... its animation kinda blows at times"). It is the film's own arrow as a
// small solid (media/models/cursor.glb, blender/cursor.py), standing in the scene's space: it gets smaller as it goes
// away from us, things nearer than it pass in front of it, and it travels through the room from thing to thing.
// Its whole path is one list of keys, each a point in the place at a time, and a key's point may itself be moving (a
// thing being carried, the camera's own edge), so the path has no jumps and no separate little animations to line up.
// How it travels between two keys (the director, 11-11, assembly 18: "most of the beef now is just the timing and unorganic
// movements of the mouse"). It used to spend the whole time between two keys gliding in a straight line, which is what
// a machine does. A hand waits, goes, and arrives:
//   - it stays where it is (never quite still: a hand's small drift) until it is time to go, then makes the move in the
//     time a hand takes for that distance (about a third of a second for a short hop, under a second across the frame),
//     arriving a moment before the thing it is going to do, so the click itself lands on its beat;
//   - the move starts and ends with no speed and no acceleration, on a shallow arc, never a ruled line (it used to run
//     a little past its mark and come back onto it: that reversal at every mark read as a wobble once the director asked for
//     "VERY smoothe", so it arrives and settles instead);
//   - a click is a press: the arrow dips and is let go; a thing held is held pressed;
//   - it leans a little into the way it is going.
// A drag (the key it leaves is `press`) and a `glide` take the whole time between their keys: the thing carried sets the pace.
// A key marked `seen` is one the viewer has to see happen (a click, a rest on a thing): it is refused at render time
// if it falls outside the middle of the frame ("in the canyon it clicks once basiclaly off ascreen").
import { staticFile } from "raea";
import { Model, Refinish } from "raea/3d";
import { LinearRgba } from "raea/color";
import { Cuboid, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import type { V3 } from "../v2/math";
import { project } from "../v2/ui";
import type { Cam } from "./cam";
import { NoShadowMesh } from "./noshadow";
import { H, W } from "./plan";

export type Key = { t: number; p: (cam: Cam) => V3; /** held down from this key to the next */ press?: boolean; /** a click at this key: pressed and let go */ click?: boolean; /** must be well inside the frame */ seen?: string; /** how far inside, as a share of the frame (0.1) */ margin?: number; /** take the whole time from the last key to arrive here (a slow lead ahead of us), not a hand's quick move */ glide?: boolean; /** a hold that takes hold of a thing (the hand): by default, a press whose `seen` takes, pulls, pushes, picks up, lifts, cranks or holds */ grab?: boolean };

// The hand (the director, 11-11, on assembly 23: "swap cursor to hand and gab effects when opportune", and on the canyon's
// tumbleweed, "use the hand cursor for this too"). Where the cursor takes hold of a thing (a door's ring, a slider, a
// wheel, the tumbleweed), it turns from the arrow into an open hand as it reaches (media/models/cursor-open.glb,
// blender/hand-cursor.py), closes on the thing (cursor-grab.glb) with a ring of light going out from its grip, holds it
// closed while it is held, opens as it lets go and is the arrow again a moment later. A draw (a stroke of paint, the
// bedroom's line) stays the arrow. Each change is a cursor's: at once, with a small pop.
const GRAB_WORDS = /\b(take|takes|pull|push|pick|lift|crank|hold|grab|drag)\b/i;
const grabs = (k: Key) => k.grab ?? (!!k.press && GRAB_WORDS.test(k.seen ?? ""));
const REACH = 0.42, BACK = 0.3;                                                // the hand opens this long before it takes hold; is the arrow again this long after it lets go
/** how far the cursor is a hand (0 the arrow .. 1), how far it is closed (0 open .. 1), and the seconds since it last
 *  closed on a thing (below 0: not yet) */
export function gripOf(keys: Key[], t: number): { hand: number; shut: number; took: number } {
  let hand = 0, shut = 0, took = -1;
  for (let j = 0; j < keys.length; j++) {
    if (!grabs(keys[j]) || (j > 0 && keys[j - 1].press && grabs(keys[j - 1]))) continue;   // (a hold over several keys is one grab)
    let m = j;
    while (m + 1 < keys.length && keys[m].press) m++;                         // (it lets go at the first key after the run of presses)
    const from = keys[j].t, to = keys[m].t;
    hand = Math.max(hand, Math.min(ss((t - (from - REACH)) / 0.14), 1 - ss((t - (to + BACK)) / 0.14)));
    shut = Math.max(shut, Math.min(ss((t - (from - 0.03)) / 0.07), 1 - ss((t - to) / 0.08)));
    if (t >= from - 0.03) took = t - (from - 0.03);
  }
  return { hand, shut, took };
}
const clamp01 = (k: number) => Math.min(1, Math.max(0, k));
const jerk = (k: number) => { const q = clamp01(k); return q * q * q * (10 - 15 * q + 6 * q * q); };
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const isClick = (k: Key) => !!k.click || /^click/.test(k.seen ?? "");
/** the last keys a cursor was asked for */
export let lastKeys: Key[] = [];
/** forget them (before a shot is asked for its view, so a shot whose cursor isn't asked for this frame leans on nothing) */
export const resetKeys = () => { lastKeys = []; };

// The cursor's motion. the director, 11-11: "the camera movements for the cursor need to be much smoother like VERY smoothe
// right now its very jarring". It had been a spring chasing a target that jumped from mark to mark, kicked sideways as
// it set off, snapped onto its mark over the last tenth of a second before a click and held there by force after it:
// every one of those is a jolt in its acceleration, and the lens, leaning after it, carried each jolt into the frame.
// Now its path is a sum of moves, as a hand's is (Flash and Hogan's minimum-jerk reach, laid end to end and overlapping
// where the keys come close): each move goes from one mark to the next on a curve that starts and ends with no speed
// and no acceleration, on a shallow arc, so the path has no corner, no kick and no snap anywhere, whatever the keys.
//   - its place is kept as the lens sees it (across, up, log depth), so between its marks it travels with us;
//   - before anything it does it is on the mark REST seconds early (seen coming), and after a click it stays AFTER;
//   - a move's length in time is set by the time the keys give it, never by where the camera happens to be, so a
//     frame rendered alone is the same frame and nothing in the path depends on the lens's own motion;
//   - a drag (from a `press` key) and a `glide` take exactly the whole time between their keys, on the thing.
type Scr = [number, number, number];                                          // across and up (as tangents of the lens's angles), log depth
const REST = 0.22, AFTER = 0.2, BEND = 0.1, HOP = 0.1;
const acts = (k: Key) => !!k.seen || !!k.press || isClick(k);
const ss = (k: number) => { const q = clamp01(k); return q * q * (3 - 2 * q); };
type Move = { i: number; from: number; to: number; bend: number };
/** when each move between two keys runs (from the keys' times only) */
function movesOf(keys: Key[]): Move[] {
  const out: Move[] = [];
  for (let i = 0; i + 1 < keys.length; i++) {
    const k = keys[i], n = keys[i + 1], gap = Math.max(1e-3, n.t - k.t);
    if (k.press || n.glide) { out.push({ i, from: k.t, to: k.t + gap, bend: 0 }); continue; }
    let d = Math.min(1.0, 0.42 + 0.25 * gap);
    const free = k.t + (isClick(k) ? AFTER : 0.04);
    let from: number;
    if (acts(n)) {
      const slack = n.t - REST - free - d;                                       // the time it has to spare: it leaves a third of the way into it
      if (slack >= 0) from = free + 0.33 * slack;
      else { d = Math.max(0.34, n.t - 0.1 - free); from = Math.min(free, n.t - 0.1 - d); }
    } else from = free + Math.min(0.1, 0.25 * gap);
    out.push({ i, from, to: from + d, bend: BEND * (i % 2 ? 1 : -1) });
  }
  return out;
}
/** The take's keys and lens at another second (the keys' own seconds), for the place a move sets off from: once the cursor
 *  leaves a mark it is the cursor's own, on the frame, and no longer the thing's (the weather's slider sits a metre from
 *  the lens, and we walk through it a moment after the cursor lets it go: a path still tied to it flew off the frame) */
export type Then = (t: number) => { keys: Key[]; cam: Cam } | null;
const DEPART = 0.22, COAST = 0.12, VMAX = 0.7;                                             // how long a mark it leaves takes to let go of it; how long its way on carries it
/** the path at t: each mark weighted by how far the cursor has come to it and gone from it, a mark it is leaving held
 *  where it was on the frame as it set off, each move's arc to one side */
function pathAt(keys: Key[], pts: Scr[], ms: Move[], t: number, scrAt: (c: Cam) => (p: V3) => Scr, then?: Then): Scr {
  const n = keys.length, prog = ms.map((m) => (t <= m.from ? 0 : jerk((t - m.from) / (m.to - m.from))));
  const exact = (m: Move) => !!keys[m.i].press || !!keys[m.i + 1].glide;
  // (a click lets go of the thing as it clicks, so it never rides a point the lens then walks through: the clouds' click
  // is a metre ahead of us as we come in; a rest on a thing stays on it, its next key being the same point)
  const freeze = (i: number, m: Move) => (isClick(keys[i]) && Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) > 0.02 ? Math.min(m.from, keys[i].t + 0.02) : m.from);
  const K = (i: number): Scr => {
    const m = ms[i], live = pts[i];
    if (!m || exact(m) || !then) return live;
    const f0 = freeze(i, m);
    if (t <= f0) return live;
    // where the mark was on the frame as it let go, carried on a little the way it was going (a hand that lets go of a
    // swinging door doesn't stop dead with it): the anchor coasts to a stop, so the cursor's speed never drops at once
    // (and a mark the lens is about to walk through is let go of sooner: the nearer it is, the quicker, and within 0.3 m
    // it is not followed at all; that quickening itself comes in over a tenth of a second, so letting go has no kink)
    const near = (1 - ss((Math.exp(live[2]) - 0.3) / 1.0)) * jerk((t - f0) / 0.1);
    const b = 1 - (1 - jerk((t - f0) / DEPART)) * (1 - near), e = 1 / 240, ws = [then(f0), then(f0 - e), then(f0 + e)];
    const ks = ws.map((w) => w?.keys[i]);
    if (ws.some((w, n) => !w || !ks[n] || Math.abs(ks[n]!.t - keys[i].t) > 1e-6)) return live;
    const [was, wa, wb] = ws.map((w, n) => scrAt(w!.cam)(ks[n]!.p(w!.cam)));
    // (only so much of the mark's speed is kept: a door swung toward the lens whips its knob across the frame)
    const vx = (wb[0] - wa[0]) / (2 * e), vy = (wb[1] - wa[1]) / (2 * e), vm = Math.hypot(vx, vy), keep = vm > 1e-9 ? (VMAX * Math.tanh(vm / VMAX)) / vm : 1;
    // (its depth is never more than the mark's own now: held at the depth it had as it set off, it rode in with the lens,
    // and as we walked at a door the path from a mark to the door's knob went in through the door, 30 cm behind its leaf:
    // the director, 11-11, on assembly 23, "theres a moment where the cursor clips behind the door accidentally" in the pixel
    // world and "cursor aciidentally dissappears" in the painted one. A mark within 1.2 m is held as it was: the slider
    // the lens walks through.)
    const coast = COAST * (1 - Math.exp(-(t - f0) / COAST)), A: Scr = [was[0] + vx * keep * coast, was[1] + vy * keep * coast, Math.min(was[2], Math.max(live[2], Math.log(1.2)))];
    return [0, 1, 2].map((j) => live[j] + (A[j] - live[j]) * b) as Scr;
  };
  const q: Scr = [0, 0, 0], got: (Scr | undefined)[] = [];
  const at = (i: number) => (got[i] ??= K(i));
  for (let i = 0; i < n; i++) {
    const w = (i === 0 ? 1 : prog[i - 1]) - (i < n - 1 ? prog[i] : 0);
    if (Math.abs(w) < 1e-12) continue;
    const p = at(i);
    for (let j = 0; j < 3; j++) q[j] += p[j] * w;
  }
  for (const [mi, m] of ms.entries()) {
    const s = prog[mi];
    if (s <= 0 || s >= 1 || !m.bend) continue;
    const a = at(m.i), b = at(m.i + 1), arc = m.bend * 4 * s * (1 - s);
    q[0] -= (b[1] - a[1]) * arc; q[1] += (b[0] - a[0]) * arc;
    // and it lifts toward us on the way, as a hand comes up off one thing and down onto the next: a free move between a
    // mark behind a door's face and its knob went straight through the arch's stones (the pixel world, assembly 23). It
    // changes only how far off the cursor is, never where it is on the frame.
    q[2] += Math.log(1 - HOP * 4 * s * (1 - s));
  }
  return q;
}
let CLOCK = 0;                                                                // the film's second at the keys' t 0 (the hand's drift runs on it, on across a join)
let THEN: Then | undefined;                                                   // the keys and lens at another second, when the caller has them (handAt)
const basis = (cam: Cam) => { const fwd = norm(sub(cam.look, cam.eye)), r = norm(cross(fwd, [0, 1, 0])), up = cross(r, fwd); return { fwd, r, up }; };
const dot3 = (p: V3, q: V3) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const scrAt = (cam: Cam) => { const { fwd, r, up } = basis(cam); return (p: V3): Scr => { const rel = sub(p, cam.eye), z = Math.max(0.12, dot3(rel, fwd)); return [dot3(rel, r) / z, dot3(rel, up) / z, Math.log(z)]; }; };
function place(keys: Key[], t: number, cam: Cam, then?: Then): { pos: V3; press: number; scr: Scr } {
  const { fwd, r, up } = basis(cam), scr = scrAt(cam);
  const world = (q: Scr): V3 => { const z = Math.exp(q[2]); return [0, 1, 2].map((n) => cam.eye[n] + z * (fwd[n] + r[n] * q[0] + up[n] * q[1])) as V3; };
  const pts = keys.map((k) => scr(k.p(cam))), ms = movesOf(keys);
  const q = pathAt(keys, pts, ms, t, scrAt, then), h = 1 / 120, q0 = pathAt(keys, pts, ms, t - h, scrAt, then), q1 = pathAt(keys, pts, ms, t + h, scrAt, then);
  const speed = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) / (2 * h);
  // a click is a press, dipped and let go; a thing held is held pressed
  let press = 0;
  for (let j = 0; j < keys.length; j++) {
    const key = keys[j], to = key.press ? (keys[j + 1]?.t ?? key.t) : isClick(key) ? key.t + 0.1 : -1;
    if (to < 0) continue;
    press = Math.max(press, Math.min(ss((t - key.t + 0.02) / 0.07), 1 - ss((t - to) / 0.14)));
  }
  // travelling fast it comes a little off the surface toward us; and a hand is never quite still (a slow drift, stilled when pressed)
  const lift = 0.12 * Math.tanh(0.5 * speed), calm = Math.exp(-1.6 * speed), amp = 0.0022 * (1 - press) * (0.35 + 0.65 * calm), T = CLOCK + t;
  const out: Scr = [q[0] + amp * (Math.sin(T * 2.1) + 0.6 * Math.sin(T * 3.7 + 1.3)), q[1] + amp * (Math.sin(T * 1.7 + 2.0) + 0.6 * Math.sin(T * 4.3)), q[2] + Math.log(1 - lift)];
  return { pos: world(out), press, scr: out };
}

/** The camera, leaning a little toward where the cursor is working (the director, 11-11: "havign the camera make soft and
 *  gentle tilts to action where relvant ... just enough to make it clearer we are follwoign the cursopr"). Its aim goes
 *  `share` of the way toward the cursor's place averaged over a gaussian window of a second and a half round t (sigma
 *  0.35 s), so it eases over well before and after and never twitches; at most `most` degrees. In the opening the keys
 *  are the whole take's (v3/walk.tsx takeView), so the lean runs on through the doors unbroken. */
export function follow(cam: Cam, keys: Key[], t: number, share = 0.15, most = 2.2): Cam {
  if (!keys.length) return cam;
  const fwd = norm(sub(cam.look, cam.eye)), r = norm(cross(fwd, [0, 1, 0])), up = cross(r, fwd);
  let sx = 0, sy = 0, wsum = 0;
  for (let j = -8; j <= 8; j++) {
    const at = t + j * 0.1, w = Math.exp(-0.5 * ((j * 0.1) / 0.35) ** 2);
    wsum += w;
    // (before it comes in and after it goes, the camera looks where it always did: its pull grows from nothing over the
    // first half second it is there, and goes over its last; and it saturates softly, never at a hard limit)
    const there = jerk((at - keys[0].t) / 0.6) * jerk((keys[keys.length - 1].t - at) / 0.6);
    if (there <= 0) continue;
    // (where the cursor is on the frame at that second, seen by the lens of that second when the caller has it)
    const was = THEN?.(at), q = was ? place(was.keys, at, was.cam, THEN).scr : place(keys, at, cam, THEN).scr;
    sx += w * there * 0.5 * Math.tanh(q[0] / 0.5); sy += w * there * 0.5 * Math.tanh(q[1] / 0.5);
  }
  const lim = Math.tan((most * Math.PI) / 180), ax = lim * Math.tanh(((sx / wsum) * share) / lim), ay = lim * Math.tanh(((sy / wsum) * share) / lim);
  const d = Math.hypot(...sub(cam.look, cam.eye));
  return { ...cam, look: [0, 1, 2].map((n) => cam.eye[n] + d * (fwd[n] + r[n] * ax + up[n] * ay)) as V3 };
}

/** where the cursor is at t, how hard it is pressed (0..1), and its lean; null before its first key and after its last.
 *  `clock`: the film's second at the keys' t 0 */
export function handAt(keys: Key[], t: number, cam: Cam, clock = 0, then?: Then): { pos: V3; press: number; lean: number; xy: [number, number]; hand: number; shut: number; took: number } | null {
  lastKeys = keys; CLOCK = clock;
  if (then) { const memo = new Map<number, ReturnType<Then>>(); THEN = (x) => { if (!memo.has(x)) memo.set(x, then(x)); return memo.get(x)!; }; } else THEN = undefined;
  if (!keys.length || t < keys[0].t || t > keys[keys.length - 1].t) return null;
  for (const key of keys) {
    if (!key.seen || Math.abs(t - key.t) > 0.02) continue;
    const q = project(cam, key.p(cam));
    const mg = key.margin ?? 0.1;
    if (!q.front || q.x < W * mg || q.x > W * (1 - mg) || q.y < H * mg || q.y > H * (1 - mg)) throw new Error(`the cursor's ${key.seen} at ${key.t.toFixed(2)} s lands at (${q.x.toFixed(0)}, ${q.y.toFixed(0)}), outside the middle of the ${W}x${H} frame: move the camera or the thing`);
  }
  const { pos, press } = place(keys, t, cam, THEN), q = project(cam, pos);
  // it leans into the way it is going: by how fast it is crossing the frame
  const was = project(cam, place(keys, Math.max(keys[0].t, t - 1 / 30), cam, THEN).pos);
  const lean = Math.max(-0.2, Math.min(0.2, -(q.x - was.x) * 0.006));
  return { pos, press, lean, xy: [q.x, q.y], ...gripOf(keys, t) };
}

/** the cursor, in the scene (put it inside the Scene). Its tip is the point it is at, on the surface of the thing it
 *  touches; its body leans back off that surface toward us, and a press tips it down onto the thing, as a finger taps.
 *  `ev` is the shot's exposure: the arrow's own white is set against it so it reads as white in a dark room and a bright one */
/** the ring of light that goes out from the hand's grip as it closes on a thing: a ring and six short strokes of light
 *  out from it, opening and fading over its time (u_k 0..1) */
const GRAB_RING = /* wgsl */ `
fn shade(in: VertexOutput) -> vec4<f32> {
  let p = in.uv * 2.0 - 1.0; let r = length(p); let k = u_k(); let a = atan2(p.y, p.x);
  let rad = 0.3 + 0.62 * (1.0 - pow(1.0 - k, 2.4));
  let ring = exp(-pow((r - rad) / (0.018 + 0.03 * k), 2.0));
  let ray = exp(-pow((r - rad - 0.1 - 0.12 * k) / 0.05, 2.0)) * pow(max(cos(a * 6.0 + 0.5), 0.0), 40.0);
  let fade = pow(1.0 - k, 1.6);
  return vec4<f32>(vec3<f32>(1.0, 0.97, 0.9) * (ring + 0.9 * ray) * fade * u_gain(), 0.0);
}`;
export function Hand3D({ hand, cam, ev = 0 }: { hand: { pos: V3; press: number; lean?: number; /** its size, times (a cursor held close to the lens is made small to look its usual size) */ size?: number; /** a hand, closed, since it closed (gripOf) */ hand?: number; shut?: number; took?: number } | null; cam: Cam; ev?: number }) {
  // there from the first frame (a render keeps what it starts with), parked behind the lens when it is not in the shot
  // (straight behind, whichever way the camera looks: under it was in view of a camera looking down, 11-11)
  const back = norm(sub(cam.eye, cam.look));
  const park: V3 = [cam.eye[0] + back[0] * 30, cam.eye[1] + back[1] * 30, cam.eye[2] + back[2] * 30];
  const pos: V3 = hand?.pos ?? park;
  const d = Math.hypot(...sub(pos, cam.eye));
  const press = hand?.press ?? 0;
  const s = 0.105 * Math.sqrt(Math.max(0.3, d)) * (1 - 0.1 * press) * (hand?.size ?? 1);
  // which of the three it is: the arrow, the open hand, the closed one (each change at once, with a pop)
  const g = hand?.hand ?? 0, shut = hand?.shut ?? 0, took = hand?.took ?? -1;
  const form = g < 0.5 ? "arrow" : shut < 0.5 ? "open" : "grab";
  const popIn = g >= 0.5 ? 0.84 + 0.16 * ss((g - 0.5) / 0.5) + 0.1 * Math.sin(Math.PI * clamp01((g - 0.5) / 0.5)) : 1;
  // (closing on the thing it gives a little, squeezed, and springs back)
  const squeeze = took >= 0 && took < 0.4 ? 1 - 0.12 * Math.exp(-took / 0.08) * Math.cos(took * 26) : 1;
  // it faces us (yaw, and pitch when we look at it from above or below), leans back (the arrow's tail toward us; a hand
  // a little), and leans into its travel
  const to = sub(cam.eye, pos), yaw = Math.atan2(to[0], to[2]), pitch = -Math.atan2(to[1], Math.hypot(to[0], to[2]));
  const turn = (tilt: number, lean: number): V3 => {
    // the turn Ry(yaw) Rx(tilt) Rz(lean), as the XYZ angles a Model's rotation takes
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(tilt), sx = Math.sin(tilt), cz = Math.cos(lean), sz = Math.sin(lean);
    const m11 = cy * cz + sy * sx * sz, m12 = -cy * sz + sy * sx * cz, m13 = sy * cx, m23 = -sx, m33 = cy * cx;
    return [Math.atan2(-m23, m33), Math.asin(Math.max(-1, Math.min(1, m13))), Math.atan2(-m12, m11)];
  };
  const lean = hand?.lean ?? 0;
  const arrowRot = turn(pitch - (0.5 - 0.4 * press), lean), handRot = turn(pitch - 0.14, lean * 0.6);
  const hs = s * popIn * (form === "grab" ? squeeze : 1);
  const lum = 2600 / 2 ** ev;
  // the ring: facing the lens, a little toward it from the grip
  const ringOn = hand && took >= 0 && took < 0.42, rk = clamp01(took / 0.42);
  const toN = norm(to), ringAt: V3 = ringOn ? [pos[0] + toN[0] * 0.04 * s, pos[1] + toN[1] * 0.04 * s, pos[2] + toN[2] * 0.04 * s] : park;
  const f = norm(sub(cam.look, cam.eye)), ringRot: V3 = [Math.asin(Math.max(-1, Math.min(1, f[1]))), Math.atan2(-f[0], -f[2]), 0];
  return (
    <>
      <Refinish key={`cursor-${lum.toFixed(0)}`} materials={[{ material: "cursor-body", emissive: "#ffffff", emissiveIntensity: lum }, { material: "cursor-rim", color: "#08080a" }]}>
        <Model name="cursor" src={staticFile("models/cursor.glb")} position={form === "arrow" ? pos : park} rotation={arrowRot} scale={[s, s, s]} {...({ allowOverlap: true } as object)} />
        <Model name="cursor-open" src={staticFile("models/cursor-open.glb")} position={form === "open" ? pos : park} rotation={handRot} scale={[hs, hs, hs]} {...({ allowOverlap: true } as object)} />
        <Model name="cursor-grab" src={staticFile("models/cursor-grab.glb")} position={form === "grab" ? pos : park} rotation={handRot} scale={[hs, hs, hs]} {...({ allowOverlap: true } as object)} />
      </Refinish>
      <NoShadowMesh name="cursor-ring" shape={{ primitive: "Rectangle", half_size: [1.5 * s, 1.5 * s] }} position={ringAt} rotation={ringRot} alpha="add" doubleSided
        wgsl={GRAB_RING} uniforms={{ k: rk, gain: ringOn ? 5 / 2 ** ev : 0 }} />
    </>
  );
}
/** the pick box, in the scene: brackets at the eight corners of a thing's box, standing in the place with it (things
 *  nearer than it pass in front of it). Always there (a render keeps what it starts with): parked behind the lens when not shown. */
export function Box3D({ at, half, show, cam, ev = 0, color = [0.49, 0.55, 1] }: { at: V3; half: V3; show: boolean; cam: Cam; ev?: number; color?: [number, number, number] }) {
  const back = norm(sub(cam.eye, cam.look));
  const c: V3 = show ? at : [cam.eye[0] + back[0] * 40, cam.eye[1] + back[1] * 40, cam.eye[2] + back[2] * 40];
  const h: V3 = [half[0] + 0.03, half[1] + 0.03, half[2] + 0.03];
  const d = Math.hypot(...sub(c, cam.eye)), w = Math.max(0.0015, 0.0009 * d), lum = 160 / 2 ** ev;
  const bars: JSX.Element[] = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) for (const axis of [0, 1, 2]) {
    const len = Math.min(0.12 * Math.sqrt(Math.max(0.5, d)), h[axis] * 0.6) / 2;
    const p: V3 = [c[0] + sx * h[0], c[1] + sy * h[1], c[2] + sz * h[2]];
    p[axis] -= [sx, sy, sz][axis] * len;
    const hs: V3 = [w, w, w]; hs[axis] = len;
    bars.push(<Mesh3d key={`${sx}${sy}${sz}${axis}`} name={`pick-${sx}${sy}${sz}${axis}`} castShadow={false} {...({ allowOverlap: true } as object)} transform={Transform.fromXyz(...p)}><Cuboid half_size={hs} /><StandardMaterial base_color="#000000" emissive={new LinearRgba(lum * color[0], lum * color[1], lum * color[2], 1)} /></Mesh3d>);
  }
  return <>{bars}</>;
}
/** a fixed point of the place */
export const at = (p: V3) => () => p;
/** a point `d` metres toward the camera from p: with the default, the cursor's tip is on the thing's surface at p; with a
 *  thing's half-depth, on the face of it we see */
export const front = (p: V3 | (() => V3), d = 0.03) => (cam: Cam): V3 => { const q = typeof p === "function" ? p() : p, n = norm(sub(cam.eye, q)); return [q[0] + n[0] * d, q[1] + n[1] * d, q[2] + n[2] * d]; };
/** a point just outside the frame, `depth` metres in front of the lens: where the cursor comes in from and leaves to
 *  (right +1 or left -1, down +1 or up -1), fixed to the camera, so it rides in with us */
export const edge = (right = 1, down = 1, depth = 1.4) => (cam: Cam): V3 => {
  const f = norm(sub(cam.look, cam.eye)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f);
  const hh = Math.tan((cam.fov * Math.PI) / 360) * depth, hw = hh * (W / H);
  return [0, 1, 2].map((i) => cam.eye[i] + f[i] * depth + r[i] * hw * 1.18 * right - u[i] * hh * 1.2 * down) as V3;
};
/** a point `depth` metres in front of the lens at a place of the frame (u across, v down, 0..1), fixed to the camera:
 *  for a move made across the picture itself (the line drawn across the bedroom, a click on the windscreen) */
export const screenPoint = (u: number, v: number, depth: number) => (cam: Cam): V3 => {
  const f = norm(sub(cam.look, cam.eye)), r = norm(cross(f, [0, 1, 0])), up = cross(r, f);
  const hh = Math.tan((cam.fov * Math.PI) / 360) * depth, hw = hh * (W / H);
  return [0, 1, 2].map((i) => cam.eye[i] + f[i] * depth + r[i] * hw * (2 * u - 1) - up[i] * hh * (2 * v - 1)) as V3;
};
/** where the cursor rides through a door in the opening: a point fixed to the lens, a little right of and below the
 *  middle, a metre out. The take's one path passes through it as the lens crosses each door, so it goes through with us
 *  and is the same on both sides of the join (v3/walk.tsx takeView) */
export const JOIN = (cam: Cam): V3 => screenPoint(0.6, 0.7, 1.0)(cam);
