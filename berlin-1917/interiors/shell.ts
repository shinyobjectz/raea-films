// A room's shell from its measured size and its openings: floor, walls (a dado below, paper or wash above), ceiling
// and skirting, each one solid per material so the bake merges it to one draw per material. The room's frame: x
// along the back wall (0..l), z from the back wall (0) to the front wall (d), y up from the floor (0..h). Walls stand
// outside that box, so the box is the room's clear inside, as the survey captions measure it.
import { crossSection, manifold, type Solid } from "raea/3d";
import { box, hash, noise3, union } from "./kit/geo";
import type { MatId } from "./kit/mats";
import type { Part } from "./kit/prop";

export type Wall = "back" | "front" | "left" | "right";
export type Opening = {
  wall: Wall;
  /** centre along the wall, metres from its left end as seen from inside the room */
  u: number;
  w: number;
  /** bottom above the floor, and height */
  y: number;
  h: number;
  kind: "window" | "door" | "hole" | "arch";
  /** floor across the wall's thickness under an opening at floor level, in the room's floor (the generated cellars'
   *  arches: without it the cut shows black between two rooms' floors) */
  threshold?: boolean;
  /** a hole's ragged edge, metres */
  rag?: number;
  /** a door's leaf: it hangs in this room and swings into it ("here"), or in the room behind ("there"), whose side
   *  of the doorway shows only its architrave; none, an open doorway (tools/city/bake.ts doorsOf) */
  leaf?: "here" | "there";
};
export type Shell = {
  l: number;
  d: number;
  h: number;
  /** wall thickness, per wall or one for all */
  t?: number | Partial<Record<Wall, number>>;
  walls: MatId;
  dado?: { mat: MatId; h: number };
  /** a stuccoed ceiling's cornice: three stepped bands round the walls under the ceiling, and a picture rail under them */
  cornice?: MatId;
  floor: "boards" | "parquet" | "brick" | "tiles" | "earth" | "snow" | "cement" | "sand";
  /** vault: Prussian caps between iron beams; barrel: a brick barrel vault (Tonnengewölbe) springing from the side
   *  walls at h, its radius half the width, as in a brewery's lager cellars and the old houses' cellars */
  /** battens: planks across the room with a half-round batten over every joint, painted (the porter's loft over the
   *  stable at Ritterstraße 120, z2_1917_MP_0075/0077: the plank ceiling of an outbuilding never plastered) */
  ceiling: "plaster" | "boards" | "battens" | "vault" | "barrel" | "none";
  /** a hole through the floor or the ceiling, its centre at x, z, w by d: a stair's well (the porter's spiral stair
   *  comes up through the loft's floor from the stable's vault) */
  hatches?: { in: "floor" | "ceiling"; x: number; z: number; w: number; d: number }[];
  /** a mansard's steep slope over the front wall: the wall rises `knee`, then the ceiling leans in `run` to meet the
   *  flat ceiling at h, in `mat` (the walls' own when plastered; boards under the slates in a drying loft). A window on
   *  the front wall becomes a dormer, its recess cut back through the slope (the street fronts' attics) */
  slope?: { knee: number; run: number; mat?: MatId };
  /** a vault's own finish (lime over the brick; a coal cellar's soot), when it differs from the walls' or the caps' whitewash */
  vaultMat?: MatId;
  /** which walls to leave out (the camera side of a set, a party wall drawn by its neighbour) */
  skip?: Wall[];
  openings?: Opening[];
  seed?: number;
};

const T = (s: Shell, w: Wall) => (typeof s.t === "number" ? s.t : s.t?.[w]) ?? (typeof s.t === "number" ? s.t : 0.38);

/** The cutter for an opening, in room coordinates: through the wall it sits in, with room to spare. */
function cutter(s: Shell, o: Opening): Solid {
  const t = T(s, o.wall) + 0.2;
  const along = o.wall === "back" || o.wall === "front";
  // u runs left to right seen from inside: on the back wall that's +x, on the front wall -x, left wall -z, right +z
  const x = o.wall === "back" ? o.u : o.wall === "front" ? s.l - o.u : o.wall === "left" ? -T(s, "left") / 2 : s.l + T(s, "right") / 2;
  const z = o.wall === "left" ? s.d - o.u : o.wall === "right" ? o.u : o.wall === "back" ? -T(s, "back") / 2 : s.d + T(s, "front") / 2;
  if (o.kind === "hole") {
    // a breakthrough: knocked out by hand, so an uneven oval, wider at the shoulders, its sill broken low
    const r = o.rag ?? 0.08;
    const blob = manifold.sphere(0.5).scale(o.w, o.h, t * 2).refineToLength(0.05).warp((px, py, pz) => {
      const n = noise3(px * 7, py * 7, pz * 3, s.seed ?? 1) * r;
      return [px * (1 + n), py * (1 + n * 0.8), pz];
    });
    return (along ? blob : blob.rotate(0, 90, 0)).move(x, o.y + o.h / 2, z);
  }
  const c = along ? box(o.w, o.h, t, x, o.y, z) : box(t, o.h, o.w, x, o.y, z);
  if (o.kind !== "arch") return c;
  const top = (along ? manifold.cylinder(o.w / 2, t) : manifold.cylinder(o.w / 2, t).rotate(0, 90, 0)).move(x, o.y + o.h, z);
  return c.union(top);
}

/** Walls as four slabs round the clear inside, split at the dado, the openings cut through both. */
export function shell(s: Shell): Part[] {
  const { l, d, h } = s;
  const tb = T(s, "back"), tf = T(s, "front"), tl = T(s, "left"), tr = T(s, "right");
  const slab = (w: Wall, y0: number, y1: number): Solid | null => {
    if (s.skip?.includes(w)) return null;
    const hh = y1 - y0;
    if (s.ceiling === "barrel" && y1 === h && (w === "back" || w === "front")) {
      // the end wall rises into the vault's lunette: a half disc over the springing line
      const end = box(l + tl + tr, hh, w === "back" ? tb : tf, (l + tr - tl) / 2, y0, w === "back" ? -tb / 2 : d + tf / 2);
      return end.union(lunette(l, h, w === "back" ? tb : tf).move(0, 0, w === "back" ? -tb : d));
    }
    if (w === "back") return box(l + tl + tr, hh, tb, (l + tr - tl) / 2, y0, -tb / 2);
    if (w === "front") return box(l + tl + tr, hh, tf, (l + tr - tl) / 2, y0, d + tf / 2);
    if (w === "left") return box(tl, hh, d, -tl / 2, y0, d / 2);
    return box(tr, hh, d, l + tr / 2, y0, d / 2);
  };
  const cuts = (s.openings ?? []).map((o) => cutter(s, o));
  const cut = (x: Solid | null) => (x && cuts.length ? x.minus(union(...cuts)) : x);
  const walls: Wall[] = ["back", "front", "left", "right"];
  const dh = s.dado?.h ?? 0;
  const upper = walls.map((w) => cut(slab(w, dh, h))).filter((x): x is Solid => !!x && !x.isEmpty());
  const parts: Part[] = upper.length ? [{ mat: s.walls, solid: union(...upper) }] : []; // every wall skipped: a display card
  if (s.dado) {
    const lower = walls.map((w) => cut(slab(w, 0, dh))).filter((x): x is Solid => !!x && !x.isEmpty());
    if (lower.length) parts.push({ mat: s.dado.mat, solid: union(...lower) });
  }
  if (s.cornice) {
    // the cornice: steps of 5, 8 and 10 cm down from the ceiling, projecting 5, 11 and 18 cm, along all four walls (their
    // ends overlap in the corners); the picture rail 0.62 m down. Cut by the openings like the walls.
    const band = (y: number, hh: number, p: number): Solid[] => [box(l, hh, p, l / 2, y, p / 2), box(l, hh, p, l / 2, y, d - p / 2), box(p, hh, d, p / 2, y, d / 2), box(p, hh, d, l - p / 2, y, d / 2)];
    const c = cut(union(...band(h - 0.1, 0.1, 0.18), ...band(h - 0.18, 0.08, 0.11), ...band(h - 0.23, 0.05, 0.05)));
    const rail = cut(union(...band(h - 0.62, 0.03, 0.025)));
    if (c && !c.isEmpty()) parts.push({ mat: s.cornice, solid: c, overlap: true });
    if (rail && !rail.isEmpty()) parts.push({ mat: "wood-dark", solid: rail, overlap: true });
  }
  if (s.slope) {
    // the slope as a wedge along the front wall, from the knee to the flat ceiling, cut back for each dormer
    const { knee, run } = s.slope, len = l + tl + tr;
    const wedge = crossSection.polygon([[-(d + 0.01), knee], [-(d + 0.01), h + 0.02], [-(d - run), h + 0.02]].reverse() as [number, number][])
      .extrude(len).rotate(0, 90, 0).move(-tl, 0, 0);
    const dormers = (s.openings ?? []).filter((o) => o.wall === "front" && o.kind === "window").map((o) => box(o.w, o.h + 0.12, run + 0.2, l - o.u, o.y, d - run / 2 + 0.05));
    const solid = dormers.length ? wedge.minus(union(...dormers)) : wedge;
    if (!solid.isEmpty()) parts.push({ mat: s.slope.mat ?? s.walls, solid });
  }
  const hatch = (ps: Part[], at: "floor" | "ceiling"): Part[] => {
    const hs = (s.hatches ?? []).filter((x) => x.in === at);
    if (!hs.length) return ps;
    const y0 = at === "floor" ? -0.4 : h - 0.6, cutBy = union(...hs.map((x) => box(x.w, 1.4, x.d, x.x, y0, x.z)));
    return ps.map((p) => ({ ...p, solid: p.solid.minus(cutBy) })).filter((p) => !p.solid.isEmpty());
  };
  parts.push(...hatch(floor(s), "floor"), ...hatch(ceiling(s), "ceiling"));
  // thresholds: the floor carried through the wall under an opening that asks for it
  const FLOOR_MAT: Record<Shell["floor"], MatId> = { boards: "floor-boards", parquet: "parquet", brick: "floor-cellar", tiles: "tile-floor", earth: "earth", snow: "snow", cement: "cement", sand: "sand" };
  const sills = (s.openings ?? []).filter((o) => o.threshold && o.y < 0.05 && !s.skip?.includes(o.wall)).map((o) => {
    const t = T(s, o.wall), along = o.wall === "back" || o.wall === "front";
    const x = o.wall === "back" ? o.u : o.wall === "front" ? s.l - o.u : o.wall === "left" ? -t / 2 : s.l + t / 2;
    const z = o.wall === "left" ? s.d - o.u : o.wall === "right" ? o.u : o.wall === "back" ? -t / 2 : s.d + t / 2;
    return along ? box(o.w + 0.02, 0.06, t, x, -0.06, z) : box(t, 0.06, o.w + 0.02, x, -0.06, z);
  });
  if (sills.length) parts.push({ mat: FLOOR_MAT[s.floor], solid: union(...sills), overlap: true });
  return parts;
}

function floor(s: Shell): Part[] {
  const { l, d } = s;
  if (s.floor === "boards") {
    // softwood boards 15 cm wide along x, a 3 mm black gap between each: what reads as a floor at eye height
    const b: Solid[] = [];
    for (let z = 0, i = 0; z < d; z += 0.153, i++) b.push(box(l, 0.025, Math.min(0.15, d - z), l / 2, -0.025 + hash(i, s.seed ?? 0) * 0.002, z + Math.min(0.15, d - z) / 2));
    return [{ mat: "floor-boards", solid: union(...b) }, { mat: "iron", solid: box(l, 0.02, d, l / 2, -0.04, d / 2) }];
  }
  if (s.floor === "parquet") {
    // Tafelparkett: oak squares of 0.5 m, five strips each, the strips turned a quarter in every other square (a
    // 2 mm gap between strips): the pattern reads from across a high room, where herringbone would cost four times as much
    const a: Solid[] = [], b: Solid[] = [], S = 0.5, n = 5, w = S / n;
    for (let i = 0; i * S < l; i++) for (let j = 0; j * S < d; j++) {
      const x0 = i * S, z0 = j * S, x1 = Math.min(l, x0 + S), z1 = Math.min(d, z0 + S), along = (i + j) % 2 === 0;
      for (let k = 0; k < n; k++) {
        const y = -0.022 + hash(i * 7 + k, j, s.seed ?? 0) * 0.0015;
        if (along) { const zz = z0 + k * w; if (zz < z1) a.push(box(x1 - x0 - 0.002, 0.022, Math.min(w, z1 - zz) - 0.002, (x0 + x1) / 2, y, zz + Math.min(w, z1 - zz) / 2)); }
        else { const xx = x0 + k * w; if (xx < x1) b.push(box(Math.min(w, x1 - xx) - 0.002, 0.022, z1 - z0 - 0.002, xx + Math.min(w, x1 - xx) / 2, y, (z0 + z1) / 2)); }
      }
    }
    return [{ mat: "parquet", solid: union(...a) }, { mat: "parquet-turned", solid: union(...b) }, { mat: "wood-dark", solid: box(l, 0.02, d, l / 2, -0.04, d / 2) }];
  }
  if (s.floor === "brick") {
    const b: Solid[] = [];
    for (let z = 0, r = 0; z < d; z += 0.125, r++) for (let x = (r % 2) * -0.13; x < l; x += 0.26) {
      const x0 = Math.max(0, x), x1 = Math.min(l, x + 0.25);
      if (x1 - x0 > 0.02) b.push(box(x1 - x0, 0.06, Math.min(0.12, d - z), (x0 + x1) / 2, -0.06 - hash(x * 10, r) * 0.008, z + Math.min(0.12, d - z) / 2));
    }
    return [{ mat: "floor-cellar", solid: union(...b) }, { mat: "mortar", solid: box(l, 0.05, d, l / 2, -0.07, d / 2) }];
  }
  if (s.floor === "tiles") return [{ mat: "tile-floor", solid: box(l, 0.03, d, l / 2, -0.03, d / 2) }];
  if (s.floor === "cement") return [{ mat: "cement", solid: box(l, 0.06, d, l / 2, -0.06, d / 2) }];
  if (s.floor === "sand") return [{ mat: "sand", solid: box(l, 0.06, d, l / 2, -0.06, d / 2) }];
  if (s.floor === "snow") return [{ mat: "snow", solid: box(l, 0.12, d, l / 2, -0.12, d / 2).refineToLength(0.4).warp((x, y, z) => [x, y > -0.01 ? y + 0.06 * noise3(x * 0.8, 0, z * 0.8, 3) + 0.08 * Math.max(0, 1 - Math.min(x, l - x, z, d - z) / 1.2) : y, z]) }];
  return [{ mat: "earth", solid: box(l, 0.05, d, l / 2, -0.05, d / 2) }];
}

const BARREL_T = 0.5, BARREL_SEG = 64;
/** The half disc closing a barrel vault's end, in the room's x-y, extruded `t` along z from 0. */
function lunette(l: number, h: number, t: number): Solid {
  const r = l / 2 + BARREL_T + 0.1, pts: [number, number][] = [];
  for (let k = 0; k <= BARREL_SEG; k++) { const a = (Math.PI * k) / BARREL_SEG; pts.push([l / 2 + r * Math.cos(a), h + r * Math.sin(a)]); }
  return crossSection.polygon(pts).extrude(t);
}

function ceiling(s: Shell): Part[] {
  const { l, d, h } = s;
  if (s.ceiling === "none") return [];
  if (s.ceiling === "barrel") {
    // a brick ring half a metre thick from wall to wall, extruded the room's depth: walls and vault are one masonry
    const r0 = l / 2, r1 = l / 2 + BARREL_T, pts: [number, number][] = [];
    for (let k = 0; k <= BARREL_SEG; k++) { const a = (Math.PI * k) / BARREL_SEG; pts.push([l / 2 + r1 * Math.cos(a), h + r1 * Math.sin(a)]); }
    for (let k = BARREL_SEG; k >= 0; k--) { const a = (Math.PI * k) / BARREL_SEG; pts.push([l / 2 + r0 * Math.cos(a), h + r0 * Math.sin(a)]); }
    return [{ mat: s.vaultMat ?? s.walls, solid: crossSection.polygon(pts).extrude(d) }];
  }
  if (s.ceiling === "plaster") return [{ mat: "plaster-ceiling", solid: box(l + 0.2, 0.05, d + 0.2, l / 2, h, d / 2) }];
  if (s.ceiling === "battens") {
    // rounded planks along x, 19 cm, edge to edge, each bellied 4 cm below the line with a dark groove at every joint:
    // the ribbed ceiling of both plates, a plank backing over them
    const b: Solid[] = [box(l, 0.03, d, l / 2, h + 0.01, d / 2)];
    for (let z = 0.095, i = 0; z < d; z += 0.19, i++)
      b.push(crossSection.circle(1).scale(0.097, 0.04 + hash(i, 7) * 0.006).extrude(l).rotate(0, 90, 0).move(0, h + 0.012, z));
    return [{ mat: "boards-painted", solid: union(...b) }];
  }
  if (s.ceiling === "boards") {
    const b: Solid[] = [];
    for (let x = 0, i = 0; x < l; x += 0.205, i++) b.push(box(Math.min(0.2, l - x), 0.03, d, x + Math.min(0.2, l - x) / 2, h + hash(i, 5) * 0.006, d / 2));
    const joists: Solid[] = [];
    for (let z = 0.4; z < d; z += 0.85) joists.push(box(l, 0.14, 0.12, l / 2, h - 0.14, z));
    return [{ mat: "ceiling-boards", solid: union(...b, ...joists) }];
  }
  // vault: the Prussian cap vault (Preußische Kappe), shallow brick arches between iron I-beams 1.2-1.5 m apart
  const bays = Math.max(1, Math.round(l / 1.35)), span = l / bays, rise = Math.min(0.16, span * 0.12);
  const spring = h - rise, arcs: Solid[] = [], beams: Solid[] = [];
  for (let i = 0; i < bays; i++) {
    const x0 = i * span, pts: [number, number][] = [];
    for (let k = 0; k <= 16; k++) { const u = k / 16; pts.push([x0 + u * span, spring + rise * Math.sin(Math.PI * u)]); }
    pts.push([x0 + span, h + 0.25], [x0, h + 0.25]);
    arcs.push(crossSection.polygon(pts).extrude(d).move(0, 0, 0));
  }
  const ib = crossSection.polygon([[-0.045, 0], [0.045, 0], [0.045, 0.012], [0.004, 0.012], [0.004, 0.148], [0.045, 0.148], [0.045, 0.16], [-0.045, 0.16], [-0.045, 0.148], [-0.004, 0.148], [-0.004, 0.012], [-0.045, 0.012]]);
  for (let i = 1; i < bays; i++) beams.push(ib.extrude(d).move(i * span, spring - 0.05, 0));
  return [{ mat: s.vaultMat ?? "brick-wash", solid: union(...arcs) }, ...(beams.length ? [{ mat: "iron-rust" as MatId, solid: union(...beams) }] : [])];
}
