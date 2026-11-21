// THE CELLAR CHAIN: coal, potato sacks, a candle. Three house cellars
// under three neighbouring front buildings, side by side along x, a fire wall (Brandwand, 51 cm) between each.
// The holes in the walls between these cellars are not historical (there were none in 1917); the film's cellar shots keep them out of frame.
//   A  the first: its outer wall
//   B  the hero cellar: the candle, the coal, the potatoes
//   C  the last, toward the stair
import { hash } from "../kit/geo";
import type { Shell } from "../shell";
import { onWall, type Place, type Room, type Set } from "./types";

const L = 8.6, D = 6.2, H = 2.4, FW = 0.51;
const COR: [number, number] = [2.35, 3.55]; // the corridor between the two rows of compartments, z
const HOLE = { u: 2.95, w: 0.78, y: 0.22, h: 1.02, kind: "hole" as const, rag: 0.22 };

function cellarShell(i: number): Shell {
  return {
    l: L, d: D, h: H, t: { back: 0.64, front: 0.64, left: i === 0 ? 0.64 : FW, right: FW },
    walls: "brick-wash", dado: { mat: "brick", h: 0.55 }, floor: "brick", ceiling: "vault", seed: 11 + i,
    skip: i === 0 ? [] : ["left"],
    openings: [
      ...(i < 2 ? [{ wall: "right" as const, ...HOLE }] : []),
      ...(i === 0 ? [{ wall: "left" as const, u: D - 2.95, w: 0.95, y: 0.12, h: 1.15, kind: "hole" as const, rag: 0.15 }] : []),
      { wall: "front", u: 2.2, w: 0.8, y: 1.78, h: 0.42, kind: "window" }, // to the light well under the pavement
      { wall: "front", u: 6.4, w: 0.8, y: 1.78, h: 0.42, kind: "window" },
      ...(i === 2 ? [{ wall: "back" as const, u: 7.6, w: 0.95, y: 0, h: 1.95, kind: "arch" as const }] : []), // to the cellar stair
    ],
  };
}

/** The partitions: a slat wall along each side of the corridor, a door into each compartment, cross walls between. */
function compartments(i: number): Place[] {
  const p: Place[] = [];
  const bays = [0.0, 2.15, 4.3, 6.45, L];
  for (const [z, yaw] of [[COR[0], Math.PI], [COR[1], 0]] as const) {
    for (let b = 0; b < 4; b++) {
      const x0 = bays[b] + 0.05, x1 = bays[b + 1] - 0.05, door = x0 + 0.5;
      p.push({ prop: "slats-door", at: [door, 0, z], yaw });
      let x = x0 + 0.95;
      while (x < x1 - 0.2) { const w = x1 - x >= 1.0 ? 1 : 0; if (!w) break; p.push({ prop: "slats-1", at: [x + 0.5, 0, z], yaw }); x += 1; }
    }
  }
  for (const xb of bays.slice(1, -1)) {
    p.push({ prop: "slats-2", at: [xb, 0, 1.1], yaw: Math.PI / 2 }, { prop: "slats-2", at: [xb, 0, 4.9], yaw: Math.PI / 2 });
  }
  return p;
}

/** What each compartment holds, seeded per house and bay: winter 1917, so little coal, some potatoes, few full jars. */
function contents(i: number, sh: Shell): Place[] {
  const p: Place[] = [];
  const bays = [0.0, 2.15, 4.3, 6.45, L];
  for (let b = 0; b < 4; b++) for (const side of ["back", "front"] as const) {
    const x0 = bays[b], x1 = bays[b + 1], r = (k: number) => hash(i, b, side === "back" ? 1 : 2, k);
    const zWall = side === "back" ? 0 : D;
    const inward = side === "back" ? 1 : -1, yaw = side === "back" ? 0 : Math.PI;
    const z = (off: number) => zWall + inward * off;
    if (r(0) < 0.55) p.push({ prop: "briquette-stack", at: [x0 + 0.55, 0, z(0.22)], yaw });
    else p.push({ prop: "coal-heap", at: [x0 + 0.8, 0, z(0.6)], yaw, scale: 0.6 + r(9) * 0.4 });
    if (r(1) < 0.6) p.push({ prop: r(2) < 0.5 ? "potato-bin" : "potato-sack", at: [x1 - 0.6, 0, z(0.4)], yaw: yaw + (r(3) - 0.5) * 0.4 });
    if (r(4) < 0.45) p.push({ prop: "preserve-shelf", at: [x0 + 1.25, 0, z(0.17)], yaw });
    if (r(5) < 0.35) p.push({ prop: "crock", at: [x1 - 0.35, 0, z(1.2)], yaw });
    if (r(6) < 0.3) p.push({ prop: "sledge", at: [x0 + 0.35, 0, z(1.2)], yaw: Math.PI / 2 });
    if (r(7) < 0.5) p.push({ prop: "kiepe", at: [x0 + 1.1, 0, z(1.25)], yaw: r(8) * 6 }); // between the sledge and the crock
    if (r(10) < 0.4) p.push({ prop: "firewood", at: [x1 - 0.9, 0, z(1.6)], yaw: r(11) * 6 });
  }
  const meter = onWall(sh, "back", 7.0, 0.25, 1.6);
  if (i === 2) p.push({ prop: "gas-meter", ...meter });
  return p;
}

const rooms: Room[] = [0, 1, 2].map((i) => {
  const sh = cellarShell(i);
  const props = [...compartments(i), ...contents(i, sh)];
  if (i < 2) props.push({ prop: "rubble-heap", at: [L - 0.55, 0, 2.95], yaw: 0.3 + i, name: `rubble-${i}` }); // spill on the near side
  if (i > 0) props.push({ prop: "rubble-heap", at: [0.5, 0, 2.95], yaw: 1.7 * i, scale: 0.7, name: `rubble-far-${i}` });
  if (i === 0) props.push({ prop: "rubble-heap", at: [0.6, 0, D - 2.95], yaw: 2.2, scale: 1.2, name: "rubble-bore" });
  if (i === 1) {
    // the hero: a candle on an upturned bucket, a coal shovel left leaning
    props.push({ prop: "bucket-up", at: [1.15, 0, 2.6], yaw: 0, name: "candle-stand" }, { prop: "candle", at: [1.15, 0.3, 2.6], name: "candle-hero", lit: true });
    props.push({ prop: "potato-sack-slumped", at: [1.4, 0, 3.25], yaw: 0.6 }, { prop: "potato-sack", at: [1.9, 0, 3.3], yaw: -0.3 });
    props.push({ prop: "coal-shovel", at: [0.12, 0, 3.6], yaw: Math.PI / 2 });
  }
  return { id: `cellar-${"abc"[i]}`, shell: sh, at: [i * (L + FW), 0, 0], props };
});

export const CELLAR: Set = {
  id: "cellar-chain",
  title: "The cellar chain: three house cellars",
  use: "the house cellars",
  rooms,
  cams: [
    { id: "breakin", eye: [L + FW + 3.4, 0.75, 3.15], at: [L + FW - 0.2, 0.62, 2.95], fov: 52, note: "B, crouched: the hole from A, its rubble, the candle on the bucket" },
    { id: "chain", eye: [2 * (L + FW) + 6.8, 0.9, 2.95], at: [0, 0.65, 2.95], fov: 40, lamp: 18, note: "C down the corridor: both holes in line, the candle beyond" },
    { id: "compartment", eye: [L + FW + 5.5, 1.5, 2.5], at: [L + FW + 6.7, 0.35, 5.5], fov: 58, lamp: 60, note: "B: through the slats to coal, potatoes and jars" },
  ],
  outside: [
    { at: [2.2, 2.0, D + 0.5], look: [2.2, 0.0, D - 2], lumens: 1200, color: "#9fb4d6", kind: "spot" }, // light well: a gas lamp's spill from the street, cold
    { at: [L + FW + 6.4, 2.0, D + 0.5], look: [L + FW + 6.4, 0, D - 2], lumens: 1200, color: "#9fb4d6", kind: "spot" },
    { at: [-1.2, 0.7, D - 2.95], look: [1, 0.5, D - 2.95], lumens: 260, color: "#ffd0a0", kind: "point" }, // a lamp at the outer wall
  ],
  ambient: { color: "#6b5a4a", brightness: 70 },
  exposure: 1.2,
  wear: { dust: 0.55, dirt: 0.6, edges: 0.4 },
  fog: { at: [L + FW + L / 2, 1.2, D / 2], size: [L, 2.4, D], density: 0.05, color: "#d8cbb8" },
};
