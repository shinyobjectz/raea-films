// Ivy on the tutorial's machine (the director, 11-16: "remove the brown turd droppings and try to lean more into an ivy
// procedurally"): in place of the music video's mud drips and hung bracken, vines that have grown on it while it stood
// in the pond. They climb out of the water up the monitor's neck and onto the bezel under the glass, up both sides of
// the case, over its top, and down the front corners; a few hang over the top bezel, never as far as the glass. On
// the keyboard they run along its back and up its ends, never over the keys. Each vine is a wandering line walked over
// the case's faces (the corners rounded as the case is); leaves sit along it in pairs, standing a little off the
// surface, their tips hanging down, younger and paler toward the vine's end. Everything is seeded, so the ivy is the
// same every frame; only the leaves move, each turning a little on its stalk in the wind.
import { crossSection } from "raea/3d";
import { TKB, TMON, type V3 } from "./machine-dims";

const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/** Euler XYZ (three's order, as raea composes `rotation`) of the turn whose x, y and z axes go to the columns given */
function eulerOfBasis(X: V3, Y: V3, Z: V3): V3 {
  const m02 = Z[0], m12 = Z[1], m22 = Z[2], m01 = Y[0], m00 = X[0];
  const ay = Math.asin(Math.max(-1, Math.min(1, m02)));
  if (Math.hypot(m12, m22) < 1e-7) return [Math.atan2(Y[2], Y[1]), ay, 0];
  return [Math.atan2(-m12, m22), ay, Math.atan2(-m01, m00)];
}
/** the turn of `v` about the unit axis `k` by angle a (Rodrigues) */
const turn = (v: V3, k: V3, a: number): V3 => { const c = Math.cos(a), s = Math.sin(a); return add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c))); };

/** an ivy leaf, five-lobed, its stalk's end at the origin and its tip up +Y, one metre long, in the XY plane (+Z its face) */
const OUTLINE: [number, number][] = [[0, 0.1], [0.12, 0.02], [0.3, 0.03], [0.5, 0.17], [0.35, 0.32], [0.47, 0.6], [0.2, 0.57], [0, 1], [-0.2, 0.57], [-0.47, 0.6], [-0.35, 0.32], [-0.5, 0.17], [-0.3, 0.03], [-0.12, 0.02]];
const chaikin = (p: [number, number][], n: number): [number, number][] => { let q = p; for (let k = 0; k < n; k++) q = q.flatMap((a, i) => { const b = q[(i + 1) % q.length]; return [[a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]] as [number, number][]; }); return q; };
export const LEAF = crossSection.polygon(chaikin(OUTLINE, 2)).extrude(0.02);

type Pt = { p: V3; n: V3 };   // a point on the vine and the surface's outward normal there
export type Vine = Pt[];

// ---- the monitor, in its own frame (TMON.c at the origin): the case W x H x D with 0.3 rounded edges, the neck under it
const [W, H, D] = TMON.size, R = 0.3, OFF = 0.035;
const NECK = { x: 1.1, y0: -H / 2 - 2.5, y1: -H / 2, z0: -1.2, z1: 0.6 };
const WATER_Y = -0.16 - TMON.c[1];
const GLASS = { x: TMON.screen[0] / 2 + 0.25, y0: 0.25 - TMON.screen[1] / 2 - 0.25, y1: 0.25 + TMON.screen[1] / 2 + 0.2 };   // the well and its lip
/** the rounded edge between two faces, as points from one to the other: the corner's centre, its two outward normals */
const arc = (c: V3, a: V3, b: V3, n = 6): Pt[] => Array.from({ length: n }, (_, i) => { const u = (i + 0.5) / n, nn = norm(add(mul(a, Math.cos((u * Math.PI) / 2)), mul(b, Math.sin((u * Math.PI) / 2)))); return { p: add(c, mul(nn, R + OFF)), n: nn }; });
const STEP = 0.07;
/** a walk from a to b along a face, wandering across it (amp metres, at the seed's own rate) */
function walk(a: V3, b: V3, n: V3, seed: number, amp = 0.35): Pt[] {
  const d = sub(b, a), len = Math.hypot(...d), side = norm(cross(n, d)), k = Math.max(2, Math.ceil(len / STEP)), out: Pt[] = [];
  for (let i = 0; i <= k; i++) { const u = i / k, w = Math.sin(Math.PI * u) * amp * (Math.sin(u * 5.1 + seed * 7) * 0.7 + Math.sin(u * 11.3 + seed * 3) * 0.3);
    out.push({ p: add(add(a, mul(d, u)), mul(side, w)), n }); }
  return out;
}
const X: V3 = [1, 0, 0], Y: V3 = [0, 1, 0], Z: V3 = [0, 0, 1];

/** a branch off a vine at point i: a shorter walk across the same face, turned off the vine by `ang`, stopped where it
 *  would leave the face or reach somewhere ivy mustn't be */
function branch(vine: Vine, i: number, ang: number, len: number, seed: number, inside: (p: V3, n: V3) => boolean): Vine {
  const q = vine[i], d = norm(sub(vine[Math.min(vine.length - 1, i + 1)].p, vine[Math.max(0, i - 1)].p)), dir = norm(turn(d, q.n, ang));
  const end = add(q.p, mul(dir, len)), out: Vine = [];
  for (const b of walk(q.p, end, q.n, seed, 0.12)) { if (!inside(b.p, b.n)) break; out.push(b); }
  return out;
}

// where ivy may be on the monitor (its own frame): on the case, off the glass and its lip, off the lamp and the vents
const lampAt: [number, number] = [-W / 2 + 0.7, -H / 2 + 0.6];
function onMonitor(p: V3, n: V3) {
  const m = 0.02;
  if (n[0] !== 0 && (Math.abs(p[1]) > H / 2 - R + m || Math.abs(p[2]) > D / 2 - R + m)) return false;
  if (n[1] === 1 && (Math.abs(p[0]) > W / 2 - R + m || Math.abs(p[2]) > D / 2 - R + m)) return false;
  if (n[2] === 1) {
    if (Math.abs(p[0]) > W / 2 - R + m || p[1] > H / 2 - R + m || p[1] < -H / 2 + R - m) return false;
    if (Math.abs(p[0]) < GLASS.x && p[1] > GLASS.y0 && p[1] < GLASS.y1) return false;
    if (Math.hypot(p[0] - lampAt[0], p[1] - lampAt[1]) < 0.4 || (p[0] > W / 2 - 2 && p[1] < -H / 2 + 1.1)) return false;
  }
  return true;
}
/** may a leaf lie here: anywhere near the front (the flat face or its rounded edges), its whole blade (along its tip, s
 *  long, half as wide) clear of the glass by a hand's width, and of the lamp and the vents */
function leafOnMonitor(at: V3, tip: V3, s: number) {
  if (at[2] < D / 2 - R - 0.15) return true;
  for (const u of [0, 0.35, 0.7, 1]) { const p = add(at, mul(tip, s * u)), r = s * 0.5 + 0.12;
    if (Math.abs(p[0]) < GLASS.x + r && p[1] > GLASS.y0 - r && p[1] < GLASS.y1 + r) return false;
    if (Math.hypot(p[0] - lampAt[0], p[1] - lampAt[1]) < 0.3 + r || (p[0] > W / 2 - 2.05 - r && p[1] < -H / 2 + 1.15 + r)) return false; }
  return true;
}

function monitorVines(): Vine[] {
  const v: Vine[] = [];
  // up each side, round onto the top, across it a way, and some over the front edge and down a front corner
  for (let s = 0; s < 14; s++) {
    const sx = s % 2 ? 1 : -1, z0 = -D / 2 + 0.45 + rnd(s + 1) * (D - 0.9), z1 = -D / 2 + 0.5 + rnd(s + 11) * (D - 1.0), nx: V3 = [sx, 0, 0];
    const top0 = rnd(s + 17) < 0.75 ? H / 2 - R : -1 + rnd(s + 19) * 3;   // most reach the top, some give out on the way
    const up = walk([sx * (W / 2 + OFF), Math.max(-H / 2 + R, WATER_Y + 0.2), z0], [sx * (W / 2 + OFF), top0, z1], nx, s, 0.45);
    if (top0 < H / 2 - R) { v.push(up); continue; }
    const over = arc([sx * (W / 2 - R), H / 2 - R, z1], nx, Y);
    const drape = rnd(s + 21) < 0.6, x2 = sx * (W / 2 - R - 0.4 - rnd(s + 31) * 2.4);
    if (drape) {   // across the top to its front corner, round it, and down the rounded upright edge where front meets side
      const top = walk([sx * (W / 2 - R), H / 2 + OFF, z1], [sx * (W / 2 - R - 0.05), H / 2 + OFF, D / 2 - R], Y, s + 50, 0.25);
      const ne: V3 = [sx * Math.SQRT1_2, 0, Math.SQRT1_2], edge = arc([sx * (W / 2 - R), H / 2 - R, D / 2 - R], Y, ne);
      const yEnd = -1.8 + rnd(s + 61) * 3.6, k = Math.ceil((H / 2 - R - yEnd) / STEP), down: Pt[] = [];
      for (let i = 0; i <= k; i++) { const y = H / 2 - R - (i / k) * (H / 2 - R - yEnd), f = Math.PI / 4 + 0.55 * Math.sin(y * 1.3 + s * 2.1), nn: V3 = [sx * Math.cos(f), 0, Math.sin(f)];
        down.push({ p: [sx * (W / 2 - R) + nn[0] * (R + OFF), y, D / 2 - R + nn[2] * (R + OFF)], n: nn }); }
      v.push([...up, ...over, ...top, ...edge, ...down]);
    } else v.push([...up, ...over, ...walk([sx * (W / 2 - R), H / 2 + OFF, z1], [x2, H / 2 + OFF, z1 + (rnd(s + 81) - 0.5) * 1.4], Y, s + 90, 0.3)]);
  }
  // strands across the top to its front edge, their leaves a fringe along it, none hanging down over the glass
  for (let s = 0; s < 11; s++) {
    const x = -GLASS.x + 0.3 + (s + rnd(s + 101) * 0.7) / 11 * (2 * GLASS.x - 0.6), z1 = -1.2 + rnd(s + 111) * 1.8;
    v.push(walk([x - 0.9 + rnd(s + 121) * 1.8, H / 2 + OFF, z1], [x, H / 2 + OFF, D / 2 - R - 0.02], Y, s + 130, 0.3));
  }
  // out of the water up the neck, under the case to its front, and onto the bezel under the glass, clear of the lamp
  // (bottom left) and the vents (bottom right)
  for (let s = 0; s < 9; s++) {
    const x0 = -1.0 + (s / 8) * 2.0, x1 = [-3.6, -3.0, -2.2, -1.4, -0.4, 0.6, 1.5, 2.2, 2.7][s], yTop = GLASS.y0 - 0.08 - rnd(s + 151) * 0.35;
    const neck = walk([x0, WATER_Y - 0.05, NECK.z1 + OFF], [x0 + (rnd(s + 161) - 0.5) * 0.4, NECK.y1 - 0.05, NECK.z1 + OFF], Z, s + 170, 0.15);
    const under = walk([neck[neck.length - 1].p[0], -H / 2 - OFF, NECK.z1], [x0 * 1.6, -H / 2 - OFF, D / 2 - R], [0, -1, 0], s + 180, 0.2);
    const edge = arc([x0 * 1.6, -H / 2 + R, D / 2 - R], [0, -1, 0], Z);
    const face = walk([x0 * 1.6, -H / 2 + R, D / 2 + OFF], [x1, yTop, D / 2 + OFF], Z, s + 190, 0.3).filter((q) => onMonitor(q.p, q.n));
    v.push([...neck, ...under, ...edge, ...face]);
  }
  // branches: off every vine every metre or so, across the same face
  const all = [...v];
  v.forEach((vine, vi) => { for (let i = 8; i < vine.length - 4; i += 12 + Math.floor(rnd(vi * 31 + i) * 8)) {
    const ang = (rnd(vi * 7 + i) < 0.5 ? -1 : 1) * (0.6 + rnd(vi * 13 + i) * 0.6);
    const b = branch(vine, i, ang, 0.5 + rnd(vi * 17 + i) * 1.1, vi * 5 + i, onMonitor); if (b.length > 3) all.push(b); } });
  return all.flatMap(splitWhere((q) => !nearGlass(q.p)));
}
/** near the glass from the front: on or by the front face, within a quarter metre of the glass or its lip (the glass sits
 *  0.4 m back in its well, so a stem on the bezel shows over its edge from an angle), or on the lamp or vents */
function nearGlass(p: V3) {
  if (p[2] < D / 2 - R - 0.05) return false;
  const m = 0.25;
  return (Math.abs(p[0]) < GLASS.x + m && p[1] > GLASS.y0 - m && p[1] < GLASS.y1 + m) || Math.hypot(p[0] - lampAt[0], p[1] - lampAt[1]) < 0.45 || (p[0] > W / 2 - 2.1 && p[1] < -H / 2 + 1.2);
}
/** a vine cut into the runs where `ok` holds */
const splitWhere = (ok: (q: Pt) => boolean) => (vine: Vine): Vine[] => { const out: Vine[] = []; let run: Vine = [];
  for (const q of vine) { if (ok(q)) run.push(q); else { if (run.length > 2) out.push(run); run = []; } } if (run.length > 2) out.push(run); return out; };

// ---- the keyboard, in its own frame (TKB.c at the origin, before its tilt): the case KBW x 0.4 x KBD, top at y 0.08
const KBW = 15 * TKB.pitch + 0.42, KBD = 5 * TKB.pitch + 0.42;
function keyboardVines(): Vine[] {
  const v: Vine[] = [], back: V3 = [0, 0, -1];
  for (let s = 0; s < 6; s++) {   // along the back, low, from the ground at one end
    const sx = s % 2 ? 1 : -1, x0 = sx * (KBW / 2 + 0.2), x1 = sx * (KBW / 2 - 1.2 - rnd(s + 201) * 3.2);
    v.push(walk([x0, -0.34, -KBD / 2 - OFF], [x1, -0.08 - rnd(s + 211) * 0.1, -KBD / 2 - OFF], back, s + 220, 0.08));
  }
  for (let s = 0; s < 6; s++) {   // up each end
    const sx = s % 2 ? 1 : -1, z0 = -KBD / 2 + 0.3 + rnd(s + 231) * (KBD - 0.6);
    v.push(walk([sx * (KBW / 2 + OFF), -0.36, z0], [sx * (KBW / 2 + OFF), 0.0, z0 + (rnd(s + 241) - 0.5) * 0.8], [sx, 0, 0], s + 250, 0.12));
  }
  return v;
}
/** a keyboard leaf stays below the case's top edge, so none lies on the keys */
const leafOnKeyboard = (at: V3, tip: V3, s: number) => at[1] + Math.max(0, tip[1]) * s < 0.06;

export type Leaf = { at: V3; n: V3; tip: V3; s: number; color: string; phase: number };
type Seg = { position: V3; rotation: V3; scale: V3 };
const GREENS = ["#0e3814", "#144a1a", "#1c5c20", "#266d27", "#357f31"];   // drawn darker than they read: the paint look lifts them
const LEAF_SIZE = 1.6;
/** stems and leaves for vines given in a part's own frame, kept where `keep` allows, then moved into the world */
function grow(vines: Vine[], keep: (at: V3, tip: V3, s: number, n: V3) => boolean, P: (p: V3) => V3, N: (n: V3) => V3, seed: number) {
  const stems: Seg[] = [], leaves: Leaf[] = [];
  vines.forEach((vine, vj) => {
    const n = vine.length, vi = vj + seed;
    for (let i = 0; i + 1 < n; i++) {
      const a = P(vine[i].p), b = P(vine[i + 1].p), d = sub(b, a), len = Math.hypot(...d); if (len < 1e-4 || len > 0.5) continue;
      const Yd = norm(d), Xd = norm(cross(Yd, N(vine[i].n))), Zd = cross(Xd, Yd), r = 0.036 * (1 - 0.6 * (i / n));
      stems.push({ position: mul(add(a, b), 0.5), rotation: eulerOfBasis(Xd, Yd, Zd), scale: [r / 0.03, len, r / 0.03] });
    }
    // a leaf off each side at every step, a few missing, bigger and darker toward the root
    for (let i = 1; i < n - 1; i++) {
      const q = vine[i], u = i / n, d = norm(sub(vine[i + 1].p, vine[i - 1].p)), side = norm(cross(q.n, d)), k = vi * 997 + i;
      for (const sgn of [1, -1]) {
        if (rnd(k + sgn * 3) < 0.3) continue;
        const at = add(add(q.p, mul(side, sgn * (0.06 + 0.06 * rnd(k + 5)))), mul(q.n, 0.03));
        // the tip hangs: down the face where it can, out along the vine where the face is level, turned a little by chance
        const g = sub([0, -1, 0], mul(q.n, -q.n[1])), hang = Math.hypot(...g) > 0.3 ? norm(g) : norm(add(mul(side, sgn), mul(d, 0.4)));
        const tip = norm(turn(hang, q.n, (rnd(k + sgn * 7) - 0.5) * 1.8 + sgn * 0.4));
        const s = LEAF_SIZE * (0.15 + 0.12 * rnd(k + 9)) * (1.2 - 0.55 * u) * (q.n[2] > 0.5 ? 0.75 : 1);   // smaller on the bezel
        if (!keep(at, tip, s, q.n)) continue;
        const color = GREENS[Math.min(4, Math.floor(u * 2.6 + rnd(k + 11) * 2.4))];
        leaves.push({ at: P(at), n: N(q.n), tip: N(tip), s, color, phase: rnd(k + 13) * 6.283 });
      }
    }
  });
  return { stems, leaves };
}
const c = Math.cos(TKB.tilt), sn = Math.sin(TKB.tilt), tilt = (a: V3): V3 => [a[0], a[1] * c - a[2] * sn, a[1] * sn + a[2] * c];   // as machine.tsx's tiltQ: the back (-z) raised
const MON = grow(monitorVines(), (at, tip, s) => leafOnMonitor(at, tip, s), (p) => add(p, TMON.c), (n) => n, 0);
const KEYB = grow(keyboardVines(), (at, tip, s) => leafOnKeyboard(at, tip, s), (p) => add(tilt(p), TKB.c), tilt, 5000);
export const IVY = { stems: [...MON.stems, ...KEYB.stems], leaves: [...MON.leaves, ...KEYB.leaves] };

/** the leaves this frame: each tilted out from the wall and turned on its stalk by the wind (wind 0..1) */
export function ivyLeaves(t: number, wind = 0.3) {
  return IVY.leaves.map((l) => {
    const flut = wind * (0.22 * Math.sin(t * 2.1 + l.phase + l.at[0] * 0.3) + 0.1 * Math.sin(t * 5.3 + l.phase * 1.7));
    const side = norm(cross(l.tip, l.n));
    // stood off the surface 25 degrees, plus the flutter, and spun a little about the stalk
    const lift = 0.45 + flut;
    const Yd = norm(turn(l.tip, side, lift)), Zd = norm(turn(l.n, side, lift)), Yt = norm(turn(Yd, Zd, flut * 0.6)), Xd = cross(Yt, Zd);
    return { position: l.at, rotation: eulerOfBasis(Xd, Yt, Zd), scale: l.s, color: l.color };
  });
}
