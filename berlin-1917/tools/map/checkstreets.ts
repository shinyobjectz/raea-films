// Street or courtyard, checked against OpenHistoricalMap: a point every 20 m along each named street centreline
// valid in 1917 (CC0) that falls on open ground must fall on kind street, not courtyard. Before 11-17 the split
// was by piece size and most courtyards came out as street; the reverse failure (a street read as courtyard) is
// what this catches.
// Raster of open.geojson at 0.5 m over the slice.
// usage: bun checkstreets.ts [SLICE.json]   (one line per figure; the last says pass or fail at MIN)
import { slicePaths } from "./paths";
import { fill, polygons } from "./raster";
import { utm } from "./utm";

const { slice, own: cache, map } = await slicePaths(process.argv[2] ?? `${import.meta.dir}/slice.json`);
const [X0, Y0, X1, Y1] = slice.bbox as number[];
const MPP = 0.5, W = Math.round((X1 - X0) / MPP), H = Math.round((Y1 - Y0) / MPP), MIN = 0.95;
const t = { id: slice.name, x0: X0, y0: Y0, x1: X1, y1: Y1, mpp: MPP };
const r = new Uint8Array(W * H);
const open = (await Bun.file(`${map}/open.geojson`).json()).features;
fill(r, t, open.filter((f: any) => f.properties.kind === "street").flatMap((f: any) => polygons(f.geometry)), 1);
fill(r, t, open.filter((f: any) => f.properties.kind === "courtyard").flatMap((f: any) => polygons(f.geometry)), 2);
// a courtyard outside.sh made (a block of today's city structure beyond the plan) counted apart from the plan's own
fill(r, t, open.filter((f: any) => f.properties.kind === "courtyard" && f.properties.source === "outside").flatMap((f: any) => polygons(f.geometry)), 3);
const at = (x: number, y: number) => {
  const u = Math.floor((x - X0) / MPP), v = Math.floor((Y1 - y) / MPP);
  return u < 0 || v < 0 || u >= W || v >= H ? -1 : r[v * W + u];
};

const year = (d: string | undefined, dflt: string) => (d ?? dflt).slice(0, 4);
if (!(await Bun.file(`${cache}/ohm.json`).exists())) {
  console.log(`checkstreets: ${slice.name}: no OHM download (fetch.sh ohm), nothing to check`);
  process.exit(0);
}
const ways = (await Bun.file(`${cache}/ohm.json`).json()).elements.filter(
  (e: any) => e.type === "way" && e.tags?.highway && e.tags?.name && e.geometry && year(e.tags.start_date, "0000") <= "1917" && year(e.tags.end_date, "9999") > "1917",
);
const n = [0, 0, 0, 0];
for (const w of ways) {
  const pts = w.geometry.map((p: any) => utm(p.lon, p.lat));
  let carry = 10;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay);
    for (let s = carry; s < L; s += 20) { const c = at(ax + ((bx - ax) * s) / L, ay + ((by - ay) * s) / L); if (c >= 0) n[c]++, c === 3 && n[2]++; }
    carry = (carry - L) % 20;
    if (carry < 0) carry += 20;
  }
}
const share = n[1] / Math.max(1, n[1] + n[2]), none = n[1] + n[2] === 0;
console.log(`OHM 1917 street centrelines, a point every 20 m: ${n[1]} on street, ${n[2]} on courtyard (${n[3]} of them beyond the plan), ${n[0]} elsewhere (built, water, park, rail); street share of open ${share.toFixed(3)}, ${none ? "no OHM street on open ground (nothing to check)" : share >= MIN ? "pass" : "FAIL"} (at least ${MIN})`);
