// The hand's performance: where it is and what it does at second t, shot by shot, to the narration's words.
// Everything is a pure function of t. The desk's top is y = 0; the arm lies along +z from the camera's side.
import { POSES, STICK } from "./poses";
import { type Pose, type V3, WRIST, add, carried, lowest, mix, reach, rested, wristAt } from "./rig";
import { BAR, bump, hold, ramp, said, shot, shotAt, SHOTS, smooth, span, type ShotName } from "./time";

export const PAPER = 0.012; // a sheet's thickness: its top face
export type Tool = "pencil" | "brush" | "baton" | null;
export type State = { shot: ShotName; pose: Pose | null; tool: Tool };

export const CUE = {
  artist: said("01", "artist"), my: said("01", "this"), hand: said("01", "hand"),
  conducts: said("04", "conducts"), badly: said("04", "badly"), feeling: said("04", "feeling"),
  writes: said("05", "writes"), dark: said("05", "too"), hiss: said("05", "there"), soft: said("05", "too", 1), every: said("05", "every"), same: said("05", "same"),
  fast: said("06", "very"), taste: said("06", "taste"), potato: said("06", "potato"),
  name: said("07", "fingerprint"),
  learns: said("08", "learns"), approve: said("08", "approve"), pick: said("08", "pick"), leave: said("08", "leave"), words: said("08", "words"), ten: said("08", "ten"), hotel: said("08", "hotel"),
  before: said("09", "before"), finds: said("09", "finds"), hate: said("09", "hate"), fixed: said("09", "fixed"),
  hides: said("10", "hides"), tell: said("10", "tell"), jealous: said("10", "jealous"),
  machine: said("11", "machine"), leaves: said("11", "leaves"), team: said("11", "team"), learned: said("11", "learned"), never: said("11", "never", 1),
  work: said("12", "work"), end: said("13", "fingerprint"), raea: said("13", "in"),
};
const S = Object.fromEntries(SHOTS.map((s) => [s[0], { from: s[1] as number, to: s[2] as number }])) as Record<ShotName, { from: number; to: number }>;
void shot;

// ── the places on the desk ─────────────────────────────────────────────────────────────────────────────────
export const SHEET = { x: 0.3, z: 2.3, w: 2.97, d: 2.1, turn: 0.12 };
export const SPIRAL = { c: [0.35, 2.3] as [number, number], r0: 0.05, r1: 0.62, turns: 3.4 };
// the viewer sits where the artist does (at -z), so their left is +x: a right hand writes and paints toward -x
export const ARC = { a: [1.3, 2.6] as [number, number], k: [0.3, 1.45] as [number, number], b: [-0.8, 2.6] as [number, number] };
export const PRINT_AT: [number, number] = [0.55, 3.35]; // where the thumb leaves its print
export const NOTES: { at: [number, number]; text: string; from: number; to: number }[] = [
  { at: [1.2, 2.15], text: "too dark", from: CUE.dark - 0.1, to: CUE.dark + 1.05 },
  { at: [0.05, 2.3], text: "hiss", from: CUE.hiss - 0.05, to: CUE.hiss + 1.0 },
  { at: [-1.1, 2.15], text: "too soft", from: CUE.soft - 0.1, to: CUE.soft + 1.05 },
];
export const NOTE = 0.76; // a sticky note's side
export const PRINTS: [number, number][] = [[-1.35, 2.85], [0, 2.95], [1.35, 2.85]]; // three prints of takes
export const PICKED = 1;
export const SLIP = { from: [0.35, 1.55] as [number, number], push: 0.75, t0: CUE.leave - 0.25, t1: CUE.leave + 0.6 }; // the note the finger slides forward
export const STRIP = { x: -0.5, z: 2.8, w: 4.5, d: 0.86 }; // the contact strip: six frames of a cut

export const spiralAt = (u: number): [number, number] => {
  const a = u * SPIRAL.turns * Math.PI * 2;
  const r = SPIRAL.r0 + (SPIRAL.r1 - SPIRAL.r0) * u;
  return [SPIRAL.c[0] + Math.cos(a) * r, SPIRAL.c[1] + Math.sin(a) * r * 0.86];
};
export const arcAt = (u: number): [number, number] => {
  const v = 1 - u;
  return [v * v * ARC.a[0] + 2 * v * u * ARC.k[0] + u * u * ARC.b[0], v * v * ARC.a[1] + 2 * v * u * ARC.k[1] + u * u * ARC.b[1]];
};
export const UNDERLINE = { a: [1.05, 3.12] as [number, number], b: [-0.35, 3.2] as [number, number] };

// how far each thing has got, for the set to draw
export const drawn = (t: number) => (t >= S.work.from ? 1 : smooth(span(t, S.draw.from + 0.55, S.draw.to - 0.35)));
export const underlined = (t: number) => smooth(span(t, S.work.from + 0.9, S.work.to - 0.9));
export const painted = (t: number) => (t >= S.print.from ? 1 : smooth(span(t, S.paint.from + 0.8, S.paint.to - 1.9)));
export const written = (i: number, t: number) => span(t, NOTES[i].from, NOTES[i].to);
export const printShown = (t: number) => ramp(t, CUE.name + 0.72, CUE.name + 0.86);
export const slipAt = (t: number): [number, number] => [SLIP.from[0], SLIP.from[1] + SLIP.push * smooth(span(t, SLIP.t0, SLIP.t1))];

// ── the grips, turned for their work ───────────────────────────────────────────────────────────────────────
const WRITE: Pose = { ...POSES.tripod, rx: -0.1, rz: 0.3 };
const tipAt = (p: Pose, q: [number, number], lift = 0): Pose => reach(p, "hand", STICK.tip, [q[0], PAPER + lift, q[1]]);
const POINT_TIP: V3 = [0.25, 0.03, 1.19];
const breathe = (p: Pose, t: number, k = 1): Pose => add(p, { indexMcp: 0.02 * Math.sin(t * 1.1), middleMcp: 0.02 * Math.sin(t * 0.9 + 1), ringMcp: 0.025 * Math.sin(t * 1.0 + 2), littleMcp: 0.03 * Math.sin(t * 0.8 + 3), thumbFlex: 0.02 * Math.sin(t * 0.7 + 4), wristFlex: 0.012 * Math.sin(t * 0.6) }, k);
// fingers drumming: each lifts and falls in turn, little finger first; `at` is when the roll starts
const drum = (p: Pose, t: number, at: number, k = 1): Pose => {
  const o = { ...p };
  ["little", "ring", "middle", "index"].forEach((f, i) => { const b = bump(t, at + i * 0.095 + 0.06, 0.2); o[`${f}Mcp`] -= 0.2 * b * k; o[`${f}Pip`] -= 0.06 * b * k; });
  return o;
};

const cache = new Map<string, Pose>();
const once = (key: string, make: () => Pose) => { let p = cache.get(key); if (!p) { p = make(); cache.set(key, p); } return p; };

function sHand(t: number): Pose {
  const down = once("hand-down", () => rested(wristAt(POSES.relaxed, [0.25, 0, 1.0])));
  const up = once("hand-up", () => wristAt({ ...POSES.open, rz: 1.0, rx: -0.22, wristFlex: -0.15 }, [0.3, 1.25, 1.2]));
  let p = breathe(down, t);
  for (const at of [0.62, 1.87, 3.12]) p = drum(p, t, at);
  const k = hold(t, CUE.my - 0.25, S.hand.to + 0.6, 0.9, 0.9);
  p = mix(p, breathe(up, t, 2), k);
  // it turns a little to be looked at
  return add(p, { rz: 0.12 * Math.sin((t - CUE.my) * 2.2), ry: 0.08 * Math.sin((t - CUE.my) * 1.7) }, k);
}
function sDraw(t: number): Pose {
  const u = drawn(t);
  const a = u * SPIRAL.turns * Math.PI * 2;
  const lift = 0.3 * (1 - ramp(t, S.draw.from, S.draw.from + 0.55)) + 0.35 * ramp(t, S.draw.to - 0.35, S.draw.to + 0.4);
  return tipAt(add(WRITE, { wristDev: 0.05 * Math.sin(a), wristFlex: 0.04 * Math.cos(a), ry: 0.05 * Math.sin(a * 0.5) }), spiralAt(u), lift);
}
function sWork(t: number): Pose {
  const u = underlined(t);
  const q: [number, number] = [UNDERLINE.a[0] + (UNDERLINE.b[0] - UNDERLINE.a[0]) * u, UNDERLINE.a[1] + (UNDERLINE.b[1] - UNDERLINE.a[1]) * u];
  const lift = 0.3 * (1 - ramp(t, S.work.from + 0.3, S.work.from + 0.9)) + 0.4 * ramp(t, S.work.to - 0.9, S.work.to - 0.2);
  return tipAt(add(WRITE, { ry: -0.06 + 0.12 * u }), q, lift);
}
function sPaint(t: number): Pose {
  const u = painted(t);
  const lift = 0.35 * (1 - ramp(t, S.paint.from + 0.2, S.paint.from + 0.8)) + 0.7 * ramp(t, S.paint.to - 1.9, S.paint.to - 0.6);
  return tipAt(add({ ...POSES.tripod, rx: 0.02, rz: 0.2 }, { ry: -0.18 + 0.36 * u, wristDev: -0.1 + 0.2 * u }), arcAt(u), lift + 0.01);
}
function sConduct(t: number): Pose {
  const ph = ((t - S.conduct.from) / BAR) % 1;
  // a bar of three: down, out, up, each a bounce off its beat
  const P: [number, number][] = [[0, -0.5], [0.6, -0.2], [0.12, 0.5]];
  const seg = Math.floor(ph * 3), k = ph * 3 - seg;
  const a = P[(seg + 2) % 3], b = P[seg], e = smooth(k);
  const bounce = Math.sin(Math.PI * k) * 0.16;
  let x = a[0] + (b[0] - a[0]) * e, y = a[1] + (b[1] - a[1]) * e + bounce;
  const bad = hold(t, CUE.badly - 0.2, CUE.feeling - 0.5, 0.3, 0.4);
  const feel = ramp(t, CUE.feeling - 0.3, CUE.feeling + 0.4);
  x += bad * 0.22 * Math.sin(t * 14) + feel * 0.5 * Math.sin((t - CUE.feeling) * Math.PI * 2 / BAR);
  y += bad * 0.16 * Math.sin(t * 19 + 1) + feel * 0.35 * Math.cos((t - CUE.feeling) * Math.PI * 2 / BAR);
  const amp = 1 + 0.5 * feel;
  // the forearm upright, the elbow low: the baton lies forward from the fingers
  const p = add({ ...POSES.tripod, rx: -1.3, rz: 0.15 }, { wristFlex: (0.16 + 0.14 * feel) * Math.sin(ph * Math.PI * 2 * 3 + 0.6) + bad * 0.1 * Math.sin(t * 23), wristDev: 0.08 * Math.sin(ph * Math.PI * 2) + bad * 0.08 * Math.sin(t * 17), rz: feel * 0.2 * Math.sin((t - CUE.feeling) * 3), rx: 0.12 * y });
  return wristAt(p, [0.1 + x * amp, 5.6 + y * amp, 1.3]);
}
function sNotes(t: number): Pose {
  // where the pencil's point is: over each note in turn, writing along it while its words are said
  const stops: { t: number; q: [number, number]; lift: number }[] = [{ t: S.notes.from, q: [NOTES[0].at[0] + 0.27, NOTES[0].at[1]], lift: 0.3 }];
  NOTES.forEach((n) => {
    stops.push({ t: n.from, q: [n.at[0] + 0.27, n.at[1]], lift: 0 });
    stops.push({ t: n.to, q: [n.at[0] - 0.27, n.at[1]], lift: 0 });
  });
  stops.push({ t: CUE.every + 0.3, q: [NOTES[2].at[0] - 0.1, NOTES[2].at[1] + 0.05], lift: 0.4 }, { t: S.notes.to + 1, q: [NOTES[2].at[0] - 0.1, NOTES[2].at[1] + 0.05], lift: 0.4 });
  let i = 0;
  while (i < stops.length - 2 && t >= stops[i + 1].t) i++;
  const a = stops[i], b = stops[i + 1];
  const k = span(t, a.t, b.t);
  const writing = a.lift === 0 && b.lift === 0;
  const e = writing ? k : smooth(k);
  let q: [number, number] = [a.q[0] + (b.q[0] - a.q[0]) * e, a.q[1] + (b.q[1] - a.q[1]) * e];
  let lift = a.lift + (b.lift - a.lift) * e + (writing ? 0 : 0.22 * Math.sin(Math.PI * k));
  if (writing) q = [q[0], q[1] + 0.045 * Math.sin(k * Math.PI * 2 * 5.5)];
  // every day, the same notes: the pencil's point taps
  for (const at of [CUE.every + 1.0, CUE.same + 0.1, CUE.same + 0.75]) lift -= 0.36 * bump(t, at, 0.34);
  return tipAt(add(WRITE, { ry: (q[0] - 0.05) * 0.09 }), q, Math.max(0, lift));
}
function sMachine(t: number): Pose {
  const base = once("machine", () => wristAt({ ...POSES.open, rx: -0.45, rz: 0.55 }, [0.15, 2.5, 1.1]));
  const wob = hold(t, CUE.fast - 0.9, CUE.fast + 1.1, 0.3, 0.4);
  let p = add(breathe(base, t, 2), { rz: 0.34 * wob * Math.sin((t - CUE.fast) * Math.PI * 2 * 2.1), wristDev: 0.08 * wob * Math.sin((t - CUE.fast) * Math.PI * 2 * 2.1 + 1) });
  // a boiled potato: it is waved away
  const flick = bump(t, CUE.potato - 0.15, 0.6);
  p = add(p, { wristFlex: 0.5 * flick, pz: 0.25 * flick, py: -0.1 * flick });
  const away = ramp(t, CUE.potato + 0.25, S.machine.to + 0.3);
  return add(mix(p, wristAt({ ...POSES.relaxed, rx: -0.2, rz: 0.2 }, [0.15, 2.1, 0.9]), away), {});
}
function sPrint(t: number): Pose {
  const press = POSES.press;
  const drop = once("press-drop", () => ({ ...press, py: 0, px: 0, pz: 0, dy: lowest(press) } as Pose)).dy;
  const TPAD: V3 = [0.78, -0.27, 0.4];
  const over = (q: [number, number], lift: number): Pose => {
    const p = reach(press, "thumb3", TPAD, [q[0], 0, q[1]]);
    return { ...p, py: PAPER + 0.003 + lift - drop };
  };
  // dab the wet paint, cross to clean paper, press, lift
  const dab = arcAt(0.97);
  const a = over(dab, 0.55 - 0.55 * bump(t, S.print.from + 0.65, 0.9));
  const b = over(PRINT_AT, 0.5 - 0.5 * hold(t, CUE.name - 0.55, CUE.name + 0.95, 0.4, 0.45));
  const p = mix(a, b, ramp(t, S.print.from + 1.05, CUE.name - 0.5));
  // then out of the way of what it made
  return add(p, { px: 2.2 * ramp(t, CUE.name + 1.0, S.print.to + 0.2), py: 0.5 * ramp(t, CUE.name + 0.95, S.print.to), pz: -0.6 * ramp(t, CUE.name + 1.0, S.print.to + 0.2) });
}
function sApprove(t: number): Pose {
  const idle = once("approve-idle", () => wristAt({ ...POSES.relaxed, rx: -0.45, roll: 0.3 }, [0.1, 3.0, 1.1]));
  // the forearm tilted up from a low elbow, turned thumb-side up: the thumb then stands without being forced
  const up = once("approve-up", () => wristAt({ ...POSES.thumbsUp, roll: 1.5, rx: -0.72 }, [0.1, 3.5, 1.3]));
  const k = ramp(t, CUE.approve - 0.75, CUE.approve - 0.1);
  return add(mix(breathe(idle, t, 2), up, k), { py: 0.12 * bump(t, CUE.approve + 0.15, 0.5), rz: 0.05 * Math.sin(t * 2) * k });
}
function sPick(t: number): Pose {
  const pt: Pose = { ...POSES.point, rx: 0.42, rz: 0.12 };
  const tip = (q: [number, number], lift: number) => reach(pt, "index3", POINT_TIP, [q[0], PAPER * 2 + 0.004 + lift, q[1]]);
  const pr = PRINTS[PICKED];
  const tap = tip(pr, 0.4 - 0.4 * bump(t, CUE.pick + 0.12, 0.42));
  const s = slipAt(t);
  const push = tip([s[0], s[1] - NOTE * 0.3], 0.4 - 0.4 * hold(t, SLIP.t0 - 0.2, SLIP.t1 + 0.25, 0.25, 0.3));
  const p = mix(tap, push, ramp(t, CUE.pick + 0.45, SLIP.t0 - 0.2));
  const rest = wristAt({ ...POSES.relaxed, rx: 0.1, rz: 0.2 }, [0.4, 1.3, 0.2]);
  return mix(p, breathe(rest, t), ramp(t, SLIP.t1 + 0.4, S.pick.to + 0.2));
}
function sHotel(t: number): Pose {
  const base = once("hotel", () => wristAt({ ...POSES.open, rx: -0.5, rz: 0.2 }, [0.1, 3.0, 1.0]));
  const no = hold(t, S.hotel.from + 0.1, CUE.ten + 0.9, 0.3, 0.4);
  let p = add(breathe(base, t, 2), { ry: 0.26 * no * Math.sin((t - S.hotel.from) * Math.PI * 2 * 1.9), wristDev: 0.12 * no * Math.sin((t - S.hotel.from) * Math.PI * 2 * 1.9 + 0.6) });
  // I am not a hotel: the palm turns up
  const shrug = ramp(t, CUE.hotel - 0.9, CUE.hotel - 0.2);
  p = mix(p, wristAt({ ...POSES.open, rx: -0.3, rz: 1.9, wristFlex: -0.3, thumbFlex: -0.3 }, [0.2, 2.9, 1.1]), shrug);
  return add(p, { py: 0.1 * bump(t, CUE.hotel, 0.5) });
}
const STRIP_REST = () => once("strip-rest", () => rested(wristAt({ ...POSES.relaxed, ry: -0.5 }, [2.6, 0, 0.9])));
function sStrip(t: number): Pose {
  let p = breathe(STRIP_REST(), t);
  for (const at of [CUE.jealous - 0.55, CUE.jealous + 0.35]) p = drum(p, t, at, 1.2);
  // it points at what was found, once
  return add(p, { indexMcp: -0.14 * bump(t, CUE.hate + 0.3, 1.2) });
}
function sCover(t: number): Pose {
  const on = once("cover-on", () => rested(wristAt({ ...POSES.flat, ry: 0.0 }, [STRIP.x + 0.15, 0, STRIP.z - 0.95]), PAPER * 2));
  const k = ramp(t, S.cover.from + 0.2, CUE.leaves - 0.75);
  let p = mix(STRIP_REST(), on, k);
  p = add(p, { py: 0.7 * Math.sin(Math.PI * k) });
  // never the footage: it pats what it keeps
  return add(breathe(p, t, 0.4), { py: 0.07 * bump(t, CUE.never + 0.25, 0.4), wristFlex: -0.05 * bump(t, CUE.never + 0.25, 0.4) });
}

// nothing goes into the desk or the paper on it: a pose that would is raised until its lowest skin clears
const AIR: ShotName[] = ["conduct", "machine", "approve", "hotel"];
function clear(name: ShotName, p: Pose): Pose {
  const floor = AIR.includes(name) ? 0.02 : PAPER + 0.003;
  const low = lowest(p);
  return low < floor ? { ...p, py: p.py + floor - low } : p;
}

/** the other hand at second t: on the big sheets it holds the paper still (its pose is the right hand's in a mirror
 * at x = 0, so +x here is the viewer's right) */
export function offHand(t: number): Pose | null {
  const name = SHOTS[shotAt(t)][0];
  if (name !== "draw" && name !== "paint" && name !== "print" && name !== "work") return null;
  const painting = name === "paint" || name === "print";
  // on the sheet's near left corner, fingers toward the work
  const at: V3 = painting ? [-1.45, 0, 1.55] : [-1.4, 0, 1.75];
  const base = once(`off-${painting}`, () => rested(wristAt({ ...POSES.holding, ry: 0.42, rx: 0.03 }, at), PAPER, 0.003));
  // it leans on the sheet a little more as the other hand bears down, and eases
  const p = add(base, { indexMcp: 0.03 * Math.sin(t * 1.3), middleMcp: 0.025 * Math.sin(t * 1.1 + 1), ringMcp: 0.03 * Math.sin(t * 0.9 + 2), littleMcp: 0.03 * Math.sin(t * 1.2 + 3), thumbFlex: 0.03 * Math.sin(t * 0.8) });
  const low = lowest(p);
  return low < PAPER + 0.003 ? { ...p, py: p.py + PAPER + 0.003 - low } : p;
}

/** the hand at second t */
export function act(t: number): State {
  const name = SHOTS[shotAt(t)][0];
  switch (name) {
    case "hand": return { shot: name, pose: clear(name, sHand(t)), tool: null };
    case "draw": return { shot: name, pose: clear(name, sDraw(t)), tool: "pencil" };
    case "paint": return { shot: name, pose: clear(name, sPaint(t)), tool: "brush" };
    case "conduct": return { shot: name, pose: clear(name, sConduct(t)), tool: "baton" };
    case "notes": return { shot: name, pose: clear(name, sNotes(t)), tool: "pencil" };
    case "machine": return { shot: name, pose: clear(name, sMachine(t)), tool: null };
    case "print": return { shot: name, pose: clear(name, sPrint(t)), tool: null };
    case "approve": return { shot: name, pose: clear(name, sApprove(t)), tool: null };
    case "pick": return { shot: name, pose: clear(name, sPick(t)), tool: null };
    case "hotel": return { shot: name, pose: clear(name, sHotel(t)), tool: null };
    case "strip": return { shot: name, pose: clear(name, sStrip(t)), tool: null };
    case "cover": return { shot: name, pose: clear(name, sCover(t)), tool: null };
    case "work": return { shot: name, pose: clear(name, sWork(t)), tool: "pencil" };
    default: return { shot: name, pose: null, tool: null };
  }
}
void WRIST; void carried;
