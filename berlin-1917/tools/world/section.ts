// The ground in section along a street: what the 1917 map says lies under and beside a line, in the line's own
// frame, for a section set (components/underground/section.tsx) to build from.
//
//   in:  map/1917/{buildings,sewers,underground}.geojson, cache/friedrichstadt/streets.json (half-widths),
//        the 1917 ground grid (map/1917/ground1917_2m.json + cache/friedrichstadt/ground1917_2m.f32)
//   out: assets/world/sections/<name>.json
//   run: bun tools/world/section.ts leipziger
//
// The frame: s metres along the line from its start A, n metres to its left (north for a line run eastward), h the
// height above NHN. Everything is clipped to s0..s1 and to a band of n.
//
// What it keeps: the ground under the line every 2 m; each building footprint in the band (key, storeys, rings in
// s,n); the sewers that run along the line (within the street and an allowance of `along` metres; since the map
// lane's Blatt 4 fit of 11-17 Leipziger Straße's own lie inside the street: the egg at n -5.5, the stoneware pipes at
// -6 and +10, one under each footway) and those that cross it
// (where, at what angle, the size, kind and invert there); the underground works that cross it; the strata of the
// nearest borehole logs, read off the Landesgeologie log sheets by hand (their links are kept).
const root = `${import.meta.dir}/../..`;
const map = `${root}/map/1917`, cache = `${root}/cache/friedrichstadt`;

type Pt = [number, number];
type Line = { name: string; a: Pt; b: Pt; s0: number; s1: number; band: [number, number]; along: number; strata: Strata[] };
type Strata = { log: string; where: string; drilled: string; ground: number; at: Pt; link: string; layers: [number, string][] };

// The strata are the layer's bottom depth below the ground, metres, and its description as the log gives it.
const LOG_6644: Strata = {
  log: "423C-6644", where: "Friedrichstr. Ecke Leipziger Str. 5", drilled: "1934", ground: 35.04, at: [390714.0, 5818990.3],
  link: "https://gdi.berlin.de/ext/bohrungen/getimage?PRJID=BL423C&LOCID=2659&LAYOUT=5&RESOLUTION=3000&IMAGETYPE=JPG",
  layers: [[2.4, "Keller"], [3.0, "Grobsand, hellbräunlich"], [5.0, "Mittelsand, hellgrau"], [6.5, "Sand, hellgrau"], [7.0, "Feinsand (schwach tonig), hellbräunlich"], [8.0, "Sand, hellbräunlich"], [10.4, "Mittelsand, hellgrau"], [12.4, "Ton, Schluff, Sand, Kies: Geschiebemergel, grau, kratzig, kalkhaltig"], [13.0, "Mittelkies bis Grobkies (sandig)"], [14.0, "Sand (scharf, feinkiesig)"], [15.0, "Mittelkies bis Grobkies (sandig)"], [16.0, "Sand, hellgrau"]],
};
const LOG_3427: Strata = {
  log: "423D-3427", where: "Leipziger Str. 102", drilled: "1891-11-30", ground: 34.4, at: [390757.7, 5819027.4],
  link: "https://gdi.berlin.de/ext/bohrungen/getimage?PRJID=BL423D&LOCID=3860&LAYOUT=5&RESOLUTION=3000&IMAGETYPE=JPG",
  layers: [[2.0, "Auffüllung"], [11.0, "Weichsel-Kaltzeit: Feinsand, weiß (Talsand)"], [11.5, "Weichsel-Kaltzeit: Sand (scharf), Ton"], [13.0, "Weichsel-Kaltzeit: Geschiebemergel, Ton"], [23.1, "Saale-Komplex: Feinsand, weiß"], [24.0, "Saale-Komplex: Feinsand, weiß"], [30.0, "Saale-Komplex: Grobkies"]],
};

const LINES: Record<string, Line> = {
  // Leipziger Straße from west of Friedrichstraße to east of Charlottenstraße, on the street skeleton's centreline
  // (cache/friedrichstadt/streets.json edges 3652-3679 to 3568-3607)
  leipziger: { name: "Leipziger Straße", a: [390572, 5819008], b: [391196, 5819056], s0: 60, s1: 420, band: [-45, 70], along: 26, strata: [LOG_3427, LOG_6644] },
};

const name = process.argv[2] ?? "leipziger";
const L = LINES[name];
if (!L) throw new Error(`section.ts: no line "${name}" (have ${Object.keys(LINES).join(", ")})`);
const dx = L.b[0] - L.a[0], dy = L.b[1] - L.a[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
const toSN = (p: Pt): Pt => { const x = p[0] - L.a[0], y = p[1] - L.a[1]; return [x * ux + y * uy, -x * uy + y * ux]; };
const r2 = (v: number) => Math.round(v * 100) / 100;
const inBand = ([s, n]: Pt, pad = 0) => s >= L.s0 - pad && s <= L.s1 + pad && n >= L.band[0] - pad && n <= L.band[1] + pad;

// ---------- the ground ----------
const head = await Bun.file(`${map}/ground1917_2m.json`).json();
const GW = head.width, GH = head.height, CELL = head.cell_m, [GX0, GY1] = head.origin_top_left;
const grid = new Float32Array(await Bun.file(`${cache}/ground1917_2m.f32`).arrayBuffer());
function g(x: number, y: number) {
  const cx = Math.min(GW - 1.001, Math.max(0, (x - GX0) / CELL - 0.5)), cy = Math.min(GH - 1.001, Math.max(0, (GY1 - y) / CELL - 0.5));
  const i = Math.floor(cx), j = Math.floor(cy), fx = cx - i, fy = cy - j, k = j * GW + i;
  return (grid[k] * (1 - fx) + grid[k + 1] * fx) * (1 - fy) + (grid[k + GW] * (1 - fx) + grid[k + GW + 1] * fx) * fy;
}
const atS = (s: number, n = 0): Pt => [L.a[0] + s * ux - n * uy, L.a[1] + s * uy + n * ux];
const ground: [number, number][] = [];
for (let s = L.s0; s <= L.s1 + 1e-6; s += 2) ground.push([s, r2(g(...atS(s)))]);

// ---------- the street's half-width under the line ----------
const streets = await Bun.file(`${cache}/streets.json`).json();
const hwPts: { s: number; n: number; hw: number }[] = [];
for (const e of streets.edges) for (const [x, y, hw] of e.pts) { const [s, n] = toSN([x, y]); if (inBand([s, n], 20) && Math.abs(n) < 6) hwPts.push({ s, n, hw }); }
const halfWidth = (s: number) => { let best = Infinity, hw = 11; for (const p of hwPts) { const d = Math.abs(p.s - s); if (d < best) (best = d), (hw = p.hw); } return hw; };

// ---------- buildings ----------
const blds = (await Bun.file(`${map}/buildings.geojson`).json()).features as any[];
const buildings: { key: string; storeys: number; kind: string; rings: Pt[][] }[] = [];
for (const f of blds) {
  const polys: number[][][][] = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [];
  for (const poly of polys) {
    const rings = poly.map((r) => r.map((p) => toSN(p as Pt)));
    if (!rings[0].some((p) => inBand(p))) continue;
    buildings.push({ key: f.properties.key, storeys: f.properties.storeys ?? 5, kind: f.properties.kind, rings: rings.map((r) => r.map(([s, n]) => [r2(s), r2(n)] as Pt)) });
  }
}

// ---------- sewers ----------
const sewers = (await Bun.file(`${map}/sewers.geojson`).json()).features as any[];
type Along = { s0: number; s1: number; n: number; kind: string; w: number; h: number; inv0: number; inv1: number; depth: number; basis: string };
type Across = { s: number; angle: number; kind: string; w: number; h: number; invert: number; depth: number; basis: string };
const along: Along[] = [], across: Across[] = [];
for (const f of sewers) {
  const c = (f.geometry.coordinates as Pt[]).map(toSN), p = f.properties;
  if (!c.some((q) => inBand(q, 10))) continue;
  const [a, b] = [c[0], c[c.length - 1]];
  const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  const flat = Math.abs(Math.sin((ang * Math.PI) / 180)) < 0.35;
  if (flat && c.every(([, n]) => Math.abs(n) < halfWidth(a[0]) + L.along)) {
    const [p0, p1] = a[0] < b[0] ? [a, b] : [b, a], [i0, i1] = a[0] < b[0] ? [p.invert_in, p.invert_out] : [p.invert_out, p.invert_in];
    along.push({ s0: r2(p0[0]), s1: r2(p1[0]), n: r2((p0[1] + p1[1]) / 2), kind: p.kind, w: p.width_m, h: p.height_m, inv0: i0, inv1: i1, depth: p.depth_in, basis: p.basis });
  }
  for (let i = 0; i + 1 < c.length; i++) {
    const [q0, q1] = [c[i], c[i + 1]];
    if ((q0[1] > 0) === (q1[1] > 0) || flat) continue;
    const t = q0[1] / (q0[1] - q1[1]), s = q0[0] + t * (q1[0] - q0[0]);
    if (s < L.s0 || s > L.s1) continue;
    const segAng = (Math.atan2(q1[1] - q0[1], q1[0] - q0[0]) * 180) / Math.PI;
    across.push({ s: r2(s), angle: r2(segAng), kind: p.kind, w: p.width_m, h: p.height_m, invert: r2(p.invert_in + (p.invert_out - p.invert_in) * t), depth: p.depth_in, basis: p.basis });
  }
}
along.sort((x, y) => x.s0 - y.s0);
across.sort((x, y) => x.s - y.s);

// ---------- underground works ----------
const ug = (await Bun.file(`${map}/underground.geojson`).json()).features as any[];
const works: { name: string; status: string; kind: string; s: number; angle: number }[] = [];
for (const f of ug) {
  if (f.geometry.type !== "LineString") continue;
  const c = (f.geometry.coordinates as Pt[]).map(toSN);
  for (let i = 0; i + 1 < c.length; i++) {
    const [q0, q1] = [c[i], c[i + 1]];
    if ((q0[1] > 0) === (q1[1] > 0)) continue;
    const t = q0[1] / (q0[1] - q1[1]), s = q0[0] + t * (q1[0] - q0[0]);
    if (s < L.s0 || s > L.s1) continue;
    works.push({ name: f.properties.name, status: f.properties.status, kind: f.properties.kind, s: r2(s), angle: r2((Math.atan2(q1[1] - q0[1], q1[0] - q0[0]) * 180) / Math.PI) });
  }
}

const out = {
  name: L.name, made: "tools/world/section.ts", crs: "EPSG:25833",
  frame: { a: L.a, b: L.b, bearing_deg: r2((Math.atan2(dy, dx) * 180) / Math.PI), s0: L.s0, s1: L.s1, band: L.band },
  ground, halfWidth: hwPts.sort((x, y) => x.s - y.s).map((p) => [r2(p.s), p.hw]),
  buildings, sewers: { along, across }, works, strata: L.strata.map((st) => ({ ...st, sn: toSN(st.at).map(r2) })),
};
const path = `${root}/assets/world/sections/${name}.json`;
await Bun.write(path, JSON.stringify(out));
console.log(`section ${name}: ground ${ground.length} samples (${Math.min(...ground.map((g) => g[1])).toFixed(2)}-${Math.max(...ground.map((g) => g[1])).toFixed(2)} m), ${buildings.length} buildings, ${along.length} sewers along, ${across.length} across, ${works.length} works -> ${path}`);
for (const a of along) console.log(`  along s ${a.s0}-${a.s1} n ${a.n}: ${a.kind} ${a.h}x${a.w} invert ${a.inv0}-${a.inv1}`);
for (const a of across) console.log(`  across s ${a.s} at ${a.angle}°: ${a.kind} ${a.h}x${a.w} invert ${a.invert}`);
for (const w of works) console.log(`  works s ${w.s} at ${w.angle}°: ${w.name} (${w.status})`);
