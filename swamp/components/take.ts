// The film's clock against the real app take: which captured state the glass shows at each frame, where the robot (the
// pointer) is, and the cameras. The pointer's places are the take's own (assets/app-take/states.json).
import { interpolate } from "raea";
import { STATES } from "./app-states";
import { BEAM_AT } from "./groundbeam";
import { END, MON, SH, T, type V3, clamp, duskAt, ease, faceAt, growAt, keyWorld, lerp, lerp3, onScreen, px, spinAt, sunAt, noted, typed, shakeAt, tremorAt } from "./timeline";

/** a state by name; one the take doesn't have yet shows the open item */
const st = (n: string) => STATES[n] ?? STATES["230-item-open"];
const pad = (n: number, w: number) => String(n).padStart(w, "0");

/** the note's states, as the take named them */
export const N = {
  tool: "231-comment-hover",
  pin: "232-pin",
  note: (i: number) => `233-note-${pad(i, 2)}`,
  pen: "234-pen",
  draw: (i: number) => `235-draw-${pad(i, 2)}`,
  drawn: "236-drawn",
  field: "236b-field",
  posted: "237-posted",
  sendHover: "237-send-hover",
  sent: "238-sent",
  working: "239a-working",
  v2: "239b-v2",
  done: "239c-done",
  cardHover: "239d-card-hover",
  v2Open: "239e-v2-open",
  compareHover: "239f-compare-hover",
  compare: "239g-compare",
  wipe: (i: number) => `239h-wipe-${pad(i, 2)}`,
  wiped: "239i-wipe-released",
};
const WIPE_STEPS = 8;
const wipeStep = (f: number) => Math.round(interpolate(f, [T.wipeFrom, T.wipeTo], [0, WIPE_STEPS], clamp));
/** [frame, state]: the glass shows the state from that frame on */
export const SCHEDULE: [number, string][] = [
  [T.wake, "010-empty"],
  [302, "020-new-project-hover"],
  [T.newTap, "030-new-project-dialog"],
  [328, "040-name-01"], [332, "040-name-02"], [336, "040-name-03"], [340, "040-name-04"], [344, "040-name-05"],
  [352, "050-make-project-hover"],
  [T.made, "060-project-open"],
  [364, "type-00"],
  [T.sent, "080-sent"],
  [T.agent, "090-planned"],
  [588, "100-tasks-tab-hover"],
  [T.task0, "110-tasks-0"],
  [608, "121-tasks-1"], [618, "122-tasks-1-open"], [628, "123-tasks-2"], [638, "124-tasks-3"], [646, "125-tasks-4"], [652, "130-replied"],
  [656, "140-feed-tab-hover"],
  [T.card, "150-feed-item"],
  [692, "160-controllers-tab-hover"],
  [T.controls, "170-controllers"],
  [T.sunFrom - 7, "180-sun-000"],
  [T.sunTo + 6, "180-sun-released"],
  [T.pick - 16, "190-colour-before"],
  [T.pick - 7, "191-colour-teal-hover"],
  [T.pick, "192-colour-teal"],
  [T.growFrom - 7, "200-canopy-000"],
  [T.growTo + 6, "200-canopy-released"],
  [941, "210-feed-again"],
  [952, "220-feed-card-hover"],
  [T.open, "230-item-open"],
  // the note: a pin on the picture, its words, a loop drawn round the place, sent; the agent's answer
  [T.pin - 12, N.tool],
  [T.pin, N.pin],
  [T.drawFrom - 10, N.pen],
  [T.drawTo + 4, N.drawn],
  [T.field, N.field],
  [T.posted, N.posted],
  [T.send - 6, N.sendHover],
  [T.send, N.sent],
  [T.working, N.working],
  [T.v2, N.v2],
  [T.v2 + 8, N.done],
  [T.cardOpen - 10, N.cardHover],
  [T.cardOpen, N.v2Open],
  [T.compare - 10, N.compareHover],
  [T.compare, N.compare],
  [T.wipeTo + 2, N.wiped],
  [T.scrubFrom - 6, "240-playhead-20"],
  [T.scrubTo + 4, "241-playhead-released"],
  [T.scrubTo + 12, "250-play-hover"],
  [T.scrubTo + 18, "251-playing"],
  // the send: Share, its Review link panel, the title, Create link
  [T.back - 12, "252b-before-share"],
  [T.shareHover, "253-share-hover"],
  [T.share, "254-share-open"],
  [T.titleFocus, "255-title-focus"],
  [T.createHover, "257-create-hover"],
  [T.create, "258-shared"],
];
const DRAW_STEPS = 13;
/** how many of the title's 20 typed characters (", for the mothership") are in */
const titled = (f: number) => Math.max(1, Math.round(interpolate(f, [T.titleFrom, T.titleTo], [1, 20], clamp)));
const drawStep = (f: number) => Math.round(interpolate(f, [T.drawFrom, T.drawTo], [0, DRAW_STEPS], clamp));
/** the state on the glass at a frame (null before it wakes) */
export const stateAt = (f: number): string | null => {
  if (f < T.wake) return null;
  if (f >= 364 && f < T.sent) return `type-${pad(typed(f), 2)}`;
  if (f >= T.sunFrom && f < T.sunTo + 6) return `180-sun-${pad(Math.round(sunAt(f) * 10) * 10, 3)}`;
  if (f >= T.growFrom && f < T.growTo + 6) return `200-canopy-${pad(Math.round(growAt(f) * 10) * 10, 3)}`;
  if (f >= T.noteFrom && f < T.drawFrom - 10) return N.note(noted(f));
  if (f >= T.drawFrom && f < T.drawTo + 4) return N.draw(drawStep(f));
  if (f >= T.wipeFrom && f < T.wipeTo + 2) return wipeStep(f) === 0 ? N.compare : N.wipe(wipeStep(f));
  if (f >= T.scrubFrom && f < T.scrubTo + 4) return `240-playhead-${20 + 7 * Math.round(duskAt(f) * 10)}`;
  if (f >= T.titleFrom && f < T.createHover) return `256-title-${pad(titled(f), 2)}`;
  let s = SCHEDULE[0][1];
  for (const [at, name] of SCHEDULE) if (f >= at) s = name;
  return s;
};

// ---- the pointer on the page: where the take had it, moving to each new place over the frames just before ----
const MOVE = 16;
/** the share link's Copy button on the page (258-shared.png: the button spans 1505-1573 x 149-177) */
const COPY_AT: [number, number] = [1538.5, 163];
const KEYS2D: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  let prev = st(SCHEDULE[0][1]).pointer;
  out.push([262, prev[0], prev[1]]);
  let last = 262;
  for (const [at, name] of SCHEDULE.slice(1)) {
    if (name === N.compare) continue;
    const p = st(name).pointer;
    if (p[0] === prev[0] && p[1] === prev[1]) continue;
    const start = Math.max(last + 1, at - MOVE);
    out.push([start, prev[0], prev[1]], [at, p[0], p[1]]);
    prev = p;
    last = at;
  }
  // the three drags, along their tracks
  const sun0 = st("180-sun-000").pointer, sun1 = st("180-sun-100").pointer;
  const can0 = st("200-canopy-000").pointer, can1 = st("200-canopy-100").pointer;
  const ph0 = st("240-playhead-20").pointer, ph1 = st("240-playhead-90").pointer;
  void sun0, sun1, can0, can1, ph0, ph1;
  // v5 (note 7): the link made, it goes on to the link's Copy (the captured panel's button, its centre at 1538.5, 163)
  const made = st("258-shared").pointer;
  out.push([T.copy - 14, made[0], made[1]], [T.copy - 2, COPY_AT[0], COPY_AT[1]]);
  return out.sort((a, b) => a[0] - b[0]);
})();
export const pointerAt = (f: number): [number, number] => {
  const drag = (a: string, b: string, t: number): [number, number] => [lerp(st(a).pointer[0], st(b).pointer[0], t), lerp(st(a).pointer[1], st(b).pointer[1], t)];
  if (f >= T.sunFrom && f <= T.sunTo) return drag("180-sun-000", "180-sun-100", sunAt(f));
  if (f >= T.growFrom && f <= T.growTo) return drag("200-canopy-000", "200-canopy-100", growAt(f));
  if (f >= T.scrubFrom && f <= T.scrubTo) return drag("240-playhead-20", "240-playhead-90", duskAt(f));
  if (f > T.compare && f < T.wipeFrom) return drag(N.compareHover, N.compare, interpolate(f, [T.compare + 2, T.wipeFrom], [0, 1], { ...clamp, easing: ease }));
  if (f >= T.wipeFrom && f <= T.wipeTo) {
    const t = interpolate(f, [T.wipeFrom, T.wipeTo], [0, WIPE_STEPS], clamp), i = Math.min(WIPE_STEPS - 1, Math.floor(t));
    return drag(i === 0 ? N.compare : N.wipe(i), N.wipe(i + 1), t - i);
  }
  if (f >= T.drawFrom && f <= T.drawTo) {
    // along the loop, step to step
    const t = interpolate(f, [T.drawFrom, T.drawTo], [0, DRAW_STEPS], clamp), i = Math.min(DRAW_STEPS - 1, Math.floor(t));
    return drag(N.draw(i), N.draw(i + 1), t - i);
  }
  let i = 0;
  while (i < KEYS2D.length - 2 && f >= KEYS2D[i + 1][0]) i++;
  const a = KEYS2D[i], b = KEYS2D[i + 1];
  const t = interpolate(f, [a[0], b[0]], [0, 1], { ...clamp, easing: ease });
  return [lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
};
/** frames the pointer is pressed: single clicks, and the three drags held */
const CLICKS = [T.newTap, T.made, 364, T.task0, 618, T.card, T.controls, T.pick, 941, T.open, T.pin - 12, T.pin, T.drawFrom - 8, T.field, T.send, T.cardOpen, T.compare, T.scrubTo + 18, T.share, T.titleFocus, T.create, T.copy];
const HELD: [number, number][] = [[T.sunFrom, T.sunTo], [T.growFrom, T.growTo], [T.scrubFrom, T.scrubTo], [T.drawFrom, T.drawTo], [T.wipeFrom, T.wipeTo]];
/** how far in front of the glass the robot's tip is, metres */
export const outAt = (f: number) => {
  let press = 0;
  for (const c of CLICKS) press = Math.max(press, interpolate(f, [c - 4, c, c + 2, c + 7], [0, 1, 1, 0], clamp));
  for (const [a, b] of HELD) press = Math.max(press, interpolate(f, [a - 5, a, b, b + 6], [0, 1, 1, 0], clamp));
  // once it plays, the robot backs off to watch, and comes back to the glass to send it
  const far = interpolate(f, [T.scrubTo + 24, T.scrubTo + 50, T.back - 26, T.back], [0, 1, 1, 0], clamp);
  // sent, it backs off from the glass again, out over the water to look down at what opens there
  // (v5: from the press on Copy, as 24-send cuts away; v4 left from Create link)
  const gone = interpolate(f, [T.copy + 3, T.crack + 10], [0, 1], { ...clamp, easing: ease });
  return lerp(lerp(lerp(0.2, 0.035, press), 0.75, far), 1.6, gone);
};

// ---- the robot off the glass: its entrance and the first key, the Return key, the seat on the bezel ----
const keyed = (keys: [number, V3][], f: number): V3 => {
  let i = 0;
  while (i < keys.length - 2 && f >= keys[i + 1][0]) i++;
  const [f0, a] = keys[i], [f1, b] = keys[i + 1];
  return lerp3(a, b, interpolate(f, [f0, f1], [0, 1], { ...clamp, easing: ease }));
};
export const SEAT: V3 = [1.3, MON[1] + SH / 2 + 0.2, 0.02];
export const robotAt2 = (f: number): V3 => {
  const WK = keyWorld("space"), R = keyWorld("return");
  const p2 = pointerAt(Math.max(f, 262));
  let p = px(p2[0], p2[1], outAt(f));
  // in: across the water, down onto the space bar, up to the glass as it lights
  // after the bump it lifts straight off the key and only turns tip-up once its body (0.44 m below the tip) clears the
  // keycaps: checked frame by frame in scripts/robot_clear.py
  const intro: [number, V3][] = [[0, [-5.2, 0.7, 6.2]], [80, [0.2, 0.55, 4.6]], [100, [-0.7, 0.8, 3.6]], [150, [WK[0], WK[1] + 0.12, WK[2]]], [T.wakeBump, [WK[0], WK[1] - 0.012, WK[2]]], [180, [WK[0] + 0.06, WK[1] + 0.42, WK[2] - 0.05]], [204, [WK[0] + 0.02, WK[1] + 0.68, WK[2] - 0.45]], [262, onScreen(0.5, 0.62, 0.5)]];
  if (f < 262) p = keyed(intro, f);
  // v5: it holds where it came to rest, half a metre off the glass with its face to it, to the cut (270: v4 snapped it
  // to the glass at 262, edge-on to 03b's lens), and settles in to the glass under 04-rail before its first move (286)
  else if (f < 288) p = lerp3(intro[intro.length - 1][1], p, interpolate(f, [270, 288], [0, 1], { ...clamp, easing: ease }));
  // the Return key: off the glass, a wind-up, the hit, and back
  const dive: [number, V3][] = [[506, p], [521, [R[0] + 0.15, R[1] + 0.62, R[2] + 0.1]], [T.returnHit, [R[0], R[1] - 0.012, R[2]]], [548, [R[0] + 0.1, R[1] + 0.34, R[2]]], [582, p]];
  if (f > 506 && f < 582) p = keyed(dive, f);
  // v3 has no seat on the bezel: after the send it hangs off the glass, sinking a little as the ground opens
  const sink = interpolate(f, [T.copy + 3, T.crack + 20], [0, 1], { ...clamp, easing: ease });
  p = [p[0] - 0.35 * sink, p[1] - 0.3 * sink, p[2]];
  const bob = Math.sin(f / 7) * 0.02;
  return [p[0], p[1] + bob, p[2]];
};
/** the robot's lens in the world (robot.tsx EYE, its glass's face): turned with its yaw; its lean is left out */
const LENS_LOCAL: V3 = [0.108, -0.195, 0.05];
export const lensAt = (f: number): V3 => {
  const r = robotAt2(f), a = spinAt(f) + faceAt(f);
  const [x, y, z] = LENS_LOCAL;
  return [r[0] + x * Math.cos(a) + z * Math.sin(a), r[1] + y, r[2] - x * Math.sin(a) + z * Math.cos(a)];
};
/** 0: tip up-left, as a pointer on the glass; 1: nose down, over the keys */
export const noseAt2 = (f: number) => Math.max(interpolate(f, [95, 115, 180, 206], [0, 1, 1, 0], clamp), interpolate(f, [508, 521, 546, 562], [0, 1, 1, 0], clamp));

// ---- cameras: one shot a row, each already moving at its start and still moving at its end ----
export type Shot2 = { id: string; from: number; to: number; p0: V3; p1: V3; l0: V3; l1: V3; fov: number; /** depth of field: the f-stop, and what the lens is focused on, metres from it at the shot's start and end */ stop?: number; focus?: [number, number]; /** the camera speeds up through the shot (it starts moving, never from a stop) */ rise?: boolean; /** it looks at (and focuses on) the robot's lens, wherever it is */ track?: "lens"; /** and turns round the axis its look travels up, radians over the shot */ spin?: number; /** it shakes with the ground (tremorAt), metres at full tremor */ shake?: number; /** v5: a second framing, moving over the same shot, that the camera goes over to between frames `from` and `to` (smoothly; both framings keep moving, so it never stops) */ then?: { from: number; to: number; p0: V3; p1: V3; l0: V3; l1: V3; fov: number }; /** v5: the near clip plane (m), for the whole shot: nothing nearer the lens than that is drawn (a video render keeps the shot's first frame's, so it can't change in a shot) */ near?: number };
const RET = keyWorld("return");
const at = (name: string, out = 0): V3 => px(st(name).pointer[0], st(name).pointer[1], out);
const SHARE = at("253-share-hover"), CREATE = at("257-create-hover");
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const SUN0 = at("180-sun-000"), SUN1 = at("180-sun-100"), TEAL = at("192-colour-teal"), CAN0 = at("200-canopy-000"), CAN1 = at("200-canopy-100"), PH0 = at("240-playhead-20"), PH1 = at("240-playhead-90"), TYPE = px(330, 772), NEWP = at("020-new-project-hover"), DLG = px(800, 300), SENT = px(720, 75), TASKS = px(1370, 217), TOOL = px(150, 431), PIN = at(N.pin), LOOP = px(640, 640), WIPE = px(832, 408);
/** v5: the cut into the Comment tool, on the robot's move to it (it leaves the open item at 972 and picks the tool at 988) */
export const CUT_TOOL = 981;
export const SHOTS2: Shot2[] = [
  { id: "01-water", from: 0, to: 90, p0: [-3.6, 0.38, 9.6], p1: [-2.9, 0.46, 7.8], l0: [0.6, 1.3, 0], l1: [0.5, 1.35, 0], fov: 40 },
  { id: "02-key", from: 90, to: 165, p0: [-0.7, 0.95, 4.5], p1: [0.5, 0.85, 4.35], l0: [-0.2, 0.25, 3.3], l1: [0.4, 0.25, 3.3], fov: 38, stop: 2.8, focus: [1.45, 1.25] },
  { id: "03-wake", from: 165, to: 240, p0: [0.5, 0.5, 5.4], p1: [0.2, 1.05, 6.6], l0: [0.1, 0.95, 0], l1: [0, 1.3, 0], fov: 44 },
  // v4: close on its lens from beside the glass as it flies in looking at the screen, focuses, and turns back to be the pointer
  { id: "03b-lens", from: 240, to: 270, p0: [0.5, 0.93, 0.25], p1: [0.68, 0.92, 0.2], l0: [0, 0.85, 1], l1: [0, 0.85, 0.5], fov: 24, stop: 2.2, track: "lens" },
  { id: "04-rail", from: 270, to: 326, p0: [NEWP[0] + 0.5, NEWP[1] + 0.1, 3.2], p1: [-0.35, 1.6, 3.6], l0: [NEWP[0] + 0.45, NEWP[1] - 0.1, 0], l1: [-0.1, 1.6, 0], fov: 34 },
  // v4: close on the New project dialog as it's named and made, so what a project is reads
  { id: "04b-dialog", from: 326, to: 360, p0: add(DLG, [0.34, -0.06, 2.2]), p1: add(DLG, [0.2, -0.04, 1.85]), l0: add(DLG, [0.04, 0, 0]), l1: DLG, fov: 30 },
  { id: "05-type-a", from: 360, to: 430, p0: [TYPE[0] + 0.15, TYPE[1] + 0.2, 1.75], p1: [TYPE[0] + 0.3, TYPE[1] + 0.16, 1.5], l0: [TYPE[0] + 0.2, TYPE[1] + 0.02, 0], l1: [TYPE[0] + 0.32, TYPE[1] + 0.02, 0], fov: 28 },
  { id: "06-keys", from: 430, to: 472, p0: [-0.5, 0.62, 4.25], p1: [-0.1, 0.57, 4.15], l0: [0.0, 0.25, 3.3], l1: [0.3, 0.25, 3.3], fov: 34, stop: 2.8, focus: [1.05, 0.95] },
  { id: "07-type-b", from: 472, to: 510, p0: [TYPE[0] + 0.4, TYPE[1] + 0.15, 1.45], p1: [TYPE[0] + 0.5, TYPE[1] + 0.12, 1.3], l0: [TYPE[0] + 0.4, TYPE[1] + 0.02, 0], l1: [TYPE[0] + 0.48, TYPE[1] + 0.02, 0], fov: 28 },
  { id: "08-return", from: 510, to: 538, p0: [RET[0] + 0.75, 0.55, RET[2] + 0.75], p1: [RET[0] + 0.5, 0.47, RET[2] + 0.65], l0: [RET[0], 0.28, RET[2]], l1: [RET[0], 0.26, RET[2]], fov: 30, stop: 2.8, focus: [1.08, 0.85] },
  // v4: what the Return did: the line lands in the chat, then a pulse of light runs out over the dead swamp
  { id: "08b-sent", from: 538, to: T.pulse, p0: add(SENT, [0.26, -0.08, 1.6]), p1: add(SENT, [0.14, -0.05, 1.35]), l0: add(SENT, [0.04, 0, 0]), l1: SENT, fov: 30 },
  { id: "08c-pulse", from: T.pulse, to: 596, p0: [-2.5, 0.42, 8.3], p1: [-2.1, 0.5, 7.6], l0: [0.25, 0.9, 0], l1: [0.2, 1.0, 0], fov: 42 },
  // v4: close on the agent's tasks as they tick
  { id: "09-tasks", from: 596, to: 658, p0: add(TASKS, [-0.36, -0.06, 1.9]), p1: add(TASKS, [-0.22, -0.04, 1.6]), l0: add(TASKS, [-0.04, 0, 0]), l1: TASKS, fov: 28 },
  { id: "09-made", from: 658, to: 690, p0: [-1.469, 1.279, 5.01], p1: [-0.9, 1.35, 5.2], l0: [0.081, 1.35, 0], l1: [0.2, 1.35, 0], fov: 38 },
  { id: "10-slider", from: 690, to: 740, p0: [SUN0[0] - 0.2, SUN0[1] + 0.12, 1.75], p1: [SUN0[0] + 0.1, SUN0[1] + 0.08, 1.5], l0: [SUN0[0] - 0.05, SUN0[1], 0], l1: [lerp(SUN0[0], SUN1[0], 0.4), SUN0[1], 0], fov: 30 },
  { id: "11-sun", from: 740, to: 790, p0: [3.4, 0.35, 6.0], p1: [3.0, 0.43, 5.5], l0: [-0.6, 1.9, 0], l1: [-0.8, 2.3, -1], fov: 44 },
  { id: "12-swatch", from: 790, to: 822, p0: [TEAL[0] - 0.22, TEAL[1] + 0.12, 1.65], p1: [TEAL[0] - 0.08, TEAL[1] + 0.09, 1.4], l0: [TEAL[0] - 0.18, TEAL[1], 0], l1: [TEAL[0] - 0.07, TEAL[1], 0], fov: 30 },
  { id: "13-water", from: 822, to: 864, p0: [-2.6, 0.22, 6.6], p1: [-2.2, 0.27, 6.1], l0: [0.2, 0.8, 0], l1: [0.1, 0.95, 0], fov: 44 },
  { id: "14-canopy", from: 864, to: 896, p0: [CAN0[0] - 0.2, CAN0[1] + 0.05, 1.7], p1: [CAN0[0] + 0.02, CAN0[1] + 0.03, 1.5], l0: [CAN0[0] - 0.05, CAN0[1] - 0.05, 0], l1: [lerp(CAN0[0], CAN1[0], 0.35), CAN0[1] - 0.05, 0], fov: 30 },
  { id: "15-leaves", from: 896, to: 940, p0: [4.4, 0.5, 6.4], p1: [4.05, 0.57, 6.0], l0: [-1, 4.4, -4], l1: [-1, 4.9, -4.4], fov: 54 },
  // the note: the item opens, a pin and its words, a loop drawn on the frame, the answer
  // v5 (note 5): held wide through the open and on as the robot sets off across the glass for the Comment tool (972-988),
  // cut on its move (981), the camera's drift kept at v4's speed
  { id: "16-open", from: 940, to: CUT_TOOL, p0: [1.5, 1.5, 4.3], p1: [0.77, 1.43, 3.42], l0: [0.3, 1.3, 0], l1: [0.01, 1.3, 0], fov: 38 },
  // v5: one close shot from the robot's arrival at the Comment tool to the pin and the note's words: on the item's rail as
  // it comes in from the right and picks the tool (988), then after it across the picture to the pin (989-1000), a beat
  // behind, and on the pin as the words type (v4 cut from this close to 17-pin as it went)
  { id: "16b-tool", from: CUT_TOOL, to: 1050, p0: add(TOOL, [-0.3, 0.1, 1.28]), p1: add(TOOL, [-0.18, 0.08, 1.1]), l0: add(TOOL, [0.12, 0.0, 0]), l1: add(TOOL, [0.1, 0.0, 0]), fov: 28,
    then: { from: 987, to: 1002, p0: [PIN[0] - 0.45, PIN[1] + 0.24, 1.95], p1: [PIN[0] + 0.05, PIN[1] + 0.14, 1.5], l0: [PIN[0] - 0.1, PIN[1] + 0.05, 0], l1: [PIN[0] + 0.2, PIN[1], 0], fov: 30 } },
  { id: "18-draw", from: 1050, to: 1114, p0: [LOOP[0] + 0.55, LOOP[1] - 0.12, 1.75], p1: [LOOP[0] + 0.3, LOOP[1] - 0.04, 1.5], l0: [LOOP[0] + 0.15, LOOP[1] + 0.05, 0], l1: [LOOP[0] + 0.12, LOOP[1] + 0.06, 0], fov: 32 },
  { id: "19-answer", from: 1114, to: 1166, p0: [-1.3, 1.5, 3.9], p1: [-0.7, 1.45, 3.5], l0: [0.2, 1.3, 0], l1: [0.3, 1.3, 0], fov: 38 },
  // v5 (note 6): held wide on the mist through the compare, the v1/v2 wipe playing on the monitor's screen in it (v4 cut
  // to 21-wipe, a close on the glass, for the wipe); it pushes in faster than v4 did and turns to the monitor, so the wipe
  // reads on the glass while the mist and the swamp stay round it
  { id: "20-mist", from: 1166, to: 1240, p0: [-4.3, 0.5, 10.6], p1: [-2.75, 0.72, 7.7], l0: [0.7, 1.7, 0], l1: [0.25, 1.55, 0], fov: 40 },
  { id: "22-scrub", from: 1240, to: 1320, p0: [PH0[0] - 0.2, 0.8, 2.7], p1: [PH1[0] - 0.4, 0.8, 2.7], l0: [PH0[0], 0.78, 0], l1: [PH1[0] - 0.3, 0.78, 0], fov: 36 },
  { id: "23-pull", from: 1320, to: 1430, p0: [0.1, 1.15, 3.6], p1: [-0.41, 1.59, 6.39], l0: [0, 1.25, 0], l1: [-0.22, 1.65, 0], fov: 42 },
  // v3: the send on the glass, the ground opening, the beam and the camera up it into the sky. v5 (note 7): after Create
  // link the robot goes on to the link's Copy and presses it (T.copy), and the film cuts on the press; the camera ends a
  // little up and right of v4's, so Copy and the robot are in the frame's middle
  { id: "24-send", from: 1430, to: 1520, p0: [SHARE[0] - 0.42, SHARE[1] - 0.36, 1.95], p1: [CREATE[0] + 0.12, CREATE[1] + 0.27, 1.7], l0: [SHARE[0] - 0.3, SHARE[1] - 0.28, 0], l1: [CREATE[0] + 0.16, CREATE[1] + 0.3, 0], fov: 30 },
  // v4: the ground opens. Held on the bank as it shakes, swells and blows open; then a cut low and wide as the beam fires,
  // tilting up it from the pit
  // (from over the water behind the bank, the one side no plant stands between the lens and the pit)
  { id: "25-crack", from: 1520, to: T.beam, p0: [-0.36, 0.93, 1.97], p1: [-0.5, 0.82, 2.1], l0: add(BEAM_AT, [0.06, 0, 0]), l1: add(BEAM_AT, [0.0, 0.1, 0]), fov: 40, shake: 0.012 },
  { id: "25b-beam", from: T.beam, to: T.rise, p0: [-0.22, 0.55, 1.42], p1: [-0.3, 0.5, 1.54], l0: add(BEAM_AT, [0, 0.55, 0]), l1: add(BEAM_AT, [0, 6, 0]), fov: 52, shake: 0.01 },
  // v5: it climbs through a crown at local frames 20-45, and the leaves that brushed the lens flashed huge and pale (v4's
  // check: the canopy flashing at 1644); its near plane is 1.6 m. At its start it looks 30 degrees up from 1.5 m over
  // the bank, so no ground is in view that near, and in view the beam is never nearer than about 3 m
  { id: "26-rise", from: T.rise, to: T.orbit, p0: add(BEAM_AT, [1.9, 1.3, 2.1]), p1: add(BEAM_AT, [1.6, 95, 1.8]), l0: add(BEAM_AT, [0, 2.8, 0]), l1: add(BEAM_AT, [0, 100, 0]), fov: 46, rise: true, spin: 1.6, near: 1.6 },
];
/** v5: 01-water comes up out of the water. The lens (its front glass RISE.r in radius) rises from 7 cm under the
 *  surface, slowly through it (the waterline sweeping down the frame between RISE.under and RISE.out: LensWater,
 *  lenswater.tsx), then gathers speed so it's up at a third of a metre as the robot skims past (40) and settles at the
 *  height v4's shot ended on; the push forward goes on throughout. A smooth curve through keys (frame, height, metres
 *  a frame), monotone. The 3D camera itself is held just over the water until the glass is out: under it, the pass
 *  draws the murk */
const RISE_KEYS: [number, number, number][] = [[0, -0.07, 0.0055], [18, 0.05, 0.011], [40, 0.33, 0.008], [90, 0.48, 0.0008]];
export const riseY = (f: number) => {
  let i = 0;
  while (i < RISE_KEYS.length - 2 && f > RISE_KEYS[i + 1][0]) i++;
  const [f0, y0, m0] = RISE_KEYS[i], [f1, y1, m1] = RISE_KEYS[i + 1];
  const h = f1 - f0, t = Math.max(0, Math.min(1, (f - f0) / h)), t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * m1;
};
const riseAt = (y: number) => {
  let f = 0;
  while (f < 90 && riseY(f) < y) f += 0.05;
  return f;
};
export const RISE = { r: 0.035, under: riseAt(-0.035), out: riseAt(0.035) };
export const shotAt2 = (f: number) => SHOTS2.find((s) => f >= s.from && f < s.to) ?? SHOTS2[SHOTS2.length - 1];
export const camAt2 = (f: number) => {
  const s = shotAt2(f);
  const u = (f - s.from) / (s.to - s.from); // linear: the camera never eases to a stop inside a shot
  const t = s.rise ? 0.12 * u + 0.88 * u ** 3 : u; // or, rising, it gathers speed: moving from its first frame
  let pos = lerp3(s.p0, s.p1, t);
  if (s.id === "01-water") pos = [pos[0], Math.max(0.012, riseY(f)), pos[2]];
  if (s.spin) {
    const a = s.spin * t, dx = pos[0] - s.l0[0], dz = pos[2] - s.l0[2];
    pos = [s.l0[0] + dx * Math.cos(a) - dz * Math.sin(a), pos[1], s.l0[2] + dx * Math.sin(a) + dz * Math.cos(a)];
  }
  if (s.track === "lens") {
    const L = lensAt(f);
    return { shot: s, pos, look: L, fov: (s.fov * Math.PI) / 180, stop: s.stop, focus: Math.hypot(L[0] - pos[0], L[1] - pos[1], L[2] - pos[2]) };
  }
  let look = lerp3(s.l0, s.l1, t);
  let fov = s.fov;
  if (s.then) {
    const k = interpolate(f, [s.then.from, s.then.to], [0, 1], { ...clamp, easing: (x: number) => x * x * (3 - 2 * x) });
    pos = lerp3(pos, lerp3(s.then.p0, s.then.p1, t), k);
    look = lerp3(look, lerp3(s.then.l0, s.then.l1, t), k);
    fov = lerp(s.fov, s.then.fov, k);
  }
  if (s.shake) {
    const k = s.shake * tremorAt(f);
    pos = [pos[0] + k * shakeAt(f, 1), pos[1] + k * shakeAt(f, 2), pos[2] + k * 0.5 * shakeAt(f, 3)];
    look = [look[0] + k * 0.6 * shakeAt(f, 4), look[1] + k * 0.6 * shakeAt(f, 5), look[2]];
  }
  const near = s.near ?? 0.1;
  return { shot: s, pos, look, fov: (fov * Math.PI) / 180, stop: s.stop, focus: s.focus ? lerp(s.focus[0], s.focus[1], t) : undefined, near };
};
