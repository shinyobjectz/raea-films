// The 1917 map layers drawn into one view of a sheet: SVG path data per layer in the view's pixels, plus labels,
// underground lines and the Soldner grid (EPSG:3068, the grid of the Straube plan itself). The sheet composition
// imports the JSON this writes.
// usage: bun sheetdata.ts NAME X0 Y0 X1 Y1 METRES_PER_PX OUT.json [--numbers]
import { polygons } from "./raster";

const [name, ...rest] = process.argv.slice(2);
const [X0, Y0, X1, Y1, mpp] = rest.slice(0, 5).map(Number);
const out = rest[5];
const numbers = rest.includes("--numbers");
const map = `${import.meta.dir}/../../map/1917`;
const W = Math.round((X1 - X0) / mpp), H = Math.round((Y1 - Y0) / mpp);
const px = (x: number) => +((x - X0) / mpp).toFixed(1);
const py = (y: number) => +((Y1 - y) / mpp).toFixed(1);
const inView = (b: number[]) => b[2] >= X0 && b[0] <= X1 && b[3] >= Y0 && b[1] <= Y1;

function bbox(coords: any): number[] {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  const walk = (c: any) => {
    if (typeof c[0] === "number") {
      b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]);
    } else c.forEach(walk);
  };
  walk(coords);
  return b;
}

/** Douglas-Peucker in sheet pixels: what the sheet can't show (under 0.4 px) is left out of its paths. */
function simplify(p: number[][], tol = 0.4): number[][] {
  if (p.length < 4) return p;
  const keep = new Uint8Array(p.length);
  keep[0] = keep[p.length - 1] = 1;
  const stack: [number, number][] = [[0, p.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = p[a], [bx, by] = p[b];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let worst = -1, far = 0;
    for (let i = a + 1; i < b; i++) {
      const dist = Math.abs((bx - ax) * (ay - p[i][1]) - (ax - p[i][0]) * (by - ay)) / len;
      if (dist > far) (far = dist), (worst = i);
    }
    if (far > tol) (keep[worst] = 1), stack.push([a, worst], [worst, b]);
  }
  return p.filter((_, i) => keep[i]);
}
const ringArea = (r: number[][]) => Math.abs(r.reduce((s, [x, y], i) => s + x * r[(i + 1) % r.length][1] - r[(i + 1) % r.length][0] * y, 0)) / 2;
const fmt = (v: number) => (mpp >= 1 ? Math.round(v * 2) / 2 : v);

/** Every polygon of a layer that reaches the view, as one path string (even-odd keeps the courtyards open). */
async function area(file: string, keep: (p: any) => boolean = () => true) {
  const gj = await Bun.file(`${map}/${file}`).json();
  let d = "";
  for (const f of gj.features) {
    if (!f.geometry || !keep(f.properties) || !inView(bbox(f.geometry.coordinates))) continue;
    for (const rings of polygons(f.geometry))
      for (const r of rings) {
        // A ring ends where it starts, which gives Douglas-Peucker no baseline: split it at its farthest point.
        const q = r.map(([x, y]: number[]) => [px(x), py(y)]);
        let k = 0;
        for (let i = 1; i < q.length; i++) if (Math.hypot(q[i][0] - q[0][0], q[i][1] - q[0][1]) > Math.hypot(q[k][0] - q[0][0], q[k][1] - q[0][1])) k = i;
        const s = k ? [...simplify(q.slice(0, k + 1)), ...simplify(q.slice(k)).slice(1)] : q;
        if (s.length < 3 || ringArea(s) < 1) continue;
        d += "M" + s.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join("L") + "Z";
      }
  }
  return d;
}

const slice = await Bun.file(`${import.meta.dir}/slice.json`).json();
const coverage = await area(`../../cache/${slice.name}/berlin1900/coverage.json`);
const layers = {
  courtyard: await area("open.geojson", (p) => p.kind === "courtyard"),
  water: await area("water.geojson"),
  green: await area("green.geojson"),
  rail: await area("rail.geojson"),
  building: await area("buildings.geojson", (p) => p.kind !== "public"), // private and commercial
  public: await area("buildings.geojson", (p) => p.kind === "public"),
};

// Names of public buildings, placed at their middle (the first point of the outer ring's centre of mass).
const named: { text: string; x: number; y: number; area: number }[] = [];
for (const f of (await Bun.file(`${map}/buildings.geojson`).json()).features) {
  const p = f.properties;
  if (!p.name || !f.geometry) continue;
  const b = bbox(f.geometry.coordinates);
  if (!inView(b)) continue;
  named.push({ text: p.name.replace(/\s*\(.*?\)\s*/g, ""), x: px((b[0] + b[2]) / 2), y: py((b[1] + b[3]) / 2), area: p.area_m2 });
}

const labels: { kind: string; text: string; x: number; y: number; angle: number }[] = [];
for (const f of (await Bun.file(`${map}/labels.geojson`).json()).features) {
  const p = f.properties, [x, y] = f.geometry.coordinates;
  if (x < X0 || x > X1 || y < Y0 || y > Y1) continue;
  if (p.kind === "house_number" && !numbers) continue;
  labels.push({ kind: p.kind, text: p.text.replace(/\s{2,}/g, " "), x: px(x), y: py(y), angle: -(p.angle ?? 0) });
}

const underground: { name: string; kind: string; status: string; d: string }[] = [];
const stations: { name: string; x: number; y: number }[] = [];
for (const f of (await Bun.file(`${map}/underground.geojson`).json()).features) {
  const p = f.properties, g = f.geometry;
  if (p.feature === "station") {
    stations.push({ name: p.name, x: px(g.coordinates[0]), y: py(g.coordinates[1]) });
    continue;
  }
  const parts = g.type === "LineString" ? [g.coordinates] : g.coordinates;
  underground.push({ name: p.name, kind: p.kind, status: p.status, d: parts.map((l: number[][]) => "M" + l.map(([x, y]) => `${px(x)} ${py(y)}`).join("L")).join("") });
}

// The Soldner grid (EPSG:3068) every 500 m: lines from DuckDB, in this view's pixels.
const grid = Bun.spawnSync([
  "duckdb", "-noheader", "-list", "-c",
  `LOAD spatial; SET geometry_always_xy = true;
   WITH c AS (SELECT ST_Transform(ST_Point(x, y), 'EPSG:25833', 'EPSG:3068', always_xy := true) p FROM (VALUES (${X0}, ${Y0}), (${X1}, ${Y1}), (${X0}, ${Y1}), (${X1}, ${Y0})) v(x, y)),
        b AS (SELECT floor(min(ST_X(p)) / 500) * 500 AS x0, ceil(max(ST_X(p)) / 500) * 500 AS x1, floor(min(ST_Y(p)) / 500) * 500 AS y0, ceil(max(ST_Y(p)) / 500) * 500 AS y1 FROM c),
        l AS (SELECT 'E' AS axis, v AS value, ST_MakeLine(ST_Point(v, y0), ST_Point(v, y1)) g FROM b, range(x0::BIGINT, (x1 + 1)::BIGINT, 500) r(v)
              UNION ALL SELECT 'N', v, ST_MakeLine(ST_Point(x0, v), ST_Point(x1, v)) FROM b, range(y0::BIGINT, (y1 + 1)::BIGINT, 500) r(v))
   SELECT axis || ' ' || value || ' ' || ST_AsText(ST_Transform(g, 'EPSG:3068', 'EPSG:25833', always_xy := true)) FROM l;`,
]).stdout.toString().trim().split("\n").filter(Boolean);
const soldner = grid.map((row) => {
  const [axis, value, ...wkt] = row.split(" ");
  const pts = wkt.join(" ").replace(/^LINESTRING\s*\(/, "").replace(/\)$/, "").split(",").map((s) => s.trim().split(" ").map(Number));
  return { axis, value: Number(value), d: "M" + pts.map(([x, y]) => `${px(x)} ${py(y)}`).join("L") };
});

await Bun.write(out, JSON.stringify({ name, view: { x0: X0, y0: Y0, x1: X1, y1: Y1, mpp, w: W, h: H }, layers, coverage, named, labels, underground, stations, soldner }));
const kb = (s: string) => (s.length / 1024).toFixed(0);
console.log(`${out}: ${W}x${H} px; paths ${Object.entries(layers).map(([k, v]) => `${k} ${kb(v)}k`).join(", ")}; ${named.length} names, ${labels.length} labels, ${underground.length} lines, ${stations.length} stations, ${soldner.length} grid lines`);
