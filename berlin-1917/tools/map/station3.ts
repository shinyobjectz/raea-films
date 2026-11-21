// Pumpstation III as Hobrecht's Blatt 16 draws it (research/pumpstation-iii-1884.tsv), put on the map: the plate's site
// plan is turned and moved onto the Straube plan (1910) by its two control points (the Sandfang's well and the
// chimney's centre, both drawn on both), at the plate's own 1:500 scale (its bar, not the controls: the two read 24.3 m
// apart on the plate and 23.9 m on the plan, inside the plan's line width), then plan to map by the offset field.
// Each row becomes a feature with its heights and the plate's note; buildings carry their outline as drawn and written.
//   in:  research/pumpstation-iii-1884.tsv, the slice's offset field
//   out: map/1917/station_iii.geojson; prints the controls' residuals and each part's centre
//   bun station3.ts [SLICE.json]
import { offsetField } from "./offsetfield";
import { slicePaths } from "./paths";
import { streetRoute } from "./streetroute";

const slicePath = process.argv.slice(2).find((a) => a.endsWith(".json")) ?? `${import.meta.dir}/slice.json`;
const { cache, map, align } = await slicePaths(slicePath);
const PXM = 23.13; // plate px a metre in the site plan (1:500 bar)
const lines = (await Bun.file(`${import.meta.dir}/../../research/pumpstation-iii-1884.tsv`).text()).split("\n").filter((l) => l && !l.startsWith("#"));
const head = lines.shift()!.split("\t");
const rows = lines.map((l) => Object.fromEntries(l.split("\t").map((v, i) => [head[i], v ?? ""])) as Record<string, string>);

// Controls: plate px and plan E N (from the note, "plan E N").
const ctl = rows.filter((r) => r.kind === "control").map((r) => {
  const [, u, v] = r.geom.split(" ").map(Number), m = r.note.match(/plan (\d+\.?\d*) (\d+\.?\d*)/);
  if (!m) throw new Error(`control ${r.part}: no plan E N in its note`);
  return { part: r.part, u, v, E: +m[1], N: +m[2] };
});
if (ctl.length !== 2) throw new Error(`need two controls, have ${ctl.length}`);
// Plate px (y down) to metres (y up), then a turn by th and a shift that puts the controls' mean on the plan's.
const met = (u: number, v: number) => [u / PXM, -v / PXM];
const [a, b] = ctl.map((c) => met(c.u, c.v));
const th = Math.atan2(ctl[1].N - ctl[0].N, ctl[1].E - ctl[0].E) - Math.atan2(b[1] - a[1], b[0] - a[0]);
const [cs, sn] = [Math.cos(th), Math.sin(th)];
const rot = ([x, y]: number[]) => [x * cs - y * sn, x * sn + y * cs];
const mid = rot([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]), tE = (ctl[0].E + ctl[1].E) / 2 - mid[0], tN = (ctl[0].N + ctl[1].N) / 2 - mid[1];
const offset = await offsetField(align); // map = plan - offset
const toMap = (u: number, v: number) => {
  const [x, y] = rot(met(u, v)), E = x + tE, N = y + tN, [dx, dy] = offset(E, N);
  return [+(E - dx).toFixed(2), +(N - dy).toFixed(2)];
};
const plateDist = Math.hypot(b[0] - a[0], b[1] - a[1]), planDist = Math.hypot(ctl[1].E - ctl[0].E, ctl[1].N - ctl[0].N);
console.log(`turn ${((th * 180) / Math.PI).toFixed(1)} deg; controls ${plateDist.toFixed(2)} m apart on the plate, ${planDist.toFixed(2)} m on the plan`);
for (const c of ctl) {
  const [x, y] = rot(met(c.u, c.v));
  console.log(`  ${c.part}: residual ${Math.hypot(x + tE - c.E, y + tN - c.N).toFixed(2)} m`);
}

// The plate's north arrow points down and left (about -50, +55 px); turned, it should point near map north.
const north = rot(met(-50, 55));
console.log(`plate north arrow turned to ${((Math.atan2(north[1], north[0]) * 180) / Math.PI).toFixed(0)} deg (90 = map north)`);

const features: any[] = [];
for (const r of rows.filter((r) => r.kind !== "control")) {
  const [shape, ...ns] = r.geom.split(" "), n = ns.map(Number);
  let geometry: any;
  if (shape === "rect") {
    const [cx, cy, w, h] = n, hw = (w * PXM) / 2, hh = (h * PXM) / 2;
    const ring = [[cx - hw, cy - hh], [cx + hw, cy - hh], [cx + hw, cy + hh], [cx - hw, cy + hh], [cx - hw, cy - hh]].map(([u, v]) => toMap(u, v));
    geometry = { type: "Polygon", coordinates: [ring.reverse()] };
  } else if (shape === "poly") {
    const pts: number[][] = [];
    for (let i = 0; i < n.length; i += 2) pts.push(toMap(n[i], n[i + 1]));
    pts.push(pts[0]);
    geometry = { type: "Polygon", coordinates: [pts.reverse()] };
  } else if (shape === "circle") {
    const [cx, cy, rm] = n, ring: number[][] = [];
    for (let k = 0; k <= 32; k++) ring.push(toMap(cx + rm * PXM * Math.cos((k / 32) * 2 * Math.PI), cy - rm * PXM * Math.sin((k / 32) * 2 * Math.PI)));
    geometry = { type: "Polygon", coordinates: [ring] };
  } else if (shape === "line") {
    const pts: number[][] = [];
    for (let i = 0; i < n.length; i += 2) pts.push(toMap(n[i], n[i + 1]));
    geometry = { type: "LineString", coordinates: pts };
  } else if (shape === "point") geometry = { type: "Point", coordinates: toMap(n[0], n[1]) };
  else throw new Error(`${r.part}: unknown geom ${shape}`);
  const num = (s: string) => (s === "" ? null : +s);
  features.push({ type: "Feature", geometry, properties: { part: r.part, kind: r.kind, eaves_m: num(r.eaves_m), top_m: num(r.top_m), storeys: num(r.storeys), note: r.note, source: "Hobrecht 1884, Atlas Blatt 16 (fitted to the Straube plan)" } });
}
// Beyond the plate: Blatt 26's long section of III's pressure main names Hallesches Ufer, the canal crossing, Großbeeren-
// straße and Yorckstraße (1,643 m, chainage 19+57 to 36 of System I's main, which it joins): routed down the middle
// of the 1917 street space (streetroute.ts) from the plate's last point over the Großbeerenbrücke and down Großbeeren-
// straße to the slice's south edge.
{
  const bridges = (await Bun.file(`${map}/bridges.geojson`).json()).features as any[];
  const gb = bridges.find((f) => /Großbeeren/.test(JSON.stringify(f.properties)));
  if (!gb) throw new Error("no Großbeerenbrücke in bridges.geojson");
  const ring = gb.geometry.type === "Polygon" ? gb.geometry.coordinates[0] : gb.geometry.coordinates[0][0];
  const bc = ring.slice(0, -1).reduce((s: number[], p: number[], _: number, r: number[][]) => [s[0] + p[0] / r.length, s[1] + p[1] / r.length], [0, 0]);
  const labels = (await Bun.file(`${map}/labels.geojson`).json()).features as any[];
  const gs = labels.find((f) => /^Großbeerenstraße$/.test(f.properties.name ?? f.properties.text ?? ""));
  if (!gs) throw new Error("no Großbeerenstraße label");
  // Down the street from the bridge through its label to the slice's south edge (bbox y0), 5 m inside.
  const [lx, ly] = gs.geometry.coordinates, y0 = (await Bun.file(slicePath).json()).bbox[1] + 5, t = (bc[1] - y0) / (bc[1] - ly);
  const plateEnd = features.find((f) => f.properties.part === "Druckrohr").geometry.coordinates.at(-1);
  // Along Hallesches Ufer on the north bank to the crossing, as Blatt 26 has it: by the north ends of the Möckernbrücke
  // and the Großbeerenbrücke (12 m north of each deck's northernmost corner, in the Ufer street, since a deck joins both
  // banks), so no cheaper way crosses the canal earlier.
  const northEnd = (name: RegExp) => { const b = bridges.find((f) => name.test(JSON.stringify(f.properties))); if (!b) throw new Error(`no ${name} in bridges.geojson`); const r = b.geometry.type === "Polygon" ? b.geometry.coordinates[0] : b.geometry.coordinates[0][0]; const v = r.reduce((p: number[], q: number[]) => (q[1] > p[1] ? q : p)); return [v[0], v[1] + 12]; };
  const route = await streetRoute(map, [plateEnd, northEnd(/Möckernbrücke/), northEnd(/Großbeerenbrücke/), bc, [bc[0] + (lx - bc[0]) * t, y0]], [gb.geometry], true);
  const len = route.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - route[i - 1][0], q[1] - route[i - 1][1]) : 0), 0);
  console.log(`pressure main beyond the plate: ${Math.round(len)} m in ${route.length} points, via the Großbeerenbrücke at ${bc.map((v: number) => v.toFixed(0)).join(" ")}`);
  features.push({ type: "Feature", geometry: { type: "LineString", coordinates: route }, properties: { part: "Druckrohr, Blatt 26 route", kind: "pressure main", eaves_m: null, top_m: null, storeys: null,
    note: "the joined main on the streets Blatt 26 names (Hallesches Ufer, the canal at the Großbeerenbrücke, Großbeerenstraße), routed down the middle of the 1917 street space as far as the slice (streetroute.ts, through the planted strips too, since the reader filed much of the tree-lined Ufer roadway as green; the line within the street ASSUMED); the pipe about 2.0 m under the street (Blatt 26 prints ground and pipe: 34.54/32.54 at the station, 34.35/32.35 before the canal, 35.75/33.15 and 35.19/33.19 on Großbeerenstraße); bore not printed",
    source: "Hobrecht 1884, Atlas Blatt 26 (Längenprofile der Druckrohrleitungen, R. S. III)" } });
  features.push({ type: "Feature", geometry: { type: "Point", coordinates: bc.map((v: number) => +v.toFixed(2)) }, properties: { part: "Lufthahn", kind: "air valve", eaves_m: null, top_m: 36.06, storeys: null,
    note: "the main crosses the Landwehrkanal above the water at the Großbeerenbrücke, rising to +36.06 m NHN (Blatt 26) with an air valve at its top; the street there 35.98", source: "Hobrecht 1884, Atlas Blatt 26" } });
}
await Bun.write(`${map}/station_iii.geojson`, JSON.stringify({ type: "FeatureCollection", crs: { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::25833" } }, features }));
for (const f of features) {
  const c = f.geometry.type === "Point" ? f.geometry.coordinates : f.geometry.type === "LineString" ? f.geometry.coordinates[0] : f.geometry.coordinates[0].slice(0, -1).reduce((s: number[], p: number[], _: number, r: number[][]) => [s[0] + p[0] / r.length, s[1] + p[1] / r.length], [0, 0]);
  console.log(`${f.properties.kind}\t${f.properties.part}\t${c[0].toFixed(1)} ${c[1].toFixed(1)}`);
}
console.log(`${features.length} parts -> ${map}/station_iii.geojson`);
