// THE KITCHEN WINDOW ("A Hinterhof: the barrel organ man... camera high, from a third-floor window,
// slow tilt down"). A side-wing kitchen on the third floor (4th storey) of a Friedrichstadt Mietshaus, its one window
// onto the court. Furnished from the worker-kitchen recipe (research/catalogue/rooms.ts) and the survey plates of
// 1913-20: the range against the chimney wall, the dresser with paper lace, the lodger's bed, washing overhead.
// The court below is a stand-in (three walls of windows, snow) until the world lane's court replaces it.
import { hash } from "../kit/geo";
import type { Opening, Shell } from "../shell";
import { onProp, onWall, type Place, type Room, type Set } from "./types";
import { heroCourtProps } from "../yard";

const l = 2.9, d = 4.2, h = 2.85, tf = 0.38;
const FLOOR = 10.6; // the kitchen floor over the court: ground floor raised 0.8 m, three storeys of 3.25 m
export const KITCHEN_SHELL: Shell = {
  l, d, h, t: { back: 0.25, front: tf, left: 0.51, right: 0.25 },
  walls: "lime-wash", dado: { mat: "oil-dado", h: 1.45 }, floor: "boards", ceiling: "plaster", seed: 4,
  openings: [
    { wall: "front", u: l / 2, w: 1.05, y: 0.85, h: 1.55, kind: "window" },
    { wall: "back", u: 1.1, w: 0.9, y: 0, h: 2.05, kind: "door" },
  ],
};

function kitchen(lamp: boolean): Place[] {
  const sh = KITCHEN_SHELL, p: Place[] = [];
  const win = { at: [l / 2, 0.85, d] as [number, number, number], yaw: Math.PI };
  if (lamp) {
    p.push({ prop: "window-kasten", ...win }, { prop: "window-wool", ...win }, { prop: "lace-curtain", ...win });
    p.push({ prop: "geranium", ...onProp(win, [0.3, 0.0, 0.12]) }, { prop: "geranium", ...onProp(win, [-0.32, 0.0, 0.14]), yaw: 2 });
  } else {
    // by day the window is open on the court (the organ grinder below): the geraniums moved to the table, the lace pushed aside
    p.push({ prop: "window-kasten-open", ...win });
    p.push({ prop: "geranium", at: [1.0, 0.78, 3.3], yaw: 1 });
  }
  const range = onWall(sh, "left", 3.25, 0.62);
  p.push({ prop: "range", ...range }, { prop: "kettle", ...onProp(range, [-0.22, 0.805, 0.03]) }, { prop: "pot", ...onProp(range, [0.2, 0.805, 0.03]) });
  p.push({ prop: "wall-hanging", ...onWall(sh, "left", 3.25, 0.02, 1.35) });
  p.push({ prop: "tub-hung", ...onWall(sh, "left", 1.75, 0.32, 1.0) }, { prop: "basin-hung", ...onWall(sh, "left", 2.35, 0.1, 1.55) });
  p.push({ prop: "spice-cabinet", ...onWall(sh, "left", 0.7, 0.15, 1.55) });
  const dresser = onWall(sh, "right", 2.75, 0.5);
  p.push({ prop: "dresser", ...dresser }, { prop: "canisters", ...onProp(dresser, [0, 0.89, -0.13]) });
  p.push({ prop: "wall-shelf", ...onWall(sh, "back", 2.35, 0.2, 1.75) });
  p.push({ prop: "bed-iron", at: [l - 0.5, 0, 1.0], yaw: 0 });
  const table: [number, number, number] = [1.2, 0, 3.3];
  p.push({ prop: "kitchen-table", at: table, yaw: 0 }, { prop: "chair", at: [1.0, 0, 2.72], yaw: 0.15 }, { prop: "stool", at: [0.45, 0, 3.35], yaw: 0.4 });
  p.push({ prop: "coffee-mill", at: [1.45, 0.77, 3.42], yaw: 0.5 });
  p.push({ prop: "hoop-lamp", at: [table[0], h, table[2]], name: "lamp", lit: lamp });
  p.push({ prop: "washing-2.5", at: [l / 2, h - 0.1, 2.15], yaw: 0 });
  p.push({ prop: "ration-cards", ...onWall(sh, "back", 0.45, 0.01, 1.45) });
  p.push({ prop: "bucket", at: [0.75, 0, 2.1], yaw: 0 });
  return p;
}

/** The court as a stand-in: the far side wing and the rear building, five storeys of windows, a snowy floor. */
function court(): Room {
  const W = 11.5, D2 = 9.5, H2 = 20, openings: Opening[] = [];
  for (const wall of ["front", "left", "right"] as const) {
    const len = wall === "front" ? W : D2;
    for (let s = 0; s < 5; s++) for (let u = 1.2; u < len - 0.8; u += 2.3) {
      if (hash(s, u, wall.length) < 0.08) continue;
      if (wall === "front" && s === 0 && Math.abs(u - W / 2) < 1.8) continue; // the arch through to the next court
      openings.push({ wall, u, w: 1.05, y: 1.2 + s * 3.25 + (s ? 0.6 : 0), h: 1.55, kind: "window" });
    }
  }
  openings.push({ wall: "front", u: W / 2, w: 2.4, y: 0, h: 3.2, kind: "arch" }); // the passage through to the next court
  return {
    id: "court-standin",
    shell: { l: W, d: D2, h: H2, t: 0.4, walls: "lime-dirty", floor: "snow", ceiling: "none", skip: ["back"], openings, seed: 9 },
    at: [l / 2 - W / 2, -FLOOR, d + tf],
    props: heroCourtProps(), // interiors/yard.ts: the organ, the washing on posts, the rack, the chests, the window that opens
    panes: true,
  };
}

const rooms = (lamp: boolean): Room[] => [{ id: "kitchen", shell: KITCHEN_SHELL, at: [0, 0, 0], props: kitchen(lamp) }, court()];

export const KITCHEN_DAY: Set = {
  id: "kitchen-day",
  title: "Kitchen window: a side-wing kitchen, third floor, over the court",
  use: "the court from the third-floor window",
  rooms: rooms(false),
  cams: [
    { id: "window", eye: [l / 2 + 0.05, 1.62, d - 0.25], at: [l / 2 - 0.5, -6.5, d + 7], fov: 62, note: "leaning out of the open window: the casements frame the court, the washing and the organ grinder below" },
    { id: "room", eye: [l / 2 + 0.35, 1.55, d - 0.25], at: [0.9, 0.9, 0.2], fov: 62, note: "the kitchen from the window: range, dresser, bed, washing" },
    // the tilt: from the rear building's windows (the one that opens) down to the organ
    { id: "tilt-start", eye: [l / 2 + 0.05, 1.62, d - 0.25], at: [l / 2 - 0.5, -1.5, d + 7], fov: 62, note: "the tilt's start: the rear building, the window opening over the arch" },
    { id: "tilt-end", eye: [l / 2 + 0.05, 1.75, d + tf + 0.2], at: [l / 2 - 0.3, -FLOOR, d + tf + 4.7], fov: 62, ev: 0.4, note: "the tilt's end, leaning out over the sill (the sill hides the court from inside the room): the washing on its posts, the organ" },
    { id: "yard", eye: [-2.3, -FLOOR + 1.6, d + tf + 1.5], at: [1.5, -FLOOR + 0.8, d + tf + 4.7], fov: 55, ev: 0.9, note: "in the court by the carpet rack: the organ, the washing, the arch" },
  ],
  // December at one o'clock: the sun 14 degrees up (Berlin, 52.5 N), from the south-west over the right wing. It reaches only
  // the top storey of the left wing and the rear building's top corner; the court below lives on sky light
  sun: { from: [100, 26, 6], at: [l / 2, -FLOOR, d + 5], lux: 9000, color: "#f2e2c8" },
  // the court's windows by day: unlit rooms, a little brighter than the dusk set's dark ones
  windows: { lit: 0, glow: 300, dark: 1.2, lumens: 0, seed: 7 },
  sky: [
    { at: [l / 2, 1.6, d + 0.5], look: [l / 2, 1.2, 0], w: 1.0, h: 1.5, lumens: 250, color: "#c9d6e8", bounce: true }, // the open window: the court panel does the work
    // the court's own sky: an 11 x 9 m panel over its mouth, so the well is lit from above and darkens downward
    { at: [l / 2, 9.3, d + 5.2], look: [l / 2, -FLOOR, d + 5.2], w: 11, h: 9, lumens: 90000, color: "#c4d0e0" },
    // the bounce the renderer doesn't trace: the sunlit top storey and the snow light the well's lower half, so a soft
    // panel halfway down stands in for it
    { at: [l / 2, -FLOOR + 6.5, d + 5.2], look: [l / 2, -FLOOR, d + 5.2], w: 10, h: 8.5, lumens: 26000, color: "#d6dce6", bounce: true },
  ],
  ambient: { color: "#9aa8bd", brightness: 60 },
  exposure: -3.2,
  wear: { dust: 0.35, dirt: 0.45, edges: 0.35 },
};

export const KITCHEN_DUSK: Set = {
  ...KITCHEN_DAY,
  id: "kitchen-dusk",
  title: "Kitchen at dusk: the hoop lamp pulled down over the table",
  rooms: rooms(true),
  cams: [{ id: "lamp", eye: [l / 2 + 0.6, 1.5, d - 0.35], at: [0.7, 1.0, 0.6], fov: 60, note: "evening: the only light is the lamp and the range's fire door" },
    // the night Hinterhof: low in the court, up at the rear building's arch
    { id: "court", eye: [3.4, -FLOOR + 1.25, 5.3], at: [2.6, -FLOOR + 2.2, 14], fov: 50, ev: 1.2, note: "night in the court: the windows round it, a third lit" },
  ],
  sun: undefined,
  sky: [{ at: [l / 2, 1.6, d + 0.5], look: [l / 2, 1.2, 0], w: 1.0, h: 1.5, lumens: 120, color: "#4a5a7a", bounce: true },
    // the night sky over the court's mouth: a blackout city, so little more than snow-light
    { at: [l / 2, 9.3, d + 5.2], look: [l / 2, -FLOOR, d + 5.2], w: 11, h: 9, lumens: 40, color: "#3c4a66" },
  ],
  // the court's windows round it: a third lit at this hour (world/SOP.md §3's rationing), each throwing a little light down
  windows: { lit: 0.33, glow: 300, dark: 0.05, lumens: 30, seed: 7 },
  ambient: { color: "#5a4a3a", brightness: 18 },
  exposure: -1.2, // the hoop lamp's fill (bounce off its shade) lights the room now
};
