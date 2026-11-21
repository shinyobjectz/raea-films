// The sewers drawn on a Hobrecht plate, read off its north-up warp (hobrecht.ts) as lines and structures in EPSG:25833.
// On Blatt 4 (System III, 1:7500) a sewer is a dark line 3-6 px wide at 0.5 m per px, drawn just inside the thin
// (1-2 px) building line on each side it serves; "Gemauerte Canäle" (brick) are drawn heavier than "Thonrohrleitungen"
// (stoneware pipe). Revisionsbrunnen (manholes) are round dots and gullies small squares, both about 6 m across as drawn.
//   1. dark = grey < DARK; the dots and squares are the pieces at least BLOB px from the paper (their centres kept);
//   2. an opening by LINE px drops the building lines, hatching and most lettering; small pieces (lettering, arrows)
//      under MIN_M long are dropped;
//   3. thinned and read as a graph (thin.ts); dead ends under SPUR m (bumps where a square sits on a line) pruned;
//   4. each line's drawn width is twice the median distance to the paper along it.
//   bun hobrechttrace.ts PLATE   reads cache/hobrecht/<plate>.north.png and .fit.json, writes cache/hobrecht/<plate>.lines.geojson
import { slicePaths } from "./paths";
import { chamfer, graph, len, median, mergeThrough, open, pieces, prune, simplify, thin } from "./thin";

const plate = process.argv[2] ?? "blatt04";
const { root } = await slicePaths(`${import.meta.dir}/slice.json`);
const dir = `${root}/cache/hobrecht`;
const fit = await Bun.file(`${dir}/${plate}.fit.json`).json();
const { m_per_px: M, bbox, width: W, height: H } = fit.north_png;
const [BX0, , , BY1] = bbox as number[];
const DARK = 140, LINE = 2, BLOB = 3.5, MIN_M = 25, SPUR = 8, TOL = 0.5;
const at = (i: number) => [BX0 + ((i % W) + 0.5) * M, BY1 - (Math.floor(i / W) + 0.5) * M];

const grey = new Uint8Array(await Bun.$`magick ${dir}/${plate}.north.png -depth 8 gray:-`.arrayBuffer());
const img = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) img[i] = grey[i] < DARK ? 1 : 0;
for (let x = 0; x < W; x++) img[x] = img[(H - 1) * W + x] = 0;
for (let y = 0; y < H; y++) img[y * W] = img[y * W + W - 1] = 0;
const dist = chamfer(W, H, (i) => !img[i]);

// 1. Dots and squares: pieces of the deep core; a round dot fills about pi r^2 of its core, a square about 4 r^2.
const core = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) core[i] = dist[i] >= BLOB ? 1 : 0;
const blobs = pieces(core, W, H, (m) => m.length >= 3).map((m) => {
  const xy = m.map(at), r = Math.max(...m.map((i) => dist[i]));
  const n = m.length, area = Math.PI * r * r;
  return { x: xy.reduce((s, p) => s + p[0], 0) / n, y: xy.reduce((s, p) => s + p[1], 0) / n, r_m: r * M, core_px: n, fill: n / area };
});
core.fill(0);

// 2. Lines: open, then keep pieces at least MIN_M across.
open(img, W, H, dist, LINE);
let dropped = 0;
pieces(img, W, H, (m) => {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const i of m) { const x = i % W, y = (i / W) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const ok = Math.hypot(x1 - x0, y1 - y0) * M >= MIN_M;
  if (!ok) dropped++;
  return ok;
});

// 3. Thin, graph, prune.
const fg = thin(img, W, H);
const { nodes, edges: e0 } = graph(img, W, fg, at, (i) => dist[i]);
let edges = prune(e0.filter((e) => e.a !== e.b), SPUR, 3, 15);
edges = mergeThrough(edges);

// 4. Widths: twice the median half-width, in metres as drawn; points inside a dot or square are left out.
const blobAt = new Set<number>();
const features = edges.map((e) => {
  const hw = e.pts.map((p) => p[2]).filter((v) => v < BLOB);
  const width = 2 * (hw.length ? median(hw) : median(e.pts.map((p) => p[2]))) * M;
  return { type: "Feature", geometry: { type: "LineString", coordinates: simplify(e.pts, TOL).map((p) => [+p[0].toFixed(2), +p[1].toFixed(2)]) },
    properties: { a: e.a, b: e.b, length_m: +len(e.pts).toFixed(1), drawn_width_m: +width.toFixed(2) } };
});
void blobAt;
const hist = new Map<number, number>();
for (const f of features) { const k = Math.round(f.properties.drawn_width_m * 4) / 4; hist.set(k, (hist.get(k) ?? 0) + f.properties.length_m); }
const pts = blobs.map((b) => ({ type: "Feature", geometry: { type: "Point", coordinates: [+b.x.toFixed(2), +b.y.toFixed(2)] },
  properties: { kind: "structure", r_m: +b.r_m.toFixed(2), fill: +b.fill.toFixed(2) } }));
await Bun.write(`${dir}/${plate}.lines.geojson`, JSON.stringify({ type: "FeatureCollection", crs: "EPSG:25833", source: fit.source,
  read: "tools/map/hobrechttrace.ts", nodes: nodes.map(([x, y], id) => ({ id, x: +x.toFixed(2), y: +y.toFixed(2) })), features: [...features, ...pts] }));
const km = features.reduce((s, f) => s + f.properties.length_m, 0) / 1000;
console.log(`${plate}: ${features.length} lines, ${km.toFixed(1)} km; ${blobs.length} dots and squares; ${dropped} small pieces dropped`);
console.log(`drawn width (m): ${[...hist].sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}: ${(v / 1000).toFixed(1)} km`).join(", ")}`);
