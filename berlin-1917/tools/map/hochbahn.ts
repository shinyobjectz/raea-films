// The Hochbahn in the city graybox: the U-Bahn's steel viaducts of 1902-13 and their ramps (map/1917/city/ubahn.geojson,
// the stretches traced off the plan) as one mesh over the tiles, with the stations on a viaduct.
// Sources, for facts only:
// - Siemens & Halske, Festschrift zur Eröffnung der elektrischen Hochbahn, February 1902 (Zentral- und Landesbibliothek
//   Berlin, Public Domain Mark: digital.zlb.de/viewer, PPN 34947903), its pages 3-5 and plates:
//   CLEAR, the clear height prescribed over a street's carriageways, 4.55 m (2.8 m over a central walk, 4.8 m over state
//   railway tracks, 5.85 m over the Ringbahn); the regular spans of 12, 15 (at stations), 16.5 and 21 m, built of 1.5 m
//   panels; DEPTH, the main girders' system depth, 1.7 m (plate "Viadukt, Längsschnitt"); tracks 3.0 m apart; a
//   station's platforms 80 m long (PLATFORM), 3 to 3.5 m wide, roofed for a train's length, about 45 m (ROOFED).
//   Measured off the plates, scaled by their own dimensions (the cross-section by its 2.26 m car, the station by its
//   3.5 m platform): the deck 7.1 m between its railings (WIDTH); a portal frame's two legs splayed, their feet 5.15 to
//   5.32 m apart (FOOT, dimensioned) and their heads about 3.9 m (HEAD); a platform 0.85 m over the rails (UP); the
//   station hall 13.0 m clear (HALL), its eaves about 4.1 m and its ridge about 7.2 m over the platform (EAVES, RIDGE).
//   The plates of photographs show the Oststrecke's halls arched (Prinzenstrasse, with the Englische Gas-Anstalt's
//   holder beside it), so the hall here is a barrel to the plate's heights; the plate's own hall, gabled, is the
//   Weststrecke's.
// - Fischer and Lorenz, "Tragwerksmodellierung eines Stahlviadukts der Linie 1 in Berlin", BTU Cottbus 2002, after
//   Eiselen, Deutsche Bauzeitung 35, 1901: the same spans, cantilevered and suspended girders on portal frames.
// ASSUMED: one rail level over the 1917 ground, CLEAR + DEPTH (the Festschrift's mean platform, 6.6 m over the ground,
// puts the stations' rails about 0.5 m lower: their 15 m spans carry shallower girders); SPAN, the 16.5 m span, between
// stations (which span stands where is not read); a ramp's length (RAMP: a stretch says only which end is tunnel); one
// barrel hall for every station (the halls differed: stone at Schlesisches Tor, a glazed gabled hall at Hallesches Tor,
// gabled on the Weststrecke); TRUSS, a long bridge's trusses 5 m over the deck (the Landwehrkanal bridge as
// photographed, its spired portals left out), on any crossing of water or railway land LONG m or more; a portal's
// knee braces and the stone viaducts' arches left out. No frame stands
// in water or on railway land (both feet there): the bridges there (77 and 65 m over the Landwehrkanal and the Anhalter Bahn, 84 m over
// the Potsdam goods station) are drawn as the same deck.
// The traced line is moved to the middle of the street it runs in (streetmiddle.ts). The rail level follows the 1917
// ground (each sheet's ground1917) as a running mean over SMOOTH m either side.
//   bun hochbahn.ts   out: assets/graybox/city/hochbahn.glb
import { Builder, writeGlb } from "../world/glb";
import { loadGround } from "./groundgrid";
import { slicePaths } from "./paths";
import { fill, polygons } from "./raster";
import { streetMiddle } from "./streetmiddle";
import { stairs } from "./stairs";

const CLEAR = 4.55, DEPTH = 1.7, WIDTH = 7.1, COL = 0.5, SPAN = 16.5, SPAN_STATION = 15, FOOT = 5.2, HEAD = 3.9;
const RAMP = 200, STEP = 2, SMOOTH = 30, TRUSS = 5, LONG = 40;
const PLATFORM = 80, ROOFED = 45, UP = 0.85, PLAT_IN = 3.0, PLAT_OUT = 6.25, HALL = 13.0, EAVES = 4.1, RIDGE = 7.2, ARC = 8;
// across the hall, s m from its middle: the barrel's height over the platform (a parabola from eave to ridge)
const arcS = (k: number) => -HALL / 2 + (HALL * k) / ARC, arcZ = (s: number) => EAVES + (RIDGE - EAVES) * (1 - (s / (HALL / 2)) ** 2);
const root = `${import.meta.dir}/../..`, ORIGIN = [391000, 5819000];
const P = (e: number, n: number, h: number) => [e - ORIGIN[0], h, -(n - ORIGIN[1])];
type V = number[];
const add = (a: V, b: V) => a.map((v, i) => v + b[i]), mul = (a: V, s: number) => a.map((v) => v * s);
const sub = (a: V, b: V) => a.map((v, i) => v - b[i]), unit = (a: V) => mul(a, 1 / (Math.hypot(...a) || 1));
const cross = (a: V, b: V) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// the ground: the sheet whose frame holds the point (the slice and the city sheets tile the plan)
const slices = await Promise.all([`${import.meta.dir}/slice.json`, ...[...new Bun.Glob("*.json").scanSync(`${import.meta.dir}/sheets`)].map((f) => `${import.meta.dir}/sheets/${f}`)].map((p) => slicePaths(p)));
const grounds = new Map<string, (x: number, y: number) => number>();
async function ground(x: number, y: number) {
  const s = slices.find((s) => { const [a, b, c, d] = s.slice.bbox; return x >= a && x < c && y >= b && y < d; });
  if (!s) return NaN;
  if (!grounds.has(s.slice.name)) grounds.set(s.slice.name, await loadGround(s.map, s.own).catch(() => () => NaN));
  return grounds.get(s.slice.name)!(x, y);
}

const lin = (hex: string) => [1, 3, 5].map((i) => Math.round(Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2) * 255)).concat(255);
const STEEL = lin("#4a4c50"), RAMPWALL = lin("#8a7a68"), HALLCOL = lin("#6b6e72"), DECK = lin("#7d756c");
const F = new Builder(0);
/** A quad wound counter-clockwise about its normal n (glTF's front face), whichever way its corners were listed. */
function quad(a: V, b: V, c: V, d: V, n: V, col: V) {
  const g = cross(sub(b, a), sub(c, a));
  if (g[0] * n[0] + g[1] * n[1] + g[2] * n[2] >= 0) F.quad(a, b, c, d, n, col);
  else F.quad(d, c, b, a, n, col);
}
/** A box from a to b (x, y in metres EPSG:25833) of width w, its middle s m left of the line, from z0 to z1 at a and z2
 * to z3 at b. */
function box(a: V, b: V, w: number, [z0, z1]: V, [z2, z3]: V, col: V, s = 0) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = -dy / L, uy = dx / L;
  const c = (p: V, k: number, z: number) => P(p[0] + ux * (s + (k * w) / 2), p[1] + uy * (s + (k * w) / 2), z);
  const al = [c(a, 1, z0), c(a, 1, z1)], ar = [c(a, -1, z0), c(a, -1, z1)], bl = [c(b, 1, z2), c(b, 1, z3)], br = [c(b, -1, z2), c(b, -1, z3)];
  quad(al[1], bl[1], br[1], ar[1], [0, 1, 0], col); // top
  quad(ar[0], br[0], bl[0], al[0], [0, -1, 0], col); // bottom
  quad(al[0], bl[0], bl[1], al[1], unit([ux, 0, -uy]), col); // left side
  quad(br[0], ar[0], ar[1], br[1], unit([-ux, 0, uy]), col); // right side
  quad(ar[0], al[0], al[1], ar[1], unit([-dx, 0, dy]), col); // a end
  quad(bl[0], br[0], br[1], bl[1], unit([dx, 0, -dy]), col); // b end
}
/** A leg w m square from f to h (both in the mesh's frame), its faces square to t (the line's direction there). */
function leg(f: V, h: V, t: V, w: number, col: V) {
  const n = unit(cross(t, sub(h, f))), a = mul(t, w / 2), b = mul(n, w / 2);
  const ring = (o: V) => [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([i, j]) => add(add(o, mul(a, i)), mul(b, j)));
  const A = ring(f), B = ring(h), mid = mul(add(f, h), 0.5);
  for (let k = 0; k < 4; k++) {
    const k1 = (k + 1) % 4, out = unit(sub(mul(add(add(A[k], A[k1]), add(B[k], B[k1])), 0.25), mid));
    quad(A[k], A[k1], B[k1], B[k], out, col);
  }
  quad(A[0], A[1], A[2], A[3], unit(sub(f, h)), col);
  quad(B[0], B[1], B[2], B[3], unit(sub(h, f)), col);
}

const fc = await Bun.file(`${root}/map/1917/city/ubahn.geojson`).json();
// The stretches run station to station, and the plan's station point can sit metres off the line, so each viaduct
// stretch bends into it: viaduct stretches meeting end to end (two at a point, not a junction) are chained into one line,
// and a sample more than KINK m off the chord between the samples CHORD/2 m either side is put back between the nearest
// samples that are not (the line's least radius, 80 m, bows 1.4 m over such a chord).
const KINK = 3, CHORD = 32;
const raw0 = fc.features.filter((f: any) => f.properties.feature === "stretch" && ["viaduct", "ramp"].includes(f.properties.kind));
const key = (p: number[]) => `${Math.round(p[0])} ${Math.round(p[1])}`;
const ends = new Map<string, number>();
for (const f of raw0) for (const p of [f.geometry.coordinates[0], f.geometry.coordinates.at(-1)]) ends.set(key(p), (ends.get(key(p)) ?? 0) + 1);
let chain = raw0.map((f: any) => ({ ...f, geometry: { ...f.geometry, coordinates: [...f.geometry.coordinates] } }));
for (let joined = true; joined; ) {
  joined = false;
  for (let a = 0; a < chain.length && !joined; a++) for (let b = 0; b < chain.length && !joined; b++) {
    const A = chain[a], B = chain[b];
    if (a === b || A.properties.kind !== "viaduct" || B.properties.kind !== "viaduct") continue;
    const ac = A.geometry.coordinates, bc = B.geometry.coordinates, e = key(ac.at(-1));
    if (ends.get(e) !== 2) continue;
    const next = key(bc[0]) === e ? bc : key(bc.at(-1)) === e ? [...bc].reverse() : null;
    if (!next) continue;
    A.geometry.coordinates = [...ac, ...next.slice(1)];
    chain.splice(b, 1), (joined = true);
  }
}
// a ramp joins the viaduct it rises to where only the two meet (the plan's stretches run station to station, so a ramp
// and its viaduct meet at the station point, each bending into it: one line, despiked through it), its length kept as
// the line's ramp_start or ramp_end
const len = (c: number[][]) => c.reduce((t, p, i) => (i ? t + Math.hypot(p[0] - c[i - 1][0], p[1] - c[i - 1][1]) : 0), 0);
for (let joined = true; joined; ) {
  joined = false;
  for (let a = 0; a < chain.length && !joined; a++) for (let b = 0; b < chain.length && !joined; b++) {
    const R = chain[a], V = chain[b];
    if (a === b || R.properties.kind !== "ramp" || V.properties.kind !== "viaduct") continue;
    const rc = R.properties.to_level === "viaduct" ? R.geometry.coordinates : [...R.geometry.coordinates].reverse(), e = key(rc.at(-1)); // its viaduct end last
    if (ends.get(e) !== 2) continue;
    const vc = V.geometry.coordinates, q = V.properties;
    if (key(vc[0]) === e && !q.ramp_start) (V.geometry.coordinates = [...rc, ...vc.slice(1)]), (V.properties = { ...q, ramp_start: len(rc) });
    else if (key(vc.at(-1)) === e && !q.ramp_end) (V.geometry.coordinates = [...vc, ...[...rc].reverse().slice(1)]), (V.properties = { ...q, ramp_end: len(rc) });
    else continue;
    chain.splice(a, 1), (joined = true);
  }
}
const stretches = chain;
function despike(pts: number[][]) {
  const k = Math.round(CHORD / 2 / STEP);
  for (let pass = 0; pass < 3; pass++) {
    const bad = pts.map((p, i) => {
      if (i < k || i + k >= pts.length) return false;
      const a = pts[i - k], b = pts[i + k], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return Math.abs(((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / L) > KINK;
    });
    if (!bad.some(Boolean)) return pts;
    for (let i = 0; i < pts.length; i++) {
      if (!bad[i]) continue;
      let j = i;
      while (j < pts.length && bad[j]) j++;
      const a = pts[i - 1], b = pts[Math.min(j, pts.length - 1)];
      for (let m = i; m < j; m++) { const t = (m - i + 1) / (j - i + 1); pts[m] = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
      i = j;
    }
  }
  return pts;
}
// samples every STEP m along each stretch, then moved to the middle of their street
const sampled = stretches.map((f: any) => {
  const raw: number[][] = f.geometry.coordinates, pts: number[][] = [];
  for (let i = 0; i + 1 < raw.length; i++) {
    const [ax, ay] = raw[i], [bx, by] = raw[i + 1], L = Math.hypot(bx - ax, by - ay);
    for (let s = 0; s < L; s += STEP) pts.push([ax + ((bx - ax) * s) / L, ay + ((by - ay) * s) / L]);
  }
  pts.push(raw[raw.length - 1]);
  return despike(pts);
});
const middle = await streetMiddle(sampled, slices.map((s) => ({ bbox: s.slice.bbox, walls: [`${s.map}/buildings.geojson`], water: [`${s.map}/water.geojson`] })), STEP);

// where no frame stands: water and railway land, every sheet the line crosses, at 1 m
const all = middle.lines.flat(), M = 20;
const X0 = Math.min(...all.map((p) => p[0])) - M, Y0 = Math.min(...all.map((p) => p[1])) - M;
const W = Math.ceil(Math.max(...all.map((p) => p[0])) + M - X0), H = Math.ceil(Math.max(...all.map((p) => p[1])) + M - Y0);
const tile = { id: "feet", x0: X0, y0: Y0, x1: X0 + W, y1: Y0 + H, mpp: 1 }, held = new Uint8Array(W * H);
for (const s of slices) for (const [k, val] of [["water", 1], ["rail", 2]] as const) {
  const f = Bun.file(`${s.map}/${k}.geojson`);
  if (await f.exists()) fill(held, tile, ((await f.json()).features as any[]).flatMap((x) => polygons(x.geometry)), val);
}
const heldAt = (x: number, y: number) => { const u = Math.floor(x - X0), v = Math.floor(tile.y1 - y); return u >= 0 && v >= 0 && u < W && v < H ? held[v * W + u] : 0; };
const footFree = (x: number, y: number) => !heldAt(x, y);

// each stretch: its ground, rail level and how far up it is (a ramp's share of full height)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lines = await Promise.all(stretches.map(async (f: any, si: number) => {
  const p = f.properties, pts = middle.lines[si], n = pts.length;
  const g = await Promise.all(pts.map(([x, y]) => ground(x, y)));
  const k = Math.round(SMOOTH / STEP);
  const level = g.map((_, i) => { const w = g.slice(Math.max(0, i - k), i + k + 1).filter((v) => !Number.isNaN(v)); return w.length ? w.reduce((a, b) => a + b, 0) / w.length : NaN; });
  // 1 on the viaduct end, falling to 0 over RAMP m towards its tunnel end (a ramp of its own, or one joined to a viaduct)
  const rampAt = Math.round(RAMP / STEP), rs = Math.round((p.ramp_start ?? 0) / STEP), re = Math.round((p.ramp_end ?? 0) / STEP);
  const up = pts.map((_, i) => p.kind === "ramp" ? (p.to_level === "viaduct" ? clamp01((i - (n - 1 - rampAt)) / rampAt) : clamp01((rampAt - i) / rampAt))
    : Math.min(rs ? clamp01((i - (rs - rampAt)) / rampAt) : 1, re ? clamp01((n - 1 - i - (re - rampAt)) / rampAt) : 1));
  return { pts, g, level, rail: level.map((l, i) => l + (CLEAR + DEPTH) * up[i]), up, station: new Uint8Array(n) };
}));
// stations open in winter 1917-18 standing on a viaduct (within 20 m of one, at full height)
const open1917 = (p: any) => String(p.opened || "0000") <= "1917-12" && String(p.closed || "9999") > "1918"; // an empty closed is still open
const halls: { l: (typeof lines)[number]; i: number; name: string }[] = [], placed: string[] = [];
for (const s of fc.features.filter((f: any) => f.properties.feature === "station" && open1917(f.properties))) {
  const [x, y] = s.geometry.coordinates;
  let best: { l: (typeof lines)[number]; i: number; d: number } | null = null;
  for (const l of lines) l.pts.forEach((q, i) => { const d = Math.hypot(q[0] - x, q[1] - y); if (d < 20 && (!best || d < best.d) && l.up[i] === 1 && !Number.isNaN(l.rail[i])) best = { l, i, d }; });
  if (!best) continue;
  const { l, i } = best as { l: (typeof lines)[number]; i: number }, h = Math.round(PLATFORM / 2 / STEP);
  for (let j = Math.max(0, i - h); j <= Math.min(l.pts.length - 1, i + h); j++) l.station[j] = 1;
  halls.push({ l, i, name: s.properties.name });
  const [px, , pz] = P(l.pts[i][0], l.pts[i][1], 0);
  placed.push(`${s.properties.name} ${Math.round(px)} ${(l.rail[i] + UP).toFixed(1)} ${Math.round(pz)}`);
}

// a station stands at full height, and a ramp beside it begins beyond its platform (Prometheus 1902: Nollendorfplatz's
// ramp into the tunnel begins in front of its domed hall), where the plan's stretches put the ramp's top at the
// station point
for (const l of lines) {
  const rampAt = Math.round(RAMP / STEP), n = l.pts.length, was = [...l.up];
  const set = (j: number, u: number) => { if (u > l.up[j]) (l.up[j] = u), (l.rail[j] = l.level[j] + (CLEAR + DEPTH) * u); };
  for (let a = 0; a < n; a++) {
    if (!l.station[a]) continue;
    let b = a;
    while (b + 1 < n && l.station[b + 1]) b++;
    const low = (j: number) => j >= 0 && j < n && was[j] < 1;
    const before = low(a - 1) || was.slice(a, b + 1).some((u, k) => u < 1 && a + k < (a + b) / 2);
    const after = low(b + 1) || was.slice(a, b + 1).some((u, k) => u < 1 && a + k > (a + b) / 2);
    if (before || after) for (let j = a; j <= b; j++) set(j, 1);
    if (before) for (let j = a - 1; j >= Math.max(0, a - rampAt); j--) set(j, clamp01((j - (a - rampAt)) / rampAt));
    if (after) for (let j = b + 1; j <= Math.min(n - 1, b + rampAt); j++) set(j, clamp01((b + rampAt - j) / rampAt));
    a = b;
  }
}
// the line as drawn, where it stands above the ground (a ramp's raised part included), for bands.sh: the band it clears
// of the plan's misread viaduct is the one the viaduct stands on, not the traced line along a kerb
const drawn: number[][][] = [];
for (const l of lines) {
  let run: number[][] = [];
  l.pts.forEach((q, i) => { if (l.up[i] > 0) run.push([+q[0].toFixed(2), +q[1].toFixed(2)]); else { if (run.length > 1) drawn.push(run); run = []; } });
  if (run.length > 1) drawn.push(run);
}
await Bun.write(`${root}/map/1917/city/hochbahn.geojson`, JSON.stringify({ type: "FeatureCollection", crs: { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::25833" } },
  features: drawn.map((c) => ({ type: "Feature", properties: { feature: "drawn" }, geometry: { type: "LineString", coordinates: c } })) }) + "\n");


let metres = 0, frames = 0, skipped = 0, bridges = 0;
const crossings: string[] = [];
for (const { pts, g, rail, up, station } of lines) {
  // a long crossing: a run of full-height samples LONG m or more over railway land (the line itself: the plan draws a
  // yard's tracks as strips with ground between) or over water (both feet: along the Landwehrkanal's bank the traced
  // water reaches under the line, whose frames stood on the quay)
  const over = pts.map(([x, y], i) => {
    if (up[i] < 1 || i + 1 >= pts.length) return false;
    const [bx, by] = pts[i + 1], L = Math.hypot(bx - x, by - y) || 1, tx = (bx - x) / L, ty = (by - y) / L;
    return heldAt(x, y) === 2 || [1, -1].every((s) => !footFree(x - ty * s * (FOOT / 2), y + tx * s * (FOOT / 2)));
  });
  for (let i = 0; i < pts.length; ) {
    let j = i;
    while (j < pts.length && over[j]) j++;
    if ((j - i) * STEP >= LONG) {
      bridges++;
      const m = pts[(i + j) >> 1];
      crossings.push(`${(j - i) * STEP} m at ${Math.round(m[0])} ${Math.round(m[1])}`);
      for (let k = i; k < j && k + 1 < pts.length; k++) for (const s of [1, -1]) box(pts[k], pts[k + 1], 0.4, [rail[k], rail[k] + TRUSS], [rail[k + 1], rail[k + 1] + TRUSS], STEEL, s * (WIDTH / 2 - 0.2));
    }
    i = j + 1;
  }
  let since = SPAN; // a frame at a stretch's first full-height sample
  for (let i = 0; i + 1 < pts.length; i++) {
    if (Number.isNaN(rail[i]) || Number.isNaN(rail[i + 1]) || (up[i] === 0 && up[i + 1] === 0)) continue;
    metres += STEP;
    if (up[i] < 1 || up[i + 1] < 1) { box(pts[i], pts[i + 1], WIDTH, [g[i], rail[i]], [g[i + 1], rail[i + 1]], RAMPWALL); since = SPAN; continue; } // a ramp: walled, filled
    box(pts[i], pts[i + 1], WIDTH, [rail[i] - DEPTH, rail[i]], [rail[i + 1] - DEPTH, rail[i + 1]], STEEL);
    // a portal frame every span: two legs from the street, splayed, to the girders
    if ((since += STEP) < (station[i] ? SPAN_STATION : SPAN)) continue;
    since = 0;
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay) || 1, tx = (bx - ax) / L, ty = (by - ay) / L;
    const feet = [1, -1].map((s) => [ax - ty * s * (FOOT / 2), ay + tx * s * (FOOT / 2)]);
    if (!feet.some(([x, y]) => footFree(x, y))) { skipped++; continue; } // one foot in the water is the trace's error: along the Landwehrkanal the frames stood on the quay
    for (const [s, [fx, fy]] of [1, -1].map((s, k) => [s, feet[k]] as [number, number[]])) {
      const hx = ax - ty * s * (HEAD / 2), hy = ay + tx * s * (HEAD / 2);
      leg(P(fx, fy, g[i] - 0.3), P(hx, hy, rail[i] - DEPTH), [tx, 0, -ty], COL, STEEL);
    }
    frames++;
  }
}
// a station: a platform PLATFORM m long either side of the tracks on its consoles, and a hall over the middle ROOFED m
for (const { l, i } of halls) {
  const h = Math.round(PLATFORM / 2 / STEP), r = Math.round(ROOFED / 2 / STEP), pf = l.rail[i] + UP;
  for (let j = Math.max(0, i - h); j < Math.min(l.pts.length - 1, i + h); j++) {
    const a = l.pts[j], b = l.pts[j + 1];
    for (const s of [1, -1]) box(a, b, PLAT_OUT - PLAT_IN, [pf - 0.4, pf], [pf - 0.4, pf], DECK, (s * (PLAT_IN + PLAT_OUT)) / 2);
    if (j < i - r || j >= i + r) continue;
    for (const s of [1, -1]) box(a, b, 0.3, [pf, pf + EAVES], [pf, pf + EAVES], HALLCOL, s * (HALL / 2));
    // the roof: a barrel from eave to eave, RIDGE over the platform at the tracks
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = -dy / L, uy = dx / L;
    const at = (p: V, s: number, z: number) => P(p[0] + ux * s, p[1] + uy * s, z);
    for (let k = 0; k < ARC; k++) {
      const s0 = arcS(k), s1 = arcS(k + 1), m = (s0 + s1) / 2, slope = (-2 * (RIDGE - EAVES) * (2 * m)) / (HALL / 2) ** 2 / 2;
      const n = unit([-ux * slope, 1, uy * slope]);
      const ring = [at(a, s0, pf + arcZ(s0)), at(b, s0, pf + arcZ(s0)), at(b, s1, pf + arcZ(s1)), at(a, s1, pf + arcZ(s1))] as [V, V, V, V];
      quad(...ring, n, HALLCOL);
      quad(...ring, mul(n, -1), HALLCOL); // the barrel seen from the platform and the street below
    }
  }
  // the barrel's ends, glazed over the open ends of the hall
  for (const [j, k] of [[Math.max(0, i - r), 1], [Math.min(l.pts.length - 1, i + r), -1]]) {
    const a = l.pts[j], b = l.pts[Math.min(l.pts.length - 1, Math.max(0, j + k))], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = -dy / L, uy = dx / L;
    const at = (s: number, z: number) => P(a[0] + ux * s, a[1] + uy * s, z), c = at(0, pf + EAVES);
    for (let q = 0; q < ARC; q++) quad(c, at(arcS(q), pf + arcZ(arcS(q))), at(arcS(q + 1), pf + arcZ(arcS(q + 1))), at(arcS(q + 1), pf + arcZ(arcS(q + 1))), unit([-dx, 0, dy]), HALLCOL);
  }
}
// the stations' stairs, and the covered bridges to stair houses beside them (stairs.ts)
const access = await stairs(halls, slices.map((s) => ({ bbox: s.slice.bbox, map: s.map })), box, { step: DECK, wall: HALLCOL }, { PLATFORM, STEP, UP, PLAT_IN, PLAT_OUT, CLEAR, DEPTH });
const part = F.part();
if (!part) throw new Error("hochbahn: nothing built");
await Bun.write(`${root}/assets/graybox/city/hochbahn.glb`, writeGlb([{ name: "hochbahn", parts: [part] }], [{ name: "hochbahn", color: [1, 1, 1, 1], roughness: 0.7 }]));
console.log(`${raw0.length} stretches chained into ${stretches.length} lines`);
console.log(middle.report);
console.log(`trussed: ${crossings.join("; ")}`);
console.log(`stations (mesh x, platform y, z): ${placed.join("; ")}`);
console.log(`stairs: ${access.join("; ")}`);
console.log(`hochbahn: ${stretches.length} stretches, ${(metres / 1000).toFixed(1)} km drawn, ${frames} portal frames (${skipped} left out over water or rail), ${bridges} trussed crossings, ${halls.length} stations, ${part.indices.length / 3} tris`);
