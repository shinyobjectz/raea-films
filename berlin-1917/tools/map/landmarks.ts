// The slice's towers, domes and spires of 1917 (research/landmarks-1917.tsv: each one's height from its own records,
// with the source) set on the map. Each row becomes a point on the tall part's axis with its height above the street,
// and the 1917 building it stands on is marked with it. Where the landmark stands today in its 1917 form, today's
// measured model (LoD2, lod2.ts) gives the axis (its tallest solid on the 1917 building or within REACH m of the
// row's point) and a check on the height; LoD2
// fits standard roof shapes, so a spire's tip comes out short and the recorded height is kept. A row with no recorded
// height takes LoD2's only when it stands as in 1917; otherwise it stays unknown.
//   in:  research/landmarks-1917.tsv and landmarks-city-1917.tsv (rows in the slice's frame), map/1917/buildings.geojson, cache/lod2/units.json (if there), the 1917 ground
//   out: map/1917/landmarks.geojson; buildings.geojson in place: landmark, landmark_top_m on the building under each
//   bun landmarks.ts [SLICE.json]      (after heights.ts; rerunnable)
import { loadGround } from "./groundgrid";
import { slicePaths } from "./paths";
import { polygons } from "./raster";

const slicePath = process.argv.slice(2).find((a) => a.endsWith(".json")) ?? `${import.meta.dir}/slice.json`;
const { slice, own: cache, map } = await slicePaths(slicePath); // a sheet's own cache holds its ground
const REACH = 40, INSET = 8, NEAR = 20, TOWER = 0.6;
const g = await loadGround(map, cache);
// The slice's table and the city's (landmarks-city-1917.tsv), each row kept where it stands in this slice's frame.
const [BX0, BY0, BX1, BY1] = slice.bbox as number[];
const recs: Record<string, string>[] = [];
for (const t of ["landmarks-1917.tsv", "landmarks-city-1917.tsv"]) {
  const lines = (await Bun.file(`${import.meta.dir}/../../research/${t}`).text()).split("\n").filter((l) => l && !l.startsWith("#"));
  const head = lines.shift()!.split("\t");
  for (const l of lines) { const r = Object.fromEntries(l.split("\t").map((v, i) => [head[i], v])); if (+r.x >= BX0 && +r.x < BX1 && +r.y >= BY0 && +r.y < BY1) recs.push(r); }
}
const file = `${map}/buildings.geojson`, fc = await Bun.file(file).json();
const blds = fc.features as any[];
for (const f of blds) delete f.properties.landmark, delete f.properties.landmark_top_m;
const unitsFile = Bun.file(`${import.meta.dir}/../../cache/lod2/units.json`);
const units: any[] = (await unitsFile.exists()) ? await unitsFile.json() : [];

const inside = (rs: number[][][], x: number, y: number) => { let c = false; for (const r of rs) for (let i = 0, j = r.length - 1; i < r.length; j = i++) if (r[i][1] > y !== r[j][1] > y && x < ((r[j][0] - r[i][0]) * (y - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };
const centroid = (r: number[][]) => r.reduce((s, p) => [s[0] + p[0] / r.length, s[1] + p[1] / r.length], [0, 0]);
/** The 1917 building under a point, or the one with a corner nearest it within NEAR m. */
function buildingAt(x: number, y: number) {
  const hit = blds.find((f) => polygons(f.geometry).some((p) => inside(p, x, y)));
  if (hit) return hit;
  let best: any = null, bd = NEAR;
  for (const f of blds) for (const p of polygons(f.geometry)) for (const [a, b] of p[0]) { const d = Math.hypot(a - x, b - y); if (d < bd) (bd = d), (best = f); }
  return best;
}

const out: any[] = [], checks: string[] = [];
for (const r of recs) {
  let x = +r.x, y = +r.y, lod2: any = null, axisFrom = r.axis === "point" ? "row" : `${r.axis} end, ${INSET} m in (assumed)`;
  const b = buildingAt(x, y);
  if (r.axis === "lod2" && units.length) {
    // Today's solids standing on the 1917 building, or near the row's point: the tallest is the tower.
    const on = (u: any) => { const [cx, cy] = centroid(u.rings[0]); return Math.hypot(cx - x, cy - y) < REACH || (!!b && polygons(b.geometry).some((p) => inside(p, cx, cy))); };
    lod2 = units.filter(on).sort((a, b) => b.top - b.ground - (a.top - a.ground))[0] ?? null;
    // LoD2 leaves some towers out altogether (the Stadthaus's, the Parochialkirche's: nothing over 30 m there): a
    // tallest solid under TOWER of the recorded height is not the tower, so the row's point stands.
    if (lod2 && !(r.top_m && lod2.top - lod2.ground < TOWER * +r.top_m)) [x, y] = centroid(lod2.rings[0]), (axisFrom = "lod2");
    else axisFrom = "row (today's model has no tower here)";
  } else if ((r.axis === "west" || r.axis === "north") && b) {
    const ring = polygons(b.geometry)[0][0], c = centroid(ring);
    const end = ring.reduce((m, p) => (r.axis === "west" ? p[0] < m[0] : p[1] > m[1]) ? p : m);
    const d = Math.hypot(c[0] - end[0], c[1] - end[1]) || 1;
    [x, y] = [end[0] + ((c[0] - end[0]) * INSET) / d, end[1] + ((c[1] - end[1]) * INSET) / d];
  }
  const lodTop = lod2 ? +(lod2.top - lod2.ground).toFixed(1) : null;
  const recorded = r.top_m ? +r.top_m : null;
  const top = recorded ?? (r.state === "as1917" ? lodTop : null);
  if (recorded && lodTop) checks.push(`${r.name} ${recorded} m recorded, today's model ${lodTop} m`);
  out.push({ type: "Feature", geometry: { type: "Point", coordinates: [+x.toFixed(1), +y.toFixed(1)] }, properties: {
    name: r.name, part: r.part, axis_from: axisFrom, top_m: top, top_from: recorded ? "record" : top ? "lod2" : null, body_m: r.body_m ? +r.body_m : null,
    state: r.state, ground_m: +g(x, y).toFixed(2), lod2_top_m: lodTop, building: b?.properties.key ?? null, source: r.source, note: r.note } });
  // A building with several rows (the Schauspielhaus's block, portico and wings) keeps its tallest.
  if (b && !(b.properties.landmark_top_m > (top ?? -1))) (b.properties.landmark = r.name), (b.properties.landmark_top_m = top);
}

await Bun.write(`${map}/landmarks.geojson`, JSON.stringify({ type: "FeatureCollection", name: "landmarks_1917",
  crs: { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::25833" } },
  source: "research/landmarks-1917.tsv and landmarks-city-1917.tsv (each row's own source); axes and checks from Berlin LoD2 (dl-de/zero-2.0)", features: out }, null, 1));
const fhead = (await Bun.file(file).text()).split('"features"')[0];
await Bun.write(file, `${fhead}"features": [\n${blds.map((f) => JSON.stringify(f)).join(",\n")}\n]\n}\n`);
console.log(`landmarks: ${out.length}, ${out.filter((f) => f.properties.top_m).length} with a height (${out.filter((f) => f.properties.top_from === "lod2").length} from today's model alone), ${out.filter((f) => !f.properties.building).length} on no building`);
for (const c of checks) console.log(`  ${c}`);
for (const f of out.filter((f) => !f.properties.top_m)) console.log(`  unknown: ${f.properties.name}`);
