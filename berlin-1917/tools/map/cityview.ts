// The whole city's 1917 graybox in one picture, from the merged layers (city.sh merge: map/1917/city/*.parquet): each
// kind of ground in its own colour at METRES_PER_PX, with the sheets' edges drawn faintly, to check the city at a glance
// (a sheet that came out empty, ground filed under the wrong kind, a seam between sheets).
// usage: bun cityview.ts OUT.png [METRES_PER_PX=5]
import { $ } from "bun";
import { fill, polygons, type Tile } from "./raster";

const [out, m = "5"] = process.argv.slice(2);
const mpp = Number(m);
const city = await Bun.file(`${import.meta.dir}/berlin.json`).json();
const [X0, Y0, X1, Y1] = city.bbox as number[];
const t: Tile = { id: "city", x0: X0, y0: Y0, x1: X1, y1: Y1, mpp };
const W = Math.round((X1 - X0) / mpp), H = Math.round((Y1 - Y0) / mpp);
const dir = process.env.CITY ?? `${import.meta.dir}/../../map/1917/city`; // CITY=DIR draws another set (a test)

// class numbers in paint order (later wins), and their colours
const KINDS: [string, string, [number, number, number]][] = [
  ["open", "kind = 'vacant'", [222, 214, 170]],
  ["open", "kind = 'beyond'", [214, 190, 200]],
  ["open", "kind = 'courtyard'", [196, 178, 150]],
  ["open", "kind = 'street'", [238, 232, 220]],
  ["green", "true", [150, 186, 120]],
  ["rail", "true", [176, 160, 196]],
  ["water", "true", [120, 168, 210]],
  ["buildings", "kind = 'private'", [92, 88, 84]],
  ["buildings", "kind = 'commercial'", [70, 90, 120]],
  ["buildings", "kind = 'public'", [140, 70, 60]],
];
const v = new Uint8Array(W * H);
for (const [i, [layer, where]] of KINDS.entries()) {
  const file = `${dir}/${layer}.parquet`;
  if (!(await Bun.file(file).exists())) continue;
  const sql = `LOAD spatial; COPY (SELECT ST_AsGeoJSON(ST_SimplifyPreserveTopology(geom, ${mpp / 2})) AS g FROM '${file}' WHERE ${where}) TO '/dev/stdout' (FORMAT csv, HEADER false, QUOTE '');`;
  const rows = (await $`duckdb -noheader -c ${sql}`.quiet().text()).split("\n").filter(Boolean);
  for (const r of rows) fill(v, t, polygons(JSON.parse(r)), i + 1);
  console.log(`${layer} ${where}: ${rows.length}`);
}
const rgb = new Uint8Array(W * H * 3).fill(250);
for (let k = 0; k < W * H; k++) if (v[k]) rgb.set(KINDS[v[k] - 1][2], k * 3);
// the sheets' edges (the city.sh grid), faint
const xs = [384400, 385900, 389400, 392900, 396400, 398400], ys = [5814800, 5817300, 5820800, 5824300, 5826800];
for (const x of xs) for (let r = 0; r < H; r++) { const c = Math.min(W - 1, Math.round((x - X0) / mpp)); rgb.set([200, 60, 60], (r * W + c) * 3); }
for (const y of ys) for (let c = 0; c < W; c++) { const r = Math.min(H - 1, Math.round((Y1 - y) / mpp)); rgb.set([200, 60, 60], (r * W + c) * 3); }
const raw = `${out}.rgb`;
await Bun.write(raw, rgb);
await $`magick -size ${W}x${H} -depth 8 rgb:${raw} ${out}`.quiet();
await $`rm ${raw}`.quiet();
console.log(`${out}: ${W}x${H} at ${mpp} m/px`);
