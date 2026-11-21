// THE PORTER'S LOFT, Ritterstraße 120 (research/scenes.md; t-irooms002). The right side wing, first floor: a Stube
// (3.90 x 3.00 m, 1.80 m high, two windows of 50 x 80 cm on the court) and a Kochraum over a horse stable, reached by an
// iron spiral stair. Rebuilt from the two flash plates of 18 October 1917, z2_1917_MP_0075 (the Stube: the checked
// featherbed, the mirror between the windows, cups on hooks, the reflector lamp, mould on the lime wash) and 0077 (the
// Kochraum: the cup board under paper lace, the broken tiled range with a cannon stove built into it, the line of white
// coats, the plank partition with its poster). What the plates don't show is reasoned and marked: the stair rising in the
// stable's court corner through a hatch into the Kochraum (the text says only that an iron spiral stair reaches it), the
// Kochraum's 2.7 m, its window, the stable's two stands with their heads to the end wall and the drain behind them.
// The porters see the gate from here; the stable below is warm and loud and drains to the sewer; a sack of briquettes
// under the Stube's table is worth more to them than money.
import { hash } from "../kit/geo";
import { SPIRAL } from "../kit/porter";
import type { Opening, Shell } from "../shell";
import { onProp, onWall, type Place, type Room, type Set } from "./types";

const H = 1.8, D = 3.0, LS = 3.9, LK = 2.7, KX = 4.0; // loft height and depth, Stube and Kochraum lengths, the Kochraum's x
const SY = -2.9, SH = 2.62, LST = KX + LK; // the stable's floor (court level) and height, its length under both rooms
const HATCH = { x: LK - SPIRAL.hatch / 2, z: SPIRAL.hatch / 2 }; // the stair's newel in the Kochraum's frame
const WIN = { w: 0.5, h: 0.8, y: 0.88 } as const;
const PART = -0.037; // the plank partition's face sits 3.7 cm past each room's nominal wall: a gap for onWall

export const STUBE_SHELL: Shell = {
  l: LS, d: D, h: H, t: { back: 0.38, front: 0.38, left: 0.25, right: 0.05 }, skip: ["right"],
  walls: "lime-damp", floor: "boards", ceiling: "battens", seed: 21,
  openings: [0.85, 2.3].map((u): Opening => ({ wall: "back", u, w: WIN.w, y: WIN.y, h: WIN.h, kind: "window" })),
};
export const KOCH_SHELL: Shell = {
  l: LK, d: D, h: H, t: { back: 0.38, front: 0.38, left: 0.05, right: 0.38 }, skip: ["left"],
  walls: "lime-dirty", dado: { mat: "oil-dado", h: 0.9 }, floor: "boards", ceiling: "battens", seed: 22,
  openings: [{ wall: "back", u: 0.7, w: WIN.w, y: WIN.y, h: WIN.h, kind: "window" }],
  hatches: [{ in: "floor", x: HATCH.x, z: HATCH.z, w: SPIRAL.hatch, d: SPIRAL.hatch }],
};
export const STABLE_SHELL: Shell = {
  l: LST, d: D, h: SH, t: { back: 0.51, front: 0.51, left: 0.38, right: 0.38 },
  walls: "lime-dirty", dado: { mat: "cement", h: 1.25 }, floor: "brick", ceiling: "vault", vaultMat: "brick-wash", seed: 23,
  openings: [
    { wall: "back", u: 4.3, w: 1.4, y: 0, h: 2.2, kind: "door" },
    ...[1.1, 2.5].map((u): Opening => ({ wall: "back", u, w: 0.8, y: 1.7, h: 0.6, kind: "window" })),
  ],
  hatches: [{ in: "ceiling", x: KX + HATCH.x, z: HATCH.z, w: SPIRAL.hatch, d: SPIRAL.hatch }],
};

function stube(lamp: boolean): Place[] {
  const sh = STUBE_SHELL, p: Place[] = [];
  for (const u of [0.85, 2.3]) p.push({ prop: "window-50x80", ...onWall(sh, "back", u, 0, WIN.y, 0) });
  p.push({ prop: "curtain-plain", ...onWall(sh, "back", 0.85 + 0.27, 0, WIN.y + WIN.h + 0.05, 0) });
  // the featherbed bed down the end wall, its foot to the window; the son's iron bed along the fire wall
  p.push({ prop: "bed-wood", at: [0.52, 0, 1.96], yaw: Math.PI }, { prop: "bed-iron", at: [2.1, 0, 2.48], yaw: Math.PI / 2 });
  // between the windows: the little mirror over a table, and under the table the sack of briquettes
  const table = onWall(sh, "back", 1.575, 0.66);
  p.push({ prop: "mirror-small", ...onWall(sh, "back", 1.575, 0, 1.0, 0) }, { prop: "kitchen-table", ...table }, { prop: "potato-sack", at: [1.62, 0, 0.3], yaw: 0.3, scale: 0.9, name: "briquettes" });
  p.push({ prop: "coffee-mill", ...onProp(table, [0.3, 0.77, 0.08]) });
  // the partition corner: the chest under the cup shelf, the reflector lamp, the photographs
  const chest = onWall(sh, "right", 0.95, 0.52, 0, PART);
  p.push({ prop: "chest-drawers", ...chest }, { prop: "chest-clutter", ...onProp(chest, [0, 0.88, 0.02]) }, { prop: "wall-shelf", ...onWall(sh, "right", 0.95, 0.2, 1.55, PART) });
  p.push({ prop: "petroleum-wall", ...onWall(sh, "right", 0.32, 0, 1.28, PART), name: "lamp", lit: lamp });
  p.push({ prop: "photos", ...onWall(sh, "right", 0.95, 0, 0.98, PART), scale: 0.8 });
  // the two chairs the porter and his wife sat on for the plate
  p.push({ prop: "chair", at: [1.15, 0, 1.05], yaw: 0.35 }, { prop: "chair", at: [2.2, 0, 1.0], yaw: -0.15 });
  p.push({ prop: "oleograph", ...onWall(sh, "left", 0.55, 0, 1.0, 0.01), scale: 0.7 });
  return p;
}

function kochraum(lamp: boolean): Place[] {
  const sh = KOCH_SHELL, p: Place[] = [];
  p.push({ prop: "window-50x80", ...onWall(sh, "back", 0.7, 0, WIN.y, 0) });
  p.push({ prop: "plank-wall-door", at: [-0.05, 0, D / 2], yaw: Math.PI / 2 });
  // the chimney wall: the broken range with its cannon stove, the cup board, the salt and flour boxes
  const range = onWall(sh, "front", 1.55, 0.6);
  p.push({ prop: "range-broken", ...range }, { prop: "cup-board", ...onWall(sh, "front", 0.55, 0, 0.85, 0.005) }, { prop: "salt-boxes", ...onWall(sh, "front", 1.12, 0, 1.0, 0.005) });
  p.push({ prop: "herbs", ...onWall(sh, "right", 2.75, 0, 1.58, 0.005) });
  // along the partition no bed (0077 shows none): her wash tub hung on it over a stool, the poster by the doorway
  p.push({ prop: "tub-hung", ...onWall(sh, "left", 2.2, 0.32, 0.95, PART) }, { prop: "stool", at: [0.3, 0, 0.8], yaw: 0.3 });
  p.push({ prop: "war-poster", ...onWall(sh, "left", 1.4, 0, 0.85, PART) }, { prop: "ration-cards", ...onWall(sh, "front", 0.12, 0, 1.25, 0.005) });
  // the table under its printed cloth, the basin and jug, the lamp; a chair drawn up to it
  const table = onWall(sh, "right", 2.05, 0.66);
  p.push({ prop: "cloth-table", ...table }, { prop: "wash-things", ...onProp(table, [-0.1, 0.79, 0.02]) });
  p.push({ prop: "petroleum-lamp", ...onProp(table, [0.36, 0.79, 0.05]), name: "lamp", lit: lamp });
  p.push({ prop: "chair", at: [0.32, 0, 2.3], yaw: Math.PI / 2 + 0.25 }); // under the coats, in front of the doorway, as the plate has it
  // the white coats across the room on their line, bunched at the partition end in front of the doorway
  p.push({ prop: "kittel-line", at: [LK / 2 + 0.05, H - 0.1, 2.25], yaw: 0.04 });
  p.push({ prop: "bucket", at: [1.86, 0, 2.72], yaw: 0.4 });
  return p;
}

function stable(lantern: boolean): Place[] {
  const sh = STABLE_SHELL, p: Place[] = [];
  p.push({ prop: "stable-door", at: [4.3, 0, 0], yaw: 0 });
  for (const u of [1.1, 2.5]) p.push({ prop: "window-80x60", ...onWall(sh, "back", u, 0, 1.7, 0) });
  // two stands, heads to the end wall: a manger and rack at each head, straw down each, the bail pole between them
  for (const [u, z] of [[0.75, 2.25], [2.25, 0.75]] as const) {
    p.push({ prop: "manger", ...onWall(sh, "left", u, 0.55) });
    p.push({ prop: "straw-bed", at: [0.55 + 1.2, 0, z], yaw: Math.PI / 2 + (hash(u, 3) - 0.5) * 0.05 });
  }
  p.push({ prop: "stall-bail", at: [0.55, 0, D / 2], yaw: 0 });
  p.push({ prop: "bucket", at: [0.75, 0, 1.25], yaw: 0.2 });
  // behind the stands the drain across the floor; the work end: harness, oats, fork and broom, the stair
  p.push({ prop: "stable-gutter", at: [3.15, 0, D / 2], yaw: 0 });
  p.push({ prop: "harness-pegs", ...onWall(sh, "front", LST - 4.3, 0, 1.55, 0.005) });
  p.push({ prop: "oat-bin", ...onWall(sh, "front", LST - 5.3, 0.55) });
  p.push({ prop: "stable-tools", ...onWall(sh, "right", 2.3, 0.4) });
  p.push({ prop: "spiral-iron", at: [KX + HATCH.x, 0, HATCH.z], yaw: -Math.PI / 2 });
  p.push({ prop: "stable-lantern", at: [3.4, SH - 0.2, 1.7], name: "lantern", lit: lantern });
  return p;
}

/** The court as a stand-in (a rear building and two side wings of windows, cobbles) until the world lane's court. */
function court(): Room {
  const W = 14, CD = 8, openings: Opening[] = [];
  for (const wall of ["back", "left", "right"] as const) {
    const len = wall === "back" ? W : CD;
    for (let s = 0; s < 4; s++) for (let u = 1.3; u < len - 0.8; u += 2.4) {
      if (hash(s, u, wall.length) < 0.1) continue;
      openings.push({ wall, u, w: 1.05, y: 1.2 + s * 3.4 + (s ? 0.5 : 0), h: 1.55, kind: "window" });
    }
  }
  return { id: "court-standin", shell: { l: W, d: CD, h: 16, t: 0.4, walls: "lime-dirty", floor: "brick", ceiling: "none", skip: ["front"], openings, seed: 12 }, at: [-4, SY, -0.51 - CD], props: [], panes: true };
}

const rooms = (lit: boolean): Room[] => [
  { id: "stube", shell: STUBE_SHELL, at: [0, 0, 0], props: stube(lit) },
  { id: "kochraum", shell: KOCH_SHELL, at: [KX, 0, 0], props: kochraum(lit) },
  { id: "stable", shell: STABLE_SHELL, at: [0, SY, 0], props: stable(lit) },
  court(),
];

/** Daylight through each small window from the court: a rectangle just outside it, facing in. */
const panes = (lm: number, color: string) => [
  ...[0.85, 2.3].map((u) => ({ at: [u, WIN.y + WIN.h / 2, -0.6] as [number, number, number], look: [u, 0.6, 2] as [number, number, number], w: WIN.w, h: WIN.h, lumens: lm, color })),
  { at: [KX + 0.7, WIN.y + WIN.h / 2, -0.6] as [number, number, number], look: [KX + 0.7, 0.6, 2] as [number, number, number], w: WIN.w, h: WIN.h, lumens: lm, color },
  ...[1.1, 2.5].map((u) => ({ at: [u, SY + 2.0, -0.75] as [number, number, number], look: [u, SY + 0.5, 2] as [number, number, number], w: 0.8, h: 0.6, lumens: lm * 1.4, color })),
  { at: [4.3, SY + 1.1, -0.8] as [number, number, number], look: [4.3, SY + 0.6, 2] as [number, number, number], w: 1.4, h: 2.2, lumens: lm * 3, color }, // the door standing open
];

export const PORTER_DAY: Set = {
  id: "porter-day",
  title: "The porter's loft, Ritterstraße 120: Stube and Kochraum over the stable, 18 October 1917",
  use: "the porter's flat on Ritterstraße (the porters watch the gate; the stair from the stable); the plates' rooms made walkable",
  rooms: rooms(false),
  cams: [
    { id: "stube", eye: [2.45, 1.38, 2.8], at: [1.55, 0.95, 0], fov: 74, lamp: 260, note: "z2_1917_MP_0075 (a flash plate, so a flash at the lens): the window wall, the featherbed on the left, the mirror between the windows, the chest and lamp in the corner" },
    { id: "kochraum", eye: [KX + 2.3, 1.3, 0.4], at: [KX + 1.0, 0.95, D], fov: 74, lamp: 260, note: "z2_1917_MP_0077 (flash, from over the stair well by the court wall): the cup board, the broken range and its cannon stove, the coats, the partition" },
    { id: "arrive", eye: [KX + HATCH.x - 0.4, 1.5, HATCH.z + 0.3], at: [KX + 0.3, 0.95, 2.5], fov: 76, note: "stepping off the spiral's landing into the Kochraum, the doorway to the Stube ahead" },
    { id: "stair", eye: [KX + 0.3, SY + 1.5, 2.45], at: [KX + HATCH.x, -0.4, HATCH.z], fov: 74, note: "in the stable at the stair's foot, looking up the spiral to the hatch" },
    { id: "stable", eye: [6.3, SY + 1.6, 2.55], at: [1.1, SY + 0.85, 1.2], fov: 72, note: "the stable from the stair corner: the two stands, mangers, the bail pole, the drain" },
  ],
  sky: [
    ...panes(110, "#c9d3e2"),
    // bounce: what the lit floor and the far wall throw back onto each window wall (no GI in a set's stills)
    ...([[LS / 2, 0, 3.4, 45], [KX + LK / 2, 0, 2.4, 30], [LST / 2, SY, 6.0, 220]] as const).map(([x, y, w, lm]) => ({ at: [x, y + 0.9, D - 0.05] as [number, number, number], look: [x, y + 0.9, 0] as [number, number, number], w, h: 1.2, lumens: lm, color: "#b9b2a2" })),
    // the court's sky: a panel over its mouth, so the well is lit from above and darkens downward
    { at: [3, 13.5, -4.5], look: [3, SY, -4.5], w: 14, h: 8, lumens: 70000, color: "#c4d0e0" },
  ],
  ambient: { color: "#9aa8bd", brightness: 40 },
  exposure: -2.2,
  wear: { dust: 0.3, dirt: 0.6, edges: 0.4 },
};

export const PORTER_DUSK: Set = {
  ...PORTER_DAY,
  id: "porter-dusk",
  title: "The porter's loft at dusk: the reflector lamp and the table lamp lit, the stove's door glowing, the lantern below",
  rooms: rooms(true),
  cams: PORTER_DAY.cams.filter((c) => c.id !== "arrive").map(({ lamp: _flash, ...c }) => c), // no flash: the lamps light it
  sky: [...panes(14, "#4a5a7a"), { at: [3, 13.5, -4.5], look: [3, SY, -4.5], w: 14, h: 8, lumens: 60, color: "#3c4a66" }],
  windows: { lit: 0.33, glow: 300, dark: 0.05, lumens: 30, seed: 11 },
  ambient: { color: "#5a4a3a", brightness: 12 },
  exposure: -0.6,
};
