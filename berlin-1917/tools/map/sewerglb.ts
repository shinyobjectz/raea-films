// The sewers of sewers.ts as one glTF in graybox.ts's frame (x east, y up in metres NHN, z south; origin 391000/5819000).
// Stoneware pipes are round; brick sewers are egg profiles (width two thirds of the height, the round crown on top);
// manholes are Blatt 9's (research/sewer-structures-1884.tsv): a round brick shaft 0.95 m inside from the sewer's crown,
// corbelled in over the top 1.25 m to the 0.556 m opening under the iron lid (its 0.716 m frame); III's station is its
// Blatt 9 sand trap, a round basin 7.53 m in radius round a 2.0 m well (0.51 m walls), from the trunk's invert to the
// street, at the Sandfang Blatt 16 places (station3.ts), the gravity system ending at the distribution well beside it;
// the station's Verbindungskanal and Nothauslass are Blatt 7's outlet arch (half-round on a flat invert); IIIa's is a 10 m shaft (assumed, Blatt 25 not read); its pressure main is an iron pipe 2 m down. Street levels come from the same 1917 ground as sewers.ts (groundgrid.ts streetLevel).
//   bun sewerglb.ts [SLICE.json]   writes assets/graybox/<slice>/sewers/sewers.glb and index.json
import { Builder, type Material, type Node, writeGlb } from "./glb";
import { loadGround, streetLevel } from "./groundgrid";
import { slicePaths } from "./paths";

const { slice, root, own, map } = await slicePaths(process.argv[2] ?? `${import.meta.dir}/slice.json`);
const g0 = await loadGround(map, own);
const g = streetLevel(g0);
const ORIGIN = [391000, 5819000];
const P = (x: number, y: number, z: number) => [x - ORIGIN[0], z, -(y - ORIGIN[1])];
const STEP = 3, SHAFT_R = 0.475, NECK_R = 0.278, NECK = 1.25, LID_R = 0.358, SUMP_R = 5, TRAP_R = 7.53, WELL_R = 1.51, WALL = 0.12;

const materials: Material[] = [
  { name: "salt-glazed stoneware", color: [0.36, 0.21, 0.11, 1], roughness: 0.35, doubleSided: true },
  { name: "sewer brick", color: [0.52, 0.24, 0.15, 1], roughness: 0.9, doubleSided: true },
  { name: "cast iron", color: [0.08, 0.08, 0.085, 1], roughness: 0.5, metallic: 0.7, doubleSided: true },
  { name: "shaft brick", color: [0.44, 0.27, 0.2, 1], roughness: 0.9, doubleSided: true },
];
const B = { pipe: new Builder(0), egg: new Builder(1), iron: new Builder(2), shaft: new Builder(3), lid: new Builder(2) };

/** A cross-section as (across, up) points from the invert, counter-clockwise seen downstream, with outward normals. */
function section(kind: string, h: number, w: number, n: number): { p: number[]; n: number[] }[] {
  const out: { p: number[]; n: number[] }[] = [];
  if (kind === "arch channel") {
    // Blatt 7's Nothauslass section: a half-round crown of radius w/2 springing from a flat invert.
    const r = w / 2 + WALL / 2;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 2 * Math.PI, sx = Math.sin(a), cy = -Math.cos(a);
      out.push(cy >= 0 ? { p: [r * sx, r * cy], n: [sx, cy] } : { p: [r * sx, -WALL / 2], n: [0, -1] });
    }
    return out;
  }
  if (kind !== "brick egg profile") {
    const r = h / 2 + WALL / 2;
    for (let i = 0; i < n; i++) { const a = (i / n) * 2 * Math.PI; out.push({ p: [r * Math.sin(a), h / 2 - r * Math.cos(a)], n: [Math.sin(a), -Math.cos(a)] }); }
    return out;
  }
  // Egg: a half circle of radius w/2 for the crown, a half ellipse (w/2 across, h - w/2 down) for the invert.
  const r = w / 2 + WALL / 2, c = h - w / 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI, sx = Math.sin(a), cy = -Math.cos(a);
    if (cy >= 0) out.push({ p: [r * sx, c + r * cy], n: [sx, cy] });
    else { const ry = c + WALL / 2, nx = sx / r, ny = cy / ry, l = Math.hypot(nx, ny); out.push({ p: [r * sx, c + ry * cy], n: [nx / l, ny / l] }); }
  }
  return out;
}

/** A tube along map points pts (x, y), its invert running from z0 to z1, every STEP metres. */
function tube(b: Builder, pts: number[][], z0: number | ((x: number, y: number) => number), z1: number, kind: string, h: number, w: number) {
  const segs: number[] = [0];
  for (let i = 1; i < pts.length; i++) segs.push(segs[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = segs[segs.length - 1];
  if (L < 0.5) return;
  const sec = section(kind, h, w, kind === "pipe" || kind === "stoneware pipe" ? 10 : 16);
  const rings: number[][] = [];
  const count = Math.max(1, Math.ceil(L / STEP));
  for (let k = 0; k <= count; k++) {
    const d = (k / count) * L;
    let i = 1;
    while (i < segs.length - 1 && segs[i] < d) i++;
    const f = (d - segs[i - 1]) / (segs[i] - segs[i - 1] || 1);
    const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f;
    const tx = pts[i][0] - pts[i - 1][0], ty = pts[i][1] - pts[i - 1][1], tl = Math.hypot(tx, ty) || 1;
    const ax = -ty / tl, ay = tx / tl; // across, to the left looking downstream
    const z = typeof z0 === "function" ? z0(x, y) : z0 + (z1 - z0) * (d / L);
    rings.push(sec.map((s) => b.vertex(P(x + ax * s.p[0], y + ay * s.p[0], z + s.p[1]), [ax * s.n[0], s.n[1], -(ay * s.n[0])])));
  }
  for (let k = 0; k + 1 < rings.length; k++)
    for (let j = 0; j < sec.length; j++) {
      const a = rings[k][j], c = rings[k][(j + 1) % sec.length], d = rings[k + 1][(j + 1) % sec.length], e = rings[k + 1][j];
      b.tri(a, e, d);
      b.tri(a, d, c);
    }
}

/** An upright cylinder (a cone when r1 is given) at map point (x, y) from z0 (radius r) to z1 (radius r1), open, with n
 * sides; a lid disk on top when lid is given, lidR across (default r1 + 0.1). */
function shaft(b: Builder, x: number, y: number, r: number, z0: number, z1: number, n: number, lid?: Builder, r1 = r, lidR = r1 + 0.1) {
  const lo: number[] = [], hi: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI, cx = Math.cos(a), cy = Math.sin(a);
    lo.push(b.vertex(P(x + r * cx, y + r * cy, z0), [cx, 0, -cy]));
    hi.push(b.vertex(P(x + r1 * cx, y + r1 * cy, z1), [cx, 0, -cy]));
  }
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; b.tri(lo[i], lo[j], hi[j]); b.tri(lo[i], hi[j], hi[i]); }
  if (!lid) return;
  const c = lid.vertex(P(x, y, z1 + 0.02), [0, 1, 0]), ring = Array.from({ length: n }, (_, i) => lid.vertex(P(x + lidR * Math.cos((i / n) * 2 * Math.PI), y + lidR * Math.sin((i / n) * 2 * Math.PI), z1 + 0.02), [0, 1, 0]));
  for (let i = 0; i < n; i++) lid.tri(c, ring[(i + 1) % n], ring[i]);
}

const lines = (await Bun.file(`${map}/sewers.geojson`).json()).features;
const points = (await Bun.file(`${map}/sewer_points.geojson`).json()).features;
let km = 0;
for (const f of lines) {
  const p = f.properties, pts = f.geometry.coordinates as number[][];
  if (p.kind === "pressure main") { tube(B.iron, pts, (x, y) => g(x, y) - p.depth_in - p.height_m, 0, "pipe", p.height_m, p.width_m); continue; }
  tube(p.kind === "brick egg profile" || p.kind === "arch channel" ? B.egg : B.pipe, pts, p.invert_in, p.invert_out, p.kind, p.height_m, p.width_m);
  km += pts.reduce((s: number, q: number[], i: number) => (i ? s + Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) : 0), 0) / 1000;
}
const stations: object[] = [], hasTrap = points.some((f: any) => f.properties.kind === "sand trap");
for (const f of points) {
  const [x, y] = f.geometry.coordinates, p = f.properties, top = g(x, y);
  if (p.kind === "manhole") {
    const z0 = p.invert + 0.3, neck = Math.max(z0, top - NECK);
    shaft(B.shaft, x, y, SHAFT_R, z0, neck, 12);
    shaft(B.shaft, x, y, SHAFT_R, neck, top, 12, B.lid, NECK_R, LID_R);
  } else if (p.kind === "air valve") {
    continue;
  } else if (p.kind === "sand trap" || (p.system === "III" && !hasTrap)) {
    shaft(B.shaft, x, y, TRAP_R, p.invert, top, 48, B.lid, TRAP_R, TRAP_R);
    shaft(B.shaft, x, y, WELL_R, p.invert, top, 24);
    stations.push({ system: p.system, name: p.name, x, y, invert: p.invert, street: +top.toFixed(2), at: P(x, y, top).map((v) => +v.toFixed(1)) });
  } else if (p.system === "III") {
    // Blatt 9's distribution well, 2.5 m square inside, as a round shaft of the same width (ASSUMED round).
    shaft(B.shaft, x, y, 1.25 + WALL, p.invert - 0.5, top, 24, B.lid, 1.25, 1.25);
    stations.push({ system: p.system, name: p.name, x, y, invert: p.invert, street: +top.toFixed(2), at: P(x, y, top).map((v) => +v.toFixed(1)) });
  } else {
    shaft(B.shaft, x, y, SUMP_R, p.invert - 1.5, top, 32, B.lid);
    stations.push({ system: p.system, name: p.name, x, y, invert: p.invert, street: +top.toFixed(2), at: P(x, y, top).map((v) => +v.toFixed(1)) });
  }
}
const nodes: Node[] = [
  { name: "stoneware pipes", parts: [B.pipe.part()].filter(Boolean) as never },
  { name: "brick sewers", parts: [B.egg.part()].filter(Boolean) as never },
  { name: "pressure main", parts: [B.iron.part()].filter(Boolean) as never },
  { name: "shafts", parts: [B.shaft.part()].filter(Boolean) as never },
  { name: "lids", parts: [B.lid.part()].filter(Boolean) as never },
].filter((n) => n.parts.length);
const glb = writeGlb(nodes, materials);
const dir = `${root}/assets/graybox/${slice.name}/sewers`;
await Bun.$`mkdir -p ${dir}`;
await Bun.write(`${dir}/sewers.glb`, glb);
await Bun.write(`${dir}/index.json`, JSON.stringify({ origin_epsg25833: ORIGIN, stations, km: +km.toFixed(1) }, null, 1));
console.log(`${slice.name}: sewers.glb ${(glb.length / 1e6).toFixed(1)} MB, ${km.toFixed(1)} km of sewer, ${points.length} shafts`);
