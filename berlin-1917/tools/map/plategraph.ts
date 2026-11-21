// The sewer network read off a Hobrecht plate (hobrechttrace.ts) as a graph for sewers.ts, in the shape of
// skeleton.ts's streets.json: nodes {id, x, y, hw} and edges {a, b, len, pts}, each edge also carrying what the plate
// says of it (brick: drawn at least BRICK m wide, the plate's heavy "Gemauerte Canäle"; else a stoneware pipe).
// Inside the slice a line must not run through the 1917 buildings or railway land: one with over half its length more
// than OFF m inside them is dropped (station platforms, lettering, a building edge read as a line). The old town's lanes
// are mostly courtyard-sized open ground in open.geojson, so "in a street" would be too strict. Outside the slice there
// is no map, so lines there are kept unchecked (`checked: false`). OFF is about the fit's 90th-percentile error (7 m on
// Blatt 4): at 4 m, sewers along a block front at Potsdamer Platz went and took the plate's west branch with them.
// The plate's dots and squares (Revisionsbrunnen, gullies) within NEAR m of a kept line are returned as structures.
import { chamfer, fillPolys, simplify } from "./thin";

export type PlateEdge = { a: number; b: number; len: number; pts: number[][]; brick: boolean; drawn_width_m: number; checked: boolean };
// Lines are simplified to SMOOTH m (the fit's rms is 1.5 m; finer bends are the pen's and the scan's).
const BRICK = 2.5, OFF = 6, NEAR = 4, SMOOTH = 1.5;

export async function plateGraph(root: string, map: string, plate: string, bbox: number[]) {
  const src = await Bun.file(`${root}/cache/hobrecht/${plate}.lines.geojson`).json();
  const [X0, Y0, X1, Y1] = bbox, W = X1 - X0, H = Y1 - Y0;
  const geoms = [...(await Bun.file(`${map}/buildings.geojson`).json()).features, ...(await Bun.file(`${map}/rail.geojson`).json()).features]
    .map((f: { geometry: { type: string; coordinates: unknown } }) => f.geometry);
  const blocked = fillPolys(geoms, X0, Y1, W, H);
  const off = chamfer(W, H, (i) => blocked[i] === 0); // metres inside a building or railway land
  const inSlice = (x: number, y: number) => x >= X0 && x < X1 && y >= Y0 && y < Y1;
  const offAt = (x: number, y: number) => off[Math.floor(Y1 - y) * W + Math.floor(x - X0)];

  const edges: PlateEdge[] = [];
  let dropped = 0, droppedKm = 0;
  const droppedLines: number[][][] = [];
  for (const f of src.features) {
    if (f.geometry.type !== "LineString") continue;
    const c = f.geometry.coordinates as number[][], p = f.properties;
    let inside = 0, outside = 0;
    for (let i = 1; i < c.length; i++) {
      const L = Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]);
      for (let t = 0; t < L; t += 2) {
        const x = c[i - 1][0] + ((c[i][0] - c[i - 1][0]) * t) / L, y = c[i - 1][1] + ((c[i][1] - c[i - 1][1]) * t) / L;
        if (!inSlice(x, y)) continue;
        if (offAt(x, y) > OFF) outside++; else inside++;
      }
    }
    if (outside > inside) { dropped++; droppedKm += p.length_m / 1000; droppedLines.push(c); continue; }
    edges.push({ a: p.a, b: p.b, len: p.length_m, pts: simplify(c.map((q) => [q[0], q[1], 0]), SMOOTH), brick: p.drawn_width_m >= BRICK, drawn_width_m: p.drawn_width_m, checked: inside + outside > 0 });
  }
  // Node positions: the trace's junctions; an edge's end lies within a pixel or two of its node.
  const all = new Map((src.nodes as { id: number; x: number; y: number }[]).map((n) => [n.id, { ...n, hw: 0 }]));
  const water = fillPolys((await Bun.file(`${map}/water.geojson`).json()).features.map((f: { geometry: { type: string; coordinates: unknown } }) => f.geometry), X0, Y1, W, H);
  const wet = (x: number, y: number) => inSlice(x, y) && water[Math.floor(Y1 - y) * W + Math.floor(x - X0)] === 1;
  const cut = splitWet(edges, all, wet);
  const snapped = snap(edges, all, SNAP, (n) => [n], () => true, undefined, wet);
  const joinedPieces = joinPieces(edges, all, wet);
  const used = new Set(edges.flatMap((e) => [e.a, e.b]));
  const nodes = [...all.values()].filter((n) => used.has(n.id));
  // Structures near a kept line.
  const near = (x: number, y: number) => edges.some((e) => e.pts.some((q, i) => {
    if (!i) return false;
    const [ax, ay] = e.pts[i - 1], dx = q[0] - ax, dy = q[1] - ay, l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
    return Math.hypot(ax + t * dx - x, ay + t * dy - y) <= NEAR;
  }));
  const structures = src.features.filter((f: { geometry: { type: string } }) => f.geometry.type === "Point")
    .map((f: { geometry: { coordinates: number[] }; properties: { r_m: number } }) => ({ x: f.geometry.coordinates[0], y: f.geometry.coordinates[1], r_m: f.properties.r_m }))
    .filter((s: { x: number; y: number }) => near(s.x, s.y));
  return { nodes, edges, structures, dropped, droppedKm, droppedLines, cut, snapped, joinedPieces, source: src.source as string };
}

/** The trace breaks a line where it meets another (the crossing's dot, a gap in the ink): each dead end within SNAP m
 * of another line is joined to it, at that line's end node if the nearest point is within 3 m of one, else at a new
 * node splitting the line there. Edges and nodes are changed in place; returns how many were joined. */
const SNAP = 10, JOIN = 40;
type N = { id: number; x: number; y: number; hw: number };
/** Joins dead ends (or, through `skip`, any node) to the nearest point on a line within `reach` m that `ok` allows. */
function snap(edges: PlateEdge[], nodes: Map<number, N>, reach: number, _pick: (n: number) => number[], ok: (e: PlateEdge) => boolean, only?: Set<number>, wetAt?: (x: number, y: number) => boolean): number {
  let next = Math.max(...nodes.keys()) + 1, joined = 0;
  const degree = () => { const d = new Map<number, number>(); for (const e of edges) for (const n of [e.a, e.b]) d.set(n, (d.get(n) ?? 0) + 1); return d; };
  for (const [id, deg] of degree()) {
    if (only ? !only.has(id) : deg !== 1) continue;
    const n = nodes.get(id)!;
    let best: { e: PlateEdge; i: number; x: number; y: number; d: number } | null = null;
    for (const e of edges) {
      if (e.a === id || e.b === id || !ok(e)) continue;
      for (let i = 1; i < e.pts.length; i++) {
        const [ax, ay] = e.pts[i - 1], dx = e.pts[i][0] - ax, dy = e.pts[i][1] - ay, l2 = dx * dx + dy * dy || 1;
        const t = Math.max(0, Math.min(1, ((n.x - ax) * dx + (n.y - ay) * dy) / l2)), x = ax + t * dx, y = ay + t * dy, d = Math.hypot(x - n.x, y - n.y);
        if (d <= reach && (!best || d < best.d) && !(wetAt && [0.25, 0.5, 0.75].some((f) => wetAt(n.x + (x - n.x) * f, n.y + (y - n.y) * f)))) best = { e, i, x, y, d };
      }
    }
    if (!best) continue;
    const { e, i, x, y, d } = best, A = nodes.get(e.a)!, B = nodes.get(e.b)!;
    let to: number;
    if (Math.hypot(A.x - x, A.y - y) <= 3) to = e.a;
    else if (Math.hypot(B.x - x, B.y - y) <= 3) to = e.b;
    else {
      to = next++;
      nodes.set(to, { id: to, x, y, hw: 0 });
      const head = [...e.pts.slice(0, i), [x, y, 0]], tail = [[x, y, 0], ...e.pts.slice(i)];
      const lenOf = (p: number[][]) => p.reduce((s, q, k) => (k ? s + Math.hypot(q[0] - p[k - 1][0], q[1] - p[k - 1][1]) : 0), 0);
      edges.splice(edges.indexOf(e), 1, { ...e, b: to, pts: head, len: lenOf(head) }, { ...e, a: to, pts: tail, len: lenOf(tail) });
    }
    if (to === id) continue;
    // A join between two brick sewers is brick; any other is a pipe.
    const own = edges.find((o) => o.a === id || o.b === id);
    edges.push({ a: id, b: to, len: d, pts: [[n.x, n.y, 0], [x, y, 0]], brick: !!own?.brick && e.brick, drawn_width_m: 0, checked: false });
    joined++;
  }
  return joined;
}

/** Pieces the snap left apart, smallest first: each joined from whichever of its nodes is nearest another piece's line,
 * if within JOIN m and not across water. Returns how many were joined. */
function joinPieces(edges: PlateEdge[], nodes: Map<number, N>, wet: (x: number, y: number) => boolean): number {
  let joined = 0;
  const failed = new Set<number>();
  for (;;) {
    const comp = new Map<number, number>(), adj = new Map<number, number[]>(), size = new Map<number, number>();
    for (const e of edges) { adj.set(e.a, [...(adj.get(e.a) ?? []), e.b]); adj.set(e.b, [...(adj.get(e.b) ?? []), e.a]); }
    for (const n of adj.keys()) {
      if (comp.has(n)) continue;
      const q = [n]; comp.set(n, n);
      while (q.length) for (const m of adj.get(q.pop()!) ?? []) if (!comp.has(m)) { comp.set(m, n); q.push(m); }
    }
    for (const e of edges) size.set(comp.get(e.a)!, (size.get(comp.get(e.a)!) ?? 0) + e.len);
    const order = [...size].sort((a, b) => a[1] - b[1]).map(([c]) => c).filter((c) => !failed.has(c));
    if (order.length <= 1) return joined;
    const c = order[0], members = new Set([...comp].filter(([, k]) => k === c).map(([n]) => n));
    const before = edges.length;
    // The member nearest any other piece's line goes first; snap() then joins it there.
    let bestNode = -1, bestD = Infinity;
    for (const id of members) {
      const n = nodes.get(id)!;
      for (const e of edges) {
        if (members.has(e.a)) continue;
        for (let i = 1; i < e.pts.length; i++) {
          const [ax, ay] = e.pts[i - 1], dx = e.pts[i][0] - ax, dy = e.pts[i][1] - ay, l2 = dx * dx + dy * dy || 1;
          const t = Math.max(0, Math.min(1, ((n.x - ax) * dx + (n.y - ay) * dy) / l2)), d = Math.hypot(ax + t * dx - n.x, ay + t * dy - n.y);
          if (d < bestD) { bestD = d; bestNode = id; }
        }
      }
    }
    if (bestNode < 0 || bestD > JOIN || !snap(edges, nodes, JOIN, (n) => [n], (e) => !members.has(e.a), new Set([bestNode]), wet)) { failed.add(c); continue; }
    if (edges.length > before) joined++;
  }
}

/** The trace runs a line on across a bridge's drawn edges or into the river at an outlet; a sewer stops at the bank.
 * Each line is cut where it is over water (sampled every metre), the dry runs over 3 m kept, each cut end a new node.
 * Returns how many lines were cut. */
function splitWet(edges: PlateEdge[], nodes: Map<number, N>, wet: (x: number, y: number) => boolean): number {
  let next = Math.max(...nodes.keys()) + 1, cut = 0;
  const out: PlateEdge[] = [];
  for (const e of edges) {
    const dense: number[][] = [];
    for (let i = 1; i < e.pts.length; i++) {
      const [ax, ay] = e.pts[i - 1], [bx, by] = e.pts[i], L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(L));
      for (let k = i === 1 ? 0 : 1; k <= n; k++) dense.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n, 0]);
    }
    const dry = dense.map((p) => !wet(p[0], p[1]));
    if (dry.every(Boolean)) { out.push(e); continue; }
    cut++;
    for (let i = 0; i < dense.length; ) {
      if (!dry[i]) { i++; continue; }
      let j = i;
      while (j + 1 < dense.length && dry[j + 1]) j++;
      const run = dense.slice(i, j + 1), L = j - i < 1 ? 0 : run.reduce((t, q, k) => (k ? t + Math.hypot(q[0] - run[k - 1][0], q[1] - run[k - 1][1]) : 0), 0);
      if (L > 3) {
        const end = (k: number, orig: number) => { if (k === orig) return orig === 0 ? e.a : e.b; const id = next++; nodes.set(id, { id, x: dense[k][0], y: dense[k][1], hw: 0 }); return id; };
        out.push({ ...e, a: end(i, 0), b: end(j, dense.length - 1 === j ? j : -1), pts: run, len: L });
      }
      i = j + 1;
    }
  }
  edges.splice(0, edges.length, ...out);
  return cut;
}
