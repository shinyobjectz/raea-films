// Radial System III of Hobrecht's Berlin sewers as it stood in 1917. Two sources for the layout:
//   --plate blatt04  the network drawn on Hobrecht's own plan of the system (Die Canalisation von Berlin, 1884, Atlas,
//            Blatt 4, 1:7500; e-rara 10.3931/e-rara-19774), fitted (hobrecht.ts) and traced (hobrechttrace.ts,
//            plategraph.ts): every sewer's route, brick or stoneware as drawn, IIIa's site, the manholes and gullies.
//   none     procedural on the 1917 streets (skeleton.ts), as below.
// Either way the flow, the sizes within each kind and the inverts are modelled. Procedural mode's sources and assumptions:
//   sourced  the pumping station at Hallesches Ufer 78 (ALKIS footprint of the 1873-76 pump house; Denkmal 09031091);
//            the intermediate station IIIa on the Schlossinsel (3 centrifugal pumps; Gieseler, after Hobrecht 1884
//            p. 259); the districts it drained (Friedrichstadt, Dorotheenstadt, Alt-Kölln, Tiergartenviertel); over
//            80 km of sewers and 389.7 ha (Gieseler; Wikipedia "Radialsystem III"); combined sewers in free fall to the
//            station, glazed stoneware pipes 210-480 mm and brick egg-profile sewers 0.90-2.00 m high (Hobrecht 1884).
//   assumed  the catchment: the left-bank land the station's district lies on, nearer to III than to I, the one other
//            station on that land (Wikipedia's coordinates), plus the Spree island for IIIa; one sewer
//            in the middle of a lane under WIDE m, one under each side of a street (vhw 2024: both sides of each street); sizes from the street
//            length draining through (SIZES below); inverts from a HEAD m deep start under each street's head, at the
//            slopes below; manholes at junctions and every MANHOLE m. IIIa lifts the Spree island into III through a pressure
//            main into III's nearest brick sewer, and takes any left-bank street (through a siphon under the Kupfergraben)
//            only if it could not reach Hallesches Ufer in free fall within SUMP m; at the falls below it takes none.
// Each line carries its basis in its properties. Checks printed: modelled street length and catchment area against
// the documented 80 km and 389.7 ha; III's cover from Blatt 9's +30.25 up.
//   bun sewers.ts [SLICE.json] [--plate PLATE]   writes map/1917/sewers.geojson, sewer_points.geojson
import { inPolys, loadGround, streetLevel } from "./groundgrid";
import { slicePaths } from "./paths";
import { plateGraph } from "./plategraph";
import { BASE, COVER, PIPE_COST, sizeFor } from "./sewersizes";
import { stationIII } from "./station3lines";
import { fillPolys } from "./thin";

const argv = process.argv.slice(2), PLATE = argv.includes("--plate") ? argv[argv.indexOf("--plate") + 1] : null;
const { slice, root, own, map } = await slicePaths(argv.find((a) => a.endsWith(".json")) ?? `${import.meta.dir}/slice.json`);
const g0 = await loadGround(map, own);
// Street level at a point: groundgrid.ts streetLevel (the 60th percentile within 10 m; see there why).
const g = streetLevel(g0);
const [X0, Y0, X1, Y1] = slice.bbox as number[];

// III ends at the distribution well in front of its pump hall as Blatt 16 draws it (station3.ts), else at the pump house.
const st3 = Bun.file(`${map}/station_iii.geojson`), well3 = (await st3.exists()) ? (await st3.json()).features.find((f: any) => f.properties.part === "Vertheilungsbrunnen") : null;
const wr: number[][] | null = well3 ? well3.geometry.coordinates[0].slice(0, -1) : null;
const III = wr ? { name: "Pumpwerk III, Hallesches Ufer 78 (its distribution well, Hobrecht's Blatt 16)", x: wr.reduce((a, p) => a + p[0], 0) / wr.length, y: wr.reduce((a, p) => a + p[1], 0) / wr.length }
  : { name: "Pumpwerk III, Hallesches Ufer 78", x: 389876, y: 5818058 };
// Of the left-bank stations only I (Reichenberger Str. 66) stands on the same land as III, between the Spree and the
// Landwehrkanal; II (Gitschiner Str.), VI (Urbanstr.) and VII (Lützowstr.) stand south of the canal.
const LEFT_BANK = { I: [393446.5, 5817142.5], III: [III.x, III.y] };
const SCHLOSSPLATZ = [391523, 5819654]; // the 1900 map's label; IIIa is put at the island's street point nearest it
// IIIa as drawn on Blatt 4 (the "Zwischen-Pump-Stat." house on the Schlossinsel's Kupfergraben bank), read to about 10 m.
const IIIA = PLATE ? { x: 391505, y: 5819585, name: "Zwischen-Pumpstation IIIa, Schlossinsel (as drawn on Hobrecht's Blatt 4, about 10 m)" }
  : { x: SCHLOSSPLATZ[0], y: SCHLOSSPLATZ[1], name: "Zwischenpumpwerk IIIa, Schlossinsel (position assumed: by the Schloßplatz)" };
// A part of the network cut off from its station is joined by the shortest straight line under BRIDGE m that crosses no
// water and, on a plate, no building. On Blatt 4 such gaps are mostly thin stoneware pipes the trace's opening erases
// (Bellevuestraße's, 75 m), so a join there follows a pipe the plate draws but the trace lost.
const WIDE = 12, HEAD = 3.0, MANHOLE = 60, BRIDGE = PLATE ? 80 : 60, DIL = 18;
// Sizes, falls, cover and routing costs: sewersizes.ts. III's trunk enters its sand trap at +30.25 m NN (Blatt 9, 5.0 m
// under the plate's +35.25 street; research/sewer-structures-1884.tsv) and its inverts rise from there, so the falls
// are flattened until no junction lies within COVER m of its street (Blatt 4 prints no levels); IIIa's station lies no
// more than SUMP m down (assumed).
const SUMP = 9, III_INVERT = 30.25;

type Node = { id: number; x: number; y: number; hw: number };
type Edge = { a: number; b: number; len: number; pts: number[][]; brick?: boolean; drawn_width_m?: number; checked?: boolean };
const plateG = PLATE ? await plateGraph(root, map, PLATE, slice.bbox as number[]) : null;
const streets = plateG ? { nodes: plateG.nodes, edges: plateG.edges } : await Bun.file(`${own}/streets.json`).json();
if (plateG) console.error(`${PLATE}: ${plateG.edges.length} traced lines kept, ${plateG.dropped} (${plateG.droppedKm.toFixed(1)} km) dropped as inside buildings or railway land; ${plateG.structures.length} drawn structures on them`);
const nodes = new Map<number, Node>(streets.nodes.map((n: Node) => [n.id, n]));
let edges: Edge[] = streets.edges;

// Land parts: big water widened by DIL m (so bridges do not join the banks), the rest labelled 4-connected on a 2 m grid.
const area = (r: number[][]) => Math.abs(r.reduce((s, p, i) => s + p[0] * r[(i + 1) % r.length][1] - r[(i + 1) % r.length][0] * p[1], 0)) / 2;
const water: number[][][][] = [];
for (const f of (await Bun.file(`${map}/water.geojson`).json()).features)
  for (const poly of f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) if (area(poly[0]) > 3000) water.push(poly);
const C = 2, GW = Math.ceil((X1 - X0) / C), GH = Math.ceil((Y1 - Y0) / C);
/** Distance (m) from each cell to the nearest cell where seed is true: chamfer 1-1.414 in two passes. */
function chamfer(seed: (k: number) => boolean): Float32Array {
  const d = new Float32Array(GW * GH);
  for (let k = 0; k < GW * GH; k++) d[k] = seed(k) ? 0 : 1e9;
  const step = (k: number, n: number, w: number) => { if (d[n] + w < d[k]) d[k] = d[n] + w; };
  for (let j = 0; j < GH; j++)
    for (let i = 0; i < GW; i++) {
      const k = j * GW + i;
      if (i > 0) step(k, k - 1, C);
      if (j > 0) { step(k, k - GW, C); if (i > 0) step(k, k - GW - 1, C * 1.414); if (i < GW - 1) step(k, k - GW + 1, C * 1.414); }
    }
  for (let j = GH - 1; j >= 0; j--)
    for (let i = GW - 1; i >= 0; i--) {
      const k = j * GW + i;
      if (i < GW - 1) step(k, k + 1, C);
      if (j < GH - 1) { step(k, k + GW, C); if (i < GW - 1) step(k, k + GW + 1, C * 1.414); if (i > 0) step(k, k + GW - 1, C * 1.414); }
    }
  return d;
}
// The traced water breaks at bridges, locks and under the elevated railway, in gaps up to about 150 m, and the banks
// would join through them; closing the water by CLOSE m (widen, then narrow again) bridges them without moving the banks.
const CLOSE = 90;
const isWater = new Uint8Array(GW * GH);
isWater.set(fillPolys(water.map((p) => ({ type: "Polygon", coordinates: p })), X0, Y1, GW, GH, C));
const dWater = chamfer((k) => isWater[k] === 1);
const dDry = chamfer((k) => dWater[k] > CLOSE);
const wet = new Float32Array(GW * GH);
for (let k = 0; k < GW * GH; k++) wet[k] = dDry[k] > CLOSE ? 0 : CLOSE - dDry[k] + C; // closed water 0, then metres from it
const land = new Int32Array(GW * GH).fill(-1);
let parts = 0;
for (let s = 0; s < GW * GH; s++) {
  if (wet[s] <= DIL || land[s] >= 0) continue;
  const q = [s];
  land[s] = parts;
  for (let k = 0; k < q.length; k++) {
    const c = q[k], i = c % GW;
    for (const n of [c - GW, c + GW, i > 0 ? c - 1 : -1, i < GW - 1 ? c + 1 : -1]) if (n >= 0 && n < GW * GH && land[n] < 0 && wet[n] > DIL) { land[n] = parts; q.push(n); }
  }
  parts++;
}
/** The land part at a point, or of the nearest labelled cell within 40 m (banks fall inside the widened water). */
function partAt(x: number, y: number): number {
  const ci = Math.floor((x - X0) / C), cj = Math.floor((Y1 - y) / C);
  for (let r = 0; r <= 40 / C; r++)
    for (let dj = -r; dj <= r; dj++)
      for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        const i = ci + di, j = cj + dj;
        if (i >= 0 && j >= 0 && i < GW && j < GH && land[j * GW + i] >= 0) return land[j * GW + i];
      }
  return -1;
}
if (process.env.DUMP_LAND) {
  const pal = [[230, 120, 90], [90, 160, 220], [120, 200, 110], [210, 190, 80], [180, 110, 200], [90, 200, 190], [220, 150, 180], [150, 150, 150]];
  const px = new Uint8Array(GW * GH * 3);
  for (let k = 0; k < GW * GH; k++) { const c = land[k] < 0 ? [255, 255, 255] : pal[land[k] % pal.length]; px.set(c, k * 3); }
  await Bun.write(process.env.DUMP_LAND, Buffer.concat([Buffer.from(`P6 ${GW} ${GH} 255\n`), Buffer.from(px)]));
  console.error(`${parts} land parts`);
  process.exit(0);
}
const nearest = (x: number, y: number, pool: Node[]) => pool.reduce((b, n) => (Math.hypot(n.x - x, n.y - y) < Math.hypot(b.x - x, b.y - y) ? n : b), pool[0]);

// The catchment: III's land part, nearer III than any other left-bank station; and the island IIIa drains.
const partIII = partAt(III.x, III.y), partIsland = partAt(SCHLOSSPLATZ[0], SCHLOSSPLATZ[1]);
// The line between III and I is not read from Hobrecht's plates yet: it is a straight line across the way from III to
// I, put just east of Lindenstraße, the Friedrichstadt's edge with the Luisenstadt (the 1900 map's label is 1,160 m
// from III that way). The land it gives III is printed against the documented 389.7 ha as a check.
// Parks over 1 ha (the Tiergarten, the squares' gardens) drained nothing and are not counted.
const AREA_HA = 389.7;
const parks: number[][][][] = [];
for (const f of (await Bun.file(`${map}/green.geojson`).json()).features)
  for (const poly of f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) if (area(poly[0]) > 1e4) parks.push(poly);
const parkCell = new Uint8Array(GW * GH);
parkCell.set(fillPolys(parks.map((p) => ({ type: "Polygon", coordinates: p })), X0, Y1, GW, GH, C));
const toI = [LEFT_BANK.I[0] - LEFT_BANK.III[0], LEFT_BANK.I[1] - LEFT_BANK.III[1]], toIl = Math.hypot(toI[0], toI[1]);
const WI = 1180; // metres from III along the way to I
const ownStation = (n: { x: number; y: number }) =>
  ((n.x - LEFT_BANK.III[0]) * toI[0] + (n.y - LEFT_BANK.III[1]) * toI[1]) / toIl <= WI ? "III" : "I";
const catchmentHa = () => {
  let cells = 0;
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    const p = land[j * GW + i];
    if (p < 0 || parkCell[j * GW + i]) continue;
    const x = X0 + (i + 0.5) * C, y = Y1 - (j + 0.5) * C;
    if ((p === partIII && ownStation({ x, y }) === "III") || (p === partIsland && p !== partIII)) cells++;
  }
  return (cells * C * C) / 1e4;
};

const sys = new Map<number, "III" | "IIIa">();
for (const n of nodes.values()) {
  const p = partAt(n.x, n.y);
  if (p === partIsland && p !== partIII) sys.set(n.id, "IIIa");
  else if (PLATE || (p === partIII && ownStation(n) === "III")) sys.set(n.id, "III"); // the plate draws only III's own sewers
}
const crossing = edges.filter((e) => e.a !== e.b && sys.get(e.a) !== sys.get(e.b));
edges = edges.filter((e) => e.a !== e.b && sys.has(e.a) && sys.get(e.a) === sys.get(e.b)); // a ring back to its own junction has no downstream end

// Join pieces the skeleton left apart (a scrap in a crossing, a narrow lane): the nearest pair of points between a
// piece and the rest of its system, if under BRIDGE m and dry along the way.
// A station's root: on the street skeleton the nearest node; on a traced plate, among the nodes within ROOT m, the one
// on the longest connected piece (the trace leaves scraps beside a station).
const ROOT = 80;
function rootOf(x: number, y: number, s: "III" | "IIIa"): Node {
  const pool = [...nodes.values()].filter((n) => sys.get(n.id) === s);
  if (!PLATE) return nearest(x, y, pool);
  const adj0 = new Map<number, number[]>(), comp = new Map<number, number>(), size = new Map<number, number>();
  for (const e of edges) { adj0.set(e.a, [...(adj0.get(e.a) ?? []), e.b]); adj0.set(e.b, [...(adj0.get(e.b) ?? []), e.a]); }
  for (const n of adj0.keys()) {
    if (comp.has(n)) continue;
    const q = [n]; comp.set(n, n);
    while (q.length) for (const m of adj0.get(q.pop()!) ?? []) if (!comp.has(m)) { comp.set(m, n); q.push(m); }
  }
  for (const e of edges) size.set(comp.get(e.a)!, (size.get(comp.get(e.a)!) ?? 0) + e.len);
  const near = pool.filter((n) => Math.hypot(n.x - x, n.y - y) <= ROOT && comp.has(n.id));
  if (!near.length) return nearest(x, y, pool);
  return near.reduce((b, n) => {
    const sb = size.get(comp.get(b.id)!)!, sn = size.get(comp.get(n.id)!)!;
    return sn > sb || (sn === sb && Math.hypot(n.x - x, n.y - y) < Math.hypot(b.x - x, b.y - y)) ? n : b;
  });
}
const roots: Record<"III" | "IIIa", Node> = { III: rootOf(III.x, III.y, "III"), IIIa: rootOf(IIIA.x, IIIA.y, "IIIa") };
console.error(`nodes: ${["III", "IIIa"].map((s) => `${s} ${[...sys.values()].filter((v) => v === s).length}`).join(", ")}; edges kept ${edges.length} (${(edges.reduce((t, e) => t + e.len, 0) / 1000).toFixed(1)} km); roots ${Object.entries(roots).map(([k, r]) => `${k} ${r.x.toFixed(0)} ${r.y.toFixed(0)}`).join(", ")}`);
let joined = 0;
const built = PLATE ? fillPolys((await Bun.file(`${map}/buildings.geojson`).json()).features.map((b: any) => b.geometry), X0, Y1, X1 - X0, Y1 - Y0, 1) : null;
const isBuilt = (x: number, y: number) => {
  const i = Math.floor(x - X0), j = Math.floor(Y1 - y);
  return !!built && i >= 0 && j >= 0 && i < X1 - X0 && j < Y1 - Y0 && built[j * (X1 - X0) + i] === 1;
};
for (const s of ["III", "IIIa"] as const) {
  for (;;) {
    const adj = new Map<number, number[]>();
    for (const e of edges) if (sys.get(e.a) === s) { adj.set(e.a, [...(adj.get(e.a) ?? []), e.b]); adj.set(e.b, [...(adj.get(e.b) ?? []), e.a]); }
    const main = new Set([roots[s].id]);
    for (const q = [roots[s].id]; q.length; ) for (const m of adj.get(q.pop()!) ?? []) if (!main.has(m)) { main.add(m); q.push(m); }
    const inside = [...main].map((id) => nodes.get(id)!), outside = [...adj.keys()].filter((id) => !main.has(id)).map((id) => nodes.get(id)!);
    let best: [Node, Node, number] | null = null;
    for (const o of outside) {
      const m = nearest(o.x, o.y, inside), d = Math.hypot(m.x - o.x, m.y - o.y);
      if (d < BRIDGE && (!best || d < best[2]) && [0.25, 0.5, 0.75].every((t) => !inPolys(o.x + (m.x - o.x) * t, o.y + (m.y - o.y) * t, water))
        && [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].every((t) => !isBuilt(o.x + (m.x - o.x) * t, o.y + (m.y - o.y) * t))) best = [o, m, d];
    }
    if (!best) break;
    edges.push({ a: best[0].id, b: best[1].id, len: best[2], pts: [[best[0].x, best[0].y, best[0].hw], [best[1].x, best[1].y, best[1].hw]] });
    joined++;
  }
}

// The siphon (Düker) under the Kupfergraben: from IIIa's street point to the nearest street point on the left bank.
const siphonTo = nearest(roots.IIIa.x, roots.IIIa.y, [...nodes.values()].filter((n) => sys.get(n.id) === "III"));
const siphon: Edge = { a: siphonTo.id, b: roots.IIIa.id, len: Math.hypot(siphonTo.x - roots.IIIa.x, siphonTo.y - roots.IIIa.y), pts: [[siphonTo.x, siphonTo.y, 5], [roots.IIIa.x, roots.IIIa.y, 5]] };
// On a plate the island is its own network: IIIa lifts it, and every left-bank sewer falls to Hallesches Ufer.
if (!PLATE) edges.push(siphon);

// Flow: every node drains by the shortest way along the streets to one station (Dijkstra from both); an edge flows
// to its end nearer that station, and street length drained accumulates from the far ends inward. A way to IIIa counts
// F times its length: F is the highest tried (IIIa takes as little as it can) with every sewer still reaching its
// station no more than SUMP m down at the base falls, or failing that the one with the shallowest station, and the
// falls are then flattened to fit.
const adj = new Map<number, { e: Edge; to: number }[]>();
for (const e of edges) { adj.set(e.a, [...(adj.get(e.a) ?? []), { e, to: e.b }]); adj.set(e.b, [...(adj.get(e.b) ?? []), { e, to: e.a }]); }
type Sys = "III" | "IIIa";
function flow(F: number) {
  const dist = new Map<number, number>(), parent = new Map<number, Edge>(), owner = new Map<number, Sys>();
  for (const [key, r] of Object.entries(roots) as [Sys, Node][]) {
    dist.set(r.id, 0);
    owner.set(r.id, key);
    const open = [r.id];
    while (open.length) {
      open.sort((p, q) => dist.get(q)! - dist.get(p)!);
      const u = open.pop()!;
      for (const { e, to } of adj.get(u) ?? []) {
        const d = dist.get(u)! + e.len * (owner.get(u) === "IIIa" ? F : 1) * (e.brick === false ? PIPE_COST : 1);
        if (d < (dist.get(to) ?? Infinity)) { dist.set(to, d); parent.set(to, e); owner.set(to, owner.get(u)!); open.push(to); }
      }
    }
  }
  const reached = edges.filter((e) => dist.has(e.a) && dist.has(e.b));
  // Far ends first; an edge flows to whichever end comes later in that order (ties included).
  const order = [...dist.keys()].sort((p, q) => dist.get(q)! - dist.get(p)! || p - q);
  const rank = new Map(order.map((n, i) => [n, i]));
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
  // Sizes: a pipe while the length drained is under 800 m, then an egg profile, 0.9 m growing to 2.0 m at the station.
  const total = Object.fromEntries(Object.entries(roots).map(([s, r]) => [s, inflow.get(r.id) ?? 0])) as Record<Sys, number>;
  const size = (L: number, s: Sys, e?: Edge) => sizeFor(L, total[s], e);
  const isEgg = (e: Edge, s: Sys) => size(drained.get(e)!, s, e).kind === "brick egg profile";
  // Inverts: from HEAD m under the street at each far end, falling at each sewer's slope; at a junction the deepest
  // arriving sewer sets the level, and nothing lies shallower than HEAD. III's are then set the way Hobrecht set them,
  // from the outlet up: its trunk at Blatt 9's +30.25 in the sand trap, each node rising at the fall of the sewers on
  // its own way to the station (the shortest, the way the flow is routed). A cross-connection between two such ways
  // then falls from its higher end to its lower, at whatever fall that leaves (lines below).
  const inverts = (k: number) => {
    const z = new Map<number, number>();
    for (const n of order) {
      const nd = nodes.get(n)!, s = owner.get(n)!;
      let v = g(nd.x, nd.y) - HEAD;
      for (const e of arriving.get(n) ?? []) v = Math.min(v, z.get(hi(e))! - (isEgg(e, s) ? BASE.egg : BASE.pipe) * k * e.len);
      z.set(n, v);
    }
    z.set(roots.III.id, III_INVERT);
    for (const n of [...order].reverse()) {
      const e = parent.get(n);
      if (owner.get(n) !== "III" || n === roots.III.id || !e) continue;
      z.set(n, z.get(e.a === n ? e.b : e.a)! + (isEgg(e, "III") ? BASE.egg : BASE.pipe) * k * e.len);
    }
    return z;
  };
  const deepest = (z: Map<number, number>) => Math.max(...Object.values(roots).map((r) => g(r.x, r.y) - z.get(r.id)!));
  // How far the lowest station sits under what it allows (> 0: too low).
  const over = (z: Map<number, number>) => Math.max(g(roots.IIIa.x, roots.IIIa.y) - z.get(roots.IIIa.id)! - SUMP,
    ...[...z.entries()].filter(([n]) => owner.get(n) === "III").map(([n, v]) => { const nd = nodes.get(n)!; return v - (g(nd.x, nd.y) - COVER); }));
  return { dist, owner, reached, lo, hi, drained, inflow, total, size, isEgg, inverts, deepest, over };
}
const tried = (PLATE ? [1] : [1, 1.5, 2, 3, 4, 6, 8, 12, 20, 40]).map((F) => { const fl = flow(F); return { F, deep: fl.deepest(fl.inverts(1)), over: fl.over(fl.inverts(1)) }; });
const fits = tried.filter((t) => t.over <= 0);
const F = fits.length ? fits[fits.length - 1].F : tried.reduce((p, q) => (q.over < p.over ? q : p)).F;
console.error(`IIIa weights tried: ${tried.map((t) => `${t.F}x ${t.deep.toFixed(1)} m`).join(", ")}`);
const { dist, owner, reached, lo, hi, drained, inflow, total, size, isEgg, inverts, deepest, over } = flow(F);
// What the plate draws that reaches no station (cut off by the island line or a gap the joins could not close), kept
// for the plan's "drawn, not joined" layer.
const reachedSet = new Set(reached), unreached = [...edges.filter((e) => !reachedSet.has(e)), ...crossing];
await Bun.write(`${own}/sewers.unreached.geojson`, JSON.stringify({ type: "FeatureCollection", crs: "EPSG:25833", features: unreached.map((e) => ({ type: "Feature",
  geometry: { type: "LineString", coordinates: e.pts.map((p) => [+p[0].toFixed(2), +p[1].toFixed(2)]) }, properties: { system: crossing.includes(e) ? "both" : sys.get(e.a) ?? null, length_m: +e.len.toFixed(1) } })) }));
console.error(`unreached: ${unreached.length} lines, ${(unreached.reduce((s, e) => s + e.len, 0) / 1000).toFixed(1)} km (${own}/sewers.unreached.geojson)`);
let k = 1;
if (over(inverts(1)) > 0) {
  let lo_ = 0, hi_ = 1;
  for (let it = 0; it < 30; it++) { const m = (lo_ + hi_) / 2; if (over(inverts(m)) > 0) hi_ = m; else lo_ = m; }
  k = lo_;
}
const invert = inverts(k);
const SLOPE = { pipe: BASE.pipe * k, egg: BASE.egg * k };
// Lines: sewers under the middle of streets under WIDE m, under both sides of wider ones (a quarter of the width in from
// each building line); brick mains always in the middle.
type F = { type: "Feature"; geometry: { type: string; coordinates: unknown }; properties: Record<string, unknown> };
const lines: F[] = [], points: F[] = [];
const offset = (pts: number[][], off: number) => pts.map((p, i) => {
  const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [p[0] - ((b[1] - a[1]) / l) * off, p[1] + ((b[0] - a[0]) / l) * off];
});
let km = 0, flipped = 0;
for (const e of reached) {
  const s = owner.get(lo(e))!, L = drained.get(e)!, sz = size(L, s, e);
  // A cross-connection in III whose upstream end came out lower than its downstream one flows the other way.
  const flip = s === "III" && invert.get(hi(e))! < invert.get(lo(e))!, from = flip ? lo(e) : hi(e), to = flip ? hi(e) : lo(e);
  const down = to === e.a ? [...e.pts].reverse() : e.pts;
  const hw = Math.min(...[e.a, e.b].map((n) => nodes.get(n)!.hw), ...e.pts.map((p) => p[2] ?? 99));
  const sides = !PLATE && sz.kind === "stoneware pipe" && hw * 2 >= WIDE ? [hw / 2, -hw / 2] : [0];
  // A branch meeting a deeper sewer keeps its own fall and drops the rest in the junction's manhole (an Absturzschacht).
  const zi = invert.get(from)!, zJ = invert.get(to)!, zo = Math.max(zJ, zi - (isEgg(e, s) ? SLOPE.egg : SLOPE.pipe) * e.len);
  if (flip) flipped++;
  for (const off of sides) {
    const pts = off ? offset(down, off) : down.map((p) => [p[0], p[1]]);
    km += e.len / 1000;
    lines.push({
      type: "Feature", geometry: { type: "LineString", coordinates: pts.map((p) => p.map((v) => +v.toFixed(2))) },
      properties: {
        system: s, kind: sz.kind, height_m: sz.h, width_m: sz.w, profile: (sz as { profile?: string }).profile ?? null, wall_m: (sz as { wall?: number }).wall ?? null, drains_m: Math.round(L), position: PLATE ? "as drawn" : off ? (off > 0 ? "left side" : "right side") : "middle",
        slope: +((zi - zo) / e.len).toFixed(5), invert_in: +zi.toFixed(2), invert_out: +zo.toFixed(2), drop_m: +(zo - zJ).toFixed(2), depth_in: +(g(pts[0][0], pts[0][1]) - zi).toFixed(2), depth_out: +(g(pts[pts.length - 1][0], pts[pts.length - 1][1]) - zo).toFixed(2),
        joined_gap: e !== siphon && e.pts.length === 2 && !streets.edges.includes(e), siphon: e === siphon,
        basis: e === siphon ? "assumed: siphon under the Kupfergraben to IIIa"
          : PLATE ? (!e.drawn_width_m ? "assumed: a gap in the trace joined straight (the plate's line there, if any, was not traced)" : `Hobrecht 1884, ${PLATE}: route and kind as drawn (${e.drawn_width_m} m wide on the plate); size by length drained, inverts and falls modelled${e.checked === false ? "; outside the slice, not checked against its streets" : ""}`)
          : "procedural on the 1917 streets; kind and sizes in Hobrecht's ranges, layout, sizes by length drained and inverts assumed",
        in_slice: pts.some((p) => p[0] >= X0 && p[0] < X1 && p[1] >= Y0 && p[1] < Y1),
      },
    });
    // Manholes at the upstream end and every MANHOLE m (on a plate: where it draws them, below).
    if (!PLATE) for (let d = 0; d < e.len; d += MANHOLE) {
      const t = d / e.len, k = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1))), f = t * (pts.length - 1) - k;
      const x = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, y = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f, z = zi + (zo - zi) * t;
      points.push({ type: "Feature", geometry: { type: "Point", coordinates: [+x.toFixed(2), +y.toFixed(2)] }, properties: { kind: "manhole", system: s, invert: +z.toFixed(2), depth: +(g(x, y) - z).toFixed(2), basis: `assumed: at junctions and every ${MANHOLE} m` } });
    }
  }
}
// IIIa's pressure main: along the streets (back over the siphon) to the nearest point of III's brick sewers.
{
  const target = new Set(reached.filter((e) => owner.get(lo(e)) === "III" && isEgg(e, "III")).flatMap((e) => [e.a, e.b]));
  const d2 = new Map([[roots.IIIa.id, 0]]), via = new Map<number, Edge>(), open = [roots.IIIa.id];
  let hit = -1;
  while (open.length) {
    open.sort((p, q) => d2.get(q)! - d2.get(p)!);
    const u = open.pop()!;
    if (target.has(u)) { hit = u; break; }
    for (const { e, to } of adj.get(u) ?? []) if (d2.get(u)! + e.len < (d2.get(to) ?? Infinity)) { d2.set(to, d2.get(u)! + e.len); via.set(to, e); open.push(to); }
  }
  if (hit < 0 && PLATE) {
    const t = nearest(roots.IIIa.x, roots.IIIa.y, [...target].map((id) => nodes.get(id)!));
    lines.push({ type: "Feature", geometry: { type: "LineString", coordinates: [[roots.IIIa.x, roots.IIIa.y], [t.x, t.y]].map((p) => p.map((v) => +v.toFixed(2))) },
      properties: { system: "IIIa", kind: "pressure main", height_m: 0.5, width_m: 0.5, depth_in: 2, depth_out: 2, length_m: Math.round(Math.hypot(t.x - roots.IIIa.x, t.y - roots.IIIa.y)), in_slice: true,
        basis: `assumed: straight from IIIa across the Kupfergraben to III's nearest brick sewer; ${PLATE} draws the Druckrohr (dash-dot), not traced yet; 0.5 m and 2 m deep assumed` } });
  }
  if (hit >= 0) {
    const path: number[][] = [];
    for (let n = hit; n !== roots.IIIa.id; ) {
      const e = via.get(n)!, pts = e.a === n ? e.pts : [...e.pts].reverse();
      path.unshift(...pts.slice(0, -1).reverse().map((p) => [p[0], p[1]]).reverse());
      n = e.a === n ? e.b : e.a;
    }
    path.unshift([roots.IIIa.x, roots.IIIa.y]);
    lines.push({ type: "Feature", geometry: { type: "LineString", coordinates: path.map((p) => p.map((v) => +v.toFixed(2))) },
      properties: { system: "IIIa", kind: "pressure main", height_m: 0.5, width_m: 0.5, depth_in: 2, depth_out: 2, length_m: Math.round(d2.get(hit)!), basis: "assumed: iron pressure main from IIIa along the streets into III's nearest brick sewer; 0.5 m and 2 m deep assumed" } });
  }
}
// On a plate, its dots (Revisionsbrunnen) and squares (gullies), each on the nearest sewer at that sewer's invert there.
if (plateG) for (const st of plateG.structures) {
  let best: { d: number; z: number; s: string } | null = null;
  for (const l of lines) {
    const c = l.geometry.coordinates as number[][], p = l.properties;
    if (p.kind === "pressure main" || p.invert_in === undefined) continue;
    let along = 0;
    const total_ = c.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - c[i - 1][0], q[1] - c[i - 1][1]) : 0), 0) || 1;
    for (let i = 1; i < c.length; i++) {
      const [ax, ay] = c[i - 1], dx = c[i][0] - ax, dy = c[i][1] - ay, L = Math.hypot(dx, dy) || 1;
      const t = Math.max(0, Math.min(1, ((st.x - ax) * dx + (st.y - ay) * dy) / (L * L))), d = Math.hypot(ax + t * dx - st.x, ay + t * dy - st.y);
      if (!best || d < best.d) best = { d, z: (p.invert_in as number) + ((p.invert_out as number) - (p.invert_in as number)) * ((along + t * L) / total_), s: p.system as string };
      along += L;
    }
  }
  if (!best || best.d > 6) continue;
  points.push({ type: "Feature", geometry: { type: "Point", coordinates: [+st.x.toFixed(2), +st.y.toFixed(2)] },
    properties: { kind: "manhole", system: best.s, invert: +best.z.toFixed(2), depth: +(g(st.x, st.y) - best.z).toFixed(2), basis: `Hobrecht 1884, ${PLATE}: a drawn Revisionsbrunnen (dot) or gully (square), not told apart; invert from the sewer it sits on` } });
}
for (const [s, r] of Object.entries(roots) as ["III" | "IIIa", Node][])
  points.push({ type: "Feature", geometry: { type: "Point", coordinates: [r.x, r.y] }, properties: { kind: "pumping station", system: s, name: s === "III" ? III.name : IIIA.name, invert: +invert.get(r.id)!.toFixed(2), depth: +(g(r.x, r.y) - invert.get(r.id)!).toFixed(2), drains_m: Math.round(total[s]) } });
// The station's own channels and pipes from Blatt 16-17 and 26 (station3lines.ts).
console.log(await stationIII(map, lines, points, g, { x: roots.III.x, y: roots.III.y, z: invert.get(roots.III.id)! }));

const cellsHa = catchmentHa();
const fc = (features: F[]) => ({ type: "FeatureCollection", crs: { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::25833" } }, features });
await Bun.write(`${map}/sewers.geojson`, JSON.stringify(fc(lines)));
await Bun.write(`${map}/sewer_points.geojson`, JSON.stringify(fc(points)));
const st = points.filter((p) => p.properties.kind === "pumping station").map((p) => `${p.properties.system} ${(p.properties.depth as number).toFixed(1)} m deep, ${((p.properties.drains_m as number) / 1000).toFixed(1)} km of street`);
const eggs = lines.filter((l) => l.properties.kind === "brick egg profile").length;
console.log(`${slice.name}: ${lines.length} sewer lines, ${km.toFixed(1)} km of sewer under ${(reached.reduce((s, e) => s + e.len, 0) / 1000).toFixed(1)} km of street (${joined} gaps joined), ${eggs} brick egg-profile lines, ${points.filter((p) => p.properties.kind === "manhole").length} manholes`);
console.log(`ways to IIIa weighted ${F.toFixed(2)}x; falls: pipes 1:${Math.round(1 / SLOPE.pipe)}, brick sewers 1:${Math.round(1 / SLOPE.egg)}${k < 1 ? " (flattened " + k.toFixed(2) + "x so every III junction keeps " + COVER + " m of cover from +" + III_INVERT + " m NN at the station)" : ""}`);
const covers = [...invert.entries()].filter(([n]) => owner.get(n) === "III").map(([n, z]) => { const nd = nodes.get(n)!; return g(nd.x, nd.y) - z; }).sort((a, b) => a - b);
console.log(`III: ${flipped} cross-connections run against the routing (their higher end upstream); ${lines.filter((l) => l.properties.system === "III" && (l.properties.slope as number) < SLOPE.pipe * 0.97 && l.properties.kind === "stoneware pipe" || l.properties.system === "III" && (l.properties.slope as number) < SLOPE.egg * 0.97).length} lines fall flatter than the minimum`);
console.log(`III from +${III_INVERT} m up: street to invert min ${covers[0].toFixed(2)} m, p5 ${covers[Math.floor(covers.length * 0.05)].toFixed(2)}, p50 ${covers[Math.floor(covers.length / 2)].toFixed(2)}, max ${covers[covers.length - 1].toFixed(2)}; ${covers.filter((c) => c < 1.5).length} of ${covers.length} nodes under 1.5 m`);
console.log(`stations: ${st.join("; ")}; deepest manhole ${Math.max(...points.filter((p) => p.properties.kind === "manhole").map((p) => p.properties.depth as number)).toFixed(1)} m`);
console.log(PLATE ? `check: sewer ${km.toFixed(0)} km as traced, ${lines.filter((l) => l.properties.in_slice).length} lines in the slice (documented over 80 km for all of III by 1878)`
  : `check: catchment land (parks over 1 ha left out) ${cellsHa.toFixed(0)} ha in the slice against the documented 389.7 ha for all of III (line with I at Lindenstraße); sewer ${km.toFixed(0)} km (documented over 80 km by 1878)`);
