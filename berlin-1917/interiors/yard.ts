// The Hinterhof dressed (kit/yard.ts): the hero court under the kitchen window (sets/kitchen.ts KITCHEN_DAY,
// "a Hinterhof in sun: laundry frozen on the lines, the organ grinder at the crank, a window opens
// above"), and the rule that dresses any court in the city (map/1917/open.geojson) from the same pieces.
//
// History that sets the layout: the washing dried on posts at head height in the court, or in the drying loft (attic.ts);
// lines across the upper storeys are Naples, not Berlin, where the house rules forbade washing hung from windows. The
// carpet rack stood in every court, beaten on the rules' days. The dust chests stood by the passage, for the carts. A
// Berlin window is a box window (Kastenfenster): its outer sashes open outward, into the court.
import type { V3 } from "./kit/geo";
import type { Place } from "./sets/types";

// kit/geo.ts's hash, copied: this file loads in bun (the world lane's bake), which can't load the kit's raea/3d
function hash(...n: number[]): number {
  let h = 2166136261;
  for (const v of n) { h ^= Math.floor(v * 1000) | 0; h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** The kitchen set's court, in the court's own frame: x 0-11.5 across, z 0 at the kitchen's wall to 9.5 at the rear
 *  building (its arch at x 5.75), y 0 on the court's floor. The organ stands where the world lane's grinder plays
 *  (raea-bf's man at court (5.1, 0, 4.8), so the crank faces him: the organ's painted front up to the window). */
export const HERO_COURT = { W: 11.5, D: 9.5, organ: [5.8, 0, 4.72] as V3 };

export function heroCourtProps(): Place[] {
  const { W, D } = HERO_COURT, p: Place[] = [];
  p.push({ prop: "barrel-organ", at: HERO_COURT.organ, yaw: Math.PI });
  // the washing: two pairs of posts, the right half's across the court's middle, the left half's toward the rear
  p.push({ prop: "washing-posts", at: [8.45, 0, 6.6], yaw: 0.04 }, { prop: "washing-posts", at: [3.1, 0, 7.4], yaw: -0.05 });
  p.push({ prop: "carpet-rack", at: [1.25, 0, 4.4], yaw: Math.PI / 2 });
  // by the arch: the dust chests to its right, the pump and the house rules to its left
  p.push({ prop: "dust-chest", at: [8.0, 0, D - 0.45], yaw: Math.PI }, { prop: "dust-chest", at: [9.4, 0, D - 0.45], yaw: Math.PI + 0.04 });
  p.push({ prop: "court-pump", at: [1.3, 0, 8.6], yaw: Math.PI / 2 });
  p.push({ prop: "house-rules", at: [4.15, 1.45, D - 0.02], yaw: Math.PI });
  // the right wing: the cellar's neck, coal sacks by it, a handcart tipped on its drawbar
  p.push({ prop: "cellar-neck", at: [W - 0.75, 0, 3.6], yaw: -Math.PI / 2 });
  p.push({ prop: "coal-sacks", at: [W - 0.32, 0, 5.3], yaw: -Math.PI / 2 });
  p.push({ prop: "handcart", at: [9.9, 0, 2.2], yaw: 0.5 });
  // snow shovelled to the walls
  p.push({ prop: "snow-bank", at: [0.5, 0, 1.9], yaw: Math.PI / 2 }, { prop: "snow-bank", at: [3.25, 0, D - 0.5], yaw: Math.PI });
  p.push({ prop: "snow-bank", at: [7.6, 0, 0.5], yaw: 0.02 }, { prop: "snow-bank", at: [W - 0.5, 0, 7.6], yaw: -Math.PI / 2, scale: 0.8 });
  return [...p, ...heroWindow(0.6)];
}

/** The window that opens: the rear building's third storey, over the arch (court x 5.7, sill 8.3 m, 1.05 m wide), its
 *  two outer sashes swinging out into the court. `open` 0 shut, 1 at 100 degrees; the left sash leads, the right
 *  follows a beat later, as one pushes both. A composition animates it by frame. */
export function heroWindow(open: number): Place[] {
  const cx = 5.7, w = 1.05, sill = 8.3, z = HERO_COURT.D - 0.03;
  const a = (k: number) => Math.max(0, Math.min(1, k)) * (100 * Math.PI) / 180;
  return [
    { prop: "casement-leaf", at: [cx + w / 2, sill, z], yaw: Math.PI - a(open * 1.15), name: "sash-a" },
    { prop: "casement-leaf", at: [cx - w / 2, sill, z], yaw: a(open * 1.15 - 0.15), name: "sash-b" },
  ];
}

// the pieces' footprints, width (x) by depth (z) in m, as kit/yard.ts and kit/stair.ts size them
const FOOT: Record<string, [number, number]> = {
  "carpet-rack": [2.6, 0.1], "dust-chest": [1.3, 0.8], "court-pump": [0.72, 1.2], "court-pump-wood": [0.72, 1.0], "rabbit-hutch": [1.78, 0.84], "rabbit-hutch-single": [1.11, 0.8], "hen-coop": [1.28, 0.72], "poultry-crate": [1.14, 0.59], "privy-block": [4.66, 1.95], "privy-boards": [2.2, 1.6], "washing-posts": [5.2, 1.0], "barrel-organ": [1.4, 0.9],
  handcart: [1.1, 2.2], "coal-sacks": [1.4, 0.6], "snow-bank": [3.0, 0.9], "cellar-neck": [1.3, 1.5], "house-rules": [0.45, 0.03],
};

/** A court of the city, dressed by rule. `edges` are its walls in order (court frame: metres, y up, the floor at 0),
 *  `passage` the index of the wall with the way out to the street (or the front court), `area` its floor in m2. The
 *  rule, from the courts photographed 1900-1920 (Zille, the housing survey's plates):
 *  - every court has a carpet rack, along its longest wall clear of the passage;
 *  - two dust chests by the passage (three in a court of more than 150 m2);
 *  - washing on posts in a court of 60 m2 or more, one pair per 80 m2, at most three; frozen in December-February;
 *  - a pump in one court in three (the rest had water in the flats by 1917, a pump kept for the yard);
 *  - a cellar's neck on one wall in two, coal sacks by it in the coal months;
 *  - snow banked along two or three walls in winter;
 *  - a handcart in one court in four, the house rules by the passage.
 *  - in the war years, hutches against a wall in one court in three, a hen pen or a crate in one in six (ASSUMED shares;
 *    the AOK survey photographed hens penned in a cellar flat in 1909 and a poultry crate in a court in 1908);
 *  - a privy in one court in five, at the far end of a wall: brick in a sewered court, boards over a pit in two of
 *    five (ASSUMED shares; in 1922 more than half of the sick fund's tenants still used a landing closet or a court's);
 *  Placements are in the court's frame; the world lane maps them to the city's (tools/world/bake.ts). */
export function dressCourt(edges: [number, number][], passage: number, area: number, seed: number, winter = true): Place[] {
  if (edges.length < 3 || area < 40) return []; // a light well: nothing stands in it
  const r = (k: number) => hash(seed, k, 911), p: Place[] = [];
  const n = edges.length;
  // the ring's turn, from its signed area in (x, z): either winding works, and the inward normal follows from it
  let twice = 0;
  for (let i = 0; i < n; i++) twice += edges[i][0] * edges[(i + 1) % n][1] - edges[(i + 1) % n][0] * edges[i][1];
  const s = twice > 0 ? 1 : -1;
  const wall = (i: number) => {
    const a = edges[i % n], b = edges[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
    return { a, b, len, ux: dx / len, uz: dz / len, nx: (-dz / len) * s, nz: (dx / len) * s };
  };
  const at = (i: number, u: number, off: number): { at: V3; yaw: number } => {
    const w = wall(i);
    return { at: [w.a[0] + w.ux * u + w.nx * off, 0, w.a[1] + w.uz * u + w.nz * off], yaw: Math.atan2(w.nx, w.nz) };
  };
  const walls = Array.from({ length: n }, (_, i) => i);
  const byLen = walls.filter((i) => i !== passage).sort((i, j) => wall(j).len - wall(i).len);
  // by the passage: the chests to one side, the rules on the wall to the other. A closed court (passage -1: a light well
  // or a court reached only through the houses) has neither: its rubbish went out through the house
  const pw = passage >= 0 ? wall(passage) : { len: 0 };
  const chests = area > 150 ? 3 : 2;
  for (let k = 0; k < chests && pw.len > 3.2; k++) p.push({ prop: "dust-chest", ...at(passage, pw.len * 0.5 + 1.6 + k * 1.4, 0.45) });
  if (pw.len > 3) {
    const q = at(passage, pw.len * 0.5 - 1.6, 0.02);
    p.push({ prop: "house-rules", at: [q.at[0], 1.45, q.at[2]], yaw: q.yaw });
  }
  // the carpet rack along the longest wall, 1.2 m off it
  const lw = wall(byLen[0]);
  if (lw.len > 3.5) p.push({ prop: "carpet-rack", ...at(byLen[0], lw.len * (0.3 + 0.4 * r(1)), 1.2), yaw: at(byLen[0], 0, 0).yaw });
  // washing posts across the court's middle, parallel to the longest wall
  const pairs = area < 60 ? 0 : Math.min(3, Math.floor(area / 80) + 1);
  for (let k = 0; k < pairs && byLen.length; k++) {
    const off = 2.4 + k * 1.9;
    if (lw.len < 5.6 || off > Math.sqrt(area) - 1.2) break;
    p.push({ prop: "washing-posts", ...at(byLen[0], lw.len * 0.5 + (r(10 + k) - 0.5) * (lw.len - 5.4), off), yaw: at(byLen[0], 0, 0).yaw + (r(20 + k) - 0.5) * 0.1 });
  }
  if (r(2) < 1 / 3 && byLen[1] !== undefined) p.push({ prop: r(901) < 0.35 ? "court-pump-wood" : "court-pump", ...at(byLen[1], 0.9, 0.45) }); // Zille's wooden one in about a third of the courts that keep a pump (ASSUMED share)
  if (r(3) < 0.5 && byLen[1] !== undefined) {
    const cw = byLen[1], len = wall(cw).len;
    p.push({ prop: "cellar-neck", ...at(cw, len * 0.65, 0.75) });
    if (winter) p.push({ prop: "coal-sacks", ...at(cw, Math.min(len - 0.8, len * 0.65 + 1.4), 0.32) });
  }
  if (r(4) < 0.25 && byLen[2] !== undefined) p.push({ prop: "handcart", ...at(byLen[2], wall(byLen[2]).len * 0.4, 1.2), yaw: at(byLen[2], 0, 0).yaw + 0.5 });
  const pv = byLen[2] ?? byLen[1]; // the far end of the wall the hutches start (a cellar's neck takes the second wall's)
  if (r(906) < 1 / 5 && pv !== undefined) {
    const boards = r(907) < 0.4, [pw2] = FOOT[boards ? "privy-boards" : "privy-block"], len = wall(pv).len;
    if (len > pw2 + 1.2) p.push({ prop: boards ? "privy-boards" : "privy-block", ...at(pv, len - pw2 / 2 - 0.4, (boards ? 0.65 : 0.74) + 0.02) });
  }
  // the war's small livestock, backed against a wall (the keys from 900 up stay clear of r(30 + i) on a many-sided court)
  const pens = byLen[2] ?? byLen[1];
  if (r(902) < 1 / 3 && pens !== undefined) {
    const one = r(903) < 0.3;
    p.push({ prop: one ? "rabbit-hutch-single" : "rabbit-hutch", ...at(pens, wall(pens).len * 0.22, one ? 0.42 : 0.44) });
  }
  if (r(904) < 1 / 6 && byLen[0] !== undefined) {
    const hen = r(905) < 0.5;
    p.push({ prop: hen ? "hen-coop" : "poultry-crate", ...at(byLen[0], wall(byLen[0]).len * 0.12 + 0.7, hen ? 0.38 : 0.31) });
  }
  if (winter) {
    const banks = byLen.slice(0, 2 + (r(5) < 0.5 ? 1 : 0));
    for (const i of banks) if (wall(i).len > 3.4) p.push({ prop: "snow-bank", ...at(i, 1.7 + r(30 + i) * (wall(i).len - 3.4), 0.5) });
  }
  // in the order placed, a piece whose footprint meets one already kept is dropped (the rule places them independently)
  const kept: Place[] = [];
  for (const q of p) {
    const [w, d] = FOOT[q.prop] ?? [0.5, 0.5], c = Math.cos(q.yaw ?? 0), s2 = Math.sin(q.yaw ?? 0);
    const ex = Math.abs(c) * w / 2 + Math.abs(s2) * d / 2, ez = Math.abs(s2) * w / 2 + Math.abs(c) * d / 2;
    const hit = kept.some((k) => {
      const [kw, kd] = FOOT[k.prop] ?? [0.5, 0.5], kc = Math.cos(k.yaw ?? 0), ks = Math.sin(k.yaw ?? 0);
      const kx = Math.abs(kc) * kw / 2 + Math.abs(ks) * kd / 2, kz = Math.abs(ks) * kw / 2 + Math.abs(kc) * kd / 2;
      return Math.abs(q.at[0] - k.at[0]) < ex + kx && Math.abs(q.at[2] - k.at[2]) < ez + kz;
    });
    if (!hit) kept.push(q);
  }
  return kept;
}
