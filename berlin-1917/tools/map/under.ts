// The underground and the elevated railway of 1917 as graybox meshes, per 500 m tile of a slice, in graybox.ts's
// frame (x east, y metres above NHN, z south, from E 391000 N 5819000):
//   assets/graybox/<slice>/under/<tile>.glb   U-Bahn tunnels, stations, the Spree tunnel, the Hochbahn viaduct, and
//                                             the halted Nord-Süd-Bahn works in Friedrichstraße
//   assets/graybox/<slice>/under/index.json   per tile: stations (name, x, y, z in the frame)
// Paths: map/1917/city/ubahn.geojson (tunnels.ts), the works from map/1917/underground.geojson (underground.sh).
//
// Sourced (research/underground.md has the citations):
//   tunnel clear width 6.24 m, clear height 3.30 m from rail top to ceiling, one row of columns between the tracks
//     (Schöneberger Untergrundbahn 1911; Deutsche Bauzeitung 1901)
//   ceiling underside at most 1.20 m below the street (0.70 m of cover) (Deutsche Bauzeitung 1901)
//   ramps 1:38 (ibid., Potsdamer Platz branch); viaduct rail about +40.5 m NN where it crosses the Landwehrkanal,
//     about 6 m over the street there, taken for the whole viaduct
//   Spree tunnel: sole about 11 m under the river's surface, about 125 m between the banks (Hochbahngesellschaft 1913)
//   stations opened 1908 on: island platforms 110 m long (ibid.)
//   Siemens & Halske's 1902 Festschrift (ZLB, Public Domain Mark; its plates measured by their own dimensions): the
//     tunnel's columns every 4.5 m; a 1902 station 80 m long with side platforms 3.5 m wide against its walls, 2.465 m
//     clear over them under the 3.3 m (so 0.835 m over the rail), its box 12.64 m clear between the walls (scaled
//     off the plate by its own 11 m street dimension: 1,252 px at 10.1 mm), the tracks 3.24 m apart; the viaduct
//     as hochbahn.ts draws it citywide: rail 6.25 m over the street (4.55 m clearance and 1.7 m girders), deck 7.1 m,
//     frames every 16.5 m, a station hall 13.0 m wide
// Assumed until measured (each a constant below): trackbed 0.5 m; columns 0.3 m square; a station opened before 1908
//   with the plate's side platforms and a later one with an island platform 4 m wide (each station's own plan unread);
//   the 1902 stations' width taken for the later ones; a station hall on the viaduct 5 m high, flat-roofed; the
//   Nord-Süd-Bahn pit 10 m wide and 7 m deep under a timber deck along its whole length (which sections were dug,
//   in shell or not begun is not yet placed; research/underground.md lists what the sources say).
// usage: bun under.ts SLICE.json
import { Builder, type Material, type Node, writeGlb } from "./glb";
import { slicePaths } from "./paths";
import { inPolys, loadGround } from "./groundgrid";

const CLEAR_W = 6.24, CLEAR_H = 3.3, CEILING = 1.2, RAMP = 1 / 38, VIADUCT = 6.25, SPREE_SOLE = 11, LEN_1908 = 110;
const TRACKBED = 0.5, COL_EVERY = 4.5, COL = 0.3, STATION_W = 12.64, LEN_1902 = 80, PLATFORM_W = 4, PLATFORM_H = 0.835, SIDE_W = 3.5;
const DECK_W = 7.1, DECK_T = 1.7, PIER_EVERY = 16.5, PIER = 0.5, HALL_W = 13.0, HALL_H = 5, PIT_W = 10, PIT_D = 7, STEP = 4;

const slicePath = process.argv[2];
const { slice, root, own, map } = await slicePaths(slicePath);
const g = await loadGround(map, own);
const ORIGIN = [391000, 5819000]; // graybox.ts's frame
const P = (x: number, y: number, z: number) => [x - ORIGIN[0], z, -(y - ORIGIN[1])];
const N = (nx: number, ny: number, nz = 0) => [nx, nz, -ny];

// Big water only (the Spree and the canals): a park pond does not send a tunnel down.
const area = (r: number[][]) => Math.abs(r.reduce((s, p, i) => s + p[0] * r[(i + 1) % r.length][1] - r[(i + 1) % r.length][0] * p[1], 0)) / 2;
const water: number[][][][] = [];
for (const f of (await Bun.file(`${map}/water.geojson`).json()).features)
  for (const poly of f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) if (area(poly[0]) > 3000) water.push(poly);

const tiles = new Map<string, number[]>();
for (const line of (await Bun.$`${import.meta.dir}/tiles.sh ${slicePath}`.text()).trim().split("\n")) {
  const [id, ...b] = line.split(" ");
  tiles.set(id, b.map(Number));
}
const [X0, Y0, X1, Y1] = slice.bbox as number[];
const tileOf = (x: number, y: number) => {
  if (x < X0 || x >= X1 || y < Y0 || y >= Y1) return null;
  const id = `${(X0 + Math.floor((x - X0) / 500) * 500) / 100}_${(Y0 + Math.floor((y - Y0) / 500) * 500) / 100}`;
  return tiles.has(id) ? id : null;
};

const M = { concrete: 0, iron: 1, platform: 2, lagging: 3, sand: 4, deck: 5, hall: 6 };
const materials: Material[] = [
  { name: "tunnel concrete", color: [0.42, 0.41, 0.39, 1], roughness: 0.9, doubleSided: true },
  { name: "iron", color: [0.07, 0.075, 0.08, 1], roughness: 0.55, metallic: 0.6, doubleSided: true },
  { name: "platform", color: [0.55, 0.53, 0.5, 1], roughness: 0.85, doubleSided: true },
  { name: "timber lagging", color: [0.25, 0.17, 0.1, 1], roughness: 0.95, doubleSided: true },
  { name: "pit sand", color: [0.55, 0.47, 0.33, 1], roughness: 1, doubleSided: true },
  { name: "timber deck", color: [0.33, 0.24, 0.15, 1], roughness: 0.9, doubleSided: true },
  { name: "station hall", color: [0.5, 0.48, 0.46, 1], roughness: 0.8, doubleSided: true },
];
const PARTS = ["tunnel", "columns", "platforms", "viaduct", "piers", "halls", "works pit", "works deck"] as const;
const MAT: Record<(typeof PARTS)[number], number> = { tunnel: M.concrete, columns: M.iron, platforms: M.platform, viaduct: M.iron, piers: M.iron, halls: M.hall, "works pit": M.lagging, "works deck": M.deck };
const out = new Map<string, Record<string, Builder>>();
const B = (tile: string, part: (typeof PARTS)[number]) => {
  if (!out.has(tile)) out.set(tile, Object.fromEntries(PARTS.map((p) => [p, new Builder(MAT[p])])));
  return out.get(tile)![part];
};
const sandFloor = new Map<string, Builder>();

type S = { x: number; y: number; s: number; tx: number; ty: number; gr: number };
/** The line every STEP metres, with unit tangents (averaged at the joints so the tube has no gaps) and the ground. */
function resample(pts: number[][]): S[] {
  const out: S[] = [];
  let s = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay);
    const n = Math.max(1, Math.ceil(L / STEP));
    for (let k = i === 0 ? 0 : 1; k <= n; k++) {
      const t = k / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
      out.push({ x, y, s: s + L * t, tx: (bx - ax) / L, ty: (by - ay) / L, gr: g(x, y) });
    }
    s += L;
  }
  for (let i = 1; i + 1 < out.length; i++) {
    const a = out[i - 1], b = out[i + 1], L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    (out[i].tx = (b.x - a.x) / L), (out[i].ty = (b.y - a.y) / L);
  }
  return out;
}
const side = (p: S, off: number) => [p.x - p.ty * off, p.y + p.tx * off]; // left of the direction of travel for off > 0

/** A wall between two samples at lateral offset `off`, from z0 to z1 at each end. */
function wall(b: Builder, a: S, c: S, offA: number, offC: number, za: [number, number], zc: [number, number]) {
  const [ax, ay] = side(a, offA), [cx, cy] = side(c, offC);
  b.quad(P(ax, ay, za[0]), P(cx, cy, zc[0]), P(cx, cy, zc[1]), P(ax, ay, za[1]), N(-a.ty * Math.sign(offA), a.tx * Math.sign(offA)));
}
/** A level strip between two samples, from off - hw to off + hw, at heights za and zc. */
function strip(b: Builder, a: S, c: S, hwA: number, hwC: number, za: number, zc: number, up = true, off = 0) {
  const [arx, ary] = side(a, off - hwA), [alx, aly] = side(a, off + hwA), [crx, cry] = side(c, off - hwC), [clx, cly] = side(c, off + hwC);
  b.quad(P(arx, ary, za), P(crx, cry, zc), P(clx, cly, zc), P(alx, aly, za), N(0, 0, up ? 1 : -1));
}
/** An upright quad from map point p to q, z0 to z1, facing along n (east, north). */
function b4(b: Builder, p: number[], q: number[], z0: number, z1: number, n: number[]) {
  b.quad(P(p[0], p[1], z0), P(q[0], q[1], z0), P(q[0], q[1], z1), P(p[0], p[1], z1), N(n[0], n[1]));
}
/** A square post centred at (x, y) on the line's direction, from z0 to z1. */
function post(b: Builder, p: S, off: number, half: number, z0: number, z1: number) {
  const [cx, cy] = side(p, off);
  const c = (du: number, dn: number) => [cx + p.tx * du - p.ty * dn, cy + p.ty * du + p.tx * dn];
  const corners = [c(half, half), c(-half, half), c(-half, -half), c(half, -half)];
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = corners[i], [bx, by] = corners[(i + 1) % 4], nx = (ax + bx) / 2 - cx, ny = (ay + by) / 2 - cy, l = Math.hypot(nx, ny);
    b.quad(P(ax, ay, z0), P(bx, by, z0), P(bx, by, z1), P(ax, ay, z1), N(nx / l, ny / l));
  }
}

const ub = await Bun.file(`${root}/map/1917/city/ubahn.geojson`).json();
const stations = new Map<string, { x: number; y: number; opened: string }>();
for (const f of ub.features) if (f.properties.feature === "station") stations.set(f.properties.name, { x: f.geometry.coordinates[0], y: f.geometry.coordinates[1], opened: f.properties.opened });
const stationLen = (n: string) => ((stations.get(n)?.opened ?? "1902").slice(0, 4) >= "1908" ? LEN_1908 : LEN_1902);
const level = (kind: string, gr: number) => (kind === "viaduct" ? gr + VIADUCT : gr - CEILING - CLEAR_H);
const stationsHere = new Map<string, { name: string; x: number; y: number; z: number; ways: Record<string, number[][]> }[]>();
let built = 0;
// The way out of each station along each line: `station|line|next station` -> unit vector (east, north).
const away = new Map<string, number[]>();
for (const f of ub.features.filter((f: any) => f.properties.feature === "stretch")) {
  const c: number[][] = f.geometry.coordinates, n = c.length, { from, to, line } = f.properties;
  const unit = (a: number[], b: number[]) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  away.set(`${from}|${line}|${to}`, unit(c[0], c[Math.min(2, n - 1)]));
  away.set(`${to}|${line}|${from}`, unit(c[n - 1], c[Math.max(0, n - 3)]));
}

for (const f of ub.features.filter((f: any) => f.properties.feature === "stretch")) {
  const pr = f.properties, pts: number[][] = f.geometry.coordinates;
  if (!pts.some(([x, y]) => x > X0 - 200 && x < X1 + 200 && y > Y0 - 200 && y < Y1 + 200)) continue;
  const S = resample(pts), len = S[S.length - 1].s, La = stationLen(pr.from) / 2, Lb = stationLen(pr.to) / 2;
  // At a station two stretches of the line meet: both take the direction through it, so their walls join.
  for (const [end, station, other] of [[0, pr.from, pr.to], [1, pr.to, pr.from]] as const) {
    const mine = away.get(`${station}|${pr.line}|${other}`)!;
    const theirs = [...away].find(([k]) => k.startsWith(`${station}|${pr.line}|`) && k !== `${station}|${pr.line}|${other}`)?.[1];
    if (!theirs) continue;
    let [tx, ty] = end ? [theirs[0] - mine[0], theirs[1] - mine[1]] : [mine[0] - theirs[0], mine[1] - theirs[1]];
    const l = Math.hypot(tx, ty) || 1;
    const p = end ? S[S.length - 1] : S[0];
    (p.tx = tx / l), (p.ty = ty / l);
  }
  const rail = S.map((p) => (pr.kind === "ramp" ? level(pr.from_level, p.gr) + (level(pr.to_level, p.gr) - level(pr.from_level, p.gr)) * (p.s / len) : level(pr.kind, p.gr)));
  // Under the river: the sole 11 m below the water, reached at 1:38.
  if (pr.kind !== "viaduct") {
    const wet = S.filter((p) => inPolys(p.x, p.y, water));
    for (let i = 0; i < S.length; i++)
      for (const w of wet) rail[i] = Math.min(rail[i], w.gr - SPREE_SOLE + TRACKBED + Math.abs(S[i].s - w.s) * RAMP);
  }
  const inStation = (p: S) => p.s <= La || p.s >= len - Lb;
  const mode = (i: number) => (rail[i] >= S[i].gr + 0.5 ? "elevated" : pr.kind === "cutting" || rail[i] + CLEAR_H > S[i].gr - 0.7 ? "trough" : "covered");
  // Each station's platform top in the frame, and its way out along each line: points every 12 m for 60 m (frame x, z),
  // for cameras and lamps.
  for (const [name, other, end] of [[pr.from, pr.to, 0], [pr.to, pr.from, 1]] as const) {
    const p = end ? S[S.length - 1] : S[0], r = end ? rail[rail.length - 1] : rail[0], t = tileOf(p.x, p.y);
    if (!t) continue;
    const way = S.filter((q) => (end ? len - q.s : q.s) <= 60 && Math.round(end ? len - q.s : q.s) % 12 < STEP)
      .sort((a, b) => (end ? b.s - a.s : a.s - b.s)).map((q) => P(q.x, q.y, 0)).map(([x, , z]) => [+x.toFixed(1), +z.toFixed(1)]);
    const list = stationsHere.get(t) ?? [];
    let st = list.find((s) => s.name === name);
    if (!st) {
      const [x, y, z] = P(p.x, p.y, r + PLATFORM_H);
      list.push((st = { name, x: +x.toFixed(1), y: +y.toFixed(1), z: +z.toFixed(1), ways: {} }));
      stationsHere.set(t, list);
    }
    st.ways[other] = way;
  }
  for (let i = 0; i + 1 < S.length; i++) {
    const a = S[i], c = S[i + 1], t = tileOf((a.x + c.x) / 2, (a.y + c.y) / 2);
    if (!t) continue;
    built++;
    const m = mode(i), st = inStation(a) && inStation(c);
    if (m === "elevated") {
      const hw = (st ? HALL_W : DECK_W) / 2, topA = rail[i] - 0.2, topC = rail[i + 1] - 0.2;
      strip(B(t, "viaduct"), a, c, hw, hw, topA, topC);
      strip(B(t, "viaduct"), a, c, hw, hw, topA - DECK_T, topC - DECK_T, false);
      wall(B(t, "viaduct"), a, c, hw, hw, [topA - DECK_T, topA], [topC - DECK_T, topC]);
      wall(B(t, "viaduct"), a, c, -hw, -hw, [topA - DECK_T, topA], [topC - DECK_T, topC]);
      if (Math.floor(c.s / PIER_EVERY) > Math.floor(a.s / PIER_EVERY))
        for (const off of [hw - 0.8, -(hw - 0.8)]) post(B(t, "piers"), c, off, PIER / 2, c.gr - 0.5, topC - DECK_T);
      if (st) {
        wall(B(t, "halls"), a, c, hw, hw, [topA, topA + HALL_H], [topC, topC + HALL_H]);
        wall(B(t, "halls"), a, c, -hw, -hw, [topA, topA + HALL_H], [topC, topC + HALL_H]);
        strip(B(t, "halls"), a, c, hw, hw, topA + HALL_H, topC + HALL_H, false);
      }
      continue;
    }
    const hw = (st ? STATION_W : CLEAR_W) / 2, fa = rail[i] - TRACKBED, fc = rail[i + 1] - TRACKBED;
    const ta = m === "covered" ? rail[i] + CLEAR_H : a.gr + 0.3, tc = m === "covered" ? rail[i + 1] + CLEAR_H : c.gr + 0.3;
    strip(B(t, "tunnel"), a, c, hw, hw, fa, fc);
    wall(B(t, "tunnel"), a, c, hw, hw, [fa, ta], [fc, tc]);
    wall(B(t, "tunnel"), a, c, -hw, -hw, [fa, ta], [fc, tc]);
    // Where a station's width meets the line's, an end wall closes the step on both sides.
    if (i > 0 && st !== (inStation(S[i - 1]) && inStation(a)) && mode(i - 1) !== "elevated")
      for (const sgn of [1, -1]) {
        const [x0, y0] = side(a, (sgn * CLEAR_W) / 2), [x1, y1] = side(a, (sgn * STATION_W) / 2);
        b4(B(t, "tunnel"), [x0, y0], [x1, y1], fa, ta, [a.tx, a.ty]);
      }
    if (m === "covered") {
      strip(B(t, "tunnel"), a, c, hw, hw, ta, tc, false);
      if (Math.floor(c.s / COL_EVERY) > Math.floor(a.s / COL_EVERY)) post(B(t, "columns"), c, 0, COL / 2, fc, tc);
    }
    if (st && stationLen(a.s < len / 2 ? pr.from : pr.to) === LEN_1902) {
      // a 1902 station: a side platform against each wall, its edge wall facing the tracks
      const pw = SIDE_W / 2, edge = STATION_W / 2 - SIDE_W;
      for (const sgn of [1, -1]) {
        strip(B(t, "platforms"), a, c, pw, pw, rail[i] + PLATFORM_H, rail[i + 1] + PLATFORM_H, true, sgn * (STATION_W / 2 - pw));
        wall(B(t, "platforms"), a, c, -sgn * edge, -sgn * edge, [rail[i], rail[i] + PLATFORM_H], [rail[i + 1], rail[i + 1] + PLATFORM_H]);
      }
    } else if (st) {
      const pw = PLATFORM_W / 2;
      strip(B(t, "platforms"), a, c, pw, pw, rail[i] + PLATFORM_H, rail[i + 1] + PLATFORM_H);
      wall(B(t, "platforms"), a, c, pw, pw, [rail[i], rail[i] + PLATFORM_H], [rail[i + 1], rail[i + 1] + PLATFORM_H]);
      wall(B(t, "platforms"), a, c, -pw, -pw, [rail[i], rail[i] + PLATFORM_H], [rail[i + 1], rail[i + 1] + PLATFORM_H]);
    }
  }
}

// The Nord-Süd-Bahn works, halted in 1917: an open pit in the Berliner Verbau (soldier piles and timber lagging)
// under a timber deck that carried the street (Holzmann's archive; the 1938 Nordsüd-S-Bahn account of the method).
const works = await Bun.file(`${map}/underground.geojson`).json().catch(() => ({ features: [] }));
let pit = 0;
for (const f of works.features.filter((f: any) => f.properties.feature === "line" && /Nord-Süd/.test(f.properties.name))) {
  const lines: number[][][] = f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const pts of lines) {
    const S = resample(pts), hw = PIT_W / 2;
    for (let i = 0; i + 1 < S.length; i++) {
      const a = S[i], c = S[i + 1], t = tileOf((a.x + c.x) / 2, (a.y + c.y) / 2);
      if (!t) continue;
      pit += c.s - a.s;
      wall(B(t, "works pit"), a, c, hw, hw, [a.gr - PIT_D, a.gr], [c.gr - PIT_D, c.gr]);
      wall(B(t, "works pit"), a, c, -hw, -hw, [a.gr - PIT_D, a.gr], [c.gr - PIT_D, c.gr]);
      if (!sandFloor.has(t)) sandFloor.set(t, new Builder(M.sand));
      strip(sandFloor.get(t)!, a, c, hw, hw, a.gr - PIT_D, c.gr - PIT_D);
      strip(B(t, "works deck"), a, c, hw + 0.3, hw + 0.3, a.gr + 0.08, c.gr + 0.08);
    }
  }
}

const dir = `${root}/assets/graybox/${slice.name}/under`;
await Bun.$`mkdir -p ${dir}`;
const index: object[] = [];
for (const [t, parts] of out) {
  const nodes: Node[] = PARTS.map((p) => ({ name: p, parts: [parts[p].part()].filter((x) => x !== null) as never }));
  if (sandFloor.has(t)) nodes.push({ name: "works floor", parts: [sandFloor.get(t)!.part()].filter((x) => x !== null) as never });
  const glb = writeGlb(nodes.filter((n) => n.parts.length), materials);
  await Bun.write(`${dir}/${t}.glb`, glb);
  index.push({ tile: t, bbox: tiles.get(t), kb: Math.round(glb.length / 1024), stations: stationsHere.get(t) ?? [] });
}
await Bun.write(`${dir}/index.json`, JSON.stringify({ origin_epsg25833: ORIGIN, tiles: index }, null, 1));
console.log(`${slice.name}: ${out.size} tiles with underground, ${built} U-Bahn pieces of ${STEP} m, ${pit.toFixed(0)} m of Nord-Süd-Bahn pit; stations: ${[...stationsHere.values()].flat().map((s) => s.name).join(", ")}`);
