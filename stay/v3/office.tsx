// The office, v3: the film's first 33.77 s. No words, no held frames. The place is a drawing until the cursor touches it.
//   0      black; the office's lines come up out of it, the camera already travelling down the aisle
//   12.19  (the drop) the cursor clicks the middle of the room and the real office spreads out from the click
//   15.01  the cursor takes a chair (the app's pick box round it) and carries it across the aisle
//   18.36  the cursor takes the blinds and draws them open: the others follow, the ceiling lights go out, a low sun comes in
//   27.70  the reverse: the same room from its far end, a drawing again, and the finished room (repainted warm, plants,
//          lamps) arrives as a front that travels away from us; the cursor carries a plant to a desk
//   33.0   the cursor clicks and the drawing spreads back over the frame, for the cut to the canyon's lines
// One dolly for the first 27.7 s, one for the reverse: each a straight line at one speed (v3/cam.ts).
import { ROOM, ROWS, WINDOWS, officeRoom } from "../sets/office-room";
import { camAt, dolly, type Dolly } from "./cam";
import { Carry, Ripple, carried, on, rectOf, type XY } from "./hand";
import type { Look } from "./look";
import { H, W, shot } from "./plan";
import { Scene, type Glow, type Item } from "./scene";
import { reach } from "../v2/path";
import type { V3 } from "../v2/math";
import { Cursor, PickBox } from "../v2/ui";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const ease = (k: number) => k * k * (3 - 2 * k);
const out3 = (k: number) => 1 - (1 - clamp01(k)) ** 3;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export const REV = shot("office-back").from, END = shot("canyon").from, DROP = 12.189;
// the two moves: down the aisle a little left of its middle, the lens turned 12 degrees to the right so the windows
// stand in the right of the frame and the aisle's vanishing point on the left thirds line; then back up it from the far end
export const IN: Dolly = { eye: [-0.9, 1.35, 4.2], yaw: 12, pitch: -1.5, vel: [0, 0, -0.26], fov: 40 };
export const BACK: Dolly = dolly([0.7, 1.55, -16.5], [-0.6, 1.2, 4], [0, 0, 0.5], 42);
const HERO = 2;                                                      // the row whose chair is carried
const CHAIR_A: V3 = [-1.9, 0, ROWS[HERO] + 0.9], CHAIR_B: V3 = [1.7, 0, ROWS[HERO] + 0.75];
const BLIND = 4, BLIND_AT: V3 = [ROOM.x - 0.1, 1.85, WINDOWS[BLIND]];
const PLANT_A: V3 = [0.4, 0, -7.4], PLANT_B: V3 = [-1.55, 0, -5.0];
// what the cursor passes over before the drop: each turns real inside its pick box while the cursor is on it
const HOVER: { at: V3; half: V3; from: number; to: number }[] = [
  { at: [2.45, 0.56, ROWS[1] + 0.1], half: [0.36, 0.56, 0.36], from: 4.6, to: 6.3 },          // a chair on the right
  { at: [3.4, 0.45, ROWS[2]], half: [0.5, 0.45, 1.05], from: 7.1, to: 8.7 },                  // a desk
  { at: [ROOM.x - 0.1, 1.75, WINDOWS[3]], half: [0.05, 0.9, 0.8], from: 9.3, to: 10.8 },      // a window's blinds
];
export const T = { fade: [0.3, 2.6], cursor: 3.6, click: DROP, chair: [15.006, 17.4], blind: [18.361, 19.86], out: [18.86, 20.36], front: [REV + 0.15, REV + 2.9], plant: [REV + 3.1, REV + 4.7], back: 33.0 } as const;
const TUBES = 9000;

export function officeAt(t: number) {
  const rev = t >= REV;
  const cam = rev ? camAt(BACK, t - REV) : camAt(IN, t);
  const pull = ease(ramp(t, T.blind[0], T.blind[1]));                                  // the cursor's draw on the blinds
  const open = (i: number) => ease(ramp(t, T.blind[0] + 0.14 * Math.abs(i - BLIND), T.blind[1] + 0.14 * Math.abs(i - BLIND) + 0.5));
  const day = ease(ramp(t, T.blind[0] + 0.2, T.blind[1] + 1.6));                       // how far the morning is in
  const dark = ramp(t, T.out[0], T.out[1]);
  const tubes = (row: number) => (t > T.out[0] + ((5 - row) / 5) * (T.out[1] - T.out[0]) ? 0 : TUBES);
  const chair = carried(t, CHAIR_A, CHAIR_B, T.chair[0], T.chair[1]);
  const plant = carried(t, PLANT_A, PLANT_B, T.plant[0], T.plant[1], 0.12);
  const items: Item[] = officeRoom(1, { tubes: 0, blinds: (i) => 0.82 * (1 - open(i)), nice: rev, grow: rev ? 1 : 0, hero: HERO }) as Item[];
  items.push({ place: "office", name: "chair-hero", file: "chair", at: chair, yaw: lerp(2.4, 1.3, ramp(t, T.chair[0], T.chair[1])), clip: "swivel", t: 0 });
  items.push({ place: "office", name: "plant-carried", file: "plant", at: rev ? plant : [0, -5, 0] });
  const glows: Glow[] = ROWS.flatMap((z, r) => [-3.4, 0, 3.4].map((cx): Glow => ({ at: [cx, ROOM.h - 0.012, z - 0.4], half: [0.26, 0.004, 0.56], lum: tubes(r), color: [1, 0.98, 0.94] })));
  // the desk lamps, on in the finished room
  for (const p of items) if (p.name.startsWith("lamp-")) glows.push({ at: [p.at[0], p.at[1] + 0.36, p.at[2]], half: [0.035, 0.012, 0.035], lum: rev ? 160000 : 0, color: [1, 0.6, 0.25] });
  // the picture: a drawing that gives way to the real room
  const look: Look = { warm: lerp(-0.5, 1.0, day), sat: lerp(0.8, 1.0, day), contrast: lerp(0.55, 0.7, day) };
  const hover = HOVER.find((h) => t >= h.from && t <= h.to);
  if (!rev) {
    look.base = 1; look.fade = out3(ramp(t, T.fade[0], T.fade[1]));
    if (hover) look.box = rectOf(cam, hover.at, hover.half, 10);
    if (t >= T.click) look.ring = [W * 0.5, H * 0.52, 1250 * ((t - T.click) / 2.6) ** 1.25];
    if (t >= T.click + 2.6) { look.base = 0; look.ring = undefined; }
  } else {
    // the finished room comes up the frame from the floor at our feet to the far wall
    look.base = 1; look.wipe = Math.max(0.0001, ramp(t, T.front[0], T.front[1]));
    if (t >= T.front[1]) { look.base = 0; look.wipe = 0; }
    if (t >= T.back) { look.base = 0; look.ring = [W * 0.5, H * 0.5, 1750 * ((t - T.back) / (END - T.back - 0.07)) ** 1.6]; }
  }
  return {
    cam, items, glows, look, chair, plant, pull, day, rev, hover,
    sun: { lux: 110000 * day, from: [40, 7, 10] as V3, to: [0, 0.8, -6] as V3, color: "#ffb26a" },
    sky: 0.02 + 0.8 * day,
    // exposed for the ceiling lights, opened up as they die, then set for a room with the sun in it
    ev: lerp(lerp(1.3, 3.2, ease(dark)), rev ? 3.3 : 2.9, day),
  };
}

/** the cursor through the take, in frame pixels: null when it is out of the picture */
function Hand({ t, s }: { t: number; s: ReturnType<typeof officeAt> }) {
  const mid: XY = [W * 0.5, H * 0.52];
  if (!s.rev) {
    const blind = on(s.cam, [BLIND_AT[0], BLIND_AT[1] - 0.55 * s.pull, BLIND_AT[2]]);
    if (t < T.cursor) return null;
    if (t < T.chair[0] - 1.0) {
      // it travels from thing to thing, resting on each while that thing shows real, then goes to the middle and clicks
      const stops: { at: XY; from: number; to: number }[] = [...HOVER.map((h) => ({ at: on(s.cam, h.at), from: h.from, to: h.to })), { at: mid, from: T.click - 0.3, to: 99 }];
      let xy: XY = [W * 0.97, H * 0.98], last = T.cursor;
      for (const st of stops) { if (t < st.from) { xy = reach(t, xy, st.at, Math.max(last, st.from - 1.0), st.from); break; } xy = st.at; last = st.to; if (t <= st.to) break; }
      return <><Ripple at={mid} t={t - T.click} />{s.hover && <PickBox cam={s.cam} at={s.hover.at} half={s.hover.half} />}<Cursor x={xy[0]} y={xy[1]} press={Math.abs(t - T.click) < 0.09 ? 1 : 0} /></>;
    }
    if (t < T.chair[1] + 0.8) return <>{Carry({ cam: s.cam, t, from: T.chair[0], to: T.chair[1], a: CHAIR_A, b: CHAIR_B, half: [0.36, 0.56, 0.36], up: 0.56, enter: mid })}</>;
    if (t < T.blind[1] + 1.2) {
      const from = on(s.cam, [CHAIR_B[0], 0.56, CHAIR_B[2]]), b0 = on(s.cam, BLIND_AT);
      const held = t >= T.blind[0] && t <= T.blind[1];
      const xy = t < T.blind[0] ? reach(t, [from[0] + 130, from[1] + 110], b0, T.chair[1] + 0.8, T.blind[0]) : held ? blind : reach(t, blind, [W * 1.04, H * 0.7], T.blind[1] + 0.1, T.blind[1] + 1.2);
      return <><PickBox cam={s.cam} at={[BLIND_AT[0], 1.75, BLIND_AT[2]]} half={[0.05, 0.9, 0.8]} show={t >= T.blind[0] - 0.12 && t <= T.blind[1] + 0.25 ? 1 : 0} /><Cursor x={xy[0]} y={xy[1]} press={held ? 1 : 0} /></>;
    }
    return null;
  }
  if (t < T.back - 1.0) return <>{Carry({ cam: s.cam, t, from: T.plant[0], to: T.plant[1], a: PLANT_A, b: PLANT_B, half: [0.3, 0.5, 0.3], up: 0.5, lift: 0.12, enter: [W * 0.9, H * 1.02] })}</>;
  const mid2: XY = [W * 0.5, H * 0.5], from = on(s.cam, [PLANT_B[0], 0.5, PLANT_B[2]]);
  const xy = reach(t, [from[0] + 130, from[1] + 110], mid2, T.plant[1] + 0.8, T.back - 0.1);
  return <><Ripple at={mid2} t={t - T.back} /><Cursor x={xy[0]} y={xy[1]} press={Math.abs(t - T.back) < 0.09 ? 1 : 0} /></>;
}

export function Office({ t, seed }: { t: number; seed: number }) {
  const s = officeAt(t);
  const mid = (ROOM.z0 + ROOM.z1) / 2, half = (ROOM.z0 - ROOM.z1) / 2;
  return (
    <Scene items={s.items} cam={s.cam} sun={s.sun} ev={s.ev} glows={s.glows} look={s.look} seed={seed} reset={Math.abs(t - REV) < 0.02}
      env={{ src: "kloofendal_48d_partly_cloudy_puresky", intensity: s.sky, rotation: 1.2 }}
      roof={{ at: [0, ROOM.h + 0.3, mid], half: [ROOM.x + 1, 0.1, half + 1] }}
      air={{ at: [0, ROOM.h / 2, mid], size: [ROOM.x * 2, ROOM.h, half * 2], density: 0.03 }}
      over={<Hand t={t} s={s} />} />
  );
}
