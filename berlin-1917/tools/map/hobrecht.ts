// Fits a plate of Hobrecht's "Die Canalisation von Berlin" (1884 atlas, e-rara DOI 10.3931/e-rara-19774, public
// domain) to EPSG:25833, then draws it north up on the map's grid.
//   1. A first affine from a few hand-picked control points (tools/map/hobrecht/<plate>.tsv: plate px, plate py, x, y,
//      what). Landmark coordinates are approximate (Wikipedia/OHM); the fit below does not depend on them being exact.
//   2. Blocks (plateblocks.ts): the plate's blocks, closed by their building lines, are paired with the map's by
//      centroid in rounds of shrinking radius, affine then quadratic, the worst tenth of pairs dropped each round.
//   3. ICP: the 1917 building lines (the edges of open.geojson's street space, every STEP m) are pulled onto the
//      plate's nearest dark pixel inside R1-8 plate px, with the block pairs kept in each solve (BLOCKW times each).
//      The sewers are drawn just inside each building line, so a line point can pair with a sewer, or with the far
//      side of a street where the start is 10 m off; the blocks hold the fit where lines alone would not (on Blatt 4
//      the line rounds alone, from four landmarks, left Friedrichstadt 10-17 m off and 29% of the sewers under houses).
//   4. What the polynomial cannot bend to, a smooth local field d (platefield.ts) measured on a first warp; the
//      plate's content for map point p is then read at the fit's M(p + d(p)).
//   5. The plate warped onto the map's grid at OUT_M per pixel over its own extent, for overlays and tracing.
//   bun hobrecht.ts PLATE        reads cache/hobrecht/<plate>.jpg, writes cache/hobrecht/<plate>.fit.json and
//                                <plate>.north.png (grey, OUT_M m per px, with the bbox in the fit json)
import { slicePaths } from "./paths";
import { mapBlocks, pairBlocks, plateBlocks } from "./plateblocks";
import { fieldGrid, plateField } from "./platefield";

const plate = process.argv[2] ?? "blatt04";
const { root, map, slice } = await slicePaths(`${import.meta.dir}/slice.json`);
const dir = `${root}/cache/hobrecht`;
const STEP = 4, R1 = 5, DARK = 170, OUT_M = 0.5, BLOCKW = 40;
// The plate's main frame, and what in it is not the map (legend, insets, a double page's fold), in plate px:
// tools/map/hobrecht/<plate>.json {frame, holes}.
type Rect = { x0: number; y0: number; x1: number; y1: number };
const { frame: FRAME, holes: HOLES } = (await Bun.file(`${import.meta.dir}/hobrecht/${plate}.json`).json()) as { frame: Rect; holes: Rect[] };

// The plate as grey bytes.
const size = (await Bun.$`magick identify -format "%w %h" ${dir}/${plate}.jpg`.text()).split(" ").map(Number);
const [PW, PH] = size;
const grey = new Uint8Array(await Bun.$`magick ${dir}/${plate}.jpg -colorspace Gray -depth 8 gray:-`.arrayBuffer());
const usable = (px: number, py: number) =>
  px >= FRAME.x0 && px < FRAME.x1 && py >= FRAME.y0 && py < FRAME.y1 && !HOLES.some((h) => px >= h.x0 && px < h.x1 && py >= h.y0 && py < h.y1);

// Nearest dark pixel for every plate pixel, by two-pass propagation of the nearest site (an approximate EDT).
const near = new Int32Array(PW * PH).fill(-1);
for (let i = 0; i < PW * PH; i++) if (grey[i] < DARK) near[i] = i;
const d2 = (i: number, s: number) => { const dx = (i % PW) - (s % PW), dy = ((i / PW) | 0) - ((s / PW) | 0); return dx * dx + dy * dy; };
const relax = (i: number, j: number) => { const s = near[j]; if (s >= 0 && (near[i] < 0 || d2(i, s) < d2(i, near[i]))) near[i] = s; };
for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) { const i = y * PW + x; if (x) relax(i, i - 1); if (y) { relax(i, i - PW); if (x) relax(i, i - PW - 1); if (x < PW - 1) relax(i, i - PW + 1); } }
for (let y = PH - 1; y >= 0; y--) for (let x = PW - 1; x >= 0; x--) { const i = y * PW + x; if (x < PW - 1) relax(i, i + 1); if (y < PH - 1) { relax(i, i + PW); if (x < PW - 1) relax(i, i + PW + 1); if (x) relax(i, i + PW - 1); } }

// Building lines: the street space's edges, sampled every STEP m.
const refs: number[][] = [];
for (const f of (await Bun.file(`${map}/open.geojson`).json()).features) {
  if (f.properties.kind !== "street") continue;
  for (const poly of f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates)
    for (const ring of poly as number[][][])
      for (let i = 1; i < ring.length; i++) {
        const [a, b] = [ring[i - 1], ring[i]], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        for (let t = 0; t < L; t += STEP) refs.push([a[0] + ((b[0] - a[0]) * t) / L, a[1] + ((b[1] - a[1]) * t) / L]);
      }
}

// Map terms: affine [1, u, v] or quadratic [1, u, v, uu, uv, vv], in km from the slice's middle (kept well scaled).
const C = [391000, 5819000];
const terms = (x: number, y: number, q: boolean) => { const u = (x - C[0]) / 1000, v = (y - C[1]) / 1000; return q ? [1, u, v, u * u, u * v, v * v] : [1, u, v]; };
const apply = (m: number[][], x: number, y: number) => { const t = terms(x, y, m[0].length > 3); return [0, 1].map((k) => m[k].reduce((s, c, i) => s + c * t[i], 0)); };
/** Least squares for one output coordinate: normal equations, Gaussian elimination. */
function solve(rows: number[][], rhs: number[]): number[] {
  const n = rows[0].length, A = Array.from({ length: n }, () => new Array(n + 1).fill(0));
  rows.forEach((r, k) => { for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) A[i][j] += r[i] * r[j]; A[i][n] += r[i] * rhs[k]; } });
  for (let i = 0; i < n; i++) {
    let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    [A[i], A[p]] = [A[p], A[i]];
    for (let r = 0; r < n; r++) if (r !== i) { const f = A[r][i] / A[i][i]; for (let c = i; c <= n; c++) A[r][c] -= f * A[i][c]; }
  }
  return A.map((r, i) => r[n] / r[i]);
}
const fit = (pairs: { x: number; y: number; px: number; py: number }[], q: boolean) => {
  const rows = pairs.map((p) => terms(p.x, p.y, q));
  return [solve(rows, pairs.map((p) => p.px)), solve(rows, pairs.map((p) => p.py))];
};

const cps = (await Bun.file(`${import.meta.dir}/hobrecht/${plate}.tsv`).text()).split("\n").filter((l) => l && !l.startsWith("#"))
  .map((l) => l.split("\t")).map(([px, py, x, y, what]) => ({ px: +px, py: +py, x: +x, y: +y, what }));
let M = fit(cps, false);
const report = (m: number[][]) => cps.map((c) => { const [px, py] = apply(m, c.x, c.y); return `${c.what} ${Math.hypot(px - c.px, py - c.py).toFixed(0)} px`; }).join(", ");
console.log(`start from ${cps.length} control points: ${report(M)}`);

// Blocks: plate px areas from 2,000 to 150,000 (about 900-66,000 m2), the map's from 1,500 to 60,000 m2.
const pb = plateBlocks(grey, PW, PH, DARK, usable).filter((b) => b.a >= 2000 && b.a <= 150000);
const ob = (await mapBlocks(map, slice.bbox)).filter((b) => b.a >= 1500 && b.a <= 60000);
const scale = (m: number[][]) => { const [a, b] = apply(m, C[0], C[1]), [c, d] = apply(m, C[0] + 100, C[1]); return 100 / Math.hypot(c - a, d - b); };
const residual = (m: number[][], p: { x: number; y: number; px: number; py: number }) => { const [px, py] = apply(m, p.x, p.y); return Math.hypot(px - p.px, py - p.py); };
const pct = (v: number[], q: number) => v.slice().sort((a, b) => a - b)[Math.floor((v.length - 1) * q)] ?? NaN;
let blocks: { x: number; y: number; px: number; py: number }[] = [];
for (const [R, q] of [[80, false], [50, false], [40, true], [25, true], [25, true]] as [number, boolean][]) {
  const s2 = scale(M) ** 2;
  const pairs = pairBlocks(ob.map((o) => { const [px, py] = apply(M, o.x, o.y); return { px, py, a: o.a / s2 }; }), pb, R)
    .map((p) => ({ x: ob[p.i].x, y: ob[p.i].y, px: pb[p.j].x, py: pb[p.j].y }));
  if (pairs.length < 12) break;
  M = fit(pairs, q);
  const r = pairs.map((p) => residual(M, p)), cut = pct(r, 0.9);
  blocks = pairs.filter((_, k) => r[k] <= cut);
  M = fit(blocks, q);
  const rm = blocks.map((p) => residual(M, p) * scale(M));
  console.log(`blocks, radius ${R} px, ${q ? "quadratic" : "affine"}: ${blocks.length} of ${pairs.length} pairs kept (${pb.length} on the plate, ${ob.length} on the map), median ${pct(rm, 0.5).toFixed(1)} m, 90% ${pct(rm, 0.9).toFixed(1)} m`);
}
const weighted = blocks.flatMap((p) => Array(BLOCKW).fill(p));

let stats = { n: 0, rms: 0 };
const rounds: [number, boolean][] = blocks.length >= 12 ? [[8, true], [R1, true], [R1, true], [R1, true]]
  : [[30, false], [20, false], [12, false], [8, false], [8, true], [R1, true], [R1, true], [R1, true]];
for (const [R, q] of rounds) {
  const pairs: { x: number; y: number; px: number; py: number }[] = [];
  let ss = 0;
  for (const [x, y] of refs) {
    const [px, py] = apply(M, x, y), ix = Math.round(px), iy = Math.round(py);
    if (!usable(ix, iy)) continue;
    const s = near[iy * PW + ix];
    if (s < 0) continue;
    const sx = s % PW, sy = (s / PW) | 0, d = Math.hypot(sx - px, sy - py);
    if (d > R) continue;
    pairs.push({ x, y, px: sx, py: sy });
    ss += d * d;
  }
  M = fit([...pairs, ...weighted], q);
  stats = { n: pairs.length, rms: Math.sqrt(ss / pairs.length) };
  console.log(`radius ${R} px, ${q ? "quadratic" : "affine"}: ${pairs.length} of ${refs.length} edge points paired, rms ${stats.rms.toFixed(2)} px`);
}

// Metres per plate pixel at the middle, and the turn of north, from the fitted map's local derivative.
const [ax, ay] = apply(M, C[0], C[1]), [ex, ey] = apply(M, C[0] + 100, C[1]), [nx, ny] = apply(M, C[0], C[1] + 100);
const mpp = 100 / Math.hypot(ex - ax, ey - ay), north = (Math.atan2(-(ny - ay), nx - ax) * 180) / Math.PI;
console.log(`plate: ${mpp.toFixed(3)} m per px (1:7500 at ${(25.4 / ((mpp * 1000) / 7500)).toFixed(0)} dpi), north drawn at ${north.toFixed(1)} deg; rms ${(stats.rms * mpp).toFixed(1)} m`);
console.log(`control points after the fit: ${report(M)}`);
const blockRes = blocks.map((p) => residual(M, p) * mpp);
console.log(`blocks after the fit: ${blocks.length}, median ${pct(blockRes, 0.5).toFixed(1)} m, 90% ${pct(blockRes, 0.9).toFixed(1)} m`);

// The plate north up on the map grid, over the map extent its frame covers.
// Invert by a dense grid: sample map points on a coarse lattice, keep those whose plate px is in the frame.
let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
for (let x = C[0] - 5000; x <= C[0] + 5000; x += 50) for (let y = C[1] - 5000; y <= C[1] + 5000; y += 50) {
  const [px, py] = apply(M, x, y);
  if (px >= FRAME.x0 && px < FRAME.x1 && py >= FRAME.y0 && py < FRAME.y1) { bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y); }
}
const W = Math.round((bx1 - bx0) / OUT_M), H = Math.round((by1 - by0) / OUT_M);
const warp = (shift: (x: number, y: number) => [number, number]) => {
  const out = new Uint8Array(W * H).fill(255);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
  const mx = bx0 + (i + 0.5) * OUT_M, my = by1 - (j + 0.5) * OUT_M, [sx, sy] = shift(mx, my);
  const [px, py] = apply(M, mx + sx, my + sy);
  const x = Math.floor(px), y = Math.floor(py);
  if (x < 0 || y < 0 || x >= PW - 1 || y >= PH - 1 || !usable(x, y)) continue;
  const fx = px - x, fy = py - y, k = y * PW + x;
  out[j * W + i] = (grey[k] * (1 - fx) + grey[k + 1] * fx) * (1 - fy) + (grey[k + PW] * (1 - fx) + grey[k + PW + 1] * fx) * fy;
  }
  return out;
};
const nodes = await plateField(warp(() => [0, 0]), W, H, OUT_M, [bx0, by0, bx1, by1], map);
const out = warp(fieldGrid(nodes, [bx0, by0, bx1, by1]));
const dn = nodes.map((k) => Math.hypot(k.dx, k.dy));
console.log(`local field: ${nodes.length} nodes, shift median ${pct(dn, 0.5).toFixed(1)} m, 90% ${pct(dn, 0.9).toFixed(1)} m, largest ${pct(dn, 1).toFixed(1)} m`);
await Bun.write(`${dir}/${plate}.north.gray`, out);
await Bun.$`magick -size ${W}x${H} -depth 8 gray:${dir}/${plate}.north.gray ${dir}/${plate}.north.png && rm ${dir}/${plate}.north.gray`;
await Bun.write(`${dir}/${plate}.fit.json`, JSON.stringify({
  plate, source: "Hobrecht, Die Canalisation von Berlin (1884), Atlas, e-rara DOI 10.3931/e-rara-19774 (public domain)",
  map_to_plate: { centre: C, unit: "km", terms: M[0].length > 3 ? "1 u v uu uv vv" : "1 u v", px: M[0], py: M[1] },
  m_per_px: +mpp.toFixed(4), north_deg: +north.toFixed(2), paired: stats.n, rms_m: +(stats.rms * mpp).toFixed(2),
  blocks: blocks.length, block_median_m: +pct(blockRes, 0.5).toFixed(2), block_p90_m: +pct(blockRes, 0.9).toFixed(2),
  field: { note: "the plate's content for map point p is at map_to_plate(p + d(p)); d between nodes is their Gaussian mean (platefield.ts)", sigma_m: 80, nodes },
  north_png: { file: `${plate}.north.png`, m_per_px: OUT_M, bbox: [bx0, by0, bx1, by1], width: W, height: H },
}, null, 1));
console.log(`${plate}.north.png: ${W}x${H} at ${OUT_M} m per px over ${bx0} ${by0} ${bx1} ${by1}`);
