// THE TEST COURT for first-person play (docs/first-person.feature FP10: "a Berlin courtyard (a manhole, a door, a
// window's ledge) and a cellar with a drilled hole are played live"). A second court of a Mietskaserne, 9.5 x 11 m,
// five storeys of windows round it, paved in brick, on 20 December 1917 at one o'clock: snow swept to the walls.
//   the manhole   the house drain's inspection shaft under Hobrecht's hinged cover (kit/street.ts MANHOLE): a hook in
//                 the slot opposite the hinge, the lid swung over, down the steps 2.5 m to the drain's channel
//   the door      the rear building's door to its stair (COURT_DOOR), on its hinge: a lobby behind it, the stair's
//                 arch dark beyond
//   the ledges    the left wing's ground-floor windows have granite ledges at 0.75 m, 0.34 m deep, to sit on
//   the arch      the passage through the front building to the first court, dark, closed at its far end
// The cellar with its drilled hole is the cellar chain (interiors/sets/cellar.ts, cellar-chain).
// Frame: the court's own, x along the rear building (back wall, z 0), z toward the front building (z D), y up, the
// paving's top at y 0. `COURT_FP` has the cover on and the door shut; `COURT_FP_OPEN` the cover swung open on its hinge and
// the door open, for a look down the shaft and into the lobby.
import { COURT_DOOR, MANHOLE } from "../kit/street";
import type { Opening, Shell } from "../shell";
import { onWall, type Place, type Room, type Set } from "./types";

const L = 9.5, D = 11, H = 16.5, S = 3.3; // the court's width (x), depth (z), the walls' height, a storey
export const FP_COURT = {
  manhole: [3.2, 0, 6.8] as [number, number, number],
  door: { x: L / 2, hinge: [L / 2 - COURT_DOOR.w / 2 + 0.015, 0, -0.12] as [number, number, number] },
  ledges: [4.0, 6.4, 8.8].map((u) => [0, 0.75, D - u] as [number, number, number]), // on the left wall's face, x 0
};

/** Windows on one wall: at each u on every storey; the ground floor's sill at `ground`, the upper floors' at 0.9 over
 *  their floor. `skip` leaves out ground-floor windows (an arch, the cellar's neck). */
function windows(wall: Opening["wall"], us: number[], ground: number, skip: number[] = []): Opening[] {
  const o: Opening[] = [];
  for (let s = 0; s < 5; s++) for (const u of us) {
    if (s === 0 && skip.includes(u)) continue;
    o.push({ wall, u, w: 1.05, y: s ? s * S + 0.9 : ground, h: 1.55, kind: "window" });
  }
  return o;
}

const COURT_SHELL: Shell = {
  l: L, d: D, h: H, t: 0.4, walls: "lime-dirty", floor: "brick", ceiling: "none", seed: 31,
  openings: [
    { wall: "back", u: FP_COURT.door.x, w: COURT_DOOR.w, y: 0, h: COURT_DOOR.h, kind: "door" },
    // the rear building's stair windows over the door, at its half-landings
    ...[0, 1, 2, 3].map((k): Opening => ({ wall: "back", u: L / 2, w: 0.9, y: 2.75 + k * S, h: 1.3, kind: "window" })),
    ...windows("back", [1.6, 7.9], 0.9),
    ...windows("left", [1.6, 4.0, 6.4, 8.8], 0.75),
    ...windows("right", [2.2, 5.5, 8.8], 0.9, [5.5]),
    ...windows("front", [1.6, 3.4, 6.1, 7.9], 0.9, [3.4, 6.1]),
    { wall: "front", u: L / 2, w: 2.6, y: 0, h: 3.2, kind: "arch" },
  ],
  hatches: [{ in: "floor", x: FP_COURT.manhole[0], z: FP_COURT.manhole[2], w: 0.7, d: 0.7 }],
};

/** The lobby of the rear building behind the door: tiles, an oil-painted dado, the house rules, the gas bracket, the
 *  stair's arch at the back. Its front wall is the court's back wall (skipped here). */
const LOBBY_SHELL: Shell = {
  l: 3.0, d: 4.5, h: 3.3, t: 0.25, walls: "lime-dirty", dado: { mat: "oil-dado", h: 1.3 }, floor: "tiles", ceiling: "plaster", seed: 32,
  skip: ["front"], openings: [{ wall: "back", u: 1.5, w: 1.1, y: 0, h: 2.2, kind: "arch" }],
};
/** The passage through the front building (Durchfahrt) behind the arch, its far end shut (the gate to the first court). */
const PASSAGE_SHELL: Shell = { l: 2.6, d: 6.0, h: 3.2, t: 0.4, walls: "lime-dirty", floor: "brick", ceiling: "plaster", seed: 33, skip: ["back"] };

function courtProps(open: boolean): Place[] {
  const sh = COURT_SHELL, [mx, , mz] = FP_COURT.manhole, p: Place[] = [];
  p.push({ prop: "manhole-frame", at: [mx, 0, mz], yaw: 0 }, { prop: "manhole-shaft", at: [mx, 0, mz], yaw: 0 });
  // the cover in its seat, or swung open on its hinge to lie on the paving (its origin is the hinge pin)
  const pin: [number, number, number] = [mx + MANHOLE.hinge.at[0], MANHOLE.hinge.at[1], mz + MANHOLE.hinge.at[2]];
  p.push({ prop: open ? "manhole-cover-open" : "manhole-cover", at: pin, yaw: 0, name: "cover" });
  p.push({ prop: "court-door-surround", at: [FP_COURT.door.x, 0, 0], yaw: 0 });
  p.push({ prop: "court-door-leaf", at: FP_COURT.door.hinge, yaw: open ? 1.25 : 0, name: "door" });
  p.push({ prop: "house-rules", at: [FP_COURT.door.x + 1.05, 1.45, 0.02], yaw: 0, scale: 0.9 });
  for (const at of FP_COURT.ledges) p.push({ prop: "court-sill", at, yaw: Math.PI / 2 });
  p.push({ prop: "cellar-neck", ...onWall(sh, "right", 5.5, 1.5) });
  p.push({ prop: "court-pump", ...onWall(sh, "left", 10.2, 0.6) });
  p.push({ prop: "dust-chest", ...onWall(sh, "right", 10.2, 0.8) }, { prop: "coal-sacks", ...onWall(sh, "right", 3.6, 0.6) });
  p.push({ prop: "carpet-rack", at: [3.0, 0, 9.5], yaw: 0.05 });
  // the ground floor's box windows in their openings, seen from the court (the panes system draws the floors above)
  const GROUND: [Opening["wall"], number, number][] = [["back", 1.6, 0.9], ["back", 7.9, 0.9], ...[1.6, 4.0, 6.4, 8.8].map((u): [Opening["wall"], number, number] => ["left", u, 0.75]), ["right", 2.2, 0.9], ["right", 8.8, 0.9], ["front", 1.6, 0.9], ["front", 7.9, 0.9]];
  const face = { back: (u: number, y: number) => ({ at: [u, y, 0], yaw: 0 }), left: (u: number, y: number) => ({ at: [0, y, D - u], yaw: Math.PI / 2 }), right: (u: number, y: number) => ({ at: [L, y, u], yaw: -Math.PI / 2 }), front: (u: number, y: number) => ({ at: [L - u, y, D], yaw: Math.PI }) } as const;
  for (const [w, u, y] of GROUND) { const f = face[w](u, y) as { at: [number, number, number]; yaw: number }; p.push({ prop: "window-kasten", ...f }, { prop: "window-wool", ...f }); }
  p.push({ prop: "removal-cart", at: [6.9, 0, 3.4], yaw: 2.6 }, { prop: "rodel", at: [1.2, 0, 2.2], yaw: 1.3 });
  // the snow swept from the paving into banks along the walls, clear of the ledges, the door and the arch
  p.push({ prop: "snow-bank", ...onWall(sh, "back", 2.2, 0.9) }, { prop: "snow-bank", ...onWall(sh, "back", 8.0, 0.9), scale: 0.8 });
  p.push({ prop: "snow-bank", ...onWall(sh, "front", 7.9, 0.9), scale: 0.9 });
  return p;
}

function rooms(open: boolean): Room[] {
  const ly = LOBBY_SHELL;
  return [
    { id: "court", shell: COURT_SHELL, at: [0, 0, 0], props: courtProps(open), panes: true },
    {
      id: "lobby", shell: ly, at: [L / 2 - ly.l / 2, 0, -0.4 - ly.d],
      props: [
        { prop: "wall-lamp", at: [0.12, 1.9, 1.6], yaw: Math.PI / 2, name: "lamp", lit: true },
        { prop: "house-rules", ...onWall(ly, "left", 3.2, 0, 1.45, 0.01) },
      ],
    },
    { id: "passage", shell: PASSAGE_SHELL, at: [L / 2 - 1.3, 0, D + 0.4], props: [] },
  ];
}

const base: Omit<Set, "id" | "title" | "rooms" | "cams"> = {
  use: "first-person test level FP10 (docs/first-person.feature): the manhole, the door, the ledges; played live and rendered",
  // December at one o'clock: the sun 14 degrees up from the south-west reaches only the top storey; the court lives on
  // the sky over its mouth and the bounce off the snow and the upper walls
  sun: { from: [100, 26, 6], at: [L / 2, 0, D / 2], lux: 9000, color: "#f2e2c8" },
  windows: { lit: 0, glow: 300, dark: 1.2, lumens: 0, seed: 31 },
  sky: [
    { at: [L / 2, H - 0.5, D / 2], look: [L / 2, 0, D / 2], w: L, h: D, lumens: 90000, color: "#c4d0e0" },
    { at: [L / 2, 7, D / 2], look: [L / 2, 0, D / 2], w: L - 1, h: D - 1, lumens: 26000, color: "#d6dce6" },
  ],
  outside: [{ at: [L / 2, 2.6, -1.6], look: [L / 2, 0, -2.6], lumens: 120, color: "#ffc98a", kind: "point" }],
  ambient: { color: "#9aa8bd", brightness: 60 },
  exposure: -3.5,
  wear: { dust: 0.35, dirt: 0.5, edges: 0.4 },
};

export const COURT_FP: Set = {
  ...base,
  id: "fp-court",
  title: "The test court (FP10): a second court with its manhole, the rear building's door and the window ledges",
  rooms: rooms(false),
  cams: [
    { id: "court", eye: [L / 2 + 1.6, 1.65, D - 1.2], at: [L / 2 - 1.2, 1.5, 0], fov: 72, note: "standing by the arch: the rear building's door ahead, the manhole on the left, the ledges along the left wing" },
    { id: "manhole", eye: [FP_COURT.manhole[0] + 1.1, 1.65, FP_COURT.manhole[2] + 0.9], at: [FP_COURT.manhole[0], 0, FP_COURT.manhole[2]], fov: 68, note: "looking down at the cover in its frame" },
    { id: "door", eye: [L / 2 + 0.35, 1.65, 1.9], at: [L / 2, 1.25, 0], fov: 68, note: "at the door: the lever, the grille over the frosted light, the step" },
    { id: "ledge", eye: [2.1, 1.65, 6.6], at: [0, 0.75, 5.7], fov: 68, note: "the left wing's ledges at 0.75 m, to sit on" },
  ],
};
export const COURT_FP_OPEN: Set = {
  ...base,
  id: "fp-court-open",
  title: "The test court open: the cover lifted off, the door open on the lobby",
  rooms: rooms(true),
  cams: [
    { id: "shaft", eye: [FP_COURT.manhole[0] - 0.15, 1.5, FP_COURT.manhole[2] + 0.55], at: [FP_COURT.manhole[0] + 0.1, -MANHOLE.depth, FP_COURT.manhole[2]], fov: 68, note: "down the shaft: the rungs, the channel at the bottom" },
    { id: "lobby", eye: [L / 2 + 0.2, 1.65, 2.6], at: [L / 2, 1.3, -3], fov: 68, note: "through the open door into the lobby, the stair's arch beyond" },
  ],
};
