// Drafts a street's config for place.ts (streets/NAME.json). The axis is a straight line fitted to the street's
// OpenHistoricalMap ways standing in 1917 inside the slice, refitted without the points more than 2.5 m off it, so a
// street that bends at one end (Wilhelmstraße into Belle-Alliance-Platz) is fitted on its straight part and the bend
// falls outside s0..s1. Where OHM has only a stub of the street (Unter den Linden: 222 m), --numbers fits the line
// to the 1900 map's house numbers instead: one direction for both sides, the axis midway between them. Station 0 is
// the crossing with ORIGIN; --flip turns u round (u should point the way the first side's numbers rise). Every other
// 1917 street that meets the line is a corner at its station. The 1900 numbers near the axis are printed by side, so
// the direction and first side can be checked before the config is written. Corners OHM lacks (a square, a church,
// a bridge) are added by hand from a source.
// --through X0,Y0,X1,Y1 (with --why "source") sets the line through two known points on the street's middle instead.
//   bun axis.ts "Wilhelmstraße" "Leipziger Straße" [--numbers | --through X0,Y0,X1,Y1 --why S] [--flip] [--reach 30] [--s0 S] [--s1 S]
import { utm } from "../map/utm.ts";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, "../..");
const argv = process.argv.slice(2), [name, origin] = argv;
const opt = (k: string) => (argv.includes(k) ? +argv[argv.indexOf(k) + 1] : undefined);
const REACH = opt("--reach") ?? 30, TOL = 2.5;
const [X0, Y0, X1, Y1] = (await Bun.file(join(here, "../map/slice.json")).json()).bbox;
const year = (d?: string) => (d ? +d.slice(0, 4) : null);
const standing = (t: Record<string, string>) => (year(t.start_date) ?? 0) <= 1917 && (year(t.end_date) ?? 9999) >= 1918;
const ways: { name: string; pts: number[][] }[] = (await Bun.file(join(root, "cache/friedrichstadt/ohm.json")).json()).elements
  .filter((e: any) => e.type === "way" && e.tags?.name && e.tags.highway && e.geometry && standing(e.tags))
  .map((e: any) => ({ name: e.tags.name, pts: e.geometry.map((g: any) => utm(g.lon, g.lat)) }));
const labels = (await Bun.file(join(root, "map/1917/labels.geojson")).json()).features
  .filter((l: any) => l.properties.kind === "house_number" && /^\d+$/.test(l.properties.text))
  .map((l: any) => ({ p: l.geometry.coordinates as number[], v: +l.properties.text }));
const inside = (p: number[]) => p[0] >= X0 && p[0] <= X1 && p[1] >= Y0 && p[1] <= Y1;

type Line = { c: number[]; u: number[] };
const nOf = (u: number[]) => [-u[1], u[0]];
const st = (L: Line, p: number[]) => (p[0] - L.c[0]) * L.u[0] + (p[1] - L.c[1]) * L.u[1];
const off = (L: Line, p: number[]) => (p[0] - L.c[0]) * nOf(L.u)[0] + (p[1] - L.c[1]) * nOf(L.u)[1];
/** Principal direction through the points' mean, kept pointing the way `prev` did. */
function pca(ps: number[][], prev?: number[]): Line {
  const c = [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length];
  let sxx = 0, sxy = 0, syy = 0;
  for (const [x, y] of ps) { sxx += (x - c[0]) ** 2; sxy += (x - c[0]) * (y - c[1]); syy += (y - c[1]) ** 2; }
  const th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  let u = [Math.cos(th), Math.sin(th)];
  if (prev && u[0] * prev[0] + u[1] * prev[1] < 0) u = [-u[0], -u[1]];
  return { c, u };
}

// The street's own points, every metre along its 1917 ways inside the slice.
const pts: number[][] = [];
for (const w of ways.filter((w) => w.name === name)) for (let i = 0; i + 1 < w.pts.length; i++) {
  const [a, b] = [w.pts[i], w.pts[i + 1]], k = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])));
  for (let j = 0; j <= k; j++) { const p = [a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k]; if (inside(p)) pts.push(p); }
}
if (!pts.length) throw new Error(`no way named ${name} standing in 1917 in the slice`);
let L = pca(pts), used = pts;
for (let it = 0; it < 8; it++) {
  const keep = pts.filter((p) => Math.abs(off(L, p)) <= TOL);
  if (keep.length === used.length || keep.length < 20) break;
  used = keep; L = pca(used, L.u);
}
let how = `OHM's ${name} standing in 1917 (${used.length} of ${pts.length} points every metre within ${TOL} m)`;
let ext = used.map((p) => st(L, p));
if (argv.includes("--numbers")) {
  // Both sides' numbers near the OHM line, each side centred on its own mean offset, one direction for both.
  const near = labels.filter((l: any) => Math.abs(off(L, l.p)) < 45 && Math.abs(off(L, l.p)) > 4);
  for (let it = 0; it < 6; it++) {
    const sides = [near.filter((l: any) => off(L, l.p) > 0), near.filter((l: any) => off(L, l.p) < 0)];
    const mean = sides.map((s) => s.reduce((a: number, l: any) => a + off(L, l.p), 0) / s.length);
    const shifted = sides.flatMap((s, i) => s.map((l: any) => [l.p[0] - nOf(L.u)[0] * mean[i], l.p[1] - nOf(L.u)[1] * mean[i]]));
    L = pca(shifted, L.u);
    const mid = (mean[0] + mean[1]) / 2;
    L = { c: [L.c[0], L.c[1]], u: L.u };
    ext = near.map((l: any) => st(L, l.p));
    how = `the 1900 map's house numbers on both sides (${sides[0].length} left, ${sides[1].length} right, the axis midway; started from OHM's ${name})`;
    if (Math.abs(mid) < 0.05) break;
  }
}
if (argv.includes("--through")) {
  // Two points the street's middle is known to pass, given with where they come from (--why).
  const [x0, y0, x1, y1] = argv[argv.indexOf("--through") + 1].split(",").map(Number), len = Math.hypot(x1 - x0, y1 - y0);
  L = { c: [x0, y0], u: [(x1 - x0) / len, (y1 - y0) / len] };
  ext = [0, len];
  how = `the line through (${x0}, ${y0}) and (${x1}, ${y1}): ${argv.includes("--why") ? argv[argv.indexOf("--why") + 1] : "two points on its middle"}`;
}
if (argv.includes("--flip")) L = { c: L.c, u: [-L.u[0], -L.u[1]] };

function meets(Lx: Line) {
  const out: { name: string; s: number }[] = [];
  for (const w of ways) {
    if (w.name === name) continue;
    for (let i = 0; i + 1 < w.pts.length; i++) {
      const [p, q] = [w.pts[i], w.pts[i + 1]], dp = off(Lx, p), dq = off(Lx, q);
      if (dp * dq <= 0 && dp !== dq) { const t = dp / (dp - dq); out.push({ name: w.name, s: st(Lx, [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]) }); }
    }
    for (const e of [w.pts[0], w.pts[w.pts.length - 1]]) if (Math.abs(off(Lx, e)) < 20) out.push({ name: w.name, s: st(Lx, e) });
  }
  return out;
}
const lo0 = Math.min(...ext.map((s) => (argv.includes("--flip") ? -s : s))), hi0 = Math.max(...ext.map((s) => (argv.includes("--flip") ? -s : s)));
const o = meets(L).filter((m) => m.name === origin && m.s > lo0 - 60 && m.s < hi0 + 60);
if (!o.length) throw new Error(`${origin} does not meet ${name}; it meets ${[...new Set(meets(L).map((m) => m.name))].join(", ")}`);
const A: Line = { c: [L.c[0] + L.u[0] * o[0].s, L.c[1] + L.u[1] * o[0].s], u: L.u };
const s0 = opt("--s0") ?? Math.floor(lo0 - o[0].s), s1 = opt("--s1") ?? Math.ceil(hi0 - o[0].s);
const corners: Record<string, number> = {};
for (const m of meets(A).filter((m) => m.s > s0 - 15 && m.s < s1 + 15).sort((p, q) => p.s - q.s))
  if (!Object.entries(corners).some(([k, v]) => k.startsWith(m.name) && Math.abs(v - m.s) < 25)) corners[corners[m.name] !== undefined ? `${m.name} (${Math.round(m.s)})` : m.name] = Math.round(m.s);

const r = (v: number) => Math.round(v * 100) / 100, r5 = (v: number) => Math.round(v * 1e5) / 1e5;
console.log(JSON.stringify({ street: name, axis: { a: A.c.map(r), u: A.u.map(r5), s0, s1,
  source: `fitted to ${how}; stations in metres from its crossing with ${origin}, rising along u` }, corners }, null, 1));
const by: Record<string, [number, number][]> = { left: [], right: [] };
for (const l of labels) { const s = st(A, l.p), d = off(A, l.p); if (Math.abs(d) < REACH && s > s0 && s < s1) by[d > 0 ? "left" : "right"].push([Math.round(s), l.v]); }
for (const k of ["right", "left"]) console.log(`${k}: ${by[k].sort((p, q) => p[0] - q[0]).map(([s, v]) => `${v}@${s}`).join(" ")}`);
