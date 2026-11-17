// Where the old things and the watchers stand: plain data, read by the film (ruins.tsx) and the proof (check.ts).
import { FLOOR, WATER, height, type V3 } from "./set";
import { FROG_PAD, G, MON, TILES, rise } from "./plan";
import { waveAt } from "./waves";
import heads from "./heads.json";
export const face = (x: number, z: number, at: [number, number]) => Math.atan2(at[0] - x, at[1] - z);
export const C = FLOOR.c;
export type Ruin = { src: string; at: [number, number]; s: number; yaw: number; sink: number; tilt?: [number, number]; runes?: number };
export const RUINS: Ruin[] = [
  { src: "stone-2", at: [-5.3, -3.3], s: 1.1, yaw: face(-5.3, -3.3, C), sink: 0.15, runes: 0 },
  { src: "stone-0", at: [5.2, -2.9], s: 1.0, yaw: face(5.2, -2.9, C), sink: 0.15, runes: 1 },
  { src: "stone-1", at: [4.5, -0.3], s: 1.15, yaw: face(4.5, -0.3, C) + 0.2, sink: 0.15, runes: 2 },
  { src: "stone-0", at: [-4.6, -0.4], s: 0.92, yaw: face(-4.6, -0.4, C) - 0.15, sink: 0.15, tilt: [0.06, -0.05], runes: 3 },
  { src: "stone-3", at: [4.7, -5.7], s: 1.4, yaw: face(4.7, -5.7, C), sink: 0.1 },
  { src: "stone-fallen", at: [-4.3, -6.1], s: 1.0, yaw: 0.65, sink: 0.12 },
  { src: "trilithon", at: [-9.0, -1.4], s: 1.12, yaw: face(-9.0, -1.4, C), sink: 0.2, runes: 4 },
  { src: "statue", at: [9.4, -4.6], s: 1.0, yaw: face(9.4, -4.6, C), sink: 0.1 },
  { src: "column-0", at: [-9.2, -10.8], s: 1.05, yaw: 0.3, sink: 0.1, runes: 5 },
  { src: "column-1", at: [-11.8, -12.9], s: 1.0, yaw: 1.1, sink: 0.1 },
  { src: "column-2", at: [9.9, -11.3], s: 1.1, yaw: 2.0, sink: 0.1 },
  { src: "column-0", at: [12.6, -14.2], s: 1.0, yaw: 0.9, sink: 0.55, tilt: [1.45, 0] },
  { src: "drum", at: [6.9, 1.4], s: 1.1, yaw: 0.4, sink: 0.05 },
  { src: "arch", at: [-8.5, -25.8], s: 1.25, yaw: 0.25, sink: 0.4 },
];
export const ruinY = (r: Ruin) => height(r.at[0], r.at[1]) - r.sink;
// where the watchers sit: on top of the old things, turned to the goose (the film turns them)
export const CRITTERS: { src: string; clip: string; at: V3; s: number }[] = [
  { src: "raccoon", clip: "AnimalArmature|AnimalArmature|AnimalArmature|Idle", at: [-9.0, ruinY(RUINS[6]) + 3.84 * 1.12, -1.4], s: 0.1 },
  { src: "frog", clip: "FrogArmature|Frog_Idle", at: [4.7, ruinY(RUINS[4]) + 0.3 * 1.4, -5.7], s: 0.13 },
  { src: "frog", clip: "FrogArmature|Frog_Idle", at: [-4.9, WATER + 0.027, -7.1], s: 0.14 },   // v7: on a lily pad by the fallen stone (it hovered beside the stone: the director 11-16)
  { src: "deer", clip: "AnimalArmature|Eating", at: [8.3, height(8.3, 3.7), 3.7], s: 0.3 },   // by the drum (was a snake: the director 11-16, a deer)
  { src: "rat", clip: "RatArmature|Rat_Idle", at: [8.6, ruinY(RUINS[7]) + 1.0, -3.6], s: 0.05 },
  { src: "frog", clip: "FrogArmature|Frog_Idle", at: [2.8, WATER + 0.027, -9.6], s: 0.12 },   // v7: on a lily pad of its own (it sat on the water: the director 11-16)
  { src: "raccoon", clip: "AnimalArmature|AnimalArmature|AnimalArmature|Idle_Eating", at: [-6.6, 0, 2.6], s: 0.08 },
];

// when a watcher reacts (v5's list, kept for the files that read it; v6's are in critterPose below)
export const REACT: { k: number; from: number; to: number; clip: string; len: number; face?: [number, number] }[] = [
  { k: 2, from: 29.6, to: 31, clip: "FrogArmature|Frog_Jump", len: 0.88, face: [0, -12.5] },
  { k: 3, from: 31.15, to: 33.4, clip: "AnimalArmature|Jump_toIdle", len: 1.5, face: [0, -12.5] },
];
/** the lily pads the frogs sit on (v7): the opening's frog's, and the one the stone frog starts on; FROG_PAD (plan.ts)
 * is where it leaps to */
export const PADS: V3[] = [[2.8, WATER + 0.002, -9.6], [-4.9, WATER + 0.002, -7.1]];

// ---- what each watcher does, every frame: where it is, how it's turned, the clips it plays (its head turned by
// blending its idle with copies of it turned left, right and up, blender/critters_build.py), and a painted mark over it
export type Clip = { clip: string; time: number; weight: number };
export type Pose = { at: V3; yaw: number; sq: number; clips: Clip[]; head: V3; emote?: { n: "bang" | "heart"; u: number } };
const IDLE: Record<string, string> = { deer: "AnimalArmature|Idle", frog: "FrogArmature|Frog_Idle", rat: "RatArmature|Rat_Idle" };
/** each idle's own loop (its last frame is its first): v8, the idles were wrapped at 2 s, so each jumped once a loop
 * (the director 11-16 on the deer: "isnt a loop so it jumps between start and end") */
const PERIOD: Record<string, number> = { deer: 100 / 30, frog: 75 / 30, rat: 71 / 30 };
const HEAD_H: Record<string, number> = { raccoon: 0.42, frog: 0.2, deer: 1.42, rat: 0.13, fish: 0.08 };
const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const beatAt = (t: number) => (t - G(0)) / (G(1) - G(0));
const mixV = (a: V3, c: V3, u: number): V3 => [a[0] + (c[0] - a[0]) * u, a[1] + (c[1] - a[1]) * u, a[2] + (c[2] - a[2]) * u];
// where each head is through each clip (blender/critter_heads.py: model space, y up, facing +z, 30 a second)
const HEADS = heads as unknown as Record<string, Record<string, V3[]>>;
/** the head, where the clips it plays put it: their head paths blended by weight, turned and scaled into the world
 * (v7: the marks over them ride it; the director 11-16, "the ! is not tracked to its head") */
function headOf(src: string, clips: Clip[], at: V3, yaw: number, s: number, sq: number): V3 {
  const tab = HEADS[src]; let p: V3 = [0, 0, 0], w = 0;
  if (tab) for (const c of clips) { const arr = tab[c.clip] ?? tab[c.clip.split("|").pop()!]; if (!arr || c.weight <= 0) continue;
    const q = arr[Math.min(arr.length - 1, Math.max(0, Math.round(c.time * 30)))]; p = [p[0] + q[0] * c.weight, p[1] + q[1] * c.weight, p[2] + q[2] * c.weight]; w += c.weight; }
  if (w <= 0) return [at[0], at[1] + HEAD_H[src], at[2]];
  const m: V3 = [p[0] / w * s, p[1] / w * s * sq, p[2] / w * s], c = Math.cos(yaw), n = Math.sin(yaw);
  return [at[0] + m[0] * c + m[2] * n, at[1] + m[1], at[2] - m[0] * n + m[2] * c];
}
/** the head turned at `look` from a body turned `yaw`: the idle and its turned copies, by weight (a turn past what the
 * neck takes is the body's) */
function looking(src: string, time: number, yaw: number, head: V3, look: V3, amount = 1): Clip[] {
  const idle = IDLE[src]; if (!idle) return [{ clip: CRITTERS.find((c) => c.src === src)!.clip, time, weight: 1 }];
  const d: V3 = [look[0] - head[0], look[1] - head[1], look[2] - head[2]], turn = wrap(Math.atan2(d[0], d[2]) - yaw) * amount, up = Math.atan2(d[1], Math.hypot(d[0], d[2])) * amount;
  const wl = clamp(turn, 0, 1), wr = clamp(-turn, 0, 1), wu = clamp(up / 0.6, 0, 1) * 0.85;
  return [{ clip: idle, time, weight: Math.max(0.001, 1 - wl - wr - wu) }, { clip: "Look_L", time, weight: wl }, { clip: "Look_R", time, weight: wr }, { clip: "Look_U", time, weight: wu }];
}
/** the body's turn toward a point from where it sits facing `home`: part of the way, the head does the rest */
const bodyTurn = (at: V3, home: number, look: V3, part = 0.55) => home + clamp(wrap(face(at[0], at[2], [look[0], look[2]]) - home), -0.9, 0.9) * part;
/** a hop on each beat between a and c, `h` high, landing on the beat */
const beatHop = (b: number, a: number, c: number, h: number) => (b < a || b >= c ? 0 : h * 4 * (((b % 1) + 1) % 1) * (1 - (((b % 1) + 1) % 1)));
/** a frog's hop for joy on each beat between a and c: the whole jump clip a beat (crouch, spring, tuck, land), off the
 * pad only while the clip has it in the air */
function frogHop(b: number, a: number, c: number, h: number) {
  if (b < a || b >= c) return null; const ph = (((b - a) % 1) + 1) % 1, u = clamp((ph - 0.3) / 0.42, 0, 1);
  return { time: ph * 0.88, y: h * 4 * u * (1 - u), sq: 1 - 0.12 * Math.exp(-(((ph - 0.22) / 0.07) ** 2)) - 0.1 * Math.exp(-(((ph - 0.8) / 0.06) ** 2)) + 0.1 * Math.sin(Math.PI * u) };
}
const DEER_SHORE: V3 = [6.6, height(6.6, -6.4), -6.4];
export const SCREEN_AT: V3 = [MON.c[0], MON.c[1], MON.c[2] + 2.1];
/** the top of the monitor, wherever its rise has it */
export const monTop = (b: number): V3 => [MON.c[0], MON.c[1] - (1 - rise(b).mon) * 9.5 + MON.size[1] / 2, MON.c[2] + 1.0];
/** what the watchers look at (v7): the goose, but the computer as it comes up out of the pond (the director 11-16: "have the
 * heron watch it go up"), and the screen when the cutaway's tiles cut in, whipped round to it */
export function watchLook(b: number, look: V3): V3 {
  const rose = sm((b - 25.8) / 0.6) * (1 - sm((b - 33.6) / 0.6)); let l = mixV(look, monTop(b), rose);
  if (b >= TILES[0] - 0.2 && b < TILES[1]) { const x = clamp((b - TILES[0] - 0.04) / 0.22, 0, 1), w = 1 + 2.4 * (x - 1) ** 3 + 1.4 * (x - 1) ** 2; l = mixV(look, SCREEN_AT, w); }   // eased out past it and back: a whip, not a pan
  return l;
}
export function critterPose(k: number, t: number, b: number, look0: V3, hop = 0, jump = 0): Pose {
  const c = CRITTERS[k], home = face(c.at[0], c.at[2], C), loop = (t * (0.8 + 0.07 * k)) % (PERIOD[c.src] ?? 2), look = watchLook(b, look0);
  let at: V3 = [c.at[0], c.at[1] + jump * 0.25 * Math.abs(Math.sin(t * 9 + k)), c.at[2]], sq = 1 + hop * 0.07 * (0.5 + 0.5 * Math.cos(t * 9.4 + k * 0.8));
  if (c.src === "frog") sq = 1 + 0.035 * Math.sin(t * 7 + k) ** 2;   // on its pad a frog breathes, its throat swelling (v7: no beat bounce on a pad)
  let yaw = bodyTurn(at, home, look), clips: Clip[] = [], emote: Pose["emote"];
  const tilesBang = b >= TILES[0] + 0.05 && b < TILES[0] + 1.25 ? { n: "bang" as const, u: (b - TILES[0] - 0.05) / 1.2 } : undefined;
  switch (k) {
    case 2: {   // the frog on its pad by the fallen stone: as the computer comes up it leaps for the next pad, and lives
      // there after; it hops for joy when the film comes up on the screen, and again when the film's posted
      const P0 = c.at, P1: V3 = [FROG_PAD[0], FROG_PAD[1] + 0.025, FROG_PAD[2]], dir = Math.atan2(P1[0] - P0[0], P1[2] - P0[2]);
      if (b >= 29.2 && b < 31.2) {
        const u = clamp((b - 30.0) / 0.75, 0, 1), arc = 0.85 * 4 * u * (1 - u);
        at = [P0[0] + (P1[0] - P0[0]) * sm(u), P0[1] + (P1[1] - P0[1]) * u + arc, P0[2] + (P1[2] - P0[2]) * sm(u)]; sq = 1;
        yaw = home + wrap(dir - home) * sm((b - 29.2) / 0.35);
        // the jump clip held to the leap: its crouch before take-off, its flight over the arc, its landing after
        const ct = b < 30 ? clamp((b - 29.6) / 0.4, 0, 1) * 0.29 : b < 30.75 ? 0.33 + u * 0.29 : 0.67 + clamp((b - 30.75) / 0.25, 0, 1) * 0.2;
        clips = b < 29.6 ? looking(c.src, loop, yaw, at, look) : [{ clip: "FrogArmature|Frog_Jump", time: ct, weight: 1 }]; break;
      }
      if (b >= 31.2) {
        const jo = frogHop(b, 102.5, 104.5, 0.26) ?? frogHop(b, 121, 122, 0.18);   // (v8: 0.4 hopped out of its close hero shot)
        at = [P1[0], P1[1] + (jo ? jo.y : 0), P1[2]]; yaw = bodyTurn(at, face(P1[0], P1[2], [SCREEN_AT[0], SCREEN_AT[2]]), look, 0.4);
        if (jo) { clips = [{ clip: "FrogArmature|Frog_Jump", time: jo.time, weight: 1 }]; sq = jo.sq; emote = { n: "heart", u: b < 110 ? (b - 102.6) / 1.8 : (b - 121.05) / 0.95 }; }
        else clips = looking(c.src, loop, yaw, at, look);
      } else clips = looking(c.src, loop, yaw, at, look);
      break;
    }
    case 3: {   // the deer by the drum, eating; the computer coming up startles it (it leaps and lands staring); later it walks
      // down to the water to watch the screen, nods along, and bangs its head on the beat when the film's posted
      const T96 = G(96), walkU = clamp((b - 96) / 12, 0, 1);
      if (b >= 96) { const e = walkU < 1 ? walkU : 1; at = [c.at[0] + (DEER_SHORE[0] - c.at[0]) * e, 0, c.at[2] + (DEER_SHORE[2] - c.at[2]) * e]; at = [at[0], height(at[0], at[2]), at[2]]; }
      yaw = b < 96 ? bodyTurn(at, face(c.at[0], c.at[2], [SCREEN_AT[0], SCREEN_AT[2]]), look, 0.3) : b < 108 ? face(c.at[0], c.at[2], [DEER_SHORE[0], DEER_SHORE[2]]) : face(at[0], at[2], [SCREEN_AT[0], SCREEN_AT[2]]);
      const st = (G(b) - G(31.15)), bang = b >= 119 && b < 120.4 ? ((((b - 119) % 1) + 1) % 1) : -1;
      // v8 (the director 11-16: "it should only raise its head and hold it, it's looking at the computer"): head down grazing,
      // the eating clip rocked back and forth through its head-down stretch (1.0-3.8 s) so it never wraps; at the
      // startle it plays the clip's own head-raise (3.8-5.33 s) a little fast, and from its last frame (the idle's
      // pose) it eases into the idle looking up at the computer, and holds it there
      const RAISE = 1.6, up = st + 0.25;   // the head comes up from 0.25 s before the startle's beat
      if (up < 0) { const u = (-up) % 5.6; clips = [{ clip: "AnimalArmature|Eating", time: 3.8 - (u < 2.8 ? u : 5.6 - u), weight: 1 }]; }
      else if (b < 72) { const e = Math.min(5.33, 3.8 + up * RAISE), w = sm((up - (5.33 - 3.8) / RAISE) / 0.35);
        const lk = looking("deer", loop, yaw, at, mixV(SCREEN_AT, monTop(b), 1 - sm((b - 33.0) / 0.8)));
        clips = w >= 1 ? lk : [{ clip: "AnimalArmature|Eating", time: e, weight: 1 - w }, ...lk.map((x) => ({ ...x, weight: x.weight * w }))]; }
      else if (b < 96) clips = looking("deer", loop, yaw, at, look);
      else if (b < 108) clips = [{ clip: "AnimalArmature|Walk", time: (t - T96) % 1.1667, weight: 1 }];
      else if (bang >= 0) clips = [{ clip: "AnimalArmature|Attack_Headbutt", time: bang * 0.79, weight: 1 }];
      // (v8: no head-low nod while the edit's on: "it should only raise its head and hold it ... not lower its head")
      else clips = looking("deer", loop, yaw, at, SCREEN_AT);
      if (b >= 31.2 && b < 32.6) emote = { n: "bang", u: (b - 31.2) / 1.4 };
      if (b >= 119.05 && b < 120) emote = { n: "heart", u: (b - 119.05) / 0.95 };
      sq = 1; break;
    }
    case 0: case 6: {   // the raccoons (not drawn since v6)
      yaw = face(at[0], at[2], [look[0], look[2]]); clips = [{ clip: c.clip, time: loop, weight: 1 }]; break;
    }
    case 4: {   // the rat on the statue: cheers when the film's posted
      if (b >= 118.5 && b < 123.5) { at = [at[0], at[1] + beatHop(b, 118.5, 123.5, 0.16), at[2]]; clips = [{ clip: "RatArmature|Rat_Jump", time: (((b % 1) + 1) % 1) * 0.83, weight: 1 }]; sq = 1; emote = { n: "bang", u: (b - 120.2) / 1.8 }; }
      else clips = looking(c.src, loop, yaw, at, look);
      break;
    }
    default: {
      if (!IDLE[c.src]) yaw = face(at[0], at[2], [look[0], look[2]]);
      clips = looking(c.src, loop, yaw, at, look);
      if (k === 1 && tilesBang) emote = tilesBang;   // the frog in the cutaway: whips round to the screen
    }
  }
  void beatAt;
  // v9: a frog rides its pad on the pond's waves as the computer comes up (waves.ts; the pad's own ride, ruins.tsx)
  if (c.src === "frog") { const w = waveAt(at[0], at[2], t); at = [at[0] + w.ox, at[1] + Math.max(0, 0.25 * w.h), at[2] + w.oz]; }
  return { at, yaw, sq, clips, head: headOf(c.src, clips, at, yaw, c.s, sq), emote };
}

// ---- the heron (ours: built from solids in ruins.tsx), standing in the shallows on the left; its neck follows the
// goose, stretches up after the computer as it comes out of the pond, cranes right out at it while it swims, whips
// round to the screen in the cutaway, and cheers when the film's posted
export const HERON_AT: V3 = [-6.6, height(-6.6, -6.9), -6.9];
export function heronPose(b: number, look0: V3) {
  const look = watchLook(b, look0), yaw = bodyTurn(HERON_AT, face(HERON_AT[0], HERON_AT[2], [0.5, -5]), look, 0.35);
  const rose = sm((b - 25.8) / 0.6) * (1 - sm((b - 33.6) / 0.6));
  const crane = Math.max(0.55 * rose, sm((b - 111.4) / 0.5) * (1 - sm((b - 113.4) / 0.5)) + 0.35 * sm((b - 83.5) / 0.5) * (1 - sm((b - 85.8) / 0.4)));
  const bob = 0.012 * Math.sin(b * Math.PI);   // stepping its weight on the beat
  // its cheer (v7: in its own shot after the film's posted), head thrown up on each beat, a heart over it
  const cheer = b >= 120 && b < 121.4 ? (0.5 - 0.5 * Math.cos(2 * Math.PI * (b - 120))) * sm((b - 120) / 0.2) : 0;
  const emote = b >= TILES[0] + 0.05 && b < TILES[0] + 1.25 ? { n: "bang" as const, u: (b - TILES[0] - 0.05) / 1.2 } : b >= 26.4 && b < 27.8 ? { n: "bang" as const, u: (b - 26.4) / 1.4 }
    : b >= 120.05 && b < 121 ? { n: "heart" as const, u: (b - 120.05) / 0.95 } : undefined;
  return { at: HERON_AT, yaw, crane, bob: bob + 0.03 * cheer, cheer, emote, look };
}
/** the heron's neck and head, where ruins.tsx draws them (and the marks over it ride its head) */
export function heronRig(b: number, look0: V3) {
  const h = heronPose(b, look0), look = h.look, yw = h.yaw + Math.PI, cw = Math.cos(yw), sw = Math.sin(yw);
  const W = (x: number, y: number, z: number): V3 => [h.at[0] + x * cw + z * sw, h.at[1] + y + h.bob, h.at[2] - x * sw + z * cw];
  const base = W(0, 0.88, -0.24);   // where the neck leaves the body
  // the head: at rest held in an S over the shoulders; craning, thrust out at what it looks at
  const toL: V3 = [look[0] - base[0], look[1] - base[1], look[2] - base[2]], dl = Math.hypot(...toL) || 1, fw: V3 = [toL[0] / dl, toL[1] / dl, toL[2] / dl];
  const rest: V3 = W(0, 1.24, -0.32), out: V3 = [base[0] + fw[0] * 0.62, base[1] + 0.12 + fw[1] * 0.5, base[2] + fw[2] * 0.62];
  const head: V3 = mixV(rest, out, h.crane);
  const upHead = W(0, 1.5, -0.16); if (h.cheer > 0) for (let i = 0; i < 3; i++) head[i] += (upHead[i] - head[i]) * h.cheer;
  // v7 (the director 11-16: "have the heron watch it go up"): as the computer rises it stretches its neck up after it, tallest
  // when the monitor stands highest over it, before it settles back to watch the screen
  const rose = sm((b - 25.8) / 3.2) * (1 - sm((b - 33.6) / 1.4)); head[1] += 0.28 * rose;
  const mid: V3 = [base[0] + (head[0] - base[0]) * 0.5 - fw[0] * 0.07 * (1 - h.crane), base[1] + (head[1] - base[1]) * 0.55, base[2] + (head[2] - base[2]) * 0.5 - fw[2] * 0.07 * (1 - h.crane)];
  const sky: V3 = [head[0] + fw[0] * 0.4, head[1] + 1.2, head[2] + fw[2] * 0.4], aim: V3 = mixV(look, sky, h.cheer);
  return { ...h, yw, base, mid, head, aim };
}
