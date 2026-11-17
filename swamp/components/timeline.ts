// The film's clock: every frame number the picture and the sound share (hype.script.ts, previz v4).
// 30 fps, 2545 frames (v4: the send, the ground opening, the beam, the ship, the arrival, the review room, the end in space). Nothing here draws; the set, the screen and the score all read it.
import { Easing, interpolate } from "raea";

export type V3 = [number, number, number];
export const FPS = 30;
export const END = 2545;
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = Easing.inOut(Easing.cubic);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
/** a seeded 0..1, fixed per index */
export const rnd = (i: number, k = 0) => {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const hex = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b), c = Math.max(0, Math.min(1, t));
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * c).toString(16).padStart(2, "0")).join("");
};

// ---- the events, in frames ----
export const T = {
  wakeBump: 162, // the robot's nose on the key
  wake: 165, // the glass lights
  newTap: 322,
  made: 358, // the new project exists
  typeFrom: 366,
  typeTo: 504,
  returnHit: 532,
  sent: 534,
  agent: 572,
  task0: 596, // each task ticks 20 frames after the last
  card: 660,
  controls: 700, // the panel turns to Controllers
  sunFrom: 716,
  sunTo: 776,
  pick: 806,
  growFrom: 874,
  growTo: 924,
  open: 962, // the item full size
  pin: 1000, // a comment pinned on the picture
  noteFrom: 1008,
  noteTo: 1044,
  drawFrom: 1056,
  drawTo: 1092,
  field: 1102, // back into the note's words, and it posts
  posted: 1106,
  send: 1118,
  working: 1128, // the agent takes the note
  v2: 1150, // its new version arrives
  cardOpen: 1180, // the new version opened
  compare: 1194, // compared with the one before
  wipeFrom: 1206,
  wipeTo: 1232,
  scrubFrom: 1260,
  scrubTo: 1322,
  seat: 1470, // v2's end (the robot on the bezel); v3 has no seat
  // ---- v3 ----
  back: 1424, // the robot back at the glass after watching the play
  shareHover: 1446,
  share: 1452, // the Share panel opens on Review link
  titleFocus: 1460,
  titleFrom: 1466, // ", for the mothership" typed after "Swamp"
  titleTo: 1488,
  createHover: 1494,
  create: 1500, // the link made: sent
  copy: 1518, // v5: it presses the link's Copy; 24-send cuts on the press, 2 frames in (1520)
  // ---- v4: the ground opens, the beam, the ship, the arrival, the room, the end ----
  tremor: 1518, // the ground starts to shake: the keys rattle, the water shivers
  crack: 1530, // light breaks through the bank in a jagged line (25-crack from 1520)
  blast: 1566, // the bank blows open: chunks of earth thrown up and out, a glowing pit left
  beam: 1586, // the beam stands up out of the pit
  rise: 1620, // 26-rise: up the beam through the canopy and into the cloud, white at its end
  orbit: 1710, // 27-orbit: the beam's head races straight up out of the atmosphere to the ship
  strike: 1776, // the beam strikes the ship's port
  port: 1830, // 28-port: into the port, white-out over its last 8 frames
  arrive: 1890, // 29-arrive: out of the white into the dark review room; the link arrives; they come in and sit
  linkIn: 1906, // the review link lands on the room's screen
  room: 2010, // 29-room: the film on its screen
  roomPlay: 2032, // the film starts playing on the alien screen
  wow: 2072, // the room's clamor
  hands: 2140, // 30-hands: alien hands on an alien keyboard
  glyphs: 2165, // 30b-glyphs: close on the comment on the screen as each press writes its words (to 2205)
  alienFrom: 2146,
  alienTo: 2196,
  noteRoom: 2205, // 31-note: the note posts on the film in alien script
  notePost: 2218,
  captionFrom: 2232, // the subtitle: "I'm not sure this is on brand for us."
  captionTo: 2312,
  end: 2325, // 32-end: the robot flies back up to the ship
  tilt: 2425, // the camera tilts up off the ship to the stars
  mark: 2455, // the raea logo, full size over the stars, held to the end
  // ---- v4's other beats the picture and the sound share ----
  pulse: 566, // after the Return and the close on the sent line: a pulse of light runs out from the monitor over the dead swamp (to ~596)
  fishOut: 836, // a fish leaves the water in 13-water
  fishIn: 851, // and drops back in
  pass: 2352, // 32-end: the robot passes closest to the lens
  sad: 2364, // its sad warble as it turns away up to the ship
};
/** the aliens walking in to their seats in 29-arrive: each head's first step; a step every STEP frames, STEPS of them,
 *  then it sits (settled SIT frames after its last step) */
export const WALK = [
  { head: 0, from: 1926 },
  { head: 2, from: 1932 },
  { head: 1, from: 1942 },
  { head: 3, from: 1950 },
];
export const STEP = 14, STEPS = 4, SIT = 4;
export const LINE = "bring this swamp back to life.";
export const NOTE = "mist on the water.";
export const noted = (f: number) => Math.round(interpolate(f, [T.noteFrom, T.noteTo], [0, NOTE.length], clamp));
export const noteFrame = (i: number) => Math.round(T.noteFrom + ((i + 0.5) / NOTE.length) * (T.noteTo - T.noteFrom));
export const typed = (f: number) => Math.round(interpolate(f, [T.typeFrom, T.typeTo], [0, LINE.length], clamp));
/** the frame character i (0-based) lands on */
export const charFrame = (i: number) => Math.round(T.typeFrom + ((i + 0.5) / LINE.length) * (T.typeTo - T.typeFrom));

// ---- what the robot's controls do: each a 0..1 the screen and the world both read ----
export const powerAt = (f: number) => interpolate(f, [T.wake, T.wake + 25], [0, 1], clamp);
export const sunAt = (f: number) => interpolate(f, [T.sunFrom, T.sunTo], [0, 1], { ...clamp, easing: ease });
export const waterAt = (f: number) => interpolate(f, [T.pick, T.pick + 52], [0, 1], clamp);
export const growAt = (f: number) => interpolate(f, [T.growFrom, T.growTo], [0, 1], { ...clamp, easing: ease });
/** the note's answer: mist over the water, from the new version on */
export const mistAt = (f: number) => interpolate(f, [T.v2, T.v2 + 80], [0, 1], { ...clamp, easing: ease });
/** the mist settling onto the water as the afternoon goes on, out of sight while the wipe holds on the glass: by the scrub it
 *  lies below the glass's foot, so the close shots on the timeline look through clear air */
export const settleAt = (f: number) => interpolate(f, [T.wipeFrom, T.scrubFrom - 22], [0, 1], { ...clamp, easing: ease });
export const duskAt = (f: number) => interpolate(f, [T.scrubFrom, T.scrubTo], [0, 1], { ...clamp, easing: ease });

// ---- the monitor: the glass is SW x SH metres, centred on MON, leaning as MON_ROT says ----
export const SW = 4.0, SH = 2.25;
export const MON: V3 = [0, 1.3, 0];
export const MON_ROT: V3 = [-0.04, 0, 0.03]; // radians, XYZ
export const GLASS_Z = 0.14; // the glass's face, in front of the monitor's centre
const rot = (p: V3): V3 => {
  // XYZ Euler as Quat.fromEuler("XYZ") applies it: x, then y, then z, about the local axes
  const [rx, , rz] = MON_ROT;
  let [x, y, z] = p;
  // about z first on the vector (the last local rotation is applied first to the point)
  [x, y] = [x * Math.cos(rz) - y * Math.sin(rz), x * Math.sin(rz) + y * Math.cos(rz)];
  [y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)];
  return [x, y, z];
};
/** a point on the glass (u, v from its top left, 0..1), `out` metres in front of it, in the world */
export const onScreen = (u: number, v: number, out = 0.22): V3 => {
  const r = rot([(u - 0.5) * SW, (0.5 - v) * SH, GLASS_Z + out]);
  return [MON[0] + r[0], MON[1] + r[1], MON[2] + r[2]];
};
/** the page the glass shows is PW x PH points */
export let PW = 1600, PH = 900;
export const px = (x: number, y: number, out = 0.22) => onScreen(x / PW, y / PH, out);

// ---- the keyboard: a real layout, U metres a key unit, lying on the bank ----
export const KB: V3 = [0.25, 0.235, 3.3];
export const KB_YAW = 0.07;
export const U = 0.098;
type Key = { id: string; row: number; x: number; w: number };
const ROWS: [string, number][][] = [
  [["`", 1], ["1", 1], ["2", 1], ["3", 1], ["4", 1], ["5", 1], ["6", 1], ["7", 1], ["8", 1], ["9", 1], ["0", 1], ["-", 1], ["=", 1], ["del", 2]],
  [["tab", 1.5], ["q", 1], ["w", 1], ["e", 1], ["r", 1], ["t", 1], ["y", 1], ["u", 1], ["i", 1], ["o", 1], ["p", 1], ["[", 1], ["]", 1], ["\\", 1.5]],
  [["caps", 1.75], ["a", 1], ["s", 1], ["d", 1], ["f", 1], ["g", 1], ["h", 1], ["j", 1], ["k", 1], ["l", 1], [";", 1], ["'", 1], ["return", 2.25]],
  [["shiftl", 2.25], ["z", 1], ["x", 1], ["c", 1], ["v", 1], ["b", 1], ["n", 1], ["m", 1], [",", 1], [".", 1], ["/", 1], ["shiftr", 2.75]],
  [["ctrl", 1.25], ["opt", 1.25], ["cmd", 1.25], ["space", 6.25], ["cmdr", 1.25], ["optr", 1.25], ["fn", 1.25], ["ctrlr", 1.25]],
];
export const KEYS: Key[] = ROWS.flatMap((row, r) => {
  let x = 0;
  return row.map(([id, w]) => {
    const k = { id, row: r, x: x + w / 2, w };
    x += w;
    return k;
  });
});
export const KEY_WIDTHS = [...new Set(KEYS.map((k) => k.w))];
/** a key's centre in the keyboard's own space (x across, z toward the viewer), metres */
export const keyLocal = (k: Key): V3 => [(k.x - 7.5) * U, 0, (k.row - 2) * U];
/** a key's top centre in the world */
export const keyWorld = (id: string): V3 => {
  const k = KEYS.find((q) => q.id === id)!;
  const [x, , z] = keyLocal(k);
  const c = Math.cos(KB_YAW), s = Math.sin(KB_YAW);
  return [KB[0] + x * c + z * s, KB[1] + 0.03, KB[2] - x * s + z * c];
};
export const keyOf = (ch: string) => (ch === " " ? "space" : ch);
/** how far down a key is at a frame, 0..1 */
export const keyDown = (id: string, f: number) => {
  let d = 0;
  if (id === "space") d = interpolate(f, [T.wakeBump - 4, T.wakeBump, T.wakeBump + 8], [0, 1, 0], clamp);
  if (id === "return") d = Math.max(d, interpolate(f, [T.returnHit - 2, T.returnHit, T.returnHit + 10], [0, 1, 0], clamp));
  for (let i = 0; i < LINE.length; i++) {
    if (keyOf(LINE[i]) !== id) continue;
    const at = charFrame(i);
    d = Math.max(d, interpolate(f, [at - 2, at, at + 3, at + 6], [0, 1, 1, 0], clamp));
  }
  for (let i = 0; i < NOTE.length; i++) {
    if (keyOf(NOTE[i]) !== id) continue;
    const at = noteFrame(i);
    d = Math.max(d, interpolate(f, [at - 1, at, at + 2, at + 4], [0, 1, 1, 0], clamp));
  }
  return d;
};

// ---- cameras: one shot a row, each already moving at its start and still moving at its end ----
export type Shot = { id: string; from: number; to: number; p0: V3; p1: V3; l0: V3; l1: V3; fov: number };
const RET = keyWorld("return");
const DY = MON[1] - 1.45; // the previz stood the monitor 0.15 m higher
const y = (v: V3): V3 => [v[0], v[1] + DY, v[2]];
export const SHOTS: Shot[] = [
  { id: "01-reeds", from: 0, to: 90, p0: [-3.4, 0.4, 9.2], p1: [-2.7, 0.5, 7.4], l0: [0.6, 1.2, 0], l1: [0.5, 1.3, 0], fov: 42 },
  { id: "02-key", from: 90, to: 165, p0: [-0.7, 0.95, 4.5], p1: [0.5, 0.85, 4.35], l0: [-0.2, 0.25, 3.3], l1: [0.4, 0.25, 3.3], fov: 38 },
  { id: "03-wake", from: 165, to: 270, p0: [0.5, 0.55, 5.3], p1: [0.2, 1.2, 6.5], l0: [0.1, 0.95, 0], l1: [0, 1.4, 0], fov: 44 },
  { id: "04-rail", from: 270, to: 360, p0: y([-1.0, 1.75, 4.1]), p1: y([-1.25, 1.7, 3.5]), l0: y([-1.2, 1.7, 0]), l1: y([-1.3, 1.65, 0]), fov: 36 },
  { id: "05-type-a", from: 360, to: 430, p0: y([-0.9, 0.85, 3.2]), p1: y([-0.75, 0.8, 2.85]), l0: y([-0.75, 0.62, 0]), l1: y([-0.65, 0.6, 0]), fov: 34 },
  { id: "06-keys", from: 430, to: 472, p0: [-0.5, 0.62, 4.25], p1: [-0.1, 0.57, 4.15], l0: [0.0, 0.25, 3.3], l1: [0.3, 0.25, 3.3], fov: 34 },
  { id: "07-type-b", from: 472, to: 510, p0: y([-0.6, 0.8, 2.8]), p1: y([-0.5, 0.76, 2.6]), l0: y([-0.6, 0.6, 0]), l1: y([-0.55, 0.58, 0]), fov: 34 },
  { id: "08-return", from: 510, to: 555, p0: [RET[0] + 0.75, 0.55, RET[2] + 0.75], p1: [RET[0] + 0.5, 0.47, RET[2] + 0.65], l0: [RET[0], 0.28, RET[2]], l1: [RET[0], 0.26, RET[2]], fov: 30 },
  { id: "09-made", from: 555, to: 690, p0: y([-3.4, 1.2, 4.6]), p1: y([-1.0, 1.5, 5.4]), l0: y([-0.3, 1.5, 0]), l1: y([0.1, 1.5, 0]), fov: 40 },
  { id: "10-slider", from: 690, to: 770, p0: y([1.0, 2.25, 3.2]), p1: y([1.35, 2.2, 2.7]), l0: y([1.1, 2.1, 0]), l1: y([1.3, 2.08, 0]), fov: 32 },
  { id: "11-sun", from: 770, to: 840, p0: [3.4, 0.35, 6.0], p1: [2.9, 0.45, 5.4], l0: [-0.4, 1.9, 0], l1: [-0.5, 2.2, -1], fov: 46 },
  { id: "12-swatch", from: 840, to: 905, p0: y([1.2, 1.7, 2.9]), p1: y([1.35, 1.66, 2.5]), l0: y([1.25, 1.55, 0]), l1: y([1.3, 1.53, 0]), fov: 32 },
  { id: "13-water", from: 905, to: 975, p0: [-2.6, 0.22, 6.4], p1: [-2.0, 0.3, 5.6], l0: [0.2, 0.8, 0], l1: [0.1, 1.0, 0], fov: 44 },
  { id: "14-drag", from: 975, to: 1040, p0: y([-0.75, 1.75, 3.5]), p1: y([-0.7, 1.9, 3.1]), l0: y([-0.7, 1.7, 0]), l1: y([-0.68, 1.85, 0]), fov: 34 },
  { id: "15-canopy", from: 1040, to: 1110, p0: [4.6, 0.5, 5.6], p1: [4.1, 0.6, 5.0], l0: [-1, 4.2, -4], l1: [-1, 4.8, -4.5], fov: 56 },
  { id: "16-scrub", from: 1110, to: 1190, p0: y([-0.8, 0.95, 3.9]), p1: y([0.2, 0.9, 3.6]), l0: y([-0.6, 0.85, 0]), l1: y([0.3, 0.85, 0]), fov: 36 },
  { id: "17-pull", from: 1190, to: 1380, p0: [0.1, 1.2, 3.4], p1: [-0.5, 1.8, 7.0], l0: [0, 1.3, 0], l1: [-0.3, 1.8, 0], fov: 42 },
  { id: "18-end", from: 1380, to: END, p0: [-0.5, 1.8, 7.0], p1: [-0.72, 1.87, 7.45], l0: [-0.3, 1.8, 0], l1: [-0.4, 1.85, 0], fov: 42 },
];
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.from && f < s.to) ?? SHOTS[SHOTS.length - 1];
export const camAt = (f: number) => {
  const s = shotAt(f);
  const t = (f - s.from) / (s.to - s.from); // linear: the camera never eases to a stop inside a shot
  return { shot: s, pos: lerp3(s.p0, s.p1, t), look: lerp3(s.l0, s.l1, t), fov: (s.fov * Math.PI) / 180 };
};

// ---- where the app's controls are on the page (points). The screen's take overwrites these with the real rects. ----
export const UI = {
  newProject: [54, 340] as [number, number],
  chatWait: [976, 837] as [number, number],
  slider: { x0: 1037, x1: 1537, y: 187 },
  swatch: [1350, 412] as [number, number],
  card: [1287, 250] as [number, number],
  tree: { x: 525, y0: 341, y1: 166 },
  timeline: { x0: 150, x1: 1450, y: 835 },
};
export function setPage(w: number, h: number, ui: Partial<typeof UI>) {
  PW = w;
  PH = h;
  Object.assign(UI, ui);
}

// ---- the robot's path: [frame, place]. Its tip is the pointer's hot spot. ----
const SEAT: V3 = [1.3, MON[1] + SH / 2 + 0.2, 0.02];
export function robotPath(): [number, V3][] {
  const WK = keyWorld("space"), R = keyWorld("return");
  const S = UI.slider, TR = UI.tree, TL = UI.timeline;
  const press = 0.03, hover = 0.2;
  return [
    [0, [-5.2, 0.7, 6.2]],
    [80, [0.2, 0.55, 4.6]],
    [100, [-0.7, 0.8, 3.6]],
    [150, [WK[0], WK[1] + 0.12, WK[2]]],
    [T.wakeBump, [WK[0], WK[1] - 0.012, WK[2]]],
    [175, [WK[0] + 0.1, WK[1] + 0.25, WK[2]]],
    [262, onScreen(0.3, 0.45, 0.6)],
    [316, px(...UI.newProject, hover)],
    [T.newTap, px(...UI.newProject, press)],
    [330, px(...UI.newProject, hover)],
    [362, px(...UI.chatWait, hover)],
    [508, px(...UI.chatWait, hover)],
    [522, [R[0] + 0.15, R[1] + 0.6, R[2] + 0.1]],
    [T.returnHit, [R[0], R[1] - 0.012, R[2]]],
    [550, [R[0] + 0.1, R[1] + 0.3, R[2]]],
    [610, onScreen(0.45, 0.5, 0.5)],
    [668, onScreen(0.55, 0.4, 0.5)],
    [T.sunFrom - 7, px(S.x0, S.y, hover)],
    [T.sunFrom, px(S.x0, S.y, press)],
    [T.sunTo, px(S.x1, S.y, press)],
    [T.sunTo + 10, px(S.x1, S.y, hover)],
    [T.pick - 6, px(...UI.swatch, hover)],
    [T.pick, px(...UI.swatch, press)],
    [T.pick + 8, px(...UI.swatch, hover)],
    [T.open - 6, px(...UI.card, hover)],
    [T.open - 2, px(...UI.card, press)],
    [T.growFrom - 5, px(TR.x, TR.y0, hover)],
    [T.growFrom, px(TR.x, TR.y0, press)],
    [T.growTo, px(TR.x, TR.y1, press)],
    [T.growTo + 10, px(TR.x, TR.y1, hover)],
    [T.scrubFrom - 6, px(lerp(TL.x0, TL.x1, 0.2), TL.y, hover)],
    [T.scrubFrom, px(lerp(TL.x0, TL.x1, 0.2), TL.y, press)],
    [T.scrubTo, px(lerp(TL.x0, TL.x1, 0.9), TL.y, press)],
    [1215, px(lerp(TL.x0, TL.x1, 0.94), TL.y - 250, 0.6)],
    [1375, onScreen(0.86, 0.1, 0.6)],
    [T.seat, SEAT],
    [END, SEAT],
  ];
}
export const robotAt = (f: number, path: [number, V3][]): V3 => {
  let i = 0;
  while (i < path.length - 2 && f >= path[i + 1][0]) i++;
  const [f0, a] = path[i], [f1, b] = path[i + 1];
  const p = lerp3(a, b, interpolate(f, [f0, f1], [0, 1], { ...clamp, easing: ease }));
  const settle = interpolate(f, [T.seat - 25, T.seat], [1, 0], clamp);
  return [p[0], p[1] + Math.sin(f / 7) * 0.02 * settle, p[2]];
};
/** 0: tip up-left, as a pointer on the glass; 1: nose down, over the keys */
export const noseAt = (f: number) =>
  Math.max(interpolate(f, [95, 115, 172, 200], [0, 1, 1, 0], clamp), interpolate(f, [508, 522, 544, 560], [0, 1, 1, 0], clamp));
export const spinAt = (f: number) => interpolate(f, [T.scrubTo + 4, T.scrubTo + 28], [0, Math.PI * 2], { ...clamp, easing: ease });
// ---- v4, the wake: the robot turns its face (its lens) to the glass as it flies in, looks it over, and turns back to
// be the pointer (03b-lens watches its lens from beside the glass) ----
/** v4, the ground opening: how hard the ground shakes (0..1.5). It starts faint at T.tremor, builds in surges to the
 *  blast, kicks at it, settles, kicks again as the beam fires, and hums on under the beam */
export const tremorAt = (f: number) => {
  if (f < T.tremor || f > T.orbit) return 0;
  const build = interpolate(f, [T.tremor, T.crack, T.blast - 8, T.blast - 1], [0.12, 0.3, 0.75, 1], clamp);
  const surge = 1 + 0.35 * Math.max(0, Math.sin((f - T.tremor) * 0.42));
  const kick = interpolate(f, [T.blast - 1, T.blast, T.blast + 14], [0, 1.5, 0], clamp) + interpolate(f, [T.beam - 1, T.beam, T.beam + 12], [0, 1.1, 0], clamp);
  const hum = f >= T.blast ? interpolate(f, [T.blast, T.blast + 14, T.beam, T.beam + 12], [1, 0.2, 0.2, 0.3], clamp) : 0;
  return f < T.blast ? Math.min(1.2, build * surge) : kick + hum;
};
/** a smooth shake, -1..1, its own for each seed: a rumble of 4 and 8 Hz (v4: slower than v3's 9 and 16, which jumped
 *  anywhere frame to frame and smeared the whole picture under the motion blur) */
export const shakeAt = (f: number, seed: number) => Math.sin(f * 0.9 + seed * 2.1) * 0.6 + Math.sin(f * 1.6 + seed * 5.7) * 0.4;

// v5: it holds its face to the glass to the end of 03b-lens and is turned back on the cut, so the lens never swings away
// on screen (the director: keep the eye this direction)
export const LOOK = { turnFrom: 214, turnTo: 234, scanFrom: 240, focus: 246, backFrom: 269.5, backTo: 270 };
/** its yaw away from the pointer's pose: a half turn to face the glass and back, with a small scan across the screen */
export const faceAt = (f: number) => {
  const turn = interpolate(f, [LOOK.turnFrom, LOOK.turnTo, LOOK.backFrom, LOOK.backTo], [0, Math.PI, Math.PI, 0], { ...clamp, easing: ease });
  const scan = interpolate(f, [LOOK.scanFrom, LOOK.scanFrom + 4, LOOK.backFrom - 2, LOOK.backFrom], [0, 1, 1, 0], clamp);
  return turn + 0.14 * scan * Math.sin((f - LOOK.scanFrom) / 3.2);
};
/** its iris as it looks: opening wide as it faces the glass, stopping down (with a small overshoot) as it focuses */
export const irisAt = (f: number) => ({
  size: interpolate(f, [LOOK.turnTo - 6, LOOK.scanFrom, LOOK.focus - 2, LOOK.focus + 2, LOOK.focus + 6, LOOK.backTo], [1, 1.75, 1.75, 0.62, 0.85, 1], clamp),
  glow: interpolate(f, [LOOK.turnTo - 6, LOOK.scanFrom, LOOK.focus, LOOK.focus + 4, LOOK.backTo], [1, 1.2, 1.2, 2.2, 1], clamp),
});

// ---- moments that make a ring on the water (frame, x, z) ----
export const RINGS: [number, number, number][] = [
  // (v5: the robot's ring as it skimmed in, frame 30, is a wake now: world.tsx Wake)
  [T.wakeBump + 2, 0.4, 2.2],
  [T.newTap, -1.6, 0.9],
  [T.returnHit + 1, 1.2, 2.3],
  [T.pick, 1.2, 0.9],
  [T.open - 2, 1.0, 0.9],
  // (v5, note 2: the pulse's ring at the monitor's foot is gone with its rings of light: pulse.tsx)
  [T.fishOut, -1.42, 5.06], // v4: the fish out (13-water, fish.tsx FISH_OUT)
  [T.fishIn, -0.86, 5.0], // and back in (FISH_IN)
];
