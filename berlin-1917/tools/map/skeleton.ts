// Street centrelines of 1917 from the street space itself (map/1917/open.geojson, kind street): the street space is
// drawn into a 1 m raster, thinned to one-pixel lines (Zhang-Suen) and read back as a graph of junctions and the lines
// between them, each point with the street's half-width there (distance to the nearest building, park or water).
// OpenHistoricalMap has only about 60 km of the slice's streets dated to 1917, so its lines can't carry a network.
// Short dead ends (thinning spurs into corners and courtyard mouths, under 25 m) are pruned. Lines through open ground
// wider than 70 m (railway yards, read as open; the middle of big squares) are dropped: no street runs there.
//   bun skeleton.ts [SLICE.json]   writes cache/<slice>/streets.json (EPSG:25833)
import { slicePaths } from "./paths";
import { chamfer, fillPolys, graph, len, median, mergeThrough, open, pieces, prune, simplify, thin } from "./thin";

const { slice, own, map } = await slicePaths(process.argv[2] ?? `${import.meta.dir}/slice.json`);
const [X0, Y0, X1, Y1] = slice.bbox as number[];
const W = X1 - X0, H = Y1 - Y0, SPUR = 25, WIDE = 35, TOL = 1.0;
const at = (i: number) => [X0 + (i % W) + 0.5, Y1 - Math.floor(i / W) - 0.5];

// 1. Street space into the raster.
const streetsGeo = (await Bun.file(`${map}/open.geojson`).json()).features.filter((f: { properties: { kind: string } }) => f.properties.kind === "street");
const img = fillPolys(streetsGeo.map((f: { geometry: { type: string; coordinates: unknown } }) => f.geometry), X0, Y1, W, H);

// 2. Distance to the street's edge (in metres), before thinning.
const dist = chamfer(W, H, (i) => !img[i]);

// 2b. Courtyards reach the street through slivers between traced footprints, so the open ground counted as street runs
// into the blocks. An opening of OPEN m (keep what is within OPEN of a pixel at least OPEN from the edge) cuts every
// link narrower than twice that; then only pieces over MIN_HA stay (a street network; a courtyard is far smaller).
const OPEN = 4.5, MIN_HA = 3;
open(img, W, H, dist, OPEN);
const kept_ = pieces(img, W, H, (m) => m.length >= MIN_HA * 1e4);
const kept = kept_.reduce((s, m) => s + m.length, 0), pieces_ = kept_.length;
console.error(`street space after opening: ${pieces_} pieces over ${MIN_HA} ha, ${(kept / 1e4).toFixed(0)} ha`);

// 3. Zhang-Suen thinning, then 4. the graph: junctions merged into nodes, lines traced between them.
const fg = thin(img, W, H);
const { nodes, edges: edges0 } = graph(img, W, fg, at, (i) => dist[i]);

// 5. Prune: lines through very wide open ground, then short dead ends (three rounds), then join lines through degree-2 nodes.
const wideCut = edges0.filter((e) => median(e.pts.map((p) => p[2])) > WIDE).length;
let edges = edges0.filter((e) => median(e.pts.map((p) => p[2])) <= WIDE && e.a !== e.b);
const before = edges.length;
edges = prune(edges, SPUR, 3, 8);
const spurs = before - edges.length;
edges = mergeThrough(edges);

const used = new Set(edges.flatMap((e) => [e.a, e.b]));
const out = {
  crs: "EPSG:25833", source: "skeleton of map/1917/open.geojson (street space), 1 m raster; tools/map/skeleton.ts",
  nodes: nodes.map((n, id) => ({ id, x: +n[0].toFixed(1), y: +n[1].toFixed(1), hw: +n[2].toFixed(1) })).filter((n) => used.has(n.id)),
  edges: edges.map((e) => ({ a: e.a, b: e.b, len: +len(e.pts).toFixed(1), pts: simplify(e.pts, TOL).map((p) => p.map((v) => +v.toFixed(1))) })),
};
await Bun.write(`${own}/streets.json`, JSON.stringify(out));
console.log(`${slice.name}: ${out.nodes.length} junctions and ends, ${out.edges.length} street lines, ${(out.edges.reduce((s, e) => s + e.len, 0) / 1000).toFixed(1)} km; dropped ${wideCut} lines through open ground over ${2 * WIDE} m wide and ${spurs} spurs under ${SPUR} m`);
