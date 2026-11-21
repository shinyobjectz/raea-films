// The radial systems other than III, as their Hobrecht plates draw them (sewers.ts builds III, with IIIa, its siphon
// and its station from Blatt 9 and 16). Blatt 3 holds Systems I and II: the Luisenstadt, and the Friedrichstadt's south
// end round the Belle-Alliance-Platz. Each plate's systems are built the way sewers.ts builds III on Blatt 4, and put in
// the slice's sewer layers (map/1917/sewers.geojson, sewer_points.geojson) in place of that plate's systems:
//   1. the plate's traced lines as a graph (plategraph.ts: dropped inside buildings or railway land, cut at water);
//   2. each station where the plate draws its inlet well, the ring at the end of the trunk, read off the fitted plate to
//      about 2 m (tools/map/hobrecht/<plate>.json "stations"); its root is the node within ROOT m on the longest piece;
//   3. a piece cut off from every station is joined by the shortest straight line under BRIDGE m crossing no water and
//      no building, as sewers.ts does on a plate;
//   4. every node drains to the station it reaches by the cheaper way along the lines (a drawn pipe's metre counts
//      PIPE_COST); the systems are drawn apart, but a trace can touch them;
//   5. sizes by street length drained, to Hobrecht's sections, kind as drawn (sewersizes.ts);
//   6. inverts from the station up: the trunk enters STATION_DEPTH m under the street (ASSUMED: III's, Blatt 9, +30.25
//      under +35.25; Blatt 3 prints no levels), each node rising at the base falls along its way to the station, the
//      falls flattened together until every junction keeps COVER m;
//   7. the plate's dots and squares (Revisionsbrunnen, gullies) as manholes on the nearest sewer within 6 m.
// Outside the slice there is no map: lines there are kept unchecked, and the ground is the slice edge's.
//   bun sewerplate.ts PLATE [SLICE.json]
import { inPolys, loadGround, streetLevel } from "./groundgrid";
import { slicePaths } from "./paths";
import { type PlateEdge, plateGraph } from "./plategraph";
import { BASE, COVER, PIPE_COST, sizeFor } from "./sewersizes";
import { fillPolys } from "./thin";

const argv = process.argv.slice(2), PLATE = argv.find((a) => !a.endsWith(".json")) ?? "blatt03";
const { slice, root, own, map } = await slicePaths(argv.find((a) => a.endsWith(".json")) ?? `${import.meta.dir}/slice.json`);
const g = streetLevel(await loadGround(map, own));
const [X0, Y0, X1, Y1] = slice.bbox as number[];
type Station = { system: string; x: number; y: number; name: string };
const stations = (await Bun.file(`${import.meta.dir}/hobrecht/${PLATE}.json`).json()).stations as Station[];
const SYSTEMS = new Set(stations.map((s) => s.system));
const BRIDGE = 80, ROOT = 80, STATION_DEPTH = 5.0, NEAR = 6;

type Node = { id: number; x: number; y: number; hw: number };
type Edge = PlateEdge | { a: number; b: number; len: number; pts: number[][]; brick?: undefined; drawn_width_m?: undefined; checked?: undefined };
const pg = await plateGraph(root, map, PLATE, slice.bbox as number[]);
const nodes = new Map<number, Node>(pg.nodes.map((n: Node) => [n.id, n]));
const edges: Edge[] = pg.edges.filter((e) => e.a !== e.b);
console.error(`${PLATE}: ${edges.length} traced lines kept, ${pg.dropped} (${pg.droppedKm.toFixed(1)} km) dropped as inside buildings or railway land; ${pg.structures.length} drawn structures on them`);

// Connected pieces, and each station's root on the longest piece near it.
function pieces() {
  const adj = new Map<number, number[]>(), comp = new Map<number, number>(), size = new Map<number, number>();
  for (const e of edges) { adj.set(e.a, [...(adj.get(e.a) ?? []), e.b]); adj.set(e.b, [...(adj.get(e.b) ?? []), e.a]); }
  for (const n of adj.keys()) {
    if (comp.has(n)) continue;
    comp.set(n, n);
    for (const q = [n]; q.length; ) for (const m of adj.get(q.pop()!) ?? []) if (!comp.has(m)) { comp.set(m, n); q.push(m); }
  }
  for (const e of edges) size.set(comp.get(e.a)!, (size.get(comp.get(e.a)!) ?? 0) + e.len);
  return { comp, size };
}
const dist2 = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const { comp, size } = pieces();
const roots = new Map<string, Node>();
for (const s of stations) {
  const near = [...nodes.values()].filter((n) => comp.has(n.id) && dist2(n, s) <= ROOT);
  if (!near.length) throw new Error(`${s.system}: no traced line within ${ROOT} m of its station`);
  roots.set(s.system, near.reduce((b, n) => { const sb = size.get(comp.get(b.id)!)!, sn = size.get(comp.get(n.id)!)!; return sn > sb || (sn === sb && dist2(n, s) < dist2(b, s)) ? n : b; }));
}

// Joins: a piece no station reaches, to the nearest node that one does, under BRIDGE m, dry and clear of buildings.
const water: number[][][][] = (await Bun.file(`${map}/water.geojson`).json()).features.flatMap((f: any) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates));
const built = fillPolys((await Bun.file(`${map}/buildings.geojson`).json()).features.map((b: any) => b.geometry), X0, Y1, X1 - X0, Y1 - Y0, 1);
const isBuilt = (x: number, y: number) => { const i = Math.floor(x - X0), j = Math.floor(Y1 - y); return i >= 0 && j >= 0 && i < X1 - X0 && j < Y1 - Y0 && built[j * (X1 - X0) + i] === 1; };
let joined = 0;
for (;;) {
  const { comp } = pieces(), rooted = new Set([...roots.values()].map((r) => comp.get(r.id)));
  const inside = [...comp.keys()].filter((n) => rooted.has(comp.get(n))).map((id) => nodes.get(id)!), outside = [...comp.keys()].filter((n) => !rooted.has(comp.get(n))).map((id) => nodes.get(id)!);
  let best: [Node, Node, number] | null = null;
  for (const o of outside) for (const m of inside) {
    const d = dist2(o, m);
    if (d < BRIDGE && (!best || d < best[2]) && [0.25, 0.5, 0.75].every((t) => !inPolys(o.x + (m.x - o.x) * t, o.y + (m.y - o.y) * t, water))
      && [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].every((t) => !isBuilt(o.x + (m.x - o.x) * t, o.y + (m.y - o.y) * t))) best = [o, m, d];
  }
  if (!best) break;
  edges.push({ a: best[0].id, b: best[1].id, len: best[2], pts: [[best[0].x, best[0].y, 0], [best[1].x, best[1].y, 0]] });
  joined++;
}

// Flow: Dijkstra from every root; each node drains to its cheapest station, an edge to its end nearer it, and the
// street length drained accumulates from the far ends inward (as sewers.ts).
const adj = new Map<number, { e: Edge; to: number }[]>();
for (const e of edges) { adj.set(e.a, [...(adj.get(e.a) ?? []), { e, to: e.b }]); adj.set(e.b, [...(adj.get(e.b) ?? []), { e, to: e.a }]); }
const dist = new Map<number, number>(), parent = new Map<number, Edge>(), owner = new Map<number, string>();
const open: number[] = [];
for (const [s, r] of roots) { dist.set(r.id, 0); owner.set(r.id, s); open.push(r.id); }
while (open.length) {
  open.sort((p, q) => dist.get(q)! - dist.get(p)!);
  const u = open.pop()!;
  for (const { e, to } of adj.get(u) ?? []) {
    const d = dist.get(u)! + e.len * (e.brick === false ? PIPE_COST : 1);
    if (d < (dist.get(to) ?? Infinity)) { dist.set(to, d); parent.set(to, e); owner.set(to, owner.get(u)!); open.push(to); }
  }
}
const reached = edges.filter((e) => dist.has(e.a) && dist.has(e.b));
const order = [...dist.keys()].sort((p, q) => dist.get(q)! - dist.get(p)! || p - q), rank = new Map(order.map((n, i) => [n, i]));
const lo = (e: Edge) => (rank.get(e.a)! > rank.get(e.b)! ? e.a : e.b), hi = (e: Edge) => (lo(e) === e.a ? e.b : e.a);
const arriving = new Map<number, Edge[]>();
for (const e of reached) arriving.set(lo(e), [...(arriving.get(lo(e)) ?? []), e]);
const drained = new Map<Edge, number>(), inflow = new Map<number, number>();
for (const e of reached) if (parent.get(hi(e)) !== e) drained.set(e, e.len);
for (const n of order) {
  const into = (arriving.get(n) ?? []).reduce((s, e) => s + (drained.get(e) ?? 0), 0);
  inflow.set(n, into);
  const p = parent.get(n);
  if (p) drained.set(p, p.len + into);
}
const total = new Map([...roots].map(([s, r]) => [s, inflow.get(r.id) ?? 0]));
const size_ = (e: Edge) => sizeFor(drained.get(e)!, total.get(owner.get(lo(e))!)!, e);
const isEgg = (e: Edge) => size_(e).kind === "brick egg profile";

// Inverts from each station up its ways, at the base falls times k; k the largest that keeps every node COVER m down.
const inverts = (k: number) => {
  const z = new Map<number, number>();
  for (const r of roots.values()) z.set(r.id, g(r.x, r.y) - STATION_DEPTH);
  for (const n of [...order].reverse()) {
    const e = parent.get(n);
    if (!e || z.has(n)) continue;
    z.set(n, z.get(e.a === n ? e.b : e.a)! + (isEgg(e) ? BASE.egg : BASE.pipe) * k * e.len);
  }
  return z;
};
const over = (z: Map<number, number>) => Math.max(...[...z].map(([n, v]) => { const nd = nodes.get(n)!; return v - (g(nd.x, nd.y) - COVER); }));
let k = 1;
if (over(inverts(1)) > 0) {
  let a = 0, b = 1;
  for (let it = 0; it < 30; it++) { const m = (a + b) / 2; if (over(inverts(m)) > 0) b = m; else a = m; }
  k = a;
}
const invert = inverts(k), SLOPE = { pipe: BASE.pipe * k, egg: BASE.egg * k };

// The lines, as drawn; a cross-connection whose upstream end came out lower runs the other way; a branch meeting a
// deeper sewer keeps its own fall and drops the rest in the junction's manhole.
type F = { type: "Feature"; geometry: { type: string; coordinates: unknown }; properties: Record<string, unknown> };
const lines: F[] = [], points: F[] = [];
const inSlice = (p: number[]) => p[0] >= X0 && p[0] < X1 && p[1] >= Y0 && p[1] < Y1;
for (const e of reached) {
  const s = owner.get(lo(e))!, sz = size_(e), flip = invert.get(hi(e))! < invert.get(lo(e))!, from = flip ? lo(e) : hi(e), to = flip ? hi(e) : lo(e);
  const pts = (to === e.a ? [...e.pts].reverse() : e.pts).map((p) => [p[0], p[1]]);
  const zi = invert.get(from)!, zJ = invert.get(to)!, zo = Math.max(zJ, zi - (isEgg(e) ? SLOPE.egg : SLOPE.pipe) * e.len);
  lines.push({ type: "Feature", geometry: { type: "LineString", coordinates: pts.map((p) => p.map((v) => +v.toFixed(2))) }, properties: {
    system: s, kind: sz.kind, height_m: sz.h, width_m: sz.w, profile: sz.profile, wall_m: sz.wall ?? null, drains_m: Math.round(drained.get(e)!), position: "as drawn",
    slope: +((zi - zo) / e.len).toFixed(5), invert_in: +zi.toFixed(2), invert_out: +zo.toFixed(2), drop_m: +(zo - zJ).toFixed(2),
    depth_in: +(g(pts[0][0], pts[0][1]) - zi).toFixed(2), depth_out: +(g(pts[pts.length - 1][0], pts[pts.length - 1][1]) - zo).toFixed(2), joined_gap: !e.drawn_width_m, siphon: false,
    basis: !e.drawn_width_m ? "assumed: a gap in the trace joined straight (the plate's line there, if any, was not traced)"
      : `Hobrecht 1884, ${PLATE}: route and kind as drawn (${e.drawn_width_m} m wide on the plate); size by length drained, inverts and falls modelled from the station ${STATION_DEPTH} m down (assumed)${e.checked === false ? "; outside the slice, not checked against its streets" : ""}`,
    in_slice: pts.some(inSlice) } });
}
for (const st of pg.structures as { x: number; y: number }[]) {
  let best: { d: number; z: number; s: string } | null = null;
  for (const l of lines) {
    const c = l.geometry.coordinates as number[][], p = l.properties, L = c.reduce((t, q, i) => (i ? t + Math.hypot(q[0] - c[i - 1][0], q[1] - c[i - 1][1]) : 0), 0) || 1;
    let along = 0;
    for (let i = 1; i < c.length; i++) {
      const [ax, ay] = c[i - 1], dx = c[i][0] - ax, dy = c[i][1] - ay, l2 = Math.hypot(dx, dy) || 1, t = Math.max(0, Math.min(1, ((st.x - ax) * dx + (st.y - ay) * dy) / (l2 * l2)));
      const d = Math.hypot(ax + t * dx - st.x, ay + t * dy - st.y);
      if (!best || d < best.d) best = { d, z: (p.invert_in as number) + ((p.invert_out as number) - (p.invert_in as number)) * ((along + t * l2) / L), s: p.system as string };
      along += l2;
    }
  }
  if (!best || best.d > NEAR) continue;
  points.push({ type: "Feature", geometry: { type: "Point", coordinates: [+st.x.toFixed(2), +st.y.toFixed(2)] }, properties: { kind: "manhole", system: best.s, invert: +best.z.toFixed(2),
    depth: +(g(st.x, st.y) - best.z).toFixed(2), basis: `Hobrecht 1884, ${PLATE}: a drawn Revisionsbrunnen (dot) or gully (square), not told apart; invert from the sewer it sits on` } });
}
for (const s of stations) {
  const r = roots.get(s.system)!;
  points.push({ type: "Feature", geometry: { type: "Point", coordinates: [s.x, s.y] }, properties: { kind: "pumping station", system: s.system, name: s.name,
    invert: +invert.get(r.id)!.toFixed(2), depth: +(g(r.x, r.y) - invert.get(r.id)!).toFixed(2), drains_m: Math.round(total.get(s.system)!) } });
}

// Into the slice's layers in place of this plate's systems.
const unreached = edges.filter((e) => !reached.includes(e));
await Bun.write(`${own}/sewers.${PLATE}.unreached.geojson`, JSON.stringify({ type: "FeatureCollection", crs: "EPSG:25833", features: unreached.map((e) => ({ type: "Feature",
  geometry: { type: "LineString", coordinates: e.pts.map((p) => [+p[0].toFixed(2), +p[1].toFixed(2)]) }, properties: { length_m: +e.len.toFixed(1) } })) }));
for (const [file, add] of [["sewers", lines], ["sewer_points", points]] as const) {
  const fc = await Bun.file(`${map}/${file}.geojson`).json();
  fc.features = [...fc.features.filter((f: F) => !SYSTEMS.has(f.properties.system as string)), ...add];
  await Bun.write(`${map}/${file}.geojson`, JSON.stringify(fc));
}
const km = (ls: F[]) => ls.reduce((t, l) => { const c = l.geometry.coordinates as number[][]; return t + c.reduce((u, q, i) => (i ? u + Math.hypot(q[0] - c[i - 1][0], q[1] - c[i - 1][1]) : 0), 0); }, 0) / 1000;
for (const s of SYSTEMS) {
  const ls = lines.filter((l) => l.properties.system === s), st = points.find((p) => p.properties.kind === "pumping station" && p.properties.system === s)!.properties;
  console.log(`${s}: ${ls.length} lines, ${km(ls).toFixed(1)} km (${km(ls.filter((l) => l.properties.in_slice)).toFixed(1)} km touching the slice), ${ls.filter((l) => l.properties.kind === "brick egg profile").length} brick; station ${(st.depth as number).toFixed(1)} m deep, ${((st.drains_m as number) / 1000).toFixed(1)} km of street drained; ${points.filter((p) => p.properties.system === s && p.properties.kind === "manhole").length} manholes`);
}
console.log(`${PLATE}: ${joined} gaps joined, ${unreached.length} lines (${km(unreached.map((e) => ({ geometry: { coordinates: e.pts } }) as F)).toFixed(1)} km) reach no station; falls pipes 1:${Math.round(1 / SLOPE.pipe)}, brick 1:${Math.round(1 / SLOPE.egg)}${k < 1 ? ` (flattened ${k.toFixed(2)}x for ${COVER} m of cover)` : ""}`);
