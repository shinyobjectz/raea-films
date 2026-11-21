// The Berlin Stadtbahn through the slice, as the map lane drew it (map/1917/stadtbahn.geojson; tools/map/stadtbahn.ts
// cites every figure): the brick viaduct on its arches, iron girder bridges where it crosses a street or the water,
// and Bahnhof Friedrichstraße's 1882 hall. One mesh City draws at every distance, like the skyline (landmarks.ts):
// a band 15.5 m wide and 6 m up reads from 2 km, and a few tens of thousands of triangles carry the whole line.
//   From the layer: the axis (rail top, m NHN, a vertex every 2 m); 15.50 m between the faces; arches 15.4 m the rule
//   on straight runs, piers 1.0-1.65 m, a group pier of 2.0-2.25 m every 4th to 6th; the crossings (street or water,
//   the street's height and the clearance under the girders, 0.8 m deep); the hall's outline (a ring segment over
//   the tracks, 144 m long, 34-37.5 m wide, ends cut along the radius), its 16 truss pairs, its 7 m brick side walls
//   with a row of windows, its obtuse pointed roof to 19.7 m over the rail (the layer marks that height derived) with
//   the glazed saddle lights along the ridge and glazed end screens.
//   ASSUMED (named here so a figure can replace it): the arch's springing and the vault's crown, the cornice and the
//   parapet, the share of arches let and fronted, the hall's window rhythm and the end screens' lower edge.
//   used by bake.ts: stadtbahn(...) -> assets/world/<slice>/stadtbahn.glb; also run alone (bun tools/world/stadtbahn.ts
//   OUT.glb) with the ground taken as the layer's rule (rail top less 6 m), to look at it before a bake.
import { Builder, writeGlb, type Material } from "./glb";
import { P, N, hash } from "./geom";
import { SURF, GLASS } from "./facade";

type V3 = [number, number, number];
type Feature = { geometry: { type: string; coordinates: any }; properties: Record<string, any> };

export const ASSUMED = {
  /** the arch springs this high over the ground under it */
  spring: 2.2,
  /** the vault's crown under the rail top: the deck, the fill and the ballast */
  crownBelowRail: 1.5,
  /** a plain pier and a group pier (inside the layer's 1.0-1.65 and 2.0-2.25), a group pier every this many */
  pier: 1.3, groupPier: 2.1, groupEvery: 5,
  /** the iron railing on the parapet, the brick cornice band under it (its depth and how far it stands out) */
  railing: 1.0, cornice: 0.35, corniceOut: 0.2,
  /** the share of arches let and walled in with a front (the layer: about 600 along the line were let) */
  let: 0.7,
  /** segments in a vault and in the hall's roof profile */
  segs: 10, roofSegs: 16,
  /** the hall roof's pitch where it leaves the wall heads, degrees: the two arcs of its obtuse pointed profile are
   *  tangent to it there (not to the vertical, which made an egg) */
  roofSpring: 58,
  /** the girders' painted iron, the stiffeners' pitch along them, the railing's posts' pitch */
  iron: "#4b524e", stiffener: 1.6, post: 2.0,
  /** the hall's windows along its side walls (every this many metres, this wide, this high from the rail) */
  hallWindowEvery: 4.5, hallWindowW: 2.0, hallWindow: [2.4, 5.6],
  /** the end screens' glazing stops this high over the rail (trains run under it) */
  screenFrom: 5.5,
};

const lin = (hex: string) => [1, 3, 5].map((i) => {
  const s = parseInt(hex.slice(i, i + 2), 16) / 255;
  return Math.round((s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4) * 255);
});
const BRICK = [...lin("#8a4a3a"), SURF.brick], TRIM = [...lin("#b8a888"), SURF.trim], IRON = [...lin(ASSUMED.iron), SURF.iron];
const BALLAST = [...lin("#4a4744"), SURF.flat], ZINC = [...lin("#6a6e72"), SURF.zinc], RIDGE = [...lin("#a7b4bf"), SURF.zinc];

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
/** A quad a b c d facing `hint` (scene frame): its winding is flipped if it faces away. */
function face(B: Builder, q: V3[], hint: V3, col: number[], uv: number[][]) {
  let [a, b, c, d] = q, n = unit(cross(sub(b, a), sub(d, a)));
  if (dot(n, hint) < 0) { [b, d] = [d, b]; n = [-n[0], -n[1], -n[2]]; uv = [uv[0], uv[3], uv[2], uv[1]]; }
  B.quad(a, b, c, d, n, col, uv);
}

/** The line: the axis's points (e, n, rail top), its length along, and a point at s with its tangent and left normal. */
function line(coords: number[][]) {
  const S = [0];
  for (let i = 1; i < coords.length; i++) S.push(S[i - 1] + Math.hypot(coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1]));
  const at = (s: number) => {
    let lo = 0, hi = S.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= s) lo = m; else hi = m; }
    const a = coords[lo], b = coords[hi], L = S[hi] - S[lo] || 1, t = Math.max(0, Math.min(1, (s - S[lo]) / L));
    const tx = (b[0] - a[0]) / L, ty = (b[1] - a[1]) / L;
    return { e: a[0] + (b[0] - a[0]) * t, n: a[1] + (b[1] - a[1]) * t, z: a[2] + (b[2] - a[2]) * t, t: [tx, ty] as [number, number], l: [-ty, tx] as [number, number] };
  };
  /** the s of the axis vertex nearest a point */
  const near = (e: number, n: number) => { let best = 0, bd = Infinity; coords.forEach((c, i) => { const d = (c[0] - e) ** 2 + (c[1] - n) ** 2; if (d < bd) (bd = d), (best = i); }); return S[best]; };
  return { S, at, near, length: S[S.length - 1] };
}

/** The Stadtbahn inside bbox [e0, n0, e1, n1]. `ground(e, n)` is the bake's ground (m NHN); alone, the layer's rule.
 *  `tileOf(e, n)` names the bake's tile a point is in: the detail (girder flanges and stiffeners, the railing, the let
 *  arches' fronts, the hall's windows and trusses) goes to that tile's own mesh, drawn with the tile at its near
 *  levels; the base (`F`, `G`: brick, girders, deck, cornice, the hall's shell) is drawn at every distance. Without
 *  it everything is in the base. */
export function stadtbahn(features: Feature[], bbox: number[], ground?: (e: number, n: number) => number, tileOf?: (e: number, n: number) => string) {
  const F = new Builder(0, true), G = new Builder(1, true);
  const detail = new Map<string, { F: Builder; G: Builder }>();
  const near = (s: number) => {
    if (!tileOf) return { F, G };
    const a = L.at(s), k = tileOf(a.e, a.n);
    return detail.get(k) ?? detail.set(k, { F: new Builder(0, true), G: new Builder(1, true) }).get(k)!;
  };
  const axisF = features.find((f) => f.properties.kind === "axis");
  if (!axisF) return { F, G, detail, log: "no axis" };
  const W = axisF.properties.width_m as number, H = W / 2;
  const L = line(axisF.geometry.coordinates);
  const gr = (e: number, n: number, s: number) => (ground ? ground(e, n) : L.at(s).z - (axisF.properties.rail_above_ground_m ?? 6));
  /** a point s along the axis, `off` to its left, at height h (m NHN), in the scene frame */
  const pt = (s: number, off: number, h: number): V3 => { const a = L.at(s); return P(a.e + a.l[0] * off, a.n + a.l[1] * off, h); };
  const left = (s: number): V3 => { const a = L.at(s); return N(a.l[0], a.l[1], 0); };
  const fwd = (s: number): V3 => { const a = L.at(s); return N(a.t[0], a.t[1], 0); };
  const groundAt = (s: number) => { const a = L.at(s); return Math.min(gr(a.e + a.l[0] * H, a.n + a.l[1] * H, s), gr(a.e - a.l[0] * H, a.n - a.l[1] * H, s)); };
  const inside = (s: number) => { const a = L.at(s); return a.e >= bbox[0] && a.e <= bbox[2] && a.n >= bbox[1] && a.n <= bbox[3]; };

  // the runs inside the box, then the crossings and the hall cut out of them
  const runs: [number, number][] = [];
  for (let s = 0, open = -1; s <= L.length + 2; s += 2) {
    const inn = s <= L.length && inside(s);
    if (inn && open < 0) open = s;
    if (!inn && open >= 0) { runs.push([open, Math.min(s - 2, L.length)]); open = -1; }
  }
  const crossings = features.filter((f) => f.properties.kind === "crossing").map((f) => {
    const c = f.geometry.coordinates as number[][], a = L.near(c[0][0], c[0][1]), b = L.near(c[c.length - 1][0], c[c.length - 1][1]);
    return { s0: Math.min(a, b), s1: Math.max(a, b), p: f.properties };
  }).filter((c) => c.s1 - c.s0 > 1).sort((a, b) => a.s0 - b.s0);
  const hallF = features.find((f) => f.properties.kind === "hall");
  const hallRing = hallF ? ((hallF.geometry.type === "Polygon" ? hallF.geometry.coordinates[0] : hallF.geometry.coordinates[0][0]) as number[][]) : null;
  let hall: [number, number] | null = null;
  if (hallRing) { const ss = hallRing.map((p) => L.near(p[0], p[1])); hall = [Math.min(...ss), Math.max(...ss)]; }
  const cuts = [...crossings.map((c) => [c.s0, c.s1] as [number, number]), ...(hall ? [hall] : [])].sort((a, b) => a[0] - b[0]);
  const arched: [number, number][] = [];
  for (const [a, b] of runs) {
    let cur = a;
    for (const [c0, c1] of cuts) {
      if (c1 <= cur || c0 >= b) continue;
      if (c0 > cur) arched.push([cur, c0]);
      cur = Math.max(cur, c1);
    }
    if (b > cur) arched.push([cur, b]);
  }

  let arches = 0, lets = 0, bridges = 0;
  // ---------- the arches
  for (const [a, b] of arched) {
    if (b - a < 4) { block(a, b); continue; }
    let n = Math.max(1, Math.round((b - a - ASSUMED.pier) / (15.4 + ASSUMED.pier)));
    const widths = (k: number, n: number) => (k === 0 || k === n || k % ASSUMED.groupEvery === 0 ? ASSUMED.groupPier : ASSUMED.pier);
    let piers = Array.from({ length: n + 1 }, (_, k) => widths(k, n));
    let span = (b - a - piers.reduce((x, y) => x + y, 0)) / n;
    while (span < 5 && n > 1) { n--; piers = Array.from({ length: n + 1 }, (_, k) => widths(k, n)); span = (b - a - piers.reduce((x, y) => x + y, 0)) / n; }
    if (span < 2) { block(a, b); continue; }
    let s = a;
    for (let k = 0; k <= n; k++) {
      pierAt(s, s + piers[k]);
      s += piers[k];
      if (k < n) { arch(s, s + span, hash(Math.round(s * 10), 71) < ASSUMED.let); s += span; arches++; }
    }
  }
  // ---------- the girder bridges
  for (const c of crossings) {
    const s0 = Math.max(c.s0, 0), s1 = Math.min(c.s1, L.length);
    if (!(inside(s0) || inside(s1))) continue;
    bridges++;
    const under = (s: number) => (c.p.street_m != null && c.p.clear_m != null ? c.p.street_m + c.p.clear_m : L.at(s).z - 1.0);
    for (let x = s0; x < s1 - 1e-6; x += 2) {
      const x1 = Math.min(s1, x + 2), u0 = under(x), u1 = under(x1), t0 = L.at(x).z + 1.0, t1 = L.at(x1).z + 1.0;
      // the deck's underside, then the plate girders on both faces, standing up past the deck as the parapet
      face(F, [pt(x, H, u0), pt(x1, H, u1), pt(x1, -H, u1), pt(x, -H, u0)], [0, -1, 0], IRON, [[x, H], [x1, H], [x1, -H], [x, -H]]);
      for (const sd of [1, -1]) {
        const o = left(x).map((v) => v * sd) as V3;
        face(F, [pt(x, sd * H, u0), pt(x1, sd * H, u1), pt(x1, sd * H, t1), pt(x, sd * H, t0)], o, IRON, [[x, u0], [x1, u1], [x1, t1], [x, t0]]);
        face(F, [pt(x, sd * (H - 0.3), u0 + 0.8), pt(x1, sd * (H - 0.3), u1 + 0.8), pt(x1, sd * (H - 0.3), t1), pt(x, sd * (H - 0.3), t0)], o.map((v) => -v) as V3, IRON, [[x, u0], [x1, u1], [x1, t1], [x, t0]]);
        face(F, [pt(x, sd * H, t0), pt(x1, sd * H, t1), pt(x1, sd * (H - 0.3), t1), pt(x, sd * (H - 0.3), t0)], [0, 1, 0], IRON, [[x, 0], [x1, 0], [x1, 0.3], [x, 0.3]]);
        // the flanges, top and bottom, standing 0.12 m out of the web
        for (const [z0, z1, za, zb] of [[t0 - 0.22, t1 - 0.22, t0, t1], [u0, u1, u0 + 0.22, u1 + 0.22]]) {
          const W = sd * (H + 0.12);
          const D = near(x).F;
          face(D, [pt(x, W, z0), pt(x1, W, z1), pt(x1, W, zb), pt(x, W, za)], o, IRON, [[x, 0], [x1, 0], [x1, 0.22], [x, 0.22]]);
          face(D, [pt(x, sd * H, z0), pt(x1, sd * H, z1), pt(x1, W, z1), pt(x, W, z0)], [0, -1, 0], IRON, [[x, 0], [x1, 0], [x1, 0.12], [x, 0.12]]);
          face(D, [pt(x, W, za), pt(x1, W, zb), pt(x1, sd * H, zb), pt(x, sd * H, za)], [0, 1, 0], IRON, [[x, 0], [x1, 0], [x1, 0.12], [x, 0.12]]);
        }
      }
    }
    // the web's stiffeners, a flat every ASSUMED.stiffener metres on both outer faces
    for (let x = s0 + ASSUMED.stiffener / 2; x < s1; x += ASSUMED.stiffener) for (const sd of [1, -1]) {
      const o = left(x).map((v) => v * sd) as V3, f = fwd(x), u = under(x), t = L.at(x).z + 1.0, W = sd * (H + 0.07), w = 0.09, D = near(x).F;
      face(D, [pt(x - w, W, u + 0.22), pt(x + w, W, u + 0.22), pt(x + w, W, t - 0.22), pt(x - w, W, t - 0.22)], o, IRON, [[0, 0], [1, 0], [1, 1], [0, 1]]);
      for (const k of [1, -1]) face(D, [pt(x + k * w, sd * H, u + 0.22), pt(x + k * w, W, u + 0.22), pt(x + k * w, W, t - 0.22), pt(x + k * w, sd * H, t - 0.22)], f.map((v) => v * k) as V3, IRON, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    }
  }
  // ---------- the deck's top along every run (ballast between the parapets), and the hall
  for (const [a, b] of runs) for (let x = a; x < b - 1e-6; x += 2) {
    const x1 = Math.min(b, x + 2), z0 = L.at(x).z - 0.2, z1 = L.at(x1).z - 0.2;
    face(F, [pt(x, H, z0), pt(x1, H, z1), pt(x1, -H, z1), pt(x, -H, z0)], [0, 1, 0], BALLAST, [[x, H], [x1, H], [x1, -H], [x, -H]]);
  }
  let hallLog = "";
  if (hall && hallRing && (inside(hall[0]) || inside(hall[1]))) hallLog = buildHall(hall[0], hall[1], hallRing, hallF!.properties);
  return { F, G, detail, log: `${arches} arches (${lets} let and fronted), ${bridges} girder bridges${hallLog ? `, the hall: ${hallLog}` : ""}, ${(F.indices.length + G.indices.length) / 3} tris` };

  // a solid stretch too short for an arch (a run's stub at a crossing): brick faces to the cornice
  function block(a: number, b: number) { pierAt(a, b); }

  /** A pier from a to b: its two faces from under the ground to the deck, the cornice band and the railing over it. */
  function pierAt(a: number, b: number) {
    for (let x = a; x < b - 1e-6; x += 2) {
      const x1 = Math.min(b, x + 2), g0 = groundAt(x) - 1, g1 = groundAt(x1) - 1;
      for (const sd of [1, -1]) {
        const o = left(x).map((v) => v * sd) as V3;
        const top0 = L.at(x).z - 0.2 - ASSUMED.cornice, top1 = L.at(x1).z - 0.2 - ASSUMED.cornice;
        face(F, [pt(x, sd * H, g0), pt(x1, sd * H, g1), pt(x1, sd * H, top1), pt(x, sd * H, top0)], o, BRICK, [[x, g0], [x1, g1], [x1, top1], [x, top0]]);
      }
      parapet(x, x1);
    }
  }
  /** The cornice band and the iron railing over the faces, from x to x1. */
  function parapet(x: number, x1: number) {
    const z0 = L.at(x).z - 0.2, z1 = L.at(x1).z - 0.2, c = ASSUMED.cornice, co = ASSUMED.corniceOut, r = ASSUMED.railing;
    for (const sd of [1, -1]) {
      const o = left(x).map((v) => v * sd) as V3, Ho = H + co;
      face(F, [pt(x, sd * Ho, z0 - c), pt(x1, sd * Ho, z1 - c), pt(x1, sd * Ho, z1), pt(x, sd * Ho, z0)], o, TRIM, [[x, 0], [x1, 0], [x1, c], [x, c]]);
      face(F, [pt(x, sd * H, z0 - c), pt(x1, sd * H, z1 - c), pt(x1, sd * Ho, z1 - c), pt(x, sd * Ho, z0 - c)], [0, -1, 0], TRIM, [[x, 0], [x1, 0], [x1, co], [x, co]]);
      face(F, [pt(x, sd * Ho, z0), pt(x1, sd * Ho, z1), pt(x1, sd * H, z1), pt(x, sd * H, z0)], [0, 1, 0], TRIM, [[x, 0], [x1, 0], [x1, co], [x, co]]);
      // the railing: a handrail and a lower rail seen from both sides, a post at every ASSUMED.post metres
      const D = near(x).F;
      for (const [a, b] of [[r - 0.07, r], [0.3, 0.36]]) for (const k of [1, -1])
        face(D, [pt(x, sd * (H + 0.05), z0 + a), pt(x1, sd * (H + 0.05), z1 + a), pt(x1, sd * (H + 0.05), z1 + b), pt(x, sd * (H + 0.05), z0 + b)], o.map((v) => v * k) as V3, IRON, [[x, a], [x1, a], [x1, b], [x, b]]);
      if (Math.floor(x / ASSUMED.post) !== Math.floor(x1 / ASSUMED.post) || x === 0) {
        const xp = Math.ceil(x / ASSUMED.post) * ASSUMED.post, zp = L.at(xp).z - 0.2, w = 0.03;
        for (const k of [1, -1]) face(D, [pt(xp - w, sd * (H + 0.05), zp), pt(xp + w, sd * (H + 0.05), zp), pt(xp + w, sd * (H + 0.05), zp + r), pt(xp - w, sd * (H + 0.05), zp + r)], o.map((v) => v * k) as V3, IRON, [[0, 0], [1, 0], [1, 1], [0, 1]]);
      }
    }
  }
  /** An arch from s0 to s1: the vault through the band, its jambs, the spandrel faces over it to the cornice; let, a
   *  brick wall in each face 0.4 m back with a shop's window and door in it. */
  function arch(s0: number, s1: number, let_: boolean) {
    const K = ASSUMED.segs, span = s1 - s0, mid = (s0 + s1) / 2;
    const g = groundAt(mid), spring = g + ASSUMED.spring, crown = Math.max(spring + 1, L.at(mid).z - ASSUMED.crownBelowRail), h = crown - spring;
    const R = (span * span / 4 + h * h) / (2 * h);
    const y = (x: number) => spring + Math.sqrt(Math.max(0, R * R - (x - span / 2) ** 2)) - (R - h);
    const xs = Array.from({ length: K + 1 }, (_, k) => s0 + (span * k) / K), ys = xs.map((x) => y(x - s0));
    // the jambs, from under the ground to the springing, facing into the arch
    for (const [x, d] of [[s0, 1], [s1, -1]] as const) face(F, [pt(x, H, g - 1), pt(x, -H, g - 1), pt(x, -H, spring), pt(x, H, spring)], fwd(x).map((v) => v * d) as V3, BRICK, [[H, g - 1], [-H, g - 1], [-H, spring], [H, spring]]);
    for (let k = 0; k < K; k++) {
      const xa = xs[k], xb = xs[k + 1], ya = ys[k], yb = ys[k + 1];
      // the vault's underside, facing down and in
      const inward: V3 = [0, -1, 0];
      face(F, [pt(xa, H, ya), pt(xb, H, yb), pt(xb, -H, yb), pt(xa, -H, ya)], inward, BRICK, [[xa, H], [xb, H], [xb, -H], [xa, -H]]);
      for (const sd of [1, -1]) {
        const o = left(xa).map((v) => v * sd) as V3, ta = L.at(xa).z - 0.2 - ASSUMED.cornice, tb = L.at(xb).z - 0.2 - ASSUMED.cornice;
        face(F, [pt(xa, sd * H, ya), pt(xb, sd * H, yb), pt(xb, sd * H, tb), pt(xa, sd * H, ta)], o, BRICK, [[xa, ya], [xb, yb], [xb, tb], [xa, ta]]);
        if (let_) {
          const w = sd * (H - 0.4);
          face(F, [pt(xa, w, g - 0.5), pt(xb, w, g - 0.5), pt(xb, w, yb), pt(xa, w, ya)], o, BRICK, [[xa, g], [xb, g], [xb, yb], [xa, ya]]);
        }
      }
    }
    for (let x = s0; x < s1 - 1e-6; x += 2) parapet(x, Math.min(s1, x + 2));
    if (!let_) return;
    lets++;
    // the shop's window and its door in each infill, a little proud of it
    for (const sd of [1, -1]) {
      const o = left(mid).map((v) => v * sd) as V3, w = sd * (H - 0.37), top = Math.min(g + 3.2, y(span / 2) - 0.8);
      const seed = Math.floor(hash(Math.round(mid * 10), sd) * 251), D = near(mid);
      face(D.G, [pt(mid - span * 0.28, w, g + 0.7), pt(mid + span * 0.12, w, g + 0.7), pt(mid + span * 0.12, w, top), pt(mid - span * 0.28, w, top)], o, [seed, (seed * 7) % 256, (seed * 13) % 256, GLASS.shop], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      face(D.F, [pt(mid + span * 0.17, w + sd * 0.01, g), pt(mid + span * 0.17 + 1.2, w + sd * 0.01, g), pt(mid + span * 0.17 + 1.2, w + sd * 0.01, g + 2.4), pt(mid + span * 0.17, w + sd * 0.01, g + 2.4)], o, [...lin("#3a2a1c"), SURF.wood], [[0, 0], [1.2, 0], [1.2, 2.4], [0, 2.4]]);
    }
  }

  /** Bahnhof Friedrichstraße's hall over the rail from s0 to s1: the station's brick base under the plan's outline up to
   *  the rail, the side walls 7 m with their windows, the pointed roof to the crown with its ridge light, the trusses
   *  in pairs, the glazed end screens. Cut across the axis every 4 m at the outline, so its width and its curve are the
   *  plan's. */
  function buildHall(s0: number, s1: number, ring: number[][], p: Record<string, any>) {
    const rail = p.rail_m as number, wall = p.side_wall_m as number, crownUp = p.crown_above_rail_m as number;
    // the outline across the axis at s: the offsets where the cross line meets the ring
    const across = (s: number): [number, number] | null => {
      const a = L.at(s), hits: number[] = [];
      for (let i = 0; i < ring.length - 1; i++) {
        const [x1, y1] = ring[i], [x2, y2] = ring[i + 1];
        const dx = x2 - x1, dy = y2 - y1, den = a.l[0] * dy - a.l[1] * dx;
        if (Math.abs(den) < 1e-9) continue;
        const t = ((x1 - a.e) * dy - (y1 - a.n) * dx) / den, u = ((x1 - a.e) * a.l[1] - (y1 - a.n) * a.l[0]) / den;
        if (u >= 0 && u <= 1) hits.push(t);
      }
      return hits.length >= 2 ? [Math.min(...hits), Math.max(...hits)] : null;
    };
    const stations: { s: number; lo: number; hi: number }[] = [];
    for (let s = s0 + 0.5; s <= s1 - 0.5; s += 4) { const c = across(s); if (c) stations.push({ s, lo: c[0], hi: c[1] }); }
    // the ends are cut along the radius, so a cut near them crosses the outline obliquely and comes out narrow: keep
    // the run of full-width cuts (within 12% of the median), so the ends stand square under their screens
    const widths = stations.map((c) => c.hi - c.lo).sort((x, y) => x - y), med = widths[widths.length >> 1] ?? 0;
    const full = stations.filter((c) => c.hi - c.lo >= med * 0.88);
    stations.length = 0;
    stations.push(...full);
    if (stations.length < 2) return "outline not crossed";
    const M = ASSUMED.roofSegs, rise = crownUp - wall;
    // the roof's profile across a station: an obtuse pointed arch, two arcs from the wall heads to the crown, each
    // tangent to ASSUMED.roofSpring at its wall head (its centre on that tangent's normal, below the springing)
    const profile = (lo: number, hi: number) => {
      const a = (hi - lo) / 2, mid = (lo + hi) / 2;
      const phi = Math.max(ASSUMED.roofSpring * Math.PI / 180, Math.atan2(rise, a) + 0.25), sp = Math.sin(phi), cp = Math.cos(phi);
      const R = (a * a + rise * rise) / (2 * (a * sp - rise * cp)), cx = -a + R * sp, cy = -R * cp;
      const th0 = Math.atan2(-cy, -a - cx), th1 = Math.atan2(rise - cy, -cx);
      const half = Array.from({ length: M / 2 + 1 }, (_, j) => { const th = th0 + (th1 - th0) * (j / (M / 2)); return [cx + R * Math.cos(th), cy + R * Math.sin(th)]; });
      half[0] = [-a, 0];
      half[M / 2] = [0, rise];
      return [...half.map(([x, y]) => [mid + x, rail + wall + y]), ...half.slice(0, -1).reverse().map(([x, y]) => [mid - x, rail + wall + y])];
    };
    const profs = stations.map((st) => profile(st.lo, st.hi));
    for (let i = 0; i < stations.length - 1; i++) {
      const A = stations[i], B = stations[i + 1], pa = profs[i], pb = profs[i + 1];
      const ga = groundAt(A.s) - 1, gb = groundAt(B.s) - 1;
      for (const [oa, ob, sd] of [[A.lo, B.lo, -1], [A.hi, B.hi, 1]] as const) {
        const o = left(A.s).map((v) => v * sd) as V3;
        // the base from the street to the rail, then the side wall to its head, outside and in
        face(F, [pt(A.s, oa, ga), pt(B.s, ob, gb), pt(B.s, ob, rail), pt(A.s, oa, rail)], o, BRICK, [[A.s, ga], [B.s, gb], [B.s, rail], [A.s, rail]]);
        for (const k of [1, -1]) face(F, [pt(A.s, oa, rail), pt(B.s, ob, rail), pt(B.s, ob, rail + wall), pt(A.s, oa, rail + wall)], o.map((v) => v * k) as V3, BRICK, [[A.s, 0], [B.s, 0], [B.s, wall], [A.s, wall]]);
      }
      // the roof, its outside zinc with the saddle light along the ridge, its inside dark iron
      for (let j = 0; j < pa.length - 1; j++) {
        const q = [pt(A.s, pa[j][0], pa[j][1]), pt(B.s, pb[j][0], pb[j][1]), pt(B.s, pb[j + 1][0], pb[j + 1][1]), pt(A.s, pa[j + 1][0], pa[j + 1][1])];
        const ridge = Math.abs(j + 0.5 - (pa.length - 1) / 2) < 1.6, up: V3 = [0, 1, 0];
        const outN = unit(cross(sub(q[1], q[0]), sub(q[3], q[0])));
        const outward: V3 = dot(outN, up) >= 0 ? outN : ([-outN[0], -outN[1], -outN[2]] as V3);
        face(F, q, outward, ridge ? RIDGE : ZINC, [[A.s, j], [B.s, j], [B.s, j + 1], [A.s, j + 1]]);
        face(F, q, outward.map((v) => -v) as V3, IRON, [[A.s, j], [B.s, j], [B.s, j + 1], [A.s, j + 1]]);
      }
      // the platforms' level between the walls
      face(F, [pt(A.s, A.lo, rail - 0.2), pt(B.s, B.lo, rail - 0.2), pt(B.s, B.hi, rail - 0.2), pt(A.s, A.hi, rail - 0.2)], [0, 1, 0], BALLAST, [[A.s, A.lo], [B.s, B.lo], [B.s, B.hi], [A.s, A.hi]]);
    }
    // the side walls' windows, outside, a row between the platform and the wall head
    const [w0, w1] = ASSUMED.hallWindow;
    for (let s = stations[0].s + 2; s < stations[stations.length - 1].s - 2; s += ASSUMED.hallWindowEvery) {
      const c = across(s);
      if (!c) continue;
      for (const [off, sd] of [[c[0], -1], [c[1], 1]] as const) {
        const o = left(s).map((v) => v * sd) as V3, w = off + sd * 0.04, hw = ASSUMED.hallWindowW / 2;
        face(near(s).G, [pt(s - hw, w, rail + w0), pt(s + hw, w, rail + w0), pt(s + hw, w, rail + w1), pt(s - hw, w, rail + w1)], o, [40, 90, 140, GLASS.stair], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      }
    }
    // the trusses, in pairs a metre apart, under the roof
    const pairs = p.truss_pairs as number, len = stations[stations.length - 1].s - stations[0].s;
    for (let k = 0; k < pairs; k++) for (const d of [-0.5, 0.5]) {
      const s = stations[0].s + ((k + 0.5) * len) / pairs + d, c = across(s);
      if (!c) continue;
      const pr = profile(c[0], c[1]);
      for (let j = 0; j < pr.length - 1; j++) {
        const [x0, y0] = pr[j], [x1, y1] = pr[j + 1], dd = 0.45;
        for (const k2 of [1, -1]) face(near(s).F, [pt(s, x0, y0 - dd), pt(s, x1, y1 - dd), pt(s, x1, y1 - 0.05), pt(s, x0, y0 - 0.05)], fwd(s).map((v) => v * k2) as V3, IRON, [[x0, 0], [x1, 0], [x1, dd], [x0, dd]]);
      }
    }
    // the glazed end screens, from ASSUMED.screenFrom over the rail up to the roof, cut along the radius at both ends
    for (const [st, pr, d] of [[stations[0], profs[0], -1], [stations[stations.length - 1], profs[profs.length - 1], 1]] as const) {
      const from = rail + ASSUMED.screenFrom, o = fwd(st.s).map((v) => v * d) as V3;
      for (let j = 0; j < pr.length - 1; j++) {
        const [x0, y0] = pr[j], [x1, y1] = pr[j + 1];
        if (Math.max(y0, y1) <= from) continue;
        face(G, [pt(st.s, x0, Math.max(from, Math.min(y0, from))), pt(st.s, x1, from), pt(st.s, x1, Math.max(from, y1)), pt(st.s, x0, Math.max(from, y0))], o, [60, 110, 150, GLASS.stair], [[0, 0], [1, 0], [1, 1], [0, 1]]);
        face(F, [pt(st.s + d * 0.05, x0, from), pt(st.s + d * 0.05, x0 + 0.1, from), pt(st.s + d * 0.05, x0 + 0.1, Math.max(from, y0)), pt(st.s + d * 0.05, x0, Math.max(from, y0))], o, IRON, [[0, 0], [0.1, 0], [0.1, 1], [0, 1]]);
      }
      face(F, [pt(st.s, st.lo, rail), pt(st.s, st.hi, rail), pt(st.s, st.hi, rail + wall), pt(st.s, st.lo, rail + wall)].map((v, i) => (i < 2 ? v : v)) as V3[], o, BRICK, [[st.lo, 0], [st.hi, 0], [st.hi, wall], [st.lo, wall]]);
    }
    return `${stations.length} cuts over ${len.toFixed(0)} m, ${(stations.reduce((x, c) => x + c.hi - c.lo, 0) / stations.length).toFixed(1)} m wide on average`;
  }
}

// alone: bun tools/world/stadtbahn.ts OUT.glb (ground as the layer's rule), the materials as bake.ts names them
if (import.meta.main) {
  const out = process.argv[2];
  if (!out) throw new Error("usage: bun tools/world/stadtbahn.ts OUT.glb");
  const root = `${import.meta.dir}/../..`;
  const slice = await Bun.file(`${root}/tools/map/slice.json`).json();
  const fs = (await Bun.file(`${root}/map/1917/stadtbahn.geojson`).json()).features;
  const r = stadtbahn(fs, slice.bbox);
  const MATS: Material[] = [
    { name: "facade", color: [1, 1, 1, 1], roughness: 0.85 },
    { name: "glass", color: [1, 1, 1, 1], roughness: 0.08 },
  ];
  await Bun.write(out, writeGlb([{ name: "stadtbahn", parts: [r.F.part(), r.G.part()].filter((x) => x !== null) }], MATS));
  console.log(`stadtbahn: ${r.log} -> ${out}`);
}
