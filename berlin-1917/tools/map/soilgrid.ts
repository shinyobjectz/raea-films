// The soil between the boreholes, as grids the drill and the cut-aways can sample anywhere in the slice: the made
// ground at the top (fill, cellar and topsoil together), the soft organic layers (peat and mud) and the depth where the
// boulder clay (till) is first met. Each cell takes the inverse-distance-squared mean of the nearest holes (K) within
// RADIUS; a cell with no hole that near is null, never filled in. `near_m` says how far the nearest hole is, so a
// reader can tell a measured place from an interpolated one. Till is averaged only over holes deep enough to have
// met it or to rule it out (a hole that stops above the depth is no evidence either way).
// in: map/1917/soil.geojson (soil.ts)   out: map/1917/soil_grid.json {x0, y0, cell, nx, ny, fields: {name: (number|null)[]}}
//   bun soilgrid.ts [SLICE.json] [--cell 25]
import { slicePaths } from "./paths";

const args = process.argv.slice(2);
const slicePath = args.find((a) => a.endsWith(".json")) ?? `${import.meta.dir}/slice.json`;
const CELL = args.includes("--cell") ? +args[args.indexOf("--cell") + 1] : 25, K = 6, RADIUS = 400;
const { map } = await slicePaths(slicePath);
const [X0, Y0, X1, Y1] = (await Bun.file(slicePath).json()).bbox;
const holes = (await Bun.file(`${map}/soil.geojson`).json()).features.filter((f: any) => f.properties.layers.length);

type Hole = { x: number; y: number; fill: number; soft: number; till: number | null; deep: number };
const MADE = new Set(["fill", "cellar", "topsoil"]), SOFT = new Set(["peat", "organic mud"]);
const hs: Hole[] = holes.map((f: any) => {
  const L = f.properties.layers as { top_m: number; base_m: number; class: string }[];
  let fill = 0;
  for (const l of L) { if (MADE.has(l.class) && l.top_m <= fill + 0.01) fill = l.base_m; else if (!MADE.has(l.class)) break; }
  const soft = L.filter((l) => SOFT.has(l.class)).reduce((s, l) => s + (l.base_m - l.top_m), 0);
  const t = L.find((l) => l.class === "till");
  const [x, y] = f.geometry.coordinates;
  return { x, y, fill, soft, till: t ? t.top_m : null, deep: L[L.length - 1].base_m };
});

const nx = Math.ceil((X1 - X0) / CELL), ny = Math.ceil((Y1 - Y0) / CELL);
const fields: Record<string, (number | null)[]> = { fill_m: [], soft_m: [], till_top_m: [], near_m: [] };
const round = (v: number) => Math.round(v * 10) / 10;
for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
  const cx = X0 + (i + 0.5) * CELL, cy = Y1 - (j + 0.5) * CELL; // row 0 is the north edge
  const near = hs.map((h) => ({ h, d: Math.hypot(h.x - cx, h.y - cy) })).filter((n) => n.d <= RADIUS).sort((a, b) => a.d - b.d);
  fields.near_m.push(near.length ? Math.round(near[0].d) : null);
  const idw = (pick: (h: Hole) => number | null) => {
    let s = 0, w = 0;
    for (const { h, d } of near.slice(0, K)) { const v = pick(h); if (v == null) continue; const wt = 1 / Math.max(d, CELL / 2) ** 2; s += v * wt; w += wt; }
    return w ? round(s / w) : null;
  };
  fields.fill_m.push(idw((h) => h.fill));
  fields.soft_m.push(idw((h) => h.soft));
  // Till: a hole that met it gives its depth; one that went deeper without meeting it says "below its bottom" and is
  // left out rather than guessed.
  fields.till_top_m.push(idw((h) => h.till));
}
await Bun.write(`${map}/soil_grid.json`, JSON.stringify({ crs: "EPSG:25833", x0: X0, y0: Y1, cell: CELL, nx, ny, order: "rows north to south, columns west to east",
  source: "map/1917/soil.geojson, inverse-distance-squared over the nearest 6 holes within 400 m; tools/map/soilgrid.ts", fields }));
const stat = (a: (number | null)[]) => { const v = a.filter((x): x is number => x != null).sort((p, q) => p - q); return `${v.length} cells, p10/p50/p90 ${[0.1, 0.5, 0.9].map((q) => v[Math.floor(q * (v.length - 1))]).join(" / ")}`; };
console.log(`soilgrid: ${nx}x${ny} cells of ${CELL} m from ${hs.length} holes (${hs.filter((h) => h.till != null).length} met till)`);
for (const k of ["fill_m", "soft_m", "till_top_m", "near_m"]) console.log(`soilgrid: ${k} ${stat(fields[k])}`);
