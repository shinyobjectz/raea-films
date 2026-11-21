// The Spree crossing at Friedrichstraße in winter 1917-18, as the map lane placed it (map/1917/bridges.geojson,
// kind "works"; research/bridges-1917.tsv has the sources): no Weidendammer Brücke (its 1896 superstructure taken
// down in 1914 for the Nord-Süd-Bahn's tunnel under the river, the street's traffic over a temporary bridge
// downstream, the works halted in 1917 for want of men and material; rebuilt and reopened 19 Dec 1923).
//   Drawn from the layer: the Hilfsbrücke (a low steel through-truss about 3 m deep, 10 m wide, deck at street level,
//   on its line 22 m downstream: all three the map lane's read of Missmann's 1914 photograph, marked so there); the
//   old south abutment and south river pier (1896, narrow, granite-clad); the new north river pier and north abutment
//   (1914-16, each two foundations either side of the tunnel, inner faces 12.50 m apart, heads 1.50 m longer than the
//   old, bare: their granite went on only in the rebuild); the north section's cofferdam (whether it still stood that
//   winter isn't stated; the map lane reads it as standing, and so does this).
//   ASSUMED (named here so a figure can replace it): the truss's panel and its members, the pile bents under the
//   temporary bridge (75 m over the water can't be one 3 m-deep span), the piers' thickness and their tops, the
//   abutments' depth into the bank, the cofferdam's margin round the north works, its sheet piling's height and its
//   timber walkway.
//   used by bake.ts: bridges(...) -> assets/world/<slice>/bridges.glb, drawn at every distance (a few thousand tris).
import { Builder } from "./glb";
import { P } from "./geom";
import { SURF } from "./facade";

type V3 = [number, number, number];
type Pt = [number, number];
type Feature = { geometry: { type: string; coordinates: any }; properties: Record<string, any> };

export const ASSUMED = {
  /** the truss: panel length, depth over the deck (the layer's "about 3 m"), its members' section */
  panel: 4.2, depth: 3.0, member: 0.26, chord: 0.36,
  /** the deck: planking over cross girders, its edge girder's depth */
  deckThick: 0.25, girder: 0.8,
  /** pile bents under the temporary bridge: at most this far apart, piles a bent, a pile's diameter */
  bentEvery: 16, piles: 5, pile: 0.35,
  /** the old and new river piers' thickness across the axis, their tops under the old deck's line */
  pierThick: 2.6, pierTopBelowStreet: 1.8, cutwater: 2.0,
  /** the abutments: depth back into the bank, top under the street */
  abutDepth: 3.5, abutTopBelowStreet: 1.0,
  /** the cofferdam: margin round the north pier and abutment, the sheet piling's top over the water, the rib pitch */
  damMargin: 2.5, damTop: 1.1, rib: 0.5, ribDepth: 0.12,
  /** the timber walkway on the cofferdam's piling */
  walk: 1.2,
  /** the riverbed under the water (the bake's lattice carves the river to 2.5 m) */
  bed: 2.5,
};

const lin = (hex: string) => [1, 3, 5].map((i) => {
  const s = parseInt(hex.slice(i, i + 2), 16) / 255;
  return Math.round((s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4) * 255);
});
const STEEL = [...lin("#4b524e"), SURF.iron], GRANITE = [...lin("#8f8d88"), SURF.rustic], RAW = [...lin("#9a958a"), SURF.plaster];
const PILING = [...lin("#3c3a36"), SURF.iron], TIMBER = [...lin("#6b5640"), SURF.wood], PLANK = [...lin("#5a4a38"), SURF.wood];

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
/** A quad facing `hint` (scene frame), its winding flipped if it faces away. */
function face(B: Builder, q: V3[], hint: V3, col: number[]) {
  let [a, b, c, d] = q, n = unit(cross(sub(b, a), sub(d, a)));
  let uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
  if (dot(n, hint) < 0) { [b, d] = [d, b]; n = mul(n, -1); uv = [uv[0], uv[3], uv[2], uv[1]]; }
  B.quad(a, b, c, d, n, col, uv);
}
/** A beam of section w x h between two scene points (its four long faces). */
function beam(B: Builder, a: V3, b: V3, w: number, h: number, col: number[]) {
  const u = unit(sub(b, a));
  let side = cross(u, [0, 1, 0]);
  if (Math.hypot(...side) < 1e-3) side = [1, 0, 0];
  side = unit(side);
  const up = unit(cross(side, u)), s = mul(side, w / 2), t = mul(up, h / 2);
  const c = (p: V3, i: number, j: number) => add(add(p, mul(s, i)), mul(t, j));
  for (const [i0, j0, i1, j1, n] of [[-1, 1, 1, 1, up], [1, 1, 1, -1, side], [1, -1, -1, -1, mul(up, -1)], [-1, -1, -1, 1, mul(side, -1)]] as [number, number, number, number, V3][])
    face(B, [c(a, i0, j0), c(a, i1, j1), c(b, i1, j1), c(b, i0, j0)], n, col);
}
/** A solid from a footprint (map points, any winding) between two heights (m NHN): its sides and top. */
function solid(B: Builder, ring: Pt[], z0: number, z1: number, col: number[]) {
  const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length, cy = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    face(B, [P(a[0], a[1], z0), P(b[0], b[1], z0), P(b[0], b[1], z1), P(a[0], a[1], z1)], [m[0] - cx, 0, -(m[1] - cy)], col);
  }
  // the top as a fan (the footprints here are convex), each triangle wound to face up
  const c = P(cx, cy, z1);
  for (let i = 0; i < ring.length; i++) {
    let a = P(ring[i][0], ring[i][1], z1), b = P(ring[(i + 1) % ring.length][0], ring[(i + 1) % ring.length][1], z1);
    if (cross(sub(a, c), sub(b, c))[1] < 0) [a, b] = [b, a];
    const i0 = B.vertex(c, [0, 1, 0], col), i1 = B.vertex(a, [0, 1, 0], col), i2 = B.vertex(b, [0, 1, 0], col);
    B.tri(i0, i1, i2);
  }
}

/** The crossing's works. `ground(e, n)` is the bake's street (m NHN), `level` the river's surface there. */
export function weidendammer(features: Feature[], ground: (e: number, n: number) => number, level: number) {
  const F = new Builder(0, true);
  const works = features.filter((f) => f.properties.kind === "works" && /Weidendammer/.test(f.properties.of ?? ""));
  const part = (name: string) => works.find((f) => f.properties.part === name)?.geometry.coordinates as Pt[] | undefined;
  const log: string[] = [];
  const bed = level - ASSUMED.bed;

  // ---------- the Hilfsbrücke
  const hb = part("temporary bridge (Hilfsbrücke)"), hbF = works.find((f) => /temporary/.test(f.properties.part));
  if (hb && hbF) {
    const [a, b] = [hb[0], hb[hb.length - 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const t: Pt = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], o: Pt = [-t[1], t[0]], W = (hbF.properties.width_m as number) ?? 10;
    const za = ground(a[0], a[1]), zb = ground(b[0], b[1]);
    const at = (s: number, off: number, up: number): V3 => P(a[0] + t[0] * s + o[0] * off, a[1] + t[1] * s + o[1] * off, za + (zb - za) * (s / L) + up);
    // the deck: planking on cross girders, an edge girder each side
    face(F, [at(0, W / 2, 0), at(L, W / 2, 0), at(L, -W / 2, 0), at(0, -W / 2, 0)], [0, 1, 0], PLANK);
    face(F, [at(0, W / 2, -ASSUMED.girder), at(L, W / 2, -ASSUMED.girder), at(L, -W / 2, -ASSUMED.girder), at(0, -W / 2, -ASSUMED.girder)], [0, -1, 0], STEEL);
    for (const sd of [1, -1]) {
      const n = P(o[0] * sd, o[1] * sd, 0), z = P(0, 0, 0), out: V3 = sub(n, z);
      face(F, [at(0, sd * W / 2, -ASSUMED.girder), at(L, sd * W / 2, -ASSUMED.girder), at(L, sd * W / 2, ASSUMED.deckThick), at(0, sd * W / 2, ASSUMED.deckThick)], out, STEEL);
    }
    // the two trusses: chords, a vertical at each panel point, diagonals falling toward the middle (a Pratt truss)
    const panels = Math.max(2, Math.round(L / ASSUMED.panel)), pl = L / panels, D = ASSUMED.depth;
    for (const sd of [1, -1]) {
      const y = sd * (W / 2 + 0.2);
      beam(F, at(0, y, 0.15), at(L, y, 0.15), ASSUMED.chord, ASSUMED.chord, STEEL);
      beam(F, at(pl, y, D), at(L - pl, y, D), ASSUMED.chord, ASSUMED.chord, STEEL);
      beam(F, at(0, y, 0.15), at(pl, y, D), ASSUMED.chord, ASSUMED.chord, STEEL); // the end posts, raked
      beam(F, at(L, y, 0.15), at(L - pl, y, D), ASSUMED.chord, ASSUMED.chord, STEEL);
      for (let k = 1; k < panels; k++) {
        beam(F, at(k * pl, y, 0.15), at(k * pl, y, D), ASSUMED.member, ASSUMED.member, STEEL);
        if (k < panels - 1) {
          const toMid = k * pl < L / 2 ? 1 : -1, k2 = k + toMid;
          if (k2 > 0 && k2 < panels) beam(F, at(k * pl, y, D), at(k2 * pl, y, 0.15), ASSUMED.member * 0.8, ASSUMED.member * 0.8, STEEL);
        }
      }
    }
    // the pile bents under it: the water's width split at most ASSUMED.bentEvery, timber piles from the bed to the girders
    const wet0 = 4, wet1 = L - 4, bents = Math.max(1, Math.ceil((wet1 - wet0) / ASSUMED.bentEvery) - 1);
    for (let k = 1; k <= bents; k++) {
      const s = wet0 + ((wet1 - wet0) * k) / (bents + 1), top = za + (zb - za) * (s / L) - ASSUMED.girder;
      for (let j = 0; j < ASSUMED.piles; j++) {
        const off = -W / 2 + 0.5 + ((W - 1) * j) / (ASSUMED.piles - 1);
        const base = at(s, off, 0), p0: V3 = [base[0], bed, base[2]], p1: V3 = [base[0], top, base[2]];
        beam(F, p0, p1, ASSUMED.pile, ASSUMED.pile, TIMBER);
      }
      beam(F, at(s, -W / 2, -ASSUMED.girder - 0.2), at(s, W / 2, -ASSUMED.girder - 0.2), 0.35, 0.35, TIMBER); // the cap
    }
    log.push(`the Hilfsbrücke ${L.toFixed(0)} m, ${panels} panels, ${bents} pile bents`);
  }

  // ---------- the piers and abutments: each bearing line runs along the stream, the old deck's 22.52 m
  const axis = part("old axis");
  const axDir: Pt | null = axis ? (() => { const [a, b] = [axis[0], axis[axis.length - 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; })() : null;
  /** a pier or abutment on a bearing line: `towardBank` +1 or -1 along the old axis for an abutment's depth, 0 for a
   *  river pier (thick both ways, with cutwaters at its ends); `gap` splits it either side of the tunnel's axis */
  const bearing = (name: string, col: number[], top: number, towardBank: number, extend: number, gap: number) => {
    const ln = part(name);
    if (!ln || !axDir) return;
    let [a, b] = [ln[0], ln[ln.length - 1]];
    const L0 = Math.hypot(b[0] - a[0], b[1] - a[1]), u: Pt = [(b[0] - a[0]) / L0, (b[1] - a[1]) / L0];
    a = [a[0] - u[0] * extend / 2, a[1] - u[1] * extend / 2];
    b = [b[0] + u[0] * extend / 2, b[1] + u[1] * extend / 2];
    const L = L0 + extend, T = ASSUMED.pierThick;
    const [d0, d1] = towardBank === 0 ? [-T / 2, T / 2] : towardBank > 0 ? [-0.6, ASSUMED.abutDepth] : [-ASSUMED.abutDepth, 0.6];
    const pt = (s: number, d: number): Pt => [a[0] + u[0] * s + axDir[0] * d, a[1] + u[1] * s + axDir[1] * d];
    // the tunnel's axis crosses the line here (its s); the new works stand either side of a gap round it
    const ax = axis![0], cr = (p: Pt, q: Pt) => p[0] * q[1] - p[1] * q[0];
    const sAx = cr([ax[0] - a[0], ax[1] - a[1]], axDir) / cr(u, axDir);
    const spans: [number, number][] = gap > 0 ? [[0, Math.max(0.5, sAx - gap / 2)], [Math.min(L - 0.5, sAx + gap / 2), L]] : [[0, L]];
    for (const [s0, s1] of spans) {
      const ring: Pt[] = towardBank === 0
        ? [pt(s0, d0), pt(s1, d0), ...(s1 >= L - 1e-6 ? [pt(s1 + ASSUMED.cutwater, 0)] : []), pt(s1, d1), pt(s0, d1), ...(s0 <= 1e-6 ? [pt(s0 - ASSUMED.cutwater, 0)] : [])]
        : [pt(s0, d0), pt(s1, d0), pt(s1, d1), pt(s0, d1)];
      solid(F, ring, bed, top, col);
    }
    log.push(`${name}${gap ? " (two foundations)" : ""}`);
  };
  if (axis && axDir) {
    const [a, b] = [axis[0], axis[axis.length - 1]];
    const zS = ground(a[0], a[1]), zN = ground(b[0], b[1]);
    // the old deck ran from the south bank (a) to the north (b); an abutment's depth runs back into its own bank
    bearing("south abutment", GRANITE, zS - ASSUMED.abutTopBelowStreet, -1, 0, 0);
    bearing("south river pier", GRANITE, (zS + zN) / 2 - ASSUMED.pierTopBelowStreet, 0, 0, 0);
    bearing("north river pier", RAW, (zS + zN) / 2 - ASSUMED.pierTopBelowStreet, 0, 1.5, 12.5);
    bearing("north abutment", RAW, zN - ASSUMED.abutTopBelowStreet, 1, 1.5, 12.5);
  }

  // ---------- the north section's cofferdam: sheet piling round the north pier and abutment, a timber walk on it
  const np = part("north river pier"), na = part("north abutment");
  if (np && na && axDir) {
    const all = [...np, ...na], m = ASSUMED.damMargin;
    const u: Pt = (() => { const [a, b] = [np[0], np[np.length - 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; })();
    const o = all[0], S = all.map((p) => (p[0] - o[0]) * u[0] + (p[1] - o[1]) * u[1]), A = all.map((p) => (p[0] - o[0]) * axDir[0] + (p[1] - o[1]) * axDir[1]);
    const s0 = Math.min(...S) - m - 0.75, s1 = Math.max(...S) + m + 0.75, a0 = Math.min(...A) - m - ASSUMED.pierThick / 2, a1 = Math.max(...A) - 0.5;
    const q = (s: number, d: number): Pt => [o[0] + u[0] * s + axDir[0] * d, o[1] + u[1] * s + axDir[1] * d];
    // three sides in the river; the fourth is the north bank's quay
    const path: Pt[] = [q(s0, a1), q(s0, a0), q(s1, a0), q(s1, a1)];
    const top = level + ASSUMED.damTop;
    let ribs = 0;
    for (let i = 0; i + 1 < path.length; i++) {
      const [p0, p1] = [path[i], path[i + 1]], L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      const t: Pt = [(p1[0] - p0[0]) / L, (p1[1] - p0[1]) / L], n: Pt = [t[1], -t[0]];
      const k = Math.max(1, Math.round(L / ASSUMED.rib));
      // the piling's pans, in and out by turns (its corrugation), seen from both sides
      for (let j = 0; j < k; j++) {
        const e0 = (j % 2 ? 1 : -1) * ASSUMED.ribDepth / 2, e1 = -e0;
        const x0: Pt = [p0[0] + t[0] * (L * j) / k + n[0] * e0, p0[1] + t[1] * (L * j) / k + n[1] * e0];
        const x1: Pt = [p0[0] + t[0] * (L * (j + 1)) / k + n[0] * e1, p0[1] + t[1] * (L * (j + 1)) / k + n[1] * e1];
        const qd: V3[] = [P(x0[0], x0[1], bed), P(x1[0], x1[1], bed), P(x1[0], x1[1], top), P(x0[0], x0[1], top)];
        for (const sd of [1, -1]) face(F, qd, [n[0] * sd, 0, -n[1] * sd], PILING);
        ribs++;
      }
      // the walk on the piling: planks on the inside, a rail on posts on the river side
      const wIn: Pt = [-n[0] * ASSUMED.walk, -n[1] * ASSUMED.walk], z = top + 0.15;
      face(F, [P(p0[0], p0[1], z), P(p1[0], p1[1], z), P(p1[0] + wIn[0], p1[1] + wIn[1], z), P(p0[0] + wIn[0], p0[1] + wIn[1], z)], [0, 1, 0], PLANK);
      beam(F, P(p0[0], p0[1], z + 1.0), P(p1[0], p1[1], z + 1.0), 0.08, 0.08, TIMBER);
      for (let j = 0; j <= Math.floor(L / 2.5); j++) {
        const x: Pt = [p0[0] + t[0] * Math.min(L, j * 2.5), p0[1] + t[1] * Math.min(L, j * 2.5)];
        beam(F, P(x[0], x[1], top), P(x[0], x[1], z + 1.0), 0.1, 0.1, TIMBER);
      }
    }
    log.push(`the cofferdam (${ribs} pans of piling)`);
  }
  return { F, log: `${log.join(", ")}; ${F.indices.length / 3} tris` };
}

// ---------- the stone arch bridges standing in 1917 (map/1917/bridges.geojson, kind "bridge", state "standing"), the
// Schloßbrücke first: Schinkel's three segmental arches (the middle vaulted in concrete in 1912 to match, so three in
// 1917), faced in sandstone, round cutwaters, a cornice, the parapet's stone base and its cast-iron panels (1824), and
// over each pier and at each end a red granite plinth and marble pedestal carrying a marble group (1847-57, greyed by
// coal smoke). The layer gives the spans, the piers, the width and the groups' height; ARCH's figures are read off
// the Stahl photograph of its downstream face (media/research/bridges/, the 4.40 m pier as the scale, about 32 px a
// metre) or assumed, and named so a figure can replace them.
export const ARCH = {
  /** off the photograph: the springing over the water, the cutwaters' tops over it, the arches' rise over their span,
   *  the arch ring's depth on the face and how proud it stands, the parapet's stone base and iron panels, a pedestal's
   *  width against the pier's */
  spring: 2.0, cutwaterTop: 3.3, riseK: 0.21, ring: 0.8, ringProud: 0.06, parapetBase: 0.3, parapetIron: 0.85, pedestalK: 0.55,
  /** ASSUMED: the cornice under the parapet, the parapet's thickness, the pedestal's granite plinth and marble cap (the
   *  layer: a group about 3 m, 6 m with the pedestal), the two-armed lamp standards near the ends */
  cornice: 0.35, corniceOut: 0.25, parapet: 0.5, plinth: 0.7, plinthOut: 0.2, shaft: 2.0, cap: 0.3, capOut: 0.15, group: 3.0,
  lamp: 5.6, lampArm: 0.9, lampFromEnd: 4.0,
};
const SANDSTONE = [...lin("#958b78"), SURF.rustic], RED_GRANITE = [...lin("#7a625b"), SURF.rustic], MARBLE = [...lin("#a39f96"), SURF.plaster];
const IRON = [...lin("#2a2b29"), SURF.iron], GLOBE = [...lin("#d8d2c0"), SURF.flat];

export type ArchSpec = { name: string; spans: number[]; pier: number; groups: boolean };
/** The bridges built here, by the layer's name, with the layer's figures. */
export const ARCH_BRIDGES: ArchSpec[] = [{ name: "Schloßbrücke", spans: [11.2, 11.7, 11.2], pier: 4.4, groups: true }];

export type ArchLayout = {
  spec: ArchSpec; c: Pt; u: Pt; v: Pt; s0: number; s1: number; w0: number; w1: number; ring: Pt[];
  at: (s: number, w: number) => Pt; frame: (x: number, y: number) => Pt;
};
/** Where a bridge stands, from its deck in the layer alone: its axis (the long side of the deck's least box), the
 *  crossing along it (the deck's length) and its faces (the deck's width over its middle half). The bake opens the
 *  river under the crossing from this before it bakes the ground. */
export function archLayout(features: Feature[]): ArchLayout[] {
  const out: ArchLayout[] = [];
  for (const spec of ARCH_BRIDGES) {
    const f = features.find((g) => g.properties.kind === "bridge" && g.properties.name === spec.name && g.geometry.type === "Polygon");
    if (!f) continue;
    const ring = (f.geometry.coordinates[0] as number[][]).map(([x, y]) => [x, y] as Pt);
    const c: Pt = [ring.reduce((a, p) => a + p[0], 0) / ring.length, ring.reduce((a, p) => a + p[1], 0) / ring.length];
    let best = { area: Infinity, u: [1, 0] as Pt };
    for (let a = 0; a < 180; a += 0.5) {
      const t = (a * Math.PI) / 180, u: Pt = [Math.cos(t), Math.sin(t)], v: Pt = [-u[1], u[0]];
      const s = ring.map((p) => (p[0] - c[0]) * u[0] + (p[1] - c[1]) * u[1]), w = ring.map((p) => (p[0] - c[0]) * v[0] + (p[1] - c[1]) * v[1]);
      const ls = Math.max(...s) - Math.min(...s), lw = Math.max(...w) - Math.min(...w);
      if (ls * lw < best.area) best = { area: ls * lw, u: ls >= lw ? u : v };
    }
    const u = best.u, v: Pt = [-u[1], u[0]];
    const frame = (x: number, y: number): Pt => [(x - c[0]) * u[0] + (y - c[1]) * u[1], (x - c[0]) * v[0] + (y - c[1]) * v[1]];
    const at = (s: number, w: number): Pt => [c[0] + u[0] * s + v[0] * w, c[1] + u[1] * s + v[1] * w];
    const fr = ring.map((p) => frame(p[0], p[1])), s0 = Math.min(...fr.map((p) => p[0])), s1 = Math.max(...fr.map((p) => p[0]));
    // the deck's width at slices over its middle half (its ends are notched round the pedestals' approaches)
    const lo: number[] = [], hi: number[] = [];
    for (let k = 1; k < 8; k++) {
      const sx = s0 + ((s1 - s0) * (2 + k)) / 12, ws: number[] = [];
      for (let i = 0; i < fr.length; i++) {
        const a = fr[i], b = fr[(i + 1) % fr.length];
        if ((a[0] - sx) * (b[0] - sx) < 0) ws.push(a[1] + ((sx - a[0]) * (b[1] - a[1])) / (b[0] - a[0]));
      }
      if (ws.length >= 2) lo.push(Math.min(...ws)), hi.push(Math.max(...ws));
    }
    const med = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
    out.push({ spec, c, u, v, s0, s1, w0: med(lo), w1: med(hi), ring, at, frame });
  }
  return out;
}

/** One stone arch bridge on its layout. `top(e, n)` is the bake's deck (m NHN), `level` the river under it. */
export function archBridge(L: ArchLayout, top: (e: number, n: number) => number, level: number) {
  const F = new Builder(0, true), A = ARCH, { spec } = L, bed = level - ASSUMED.bed;
  const total = spec.spans.reduce((a, b) => a + b, 0) + spec.pier * (spec.spans.length - 1), mid = (L.s0 + L.s1) / 2;
  const spans: [number, number][] = [];
  for (let s = mid - total / 2, k = 0; k < spec.spans.length; s += spec.spans[k] + spec.pier, k++) spans.push([s, s + spec.spans[k]]);
  const piers = spans.slice(0, -1).map(([, b]) => b + spec.pier / 2);
  const zs = level + A.spring;
  const arc = (k: number) => {
    const [a, b] = spans[k], h = (b - a) / 2, r = A.riseK * (b - a), R = (h * h + r * r) / (2 * r), m = (a + b) / 2;
    return { m, R, zc: zs + r - R, z: (s: number) => zs + r - R + Math.sqrt(Math.max(0, R * R - (s - m) ** 2)) };
  };
  const W = (s: number, w: number, z: number): V3 => { const p = L.at(s, w); return P(p[0], p[1], z); };
  const T = (s: number, w: number) => { const p = L.at(s, w); return top(p[0], p[1]); };
  const sc = (d: Pt): V3 => [d[0], 0, -d[1]];
  const out = (side: number) => sc([L.v[0] * side, L.v[1] * side]), along = (k: number) => sc([L.u[0] * k, L.u[1] * k]);
  const SEG = 12, sides: [number, number][] = [[-1, L.w0], [1, L.w1]];
  /** a box in the bridge's frame: s and w ranges, between two heights */
  const box = (sa: number, sb: number, wa: number, wb: number, z0: number, z1: number, col: number[]) =>
    solid(F, [L.at(sa, wa), L.at(sb, wa), L.at(sb, wb), L.at(sa, wb)], z0, z1, col);
  // the strips along a face: solid where a pier, an end or the land is, open below the arch in a span
  const strips: { a: number; b: number; k: number }[] = [];
  let s = L.s0;
  spans.forEach(([a, b], k) => {
    if (a > s + 1e-3) strips.push({ a: s, b: a, k: -1 });
    for (let j = 0; j < SEG; j++) strips.push({ a: a + ((b - a) * j) / SEG, b: a + ((b - a) * (j + 1)) / SEG, k });
    s = b;
  });
  if (L.s1 > s + 1e-3) strips.push({ a: s, b: L.s1, k: -1 });
  for (const [side, wf] of sides) {
    for (const st of strips) {
      const za = st.k < 0 ? bed : arc(st.k).z(st.a), zb = st.k < 0 ? bed : arc(st.k).z(st.b);
      face(F, [W(st.a, wf, za), W(st.b, wf, zb), W(st.b, wf, T(st.b, wf)), W(st.a, wf, T(st.a, wf))], out(side), SANDSTONE);
    }
    // the arch ring, a band of voussoirs standing proud of the face
    spans.forEach((_, k) => {
      const { m, R, zc, z } = arc(k), [a, b] = spans[k], wr = wf + side * A.ringProud;
      for (let j = 0; j < SEG; j++) {
        const sa = a + ((b - a) * j) / SEG, sb = a + ((b - a) * (j + 1)) / SEG, za = z(sa), zb = z(sb);
        const ra: [number, number] = [(sa - m) / R, (za - zc) / R], rb: [number, number] = [(sb - m) / R, (zb - zc) / R];
        face(F, [W(sa, wr, za), W(sb, wr, zb), W(sb + rb[0] * A.ring, wr, zb + rb[1] * A.ring), W(sa + ra[0] * A.ring, wr, za + ra[1] * A.ring)], out(side), SANDSTONE);
      }
    });
    // the round cutwaters, upstream and down, to their caps
    for (const sp of piers) {
      const rr = spec.pier / 2, n = 8, z1 = level + A.cutwaterTop;
      for (let j = 0; j < n; j++) {
        const f0 = (Math.PI * j) / n, f1 = (Math.PI * (j + 1)) / n, fm = (f0 + f1) / 2;
        const p = (f: number, r: number, z: number) => W(sp + r * Math.cos(f), wf + side * r * Math.sin(f), z);
        const hint = add(along(Math.cos(fm)), mul(out(side), Math.sin(fm)));
        face(F, [p(f0, rr, bed), p(f1, rr, bed), p(f1, rr, z1), p(f0, rr, z1)], hint, SANDSTONE);
        face(F, [p(f0, rr, z1), p(f1, rr, z1), p(f1, 0.15, z1 + 0.7), p(f0, 0.15, z1 + 0.7)], add(hint, [0, 1, 0]), SANDSTONE);
      }
    }
    // the cornice under the parapet, in 2 m runs so it follows the deck's crown
    const runs = Math.max(1, Math.ceil((L.s1 - L.s0) / 2));
    for (let j = 0; j < runs; j++) {
      const sa = L.s0 + ((L.s1 - L.s0) * j) / runs, sb = L.s0 + ((L.s1 - L.s0) * (j + 1)) / runs, wo = wf + side * A.corniceOut;
      const ta = T(sa, wf), tb = T(sb, wf);
      face(F, [W(sa, wo, ta - 0.1 - A.cornice), W(sb, wo, tb - 0.1 - A.cornice), W(sb, wo, tb - 0.1), W(sa, wo, ta - 0.1)], out(side), SANDSTONE);
      face(F, [W(sa, wf, ta - 0.1), W(sb, wf, tb - 0.1), W(sb, wo, tb - 0.1), W(sa, wo, ta - 0.1)], [0, 1, 0], SANDSTONE);
      face(F, [W(sa, wf, ta - 0.1 - A.cornice), W(sb, wf, tb - 0.1 - A.cornice), W(sb, wo, tb - 0.1 - A.cornice), W(sa, wo, ta - 0.1 - A.cornice)], [0, -1, 0], SANDSTONE);
    }
    // the pedestals: over the piers and at the ends, in the parapet's line, flush with the face
    const pw = A.pedestalK * spec.pier, ped = [L.s0 + pw / 2 + A.plinthOut, ...piers, L.s1 - pw / 2 - A.plinthOut];
    const wIn = wf - side * pw, wOut = wf + side * 0.05;
    for (const sp of ped) {
      const t0 = T(sp, wf), o = A.plinthOut, q = A.capOut;
      box(sp - pw / 2 - o, sp + pw / 2 + o, wIn - side * o, wOut + side * o, t0 - 0.2, t0 + A.plinth, RED_GRANITE);
      box(sp - pw / 2, sp + pw / 2, wIn, wOut, t0 + A.plinth, t0 + A.plinth + A.shaft, MARBLE);
      box(sp - pw / 2 - q, sp + pw / 2 + q, wIn - side * q, wOut + side * q, t0 + A.plinth + A.shaft, t0 + A.plinth + A.shaft + A.cap, MARBLE);
      if (spec.groups) group(sp, (wIn + wOut) / 2, t0 + A.plinth + A.shaft + A.cap, side, sp);
    }
    // the parapet between them: the stone base course and the iron panels on it, a rail along their top
    const gaps: [number, number][] = [];
    for (let j = 0; j + 1 < ped.length; j++) gaps.push([ped[j] + pw / 2 + A.plinthOut, ped[j + 1] - pw / 2 - A.plinthOut]);
    for (const [ga, gb] of gaps) {
      const n = Math.max(1, Math.ceil((gb - ga) / 2.5)), wp = wf - side * A.parapet;
      for (let j = 0; j < n; j++) {
        const sa = ga + ((gb - ga) * j) / n, sb = ga + ((gb - ga) * (j + 1)) / n, ta = T(sa, wf), tb = T(sb, wf), b0 = A.parapetBase, b1 = b0 + A.parapetIron;
        face(F, [W(sa, wf, ta), W(sb, wf, tb), W(sb, wf, tb + b0), W(sa, wf, ta + b0)], out(side), SANDSTONE);
        face(F, [W(sa, wp, ta), W(sb, wp, tb), W(sb, wp, tb + b0), W(sa, wp, ta + b0)], out(-side), SANDSTONE);
        face(F, [W(sa, wf, ta + b0), W(sb, wf, tb + b0), W(sb, wp, tb + b0), W(sa, wp, ta + b0)], [0, 1, 0], SANDSTONE);
        const wm = wf - side * A.parapet / 2;
        for (const sd of [1, -1]) face(F, [W(sa, wm, ta + b0), W(sb, wm, tb + b0), W(sb, wm, tb + b1), W(sa, wm, ta + b1)], out(side * sd), IRON);
        beam(F, W(sa, wm, ta + b1), W(sb, wm, tb + b1), 0.12, 0.08, IRON);
      }
    }
    // a two-armed lamp standard near each end, inboard of the parapet
    for (const sl of [L.s0 + A.lampFromEnd, L.s1 - A.lampFromEnd]) {
      const wl = wf - side * (A.parapet + 0.6), t0 = T(sl, wl);
      box(sl - 0.3, sl + 0.3, wl - 0.3, wl + 0.3, t0, t0 + 1.0, IRON);
      beam(F, W(sl, wl, t0 + 1.0), W(sl, wl, t0 + A.lamp), 0.2, 0.2, IRON);
      for (const k of [1, -1]) {
        const e = sl + k * A.lampArm;
        beam(F, W(sl, wl, t0 + A.lamp - 0.35), W(e, wl, t0 + A.lamp - 0.1), 0.07, 0.07, IRON);
        box(e - 0.18, e + 0.18, wl - 0.18, wl + 0.18, t0 + A.lamp - 0.6, t0 + A.lamp - 0.1, GLOBE);
      }
    }
  }
  // the vaults' soffits and the jambs under them
  spans.forEach(([a, b], k) => {
    const { z } = arc(k);
    for (const st of strips.filter((x) => x.k === k)) face(F, [W(st.a, L.w0, z(st.a)), W(st.b, L.w0, z(st.b)), W(st.b, L.w1, z(st.b)), W(st.a, L.w1, z(st.a))], [0, -1, 0], SANDSTONE);
    face(F, [W(a, L.w0, bed), W(a, L.w1, bed), W(a, L.w1, zs), W(a, L.w0, zs)], along(1), SANDSTONE);
    face(F, [W(b, L.w0, bed), W(b, L.w1, bed), W(b, L.w1, zs), W(b, L.w0, zs)], along(-1), SANDSTONE);
  });

  /** A marble group on its pedestal, a stand-in for its massing (a winged goddess leading a young warrior, about
   *  3 m): two tapered figures on a slab, her wings, his raised arm, facing out over the water. */
  function group(sp: number, wc: number, z0: number, side: number, seed: number) {
    const H = A.group, lean = (Math.round(seed * 10) % 2 ? 1 : -1) * 0.35;
    box(sp - 0.9, sp + 0.9, wc - 0.6, wc + 0.6, z0, z0 + 0.25, MARBLE);
    const figure = (ds: number, h: number, wB: number, wT: number) => {
      const s0 = sp + ds, zb = z0 + 0.25, zt = zb + h * 0.86;
      const q = (s: number, w: number, z: number) => W(s, wc + w, z);
      const quad = (ws: number[], zz: number[]) => [q(s0 - ws[0], -ws[1], zz[0]), q(s0 + ws[0], -ws[1], zz[0]), q(s0 + ws[2], -ws[3], zz[1]), q(s0 - ws[2], -ws[3], zz[1])];
      const b = [wB / 2, wB * 0.35], t = [wT / 2, wT * 0.35];
      for (const [dir, flip] of [[out(side), 1], [out(-side), -1]] as [V3, number][]) {
        const ring = (r: number[]) => [r[0], r[1] * flip];
        const pts = quad([...ring(b), ...ring(t)], [zb, zt]);
        face(F, pts, dir, MARBLE);
      }
      for (const k of [1, -1]) face(F, [q(s0 + k * b[0], -b[1], zb), q(s0 + k * b[0], b[1], zb), q(s0 + k * t[0], t[1], zt), q(s0 + k * t[0], -t[1], zt)], along(k), MARBLE);
      box(s0 - 0.14, s0 + 0.14, wc - 0.14, wc + 0.14, zt, zt + h * 0.14, MARBLE);
      return { s0, zt };
    };
    const her = figure(lean, H, 0.75, 0.48), him = figure(-lean * 1.6, H * 0.85, 0.62, 0.42);
    for (const k of [1, -1]) face(F, [W(her.s0 + k * 0.2, wc - side * 0.2, her.zt - 0.6), W(her.s0 + k * 1.0, wc - side * 0.5, her.zt + 0.2), W(her.s0 + k * 0.7, wc - side * 0.6, her.zt + 1.0), W(her.s0 + k * 0.15, wc - side * 0.25, her.zt)], out(side), MARBLE);
    beam(F, W(him.s0, wc, him.zt - 0.1), W(him.s0 - lean * 0.6, wc + side * 0.15, him.zt + 0.75), 0.11, 0.11, MARBLE);
  }
  return { F, spans, log: `${spec.name}: ${spec.spans.length} arches ${spec.spans.join("/")} m over ${(L.s1 - L.s0).toFixed(1)} m of deck (${total.toFixed(1)} m of arches and piers), ${(L.w1 - L.w0).toFixed(1)} m wide, ${spec.groups ? `${2 * (piers.length + 2)} groups, ` : ""}${F.indices.length / 3} tris` };
}
