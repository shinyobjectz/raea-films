// The 1917 city as a 3D graybox, one .glb per 500 m tile, in one frame for the whole city:
//   x = east and z = south in metres from ORIGIN (EPSG:25833), y = height above NHN in metres.
// Each tile holds the 1917 street-level ground (a 2 m grid), its sidewalks with a 15 cm kerb, courtyards, parks,
// railway land, water carved 2.5 m into the ground with quay walls, bridge decks, and every building whose middle is in
// the tile: walls from the ground to the eaves with a storey-and-window texture, and a flat roof.
// Heights: the 1887 building code measured a front from the top of the sidewalk to the top of the main cornice and
// allowed 22 m and five habitable storeys at most, so a storey is 22/5 = 4.4 m here (public buildings 4 storeys of
// 5 m, assumed until their own heights are looked up). Windows and their 2.6 m spacing are placeholders.
//   in:  map dir (buildings.geojson), cache/<slice>/ground1917_2m.f32 (ground1917.ts), cache/<slice>/graybox/surfaces.geojson (graybox.sh)
//   out: assets/graybox/<slice>/<tile>.glb and index.json
// usage: bun graybox.ts SLICE.json [TILE...]
import earcut from "earcut";
import { Builder, type Material, type Node, writeGlb } from "./glb";
import { slicePaths } from "./paths";
import { polygons } from "./raster";

export const ORIGIN = [391000, 5819000]; // Friedrichstadt, near the Gendarmenmarkt
const [slicePath, ...only] = process.argv.slice(2);
const { slice, root, own: cache, map } = await slicePaths(slicePath);
const outDir = `${root}/assets/graybox/${slice.name}`;
await Bun.$`mkdir -p ${outDir}`;

// The ground: cell centres of a 2 m grid, north up.
const head = await Bun.file(`${map}/ground1917_2m.json`).json();
const GW = head.width, GH = head.height, CELL = head.cell_m, [GX0, GY1] = head.origin_top_left;
const ground = new Float32Array(await Bun.file(`${cache}/ground1917_2m.f32`).arrayBuffer());
function g(x: number, y: number) {
  const cx = Math.min(GW - 1.001, Math.max(0, (x - GX0) / CELL - 0.5)), cy = Math.min(GH - 1.001, Math.max(0, (GY1 - y) / CELL - 0.5));
  const i = Math.floor(cx), j = Math.floor(cy), fx = cx - i, fy = cy - j, k = j * GW + i;
  return (ground[k] * (1 - fx) + ground[k + 1] * fx) * (1 - fy) + (ground[k + GW] * (1 - fx) + ground[k + GW + 1] * fx) * fy;
}
// Level of detail. LOD=city, for the sheets beyond the Friedrichstadt: a 4 m ground lattice, sidewalks and parks draped
// every 8 m and traced outlines simplified at 0.5 m, about a third of the bytes (22 GB free on 11-16). Default: full.
const CITY = process.env.LOD === "city";
const LAT = CITY ? 4 : 2, DENSE = CITY ? 8 : 4, TRACED_TOL = CITY ? 0.5 : 0.35;
const P = (x: number, y: number, z: number) => [x - ORIGIN[0], z, -(y - ORIGIN[1])];
const N = (nx: number, ny: number, nz = 0) => [nx, nz, -ny]; // a map-frame normal (east, north, up) in glTF's frame

// Materials (linear colours). The wall texture is one storey (4.4 m) by one window bay (2.6 m).
const M = { wall: 0, publicWall: 1, roof: 2, street: 3, sidewalk: 4, kerb: 5, courtyard: 6, green: 7, rail: 8, water: 9, quay: 10, bridge: 11, brick: 12 };
const materials: Material[] = [
  { name: "wall", color: [1, 1, 1, 1], roughness: 0.9, texture: 0 },
  { name: "public wall", color: [0.86, 0.88, 0.92, 1], roughness: 0.85, texture: 0 },
  { name: "roof", color: [0.16, 0.16, 0.17, 1], roughness: 0.8 },
  { name: "street", color: [0.2, 0.2, 0.2, 1], roughness: 0.9 },
  { name: "sidewalk", color: [0.42, 0.41, 0.39, 1], roughness: 0.9 },
  { name: "kerb", color: [0.5, 0.5, 0.5, 1], roughness: 0.8 },
  { name: "courtyard", color: [0.3, 0.29, 0.27, 1], roughness: 0.95 },
  { name: "green", color: [0.09, 0.17, 0.07, 1], roughness: 1 },
  { name: "rail", color: [0.24, 0.22, 0.2, 1], roughness: 1 },
  { name: "water", color: [0.03, 0.06, 0.07, 1], roughness: 0.1 },
  { name: "quay", color: [0.45, 0.43, 0.4, 1], roughness: 0.85 },
  { name: "bridge", color: [0.36, 0.35, 0.33, 1], roughness: 0.85 },
  { name: "brick", color: [0.4, 0.21, 0.15, 1], roughness: 0.9 },
];
const BAY = 2.6, STOREY = 4.4;
const tex = Bun.spawnSync(["magick", "-size", "128x128", "xc:#e4e0d8", "-fill", "#3a3f46",
  "-draw", `rectangle 35,${Math.round(((STOREY - 3.2) / STOREY) * 128)} 92,${Math.round(((STOREY - 0.9) / STOREY) * 128)}`,
  "-fill", "#a9a49b", "-draw", "rectangle 0,123 127,127", "-type", "TrueColor", "PNG24:-"]).stdout;

const hash = (n: number) => {
  let h = n * 2654435761;
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
};
const shade = (id: number, base = 236): number[] => {
  const v = Math.round(base * (0.9 + 0.1 * hash(id)));
  return [v, Math.round(v * 0.985), Math.round(v * 0.96), 255];
};

type Ring = number[][];
const area2 = (r: Ring) => r.reduce((s, [x, y], i) => s + x * r[(i + 1) % r.length][1] - r[(i + 1) % r.length][0] * y, 0);
const open = (r: Ring) => (r.length > 1 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1] ? r.slice(0, -1) : r);
/** Outer ring counter-clockwise and holes clockwise (seen from above), closing points dropped. */
function orient(rings: Ring[], tol = 0.15): Ring[] {
  return rings.map((r0, i) => {
    const r = simplify(open(r0), tol);
    const ccw = area2(r) > 0;
    return (i === 0) === ccw ? r : r.slice().reverse();
  });
}
/** Douglas-Peucker on a closed ring (split at the point farthest from the first): the 1900 survey and the traced
 *  outlines carry many points on straight walls, which cost wall quads and show nothing. */
function simplify(r: Ring, tol: number): Ring {
  if (r.length < 5) return r;
  const dp = (p: Ring): Ring => {
    const keep = new Uint8Array(p.length);
    keep[0] = keep[p.length - 1] = 1;
    const stack: [number, number][] = [[0, p.length - 1]];
    while (stack.length) {
      const [a, b] = stack.pop()!;
      const [ax, ay] = p[a], [bx, by] = p[b], len = Math.hypot(bx - ax, by - ay) || 1;
      let worst = -1, far = 0;
      for (let i = a + 1; i < b; i++) {
        const d = Math.abs((bx - ax) * (ay - p[i][1]) - (ax - p[i][0]) * (by - ay)) / len;
        if (d > far) (far = d), (worst = i);
      }
      if (far > tol) (keep[worst] = 1), stack.push([a, worst], [worst, b]);
    }
    return p.filter((_, i) => keep[i]);
  };
  let k = 0;
  for (let i = 1; i < r.length; i++) if (Math.hypot(r[i][0] - r[0][0], r[i][1] - r[0][1]) > Math.hypot(r[k][0] - r[0][0], r[k][1] - r[0][1])) k = i;
  const out = [...dp([...r.slice(0, k + 1)]), ...dp([...r.slice(k), r[0]]).slice(1, -1)];
  return out.length >= 3 ? out : r;
}
function densify(r: Ring, step = DENSE): Ring {
  const out: Ring = [];
  for (let i = 0; i < r.length; i++) {
    const [ax, ay] = r[i], [bx, by] = r[(i + 1) % r.length];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 0; k < n; k++) out.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
  }
  return out;
}
/** Triangles of a polygon with holes, each counter-clockwise from above, as vertex index triples into flat. */
function triangulate(rings: Ring[]): { flat: Ring; tris: number[] } {
  const flat: Ring = [], holes: number[] = [];
  rings.forEach((r, i) => {
    if (i) holes.push(flat.length);
    flat.push(...r);
  });
  const tris = earcut(flat.flat(), holes, 2);
  for (let t = 0; t < tris.length; t += 3) {
    const [a, b, c] = [flat[tris[t]], flat[tris[t + 1]], flat[tris[t + 2]]];
    if ((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]) < 0) [tris[t + 1], tris[t + 2]] = [tris[t + 2], tris[t + 1]];
  }
  return { flat, tris };
}
/** A flat-ish surface laid on the ground at +lift, or at a fixed height z. */
function drape(b: Builder, rings: Ring[], lift: number, z?: (x: number, y: number) => number, col?: number[]) {
  const { flat, tris } = triangulate(rings.map((r) => densify(r)));
  const base = b.count;
  for (const [x, y] of flat) b.vertex(P(x, y, (z ? z(x, y) : g(x, y)) + lift), [0, 1, 0], col);
  for (let t = 0; t < tris.length; t += 3) b.tri(base + tris[t], base + tris[t + 1], base + tris[t + 2]);
}
/** Vertical faces along each edge from bottom(x,y) to top(x,y), facing right of travel (out of an oriented polygon),
 *  or left of it with inward. Edges on the tile's border are skipped (they are cuts, not walls). */
function walls(b: Builder, rings: Ring[], bottom: (x: number, y: number) => number, top: (x: number, y: number) => number,
  opts: { inward?: boolean; col?: number[]; storey?: number; skip?: (a: number[], c: number[]) => boolean } = {}) {
  for (const r of rings)
    for (let i = 0; i < r.length; i++) {
      let a = r[i], c = r[(i + 1) % r.length];
      if (opts.skip?.(a, c)) continue;
      if (opts.inward) [a, c] = [c, a];
      const len = Math.hypot(c[0] - a[0], c[1] - a[1]);
      if (len < 0.05) continue;
      const n = N((c[1] - a[1]) / len, -(c[0] - a[0]) / len);
      const [ab, at, cb, ct] = [bottom(a[0], a[1]), top(a[0], a[1]), bottom(c[0], c[1]), top(c[0], c[1])];
      if (at - ab < 0.01 && ct - cb < 0.01) continue;
      const s = opts.storey ?? 1, h0 = Math.min(ab, cb);
      b.quad(P(a[0], a[1], ab), P(c[0], c[1], cb), P(c[0], c[1], ct), P(a[0], a[1], at), n, opts.col,
        [[0, -(ab - h0) / s], [len / BAY, -(cb - h0) / s], [len / BAY, -(ct - h0) / s], [0, -(at - h0) / s]]);
    }
}

// A round footprint DRUM_MIN m or more across (DRUM_ROUND by area against perimeter, or its outline's distance from
// the centre varying by DRUM_CV or less: a traced circle's jagged edge spoils the first, never the second; a square
// varies by 0.09-0.11) is a drum: a gasholder house or a water tower, drawn in brick with no
// window texture under a shallow dome. From GASHOLDER m across it takes the proportions of the Fichtestrasse holder
// (Schwedler, 1874-76: 56 m across, a 21 m brick wall, 27 m to the crown of its iron dome; structurae.net, en.wikipedia
// "Fichte-Bunker"); a smaller drum keeps the storeys read for it. A holder measured for itself (heights.ts: eaves_m and
// top_m, research/gasholders-1917.tsv) keeps its own wall and crown; the proportions are ASSUMED for the rest.
const DRUM_ROUND = 0.9, DRUM_CV = 0.065, DRUM_MIN = 20, GASHOLDER = 30, WALL_D = 21 / 56, DOME_D = 6 / 56;
function drum(r: Ring) {
  let a = 0, p = 0, cx = 0, cy = 0;
  for (let i = 0; i < r.length; i++) {
    const [x0, y0] = r[i], [x1, y1] = r[(i + 1) % r.length], c = x0 * y1 - x1 * y0;
    (a += c), (cx += (x0 + x1) * c), (cy += (y0 + y1) * c), (p += Math.hypot(x1 - x0, y1 - y0));
  }
  a /= 2;
  if (Math.abs(a) < 1) return null;
  const d = 2 * Math.sqrt(Math.abs(a) / Math.PI), c = { cx: cx / (6 * a), cy: cy / (6 * a), d };
  if (d < DRUM_MIN) return null;
  if ((4 * Math.PI * Math.abs(a)) / (p * p) >= DRUM_ROUND) return c;
  const rs: number[] = []; // the distance from the centre every metre along the outline
  for (let i = 0; i < r.length; i++) {
    const [x0, y0] = r[i], [x1, y1] = r[(i + 1) % r.length], L = Math.hypot(x1 - x0, y1 - y0);
    for (let t = 0; t < L; t += 1) rs.push(Math.hypot(x0 + ((x1 - x0) * t) / L - c.cx, y0 + ((y1 - y0) * t) / L - c.cy));
  }
  const m = rs.reduce((x, y) => x + y, 0) / rs.length;
  return Math.sqrt(rs.reduce((x, y) => x + (y - m) ** 2, 0) / rs.length) / m <= DRUM_CV ? c : null;
}
/** A dome over ring r: rings drawn in toward the centre, rising as 1 - s^2 to `rise` over `top`. */
function dome(b: Builder, r: Ring, c: { cx: number; cy: number }, top: number, rise: number, col: number[]) {
  const S = [1, 0.8, 0.55, 0.3, 0], at = (p: number[], s: number) => P(c.cx + (p[0] - c.cx) * s, c.cy + (p[1] - c.cy) * s, top + rise * (1 - s * s));
  for (let k = 0; k + 1 < S.length; k++)
    for (let i = 0; i < r.length; i++) {
      const q = [at(r[i], S[k]), at(r[(i + 1) % r.length], S[k]), at(r[(i + 1) % r.length], S[k + 1]), at(r[i], S[k + 1])];
      const u = [q[1][0] - q[0][0], q[1][1] - q[0][1], q[1][2] - q[0][2]], v = [q[3][0] - q[0][0], q[3][1] - q[0][1], q[3][2] - q[0][2]];
      let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const up = n[1] >= 0, m = Math.hypot(n[0], n[1], n[2]) || 1;
      n = n.map((x) => (up ? x : -x) / m);
      if (up) b.quad(q[0], q[1], q[2], q[3], n, col); else b.quad(q[0], q[3], q[2], q[1], n, col); // counter-clockwise from above
    }
}

// Inputs, read once.
const tileList = (await Bun.$`${import.meta.dir}/tiles.sh ${slicePath}`.text()).trim().split("\n").map((l) => {
  const [id, x0, y0, x1, y1] = l.split(" ");
  return { id, x0: +x0, y0: +y0, x1: +x1, y1: +y1 };
}).filter((t) => !only.length || only.includes(t.id));
const surf = new Map<string, { layer: string; rings: Ring[] }[]>();
for (const f of (await Bun.file(`${cache}/graybox/surfaces.geojson`).json()).features) {
  const list = surf.get(f.properties.tile) ?? [];
  for (const rings of polygons(f.geometry)) list.push({ layer: f.properties.layer, rings: orient(rings) });
  surf.set(f.properties.tile, list);
}
type Bld = { id: number; kind: string; storeys: number; name: string | null; rings: Ring[]; cx: number; cy: number; eaves_m?: number; top_m?: number };
const buildings: Bld[] = [];
for (const f of (await Bun.file(`${map}/buildings.geojson`).json()).features) {
  if (!f.geometry) continue;
  for (const rings of polygons(f.geometry)) {
    // Traced outlines step along the 0.25 m pixels of the scan on diagonals; 0.35 m takes the steps out.
    const o = orient(rings, f.properties.source === "straube-reader" ? TRACED_TOL : 0.15);
    if (o[0].length < 3) continue;
    const xs = o[0].map((p) => p[0]), ys = o[0].map((p) => p[1]);
    buildings.push({ id: f.properties.id, kind: f.properties.kind, storeys: f.properties.storeys, name: f.properties.name, eaves_m: f.properties.eaves_m ?? undefined, top_m: f.properties.top_m ?? undefined,
      rings: o, cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2 });
  }
}

/** The lattice points (LAT m) of a tile that lie inside any of these polygons. */
function inside(t: { x0: number; y0: number }, n: number, polys: Ring[][]): Uint8Array {
  const m = new Uint8Array(n * n);
  for (const rings of polys)
    for (let j = 0; j < n; j++) {
      const y = t.y0 + j * LAT, xs: number[] = [];
      for (const r of rings)
        for (let i = 0; i < r.length; i++) {
          const [ax, ay] = r[i], [bx, by] = r[(i + 1) % r.length];
          if ((ay > y) !== (by > y)) xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
        }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let i = Math.max(0, Math.ceil((xs[k] - t.x0) / LAT)); i < n && t.x0 + i * LAT <= xs[k + 1]; i++) m[j * n + i] = 1;
    }
  return m;
}
const median = (v: number[]) => (v.length ? v.slice().sort((a, b) => a - b)[Math.floor(v.length / 2)] : NaN);

const index: any[] = [];
for (const t of tileList) {
  const s = surf.get(t.id) ?? [];
  const on = (a: number[], c: number[]) =>
    (Math.abs(a[0] - c[0]) < 1e-6 && (Math.abs(a[0] - t.x0) < 1e-3 || Math.abs(a[0] - t.x1) < 1e-3)) ||
    (Math.abs(a[1] - c[1]) < 1e-6 && (Math.abs(a[1] - t.y0) < 1e-3 || Math.abs(a[1] - t.y1) < 1e-3));
  const n = Math.round((t.x1 - t.x0) / LAT) + 1;
  // Water: each piece's level is the median of today's survey over it (the river held by its locks); the ground
  // under water and bridges is carved 2.5 m below the tile's water.
  const water = s.filter((p) => p.layer === "water"), bridges = s.filter((p) => p.layer === "bridge");
  const wet = inside(t, n, water.map((p) => p.rings)), under = inside(t, n, bridges.map((p) => p.rings));
  const levels = water.map((p) => {
    const m = inside(t, n, [p.rings]), v: number[] = [];
    for (let k = 0; k < m.length; k++) if (m[k]) v.push(g(t.x0 + (k % n) * LAT, t.y0 + Math.floor(k / n) * LAT));
    return v.length ? median(v) : g(...(p.rings[0][0] as [number, number]));
  });
  const tileLevel = levels.length ? median(levels) : NaN;

  const terrain = new Builder(M.street);
  const z = new Float32Array(n * n);
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const k = j * n + i, x = t.x0 + i * LAT, y = t.y0 + j * LAT;
      z[k] = g(x, y) - ((wet[k] || under[k]) && !isNaN(tileLevel) ? g(x, y) - tileLevel + 2.5 : 0);
    }
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const k = j * n + i;
      const dx = (z[j * n + Math.min(n - 1, i + 1)] - z[j * n + Math.max(0, i - 1)]) / (2 * LAT);
      const dy = (z[Math.min(n - 1, j + 1) * n + i] - z[Math.max(0, j - 1) * n + i]) / (2 * LAT);
      const l = Math.hypot(dx, dy, 1);
      terrain.vertex(P(t.x0 + i * LAT, t.y0 + j * LAT, z[k]), N(-dx / l, -dy / l, 1 / l));
    }
  for (let j = 0; j + 1 < n; j++)
    for (let i = 0; i + 1 < n; i++) {
      const a = j * n + i;
      terrain.tri(a, a + 1, a + n + 1);
      terrain.tri(a, a + n + 1, a + n);
    }

  const layer = (name: string, mat: number, lift: number) => {
    const b = new Builder(mat);
    for (const p of s) if (p.layer === name) drape(b, p.rings, lift);
    return b;
  };
  // The kerb is the carriageway's edge, facing into it; the sidewalk's other edges run under the houses.
  const sidewalk = layer("sidewalk", M.sidewalk, 0.15), kerb = new Builder(M.kerb);
  for (const p of s.filter((q) => q.layer === "carriage")) walls(kerb, p.rings, (x, y) => g(x, y) - 0.05, (x, y) => g(x, y) + 0.15, { inward: true, skip: on });
  const surface = new Builder(M.water), quay = new Builder(M.quay);
  water.forEach((p, i) => {
    const lv = levels[i];
    drape(surface, p.rings, 0, () => lv);
    // A quay wall faces the water, from 2.5 m under it up to the ground a metre and a half inland.
    walls(quay, p.rings, () => lv - 2.5, (x, y) => Math.max(lv + 0.3, g(x, y)), { inward: true, skip: on });
  });
  const deck = new Builder(M.bridge);
  for (const p of bridges) {
    const zs = p.rings[0].map(([x, y]) => g(x, y)).sort((a, b) => a - b);
    const top = Math.max(zs[Math.floor(zs.length * 0.9)], (isNaN(tileLevel) ? -Infinity : tileLevel + 2));
    drape(deck, p.rings, 0, () => top);
    walls(deck, p.rings, () => top - 1.2, () => top, { skip: on });
  }

  const wall = new Builder(M.wall, true), pub = new Builder(M.publicWall, true), roof = new Builder(M.roof), brick = new Builder(M.brick, true);
  const named: { name: string; x: number; z: number }[] = [];
  let count = 0, drums = 0;
  for (const bd of buildings) {
    if (bd.cx < t.x0 || bd.cx >= t.x1 || bd.cy < t.y0 || bd.cy >= t.y1) continue;
    count++;
    const isPub = bd.kind === "public", storeys = bd.storeys || (isPub ? 4 : 5);
    const storeyH = isPub ? 5 : STOREY;
    const footing = bd.rings[0].map(([x, y]) => g(x, y));
    const front = footing.reduce((a, b) => a + b, 0) / footing.length;
    // Private fronts are held to the 22 m limit; public buildings were not.
    const eaves = front + (isPub ? storeys * storeyH : Math.min(22, storeys * storeyH));
    const col = shade(bd.id, isPub ? 228 : 236), dr = drum(bd.rings[0]);
    if (dr) {
      const top = bd.eaves_m != null ? front + bd.eaves_m : dr.d >= GASHOLDER ? front + WALL_D * dr.d : eaves;
      const rise = bd.eaves_m != null && bd.top_m != null ? bd.top_m - bd.eaves_m : DOME_D * dr.d;
      walls(brick, bd.rings, (x, y) => g(x, y) - 0.5, () => top, { col, storey: storeyH });
      dome(roof, bd.rings[0], dr, top, rise, shade(bd.id * 7, 255));
      drums++;
    } else {
      walls(isPub ? pub : wall, bd.rings, (x, y) => g(x, y) - 0.5, () => eaves, { col, storey: storeyH });
      drape(roof, bd.rings, 0, () => eaves, shade(bd.id * 7, 255));
    }
    if (bd.name) { const [x, , zz] = P(bd.cx, bd.cy, 0); named.push({ name: bd.name, x: +x.toFixed(1), z: +zz.toFixed(1) }); }
  }

  const nodes: Node[] = [
    { name: "ground", parts: [terrain.part()!] },
    ...([["sidewalk", sidewalk], ["kerb", kerb], ["courtyard", layer("courtyard", M.courtyard, 0.03)], ["green", layer("green", M.green, 0.05)],
      ["rail", layer("rail", M.rail, 0.04)], ["water", surface], ["quay", quay], ["bridge", deck], ["walls", wall], ["public walls", pub], ["brick walls", brick], ["roofs", roof]] as [string, Builder][])
      .map(([name, b]) => ({ name, parts: [b.part()].filter(Boolean) as any[] })),
  ];
  const glb = writeGlb(nodes.filter((nd) => nd.parts.length), materials, [new Uint8Array(tex)]);
  await Bun.write(`${outDir}/${t.id}.glb`, glb);
  index.push({ tile: t.id, bbox: [t.x0, t.y0, t.x1, t.y1], buildings: count, water_level_m: isNaN(tileLevel) ? null : +tileLevel.toFixed(2),
    ground_m: [+Math.min(...z).toFixed(2), +Math.max(...z).toFixed(2)], kb: Math.round(glb.byteLength / 1024), named });
  console.log(`${t.id}: ${count} buildings${drums ? ` (${drums} drums)` : ""}, ${s.length} surfaces, ${Math.round(glb.byteLength / 1024)} kB`);
}
await Bun.write(`${outDir}/index.json`, JSON.stringify({ origin_epsg25833: ORIGIN, frame: "x east, y up (m above NHN), z south; metres", tiles: index }, null, 1));
