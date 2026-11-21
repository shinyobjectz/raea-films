// The attics under the street fronts' mansards (t-irooms002). The world lane's roof (tools/world/facade.ts) puts a
// steep mansard over every street front, 3.0 m up at an inset of 1.0 m, with a dormer on every other window axis. What
// is behind a dormer: an attic flat (Mansardenwohnung), a maid's room (Mädchenkammer) under a better front building,
// or the house's drying loft (Trockenboden) with each flat's lattice store room (Bodenkammer). The first two are
// furnisher recipes with `attic-slope` (interiors/furnish.ts gives them the slope and a dormer); the loft is built here,
// like the cellar's slice, for the room atlas.
import type { Shell } from "./shell";
import type { Place, Room } from "./sets/types";

/** Plain numbers so tools can read them: the slope's knee wall and how far it leans in (a 66-degree pitch, the
 *  mansard's lower slope seen from inside, where the room's flat ceiling cuts it at about 2.4 m). */
export const MANSARD = { knee: 0.5, run: 0.85 } as const;
export const LOFT = { l: 4.2, d: 5.0, h: 2.4, cam_y: 1.35, dormer: { w: 0.9, h: 1.3, y: 0.55 } } as const;

const h32 = (s: number, k: number) => { let x = Math.imul((s * 1e6) | 0, 0x9e3779b1) ^ Math.imul(k + 1, 0x85ebca77); x ^= x >>> 15; x = Math.imul(x, 0x2c1b3c6d); x ^= x >>> 12; return (x >>> 0) / 4294967296; };

/** The drying loft behind a dormer: rafters down the slope, the flats' lattice store rooms along the back (their doors
 *  padlocked, a sledge and baskets behind the slats), sheets on two lines over the open floor, the chimney breast. Lit,
 *  someone's lantern hangs from a joist (it is seldom: a loft has no lamp of its own). Origin: the room's corner. */
export function atticLoft(seed: number, lit: boolean): Room {
  const { l, d, h, dormer: W } = LOFT, R = (k: number) => h32(seed, k);
  const shell: Shell = {
    l, d, h, t: { front: 0.38, back: 0.25, left: 0.38, right: 0.38 },
    walls: "brick-raw", floor: "boards", ceiling: "boards", seed: Math.floor(seed * 997),
    slope: { ...MANSARD, mat: "ceiling-boards" },
    openings: [{ wall: "front", u: l / 2, w: W.w, y: W.y, h: W.h, kind: "window" }],
  };
  const p: Place[] = [{ prop: "window-90x130", at: [l / 2, W.y, d], yaw: Math.PI }];
  for (let x = 0.3; x < l - 0.1; x += 0.9) if (Math.abs(x - l / 2) > 0.6) p.push({ prop: "rafter-mansard", at: [x, 0, d - 0.01], yaw: Math.PI });
  // the store rooms: a lattice front 1.5 m off the back wall, a door in it, one cross wall; what's kept behind it. The
  // box is 5 m deep (a loft runs the building's depth) so the lattice stands a metre from the cube's centre: nearer, its
  // slats fill the atlas faces
  const z = 1.5, door = 1.0 + R(1) * 0.9;
  p.push({ prop: "slats-1", at: [door - 0.5, 0, z], yaw: 0 }, { prop: "slats-door", at: [door + 0.45, 0, z], yaw: 0 });
  for (let x = door + 0.9; x < l - 0.4; x += 2.0) p.push({ prop: x + 2.0 <= l ? "slats-2" : "slats-1", at: [x + (x + 2.0 <= l ? 1.0 : 0.5), 0, z], yaw: 0 });
  p.push({ prop: "slats-x15", at: [door + 0.9 + 0.04, 0, 0.75], yaw: Math.PI / 2 });
  p.push({ prop: "sledge", at: [0.6, 0, 0.5], yaw: 0.2 }, { prop: "kiepe", at: [door + 1.6, 0, 0.45], yaw: -0.3 }, { prop: "attic-trunk", at: [l - 0.7, 0, 0.5], yaw: 0.1 });
  if (R(2) < 0.6) p.push({ prop: "crock", at: [door + 0.4, 0, 0.35], yaw: 0 });
  // the drying floor: a line of sheets in front of the cube's centre (over it, they would fill every face), the chimney
  // breast on the end wall, a trunk on the boards
  p.push({ prop: "washing-3.5", at: [l / 2 + (R(3) - 0.5) * 0.3, h - 0.12, 3.3], yaw: 0.02 });
  p.push({ prop: "chimney-breast", at: [0.2, 0, d / 2], yaw: Math.PI / 2 });
  p.push({ prop: "attic-trunk", at: [l - 0.6, 0, 3.4], yaw: Math.PI / 2 + 0.15, scale: 0.85 });
  if (lit) p.push({ prop: "stable-lantern", at: [1.3, h - 0.08, 2.9], name: "lantern", lit: true });
  return { id: "loft", shell, at: [0, 0, 0], props: p };
}
