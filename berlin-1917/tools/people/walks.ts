// The sidewalks people pass along, as rings round each block: the street skeleton (cache/friedrichstadt/streets.json)
// traversed face by face, each street's edge offset into the block by its half-width less 2.2 m (the world bake's
// own rule for its tile walks, tools/world/bake.ts walksIn), joined at the corners, and pushed out of the baked
// buildings (the tiles' colliders) where the skeleton's width is off. A ring has no ends, so a walker turns its
// corners; the tiles' own walks are cut wherever the raster said building and at tile edges, and walkers popped at
// every cut. Each leg (one street's side of the block) is busy by its street: a tram in 1917 (map/1917/trams.geojson,
// OpenHistoricalMap) or a named shopping and government street (map/1917/labels.geojson, carried along its straight
// run) makes it an avenue, 0.3 walkers a metre at 5 pm, so its tile holds about world/budgets.ts's 250 out of doors;
// any other 0.08. The doors on it (assets/people/places.json) are where walkers come out and go in.
// Writes assets/people/walks.json for people/city.ts.
//   bun --tsconfig-override ~/raea/sdk/tsconfig.base.json tools/people/walks.ts
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const G = join(import.meta.dir, "../..");
const W = join(G, "assets/world/friedrichstadt");
const PER = { avenue: 0.3, side: 0.08 };
type XY = [number, number];
type V3 = [number, number, number];
const S = (e: number, n: number): XY => [e - 391000, -(n - 5819000)]; // map to the scene's x, z

// ---- the skeleton as half-edges (map coordinates, EPSG:25833)
const sk = JSON.parse(readFileSync(join(G, "cache/friedrichstadt/streets.json"), "utf8")) as { nodes: { id: number; x: number; y: number }[]; edges: { a: number; b: number; pts: [number, number, number][] }[] };
const node = new Map(sk.nodes.map((n) => [n.id, n]));
type Half = { id: number; from: number; to: number; pts: [number, number, number][]; edge: number; twin: number };
const halves: Half[] = [];
sk.edges.forEach((e, i) => {
  let pts = e.pts;
  const A = node.get(e.a)!;
  if (Math.hypot(pts[0][0] - A.x, pts[0][1] - A.y) > Math.hypot(pts[pts.length - 1][0] - A.x, pts[pts.length - 1][1] - A.y)) pts = [...pts].reverse();
  const h = halves.length;
  halves.push({ id: h, from: e.a, to: e.b, pts, edge: i, twin: h + 1 }, { id: h + 1, from: e.b, to: e.a, pts: [...pts].reverse(), edge: i, twin: h });
});
const out = new Map<number, Half[]>();
const angle = (h: Half) => { const [p, q] = h.pts.length > 1 ? [h.pts[0], h.pts[1]] : [h.pts[0], h.pts[0]]; return Math.atan2(q[1] - p[1], q[0] - p[0]); };
for (const h of halves) (out.get(h.from) ?? out.set(h.from, []).get(h.from)!).push(h);
for (const l of out.values()) l.sort((a, b) => angle(a) - angle(b));
// the face on a half-edge's left goes on with the edge leaving its end next clockwise from the way back
const next = (h: Half) => { const l = out.get(h.to)!, i = l.findIndex((x) => x.id === h.twin); return l[(i - 1 + l.length) % l.length]; };

// ---- busy streets: tram lines, and the named streets' labels carried along their straight runs
const tram = new Map<string, XY[]>();
const cell = (e: number, n: number) => `${Math.floor(e / 50)},${Math.floor(n / 50)}`;
for (const f of JSON.parse(readFileSync(join(G, "map/1917/trams.geojson"), "utf8")).features as { geometry: { coordinates: XY[] } }[]) {
  const c = f.geometry.coordinates;
  for (let i = 1; i < c.length; i++) {
    const k = Math.max(1, Math.ceil(Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]) / 5));
    for (let j = 0; j <= k; j++) { const p: XY = [c[i - 1][0] + ((c[i][0] - c[i - 1][0]) * j) / k, c[i - 1][1] + ((c[i][1] - c[i - 1][1]) * j) / k]; (tram.get(cell(...p)) ?? tram.set(cell(...p), []).get(cell(...p))!).push(p); }
  }
}
const tramNear = (p: XY, r: number) => { const i = Math.floor(p[0] / 50), j = Math.floor(p[1] / 50); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const q of tram.get(`${i + a},${j + b}`) ?? []) if (Math.hypot(q[0] - p[0], q[1] - p[1]) <= r) return true; return false; };
const along = (pts: [number, number, number][], u: number): XY => {
  const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1])), L = seg.reduce((x, y) => x + y, 0);
  let d = u * L, i = 0;
  while (i < seg.length - 1 && d > seg[i]) d -= seg[i++];
  const k = seg[i] ? d / seg[i] : 0, A = pts[i], B = pts[Math.min(i + 1, pts.length - 1)];
  return [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k];
};
const busyEdge = new Set<number>();
sk.edges.forEach((e, i) => { let hit = 0; for (const u of [0.2, 0.35, 0.5, 0.65, 0.8]) if (tramNear(along(e.pts, u), 8)) hit++; if (hit >= 3) busyEdge.add(i); });
const trams = busyEdge.size;
// Friedrichstraße had no tram (its shops, cafés and the station's crowds made it the busiest walking street)
const NAMED = /^(Friedrichstra(ss|ß)e|Unter den Linden|Wilhelmstra(ss|ß)e|Leipziger Stra(ss|ß)e)$/;
const seeds: number[] = [];
for (const f of JSON.parse(readFileSync(join(G, "map/1917/labels.geojson"), "utf8")).features as { properties: { kind: string; text: string }; geometry: { coordinates: XY } }[]) {
  if (f.properties.kind !== "street" || !NAMED.test(f.properties.text)) continue;
  const p = f.geometry.coordinates;
  let best = -1, bd = 30;
  sk.edges.forEach((e, i) => { for (const u of [0.25, 0.5, 0.75]) { const q = along(e.pts, u), d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = i; } } });
  if (best >= 0) seeds.push(best);
}
// carried along: through a node, the edge that goes on within 12 degrees of straight
const dirAt = (e: (typeof sk.edges)[number], end: "a" | "b"): XY => { const p = e.pts, [s, t] = end === "a" ? [p[1], p[0]] : [p[p.length - 2], p[p.length - 1]]; const l = Math.hypot(t[0] - s[0], t[1] - s[1]) || 1; return [(t[0] - s[0]) / l, (t[1] - s[1]) / l]; };
const atNode = new Map<number, number[]>();
sk.edges.forEach((e, i) => { for (const n of [e.a, e.b]) (atNode.get(n) ?? atNode.set(n, []).get(n)!).push(i); });
const named = new Set<number>(), todo = [...seeds];
while (todo.length) {
  const i = todo.pop()!;
  if (named.has(i)) continue;
  named.add(i);
  const e = sk.edges[i];
  for (const [n, end] of [[e.a, "a"], [e.b, "b"]] as const) {
    const d = dirAt(e, end); // pointing out of the edge at this node
    for (const j of atNode.get(n) ?? []) {
      if (j === i || named.has(j)) continue;
      const f = sk.edges[j], o = dirAt(f, f.a === n ? "a" : "b"); // pointing out of f at this node, so straight on is -o
      if (-(d[0] * o[0] + d[1] * o[1]) > Math.cos((12 * Math.PI) / 180)) todo.push(j);
    }
  }
}
for (const i of named) busyEdge.add(i);

// ---- the baked buildings (scene x, z) and the ground's heights, from the tiles
const tiles = (JSON.parse(readFileSync(join(W, "index.json"), "utf8")).tiles as { tile: string; bbox: number[] }[]);
type Poly = { ring: XY[]; box: [number, number, number, number] };
const polys = new Map<string, Poly[]>(), ground = new Map<string, V3[]>();
const sc = (x: number, z: number) => `${Math.floor(x / 25)},${Math.floor(z / 25)}`;
for (const t of tiles) {
  const T = JSON.parse(readFileSync(join(W, t.tile, "tile.json"), "utf8")) as { colliders: { ring: XY[] }[]; walks: V3[][]; doors: { pos: V3 }[] };
  for (const c of T.colliders) {
    const xs = c.ring.map((p) => p[0]), zs = c.ring.map((p) => p[1]);
    const P: Poly = { ring: c.ring, box: [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)] };
    for (let x = Math.floor(P.box[0] / 25); x <= Math.floor(P.box[2] / 25); x++) for (let z = Math.floor(P.box[1] / 25); z <= Math.floor(P.box[3] / 25); z++) (polys.get(`${x},${z}`) ?? polys.set(`${x},${z}`, []).get(`${x},${z}`)!).push(P);
  }
  for (const p of [...T.walks.flat(), ...T.doors.map((d) => d.pos)]) (ground.get(sc(p[0], p[2])) ?? ground.set(sc(p[0], p[2]), []).get(sc(p[0], p[2]))!).push(p);
}
const inside = (x: number, z: number) => {
  for (const P of polys.get(sc(x, z)) ?? []) {
    if (x < P.box[0] || x > P.box[2] || z < P.box[1] || z > P.box[3]) continue;
    let c = false;
    for (let i = 0, j = P.ring.length - 1; i < P.ring.length; j = i++) {
      const [xi, zi] = P.ring[i], [xj, zj] = P.ring[j];
      if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
    }
    if (c) return true;
  }
  return false;
};
const heightAt = (x: number, z: number): number | undefined => {
  let best: number | undefined, bd = 60;
  const i = Math.floor(x / 25), j = Math.floor(z / 25);
  for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) for (const p of ground.get(`${i + a},${j + b}`) ?? []) { const d = Math.hypot(p[0] - x, p[2] - z); if (d < bd) { bd = d; best = p[1]; } }
  return best;
};
const inSlice = (x: number, z: number) => { const e = x + 391000, n = -z + 5819000; return tiles.some((t) => e >= t.bbox[0] && e < t.bbox[2] && n >= t.bbox[1] && n < t.bbox[3]); };

// ---- faces to rings
const seen = new Set<number>();
type Ring = { pts: V3[]; legs: [number, number][]; doors: number[] };
const rings: Ring[] = [];
let pushed = 0, dropped = 0;
for (const h0 of halves) {
  if (seen.has(h0.id)) continue;
  const face: Half[] = [];
  for (let h = h0; !seen.has(h.id); h = next(h)) { seen.add(h.id); face.push(h); if (face.length > 400) break; }
  // a block's face runs anticlockwise (the outer face of the whole slice clockwise)
  // (over the closed outline, about the frame's origin: map coordinates are millions of metres, and the joins
  // between one street's points and the next count)
  const outline = face.flatMap((h) => h.pts.map((p) => [p[0] - 391000, p[1] - 5819000]));
  let area = 0;
  for (let i = 0; i < outline.length; i++) { const a = outline[i], b = outline[(i + 1) % outline.length]; area += a[0] * b[1] - b[0] * a[1]; }
  area /= 2;
  if (area < 200 || area > 400000) continue;
  // each half-edge's points offset to its left (into the block), with the way back to the street at each
  const parts = face.map((h) => h.pts.map((p, i) => {
    const a = h.pts[Math.max(0, i - 1)], b = h.pts[Math.min(h.pts.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const off = Math.max(1.2, p[2] - 2.2), nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
    return { x: p[0] + nx * off, y: p[1] + ny * off, nx, ny, off };
  }));
  // corners: where one street's offset line meets the next one's, when that's near the corner
  for (let k = 0; k < parts.length; k++) {
    const P = parts[k], Q = parts[(k + 1) % parts.length];
    if (P.length < 2 || Q.length < 2) continue;
    const p1 = P[P.length - 2], p2 = P[P.length - 1], q1 = Q[0], q2 = Q[1];
    const d1 = [p2.x - p1.x, p2.y - p1.y], d2 = [q2.x - q1.x, q2.y - q1.y], den = d1[0] * d2[1] - d1[1] * d2[0];
    if (Math.abs(den) < 1e-6) continue;
    const t = ((q1.x - p1.x) * d2[1] - (q1.y - p1.y) * d2[0]) / den, X = p1.x + d1[0] * t, Y = p1.y + d1[1] * t;
    if (Math.hypot(X - p2.x, Y - p2.y) < 3 * p2.off && Math.hypot(X - q1.x, Y - q1.y) < 3 * q1.off) { p2.x = X; p2.y = Y; q1.x = X; q1.y = Y; }
  }
  // to the scene, out of any building, on the ground; legs end where each street's side ends
  const pts: V3[] = [], legs: [number, number][] = [];
  let arc = 0, any = false;
  parts.forEach((P, k) => {
    for (const q of P) {
      let [x, z] = S(q.x, q.y);
      // back toward the street (the scene's z runs against the map's north), 0.25 m at a time, to a metre clear
      const sx = -q.nx, sz = q.ny;
      let moved = 0;
      while (inside(x, z) && moved < q.off - 0.6) { x += sx * 0.25; z += sz * 0.25; moved += 0.25; }
      if (moved > 0) { const m = Math.min(1, q.off - 0.6 - moved); x += sx * m; z += sz * m; pushed++; }
      if (inSlice(x, z)) any = true;
      const y = heightAt(x, z);
      const last = pts[pts.length - 1];
      if (last && Math.hypot(last[0] - x, last[2] - z) < 0.3) continue;
      if (last) arc += Math.hypot(last[0] - x, last[2] - z);
      pts.push([Math.round(x * 100) / 100, y === undefined ? NaN : Math.round(y * 100) / 100, Math.round(z * 100) / 100]);
    }
    legs.push([arc, busyEdge.has(face[k].edge) ? PER.avenue : PER.side]);
  });
  if (!any || pts.length < 3) { dropped++; continue; }
  // heights where no tile was near: the ring's own mean
  const known = pts.filter((p) => !Number.isNaN(p[1]));
  if (!known.length) { dropped++; continue; }
  const mean = known.reduce((s, p) => s + p[1], 0) / known.length;
  for (const p of pts) if (Number.isNaN(p[1])) p[1] = Math.round(mean * 100) / 100;
  // the closing stretch belongs to the last leg
  const total = arc + Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][2] - pts[pts.length - 1][2]);
  legs[legs.length - 1][0] = total;
  rings.push({ pts, legs, doors: [] });
}

// ---- the doors on each ring (a door is on the building line, the sidewalk's middle 1.5 to 4 m out)
const P = JSON.parse(readFileSync(join(G, "assets/people/places.json"), "utf8")) as { kinds: string[]; rows: number[][] };
const doorKinds = new Set(P.kinds.map((k, i) => [k, i] as const).filter(([k]) => !["hinterhof", "beat-corner", "school", "church"].includes(k) && !k.startsWith("stand")).map(([, i]) => i));
const segs = new Map<string, { r: number; i: number; a: number }[]>();
rings.forEach((R, r) => {
  let a = 0;
  for (let i = 0; i < R.pts.length; i++) {
    const A = R.pts[i], B = R.pts[(i + 1) % R.pts.length];
    for (const k of new Set([sc(A[0], A[2]), sc(B[0], B[2]), sc((A[0] + B[0]) / 2, (A[2] + B[2]) / 2)])) (segs.get(k) ?? segs.set(k, []).get(k)!).push({ r, i, a });
    a += Math.hypot(B[0] - A[0], B[2] - A[2]);
  }
});
let onRing = 0;
for (const row of P.rows) {
  if (!doorKinds.has(row[0]) || row[6] === 3) continue; // stand-ins aren't doors
  const x = row[1], z = row[3];
  let best: { r: number; s: number } | undefined, bd = 7;
  const i0 = Math.floor(x / 25), j0 = Math.floor(z / 25);
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const s of segs.get(`${i0 + a},${j0 + b}`) ?? []) {
    const R = rings[s.r], A = R.pts[s.i], B = R.pts[(s.i + 1) % R.pts.length], dx = B[0] - A[0], dz = B[2] - A[2], L2 = dx * dx + dz * dz || 1;
    const u = Math.min(1, Math.max(0, ((x - A[0]) * dx + (z - A[2]) * dz) / L2)), d = Math.hypot(A[0] + dx * u - x, A[2] + dz * u - z);
    if (d < bd) { bd = d; best = { r: s.r, s: s.a + u * Math.sqrt(L2) }; }
  }
  if (best) { rings[best.r].doors.push(Math.round(best.s * 10) / 10); onRing++; }
}
for (const R of rings) R.doors.sort((a, b) => a - b);

writeFileSync(join(G, "assets/people/walks.json"), JSON.stringify({
  about: "tools/people/walks.ts: sidewalk rings round the blocks; a ring: legs [[metres along where it ends, walkers a metre at 5 pm]], doors (metres along), pts flat x, y, z",
  rings: rings.map((R) => ({ legs: R.legs.map(([a, p]) => [Math.round(a * 10) / 10, p]), doors: R.doors, pts: R.pts.flat() })),
}));
const km = (p: number) => (rings.reduce((s, R) => { let a = 0; R.legs.forEach(([to, per]) => { if (per === p) s += to - a; a = to; }); return s; }, 0) / 1000).toFixed(1);
console.log(`walks: ${rings.length} rings round blocks (${dropped} faces outside the slice or empty), ${km(PER.avenue)} km of avenue sidewalk (${trams} tram edges, ${named.size} along named streets), ${km(PER.side)} km of side street`);
console.log(`walks: ${pushed} points pushed out of buildings; ${onRing} doors on a ring`);
