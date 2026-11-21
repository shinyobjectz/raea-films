// The Stadtbahn through the slice in winter 1917-18: the brick viaduct of 1875-82 (Ernst Dircksen) on its arches, the
// bridges where it crosses a street or the river, and the hall of Bahnhof Friedrichstrasse as it then stood (Johannes
// Vollmer, 1878-82; its successor, Brodfuehrer's double hall, was built 1919-25 on the same viaduct: Denkmaldatenbank
// 09080415). Sources, for facts only:
// - Axis: OpenHistoricalMap way 198651506, "Berliner Stadtbahn", bridge=viaduct, from 1882-02-07 (CC0). The other
//   dated Stadtbahn ways in the slice are its track pairs, within 8 m of it.
// - Footprint as drawn in 1910: the plan's rail pieces (rail.geojson) touching the axis within REACH m.
// - Height: rail top "etwa 6 m ueber Gelaende", every street passed under with at least 4.4 m clear, most street
//   bridges iron beam girders (Enzyklopaedie des Eisenbahnwesens, 1912, "Berliner Stadtbahn"); Zeitschrift fuer
//   Bauwesen 35 (1885) col. 1-12 measures 5.18 to 6.34 m from rail underside to the street's crown at three underpasses,
//   with 0.78-0.85 m left for the girders. Rail level here: the land under the axis (water left out) as a running
//   median over SMOOTH m either side, plus RAIL m.
// - Width 15.50 m between the faces, 2.25 + 3.50 + 4.00 + 3.50 + 2.25 about the four track centres, the local pair
//   north, the long-distance pair south (Berlin und seine Bauten, 1896, I p. 212; Enzyklopaedie). Arches of 6 to 15 m by
//   the ground; 15.4 m the rule on straight runs, piers 1.0-1.65 m thick at the springing and every fourth to sixth a
//   group pier of 2.0-2.25 m (ICOMOS Hefte des Deutschen Nationalkomitees, Stadtbahn article); about 600 arches let as
//   workshops, stores, restaurants and shops.
// - Hall (ZfB 35, 1885, col. 493-502): one hall over both platforms and four tracks, a ring segment on the 285 m curve
//   with its ends cut along the radius, 144 m long on its centreline and 34 to 37.5 m wide, 16 pairs of three-hinged
//   iron arch trusses (an obtuse pointed arch at the 34 m ends), roofed in corrugated iron with zinc over the trusses and
//   glazed saddle lights along the ridge (glass about 1:6.5 of the floor), glazed screens at both ends, side walls of
//   brick 7 m high with a row of windows. The station on its three viaducts is 158 m long between the abutments at
//   Friedrichstrasse and the Spree bank. The crown height is not in the text (plate 17): the trusses are those of
//   Alexanderplatz (col. 483: inner chord a 19.89 m arc centred at rail level 1.x m beside the axis), which puts the
//   inner crown about 19.7 m above the rails at a 34 m span; CROWN is that, an assumption until the plate is read.
// out: map/1917/stadtbahn.geojson: the axis (LineString Z, z = rail top m NHN every STEP m), the crossings (LineString
// Z over streets and water, with the street's 1917 name where OpenHistoricalMap has one), the viaduct pieces as drawn,
// and the hall (Polygon).
//   bun stadtbahn.ts [SLICE.json]
import { inPolys, loadGround } from "./groundgrid";
import { slicePaths } from "./paths";
import { utm } from "./utm";

const slicePath = process.argv.slice(2).find((a) => a.endsWith(".json")) ?? `${import.meta.dir}/slice.json`;
const { own: cache, map } = await slicePaths(slicePath); // a sheet's own cache holds its OHM and ground
// the viaduct's axis: way 198651506 from Zoologischer Garten to past the Schlesischer Bahnhof, and 200138129 on west
// from it to Savignyplatz (they share their end node); a sheet takes whichever its OHM download holds
const AXES = [200138129, 198651506], AXIS = AXES.join("+"), STEP = 2, SMOOTH = 60, RAIL = 6.0, REACH = 6, MIN_RUN = 6, NAME_M = 30, CROWN = 19.7;
const HALL_AT = [390559, 5820122]; // inside the plan's station piece (5,888 m2, x 390475-390637)
if (!(await Bun.file(`${cache}/ohm.json`).exists())) { console.log(`stadtbahn: no OHM download in ${cache}, nothing written`); process.exit(0); }
const ohm = (await Bun.file(`${cache}/ohm.json`).json()).elements as any[];
const ways = AXES.map((id) => ohm.find((e) => e.type === "way" && e.id === id)).filter(Boolean);
if (!ways.length) { console.log(`stadtbahn: no Stadtbahn way in ${cache}/ohm.json, nothing written`); process.exit(0); }
// chained end to end: each next way joins the line at whichever end it shares
let chain: any[] = ways[0].geometry;
for (const w of ways.slice(1)) {
  const g: any[] = w.geometry, same = (a: any, b: any) => a.lon === b.lon && a.lat === b.lat;
  if (same(chain[chain.length - 1], g[0])) chain = chain.concat(g.slice(1));
  else if (same(chain[chain.length - 1], g[g.length - 1])) chain = chain.concat(g.slice(0, -1).reverse());
  else if (same(chain[0], g[g.length - 1])) chain = g.slice(0, -1).concat(chain);
  else if (same(chain[0], g[0])) chain = g.slice(1).reverse().concat(chain);
  else throw new Error(`way ${w.id} shares no end with the Stadtbahn axis`);
}
const way = { geometry: chain }, axisId = ways.length === 1 ? ways[0].id : AXIS;
const ground = await loadGround(map, cache);
const sliceBox = (await Bun.file(slicePath).json()).bbox as number[]; // [x0, y0, x1, y1]

// The axis, resampled every STEP m, kept inside the slice.
const raw = way.geometry.map((g: any) => utm(g.lon, g.lat));
const pts: number[][] = [];
for (let i = 1; i < raw.length; i++) {
  const [a, b] = [raw[i - 1], raw[i]], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  for (let d = 0; d < L; d += STEP) pts.push([a[0] + ((b[0] - a[0]) * d) / L, a[1] + ((b[1] - a[1]) * d) / L]);
}
const axis = pts.filter(([x, y]) => x >= sliceBox[0] && x <= sliceBox[2] && y >= sliceBox[1] && y <= sliceBox[3]);
if (axis.length < 2) { console.log("stadtbahn: the axis does not cross this frame, nothing written"); process.exit(0); }

// What lies under each sample: water, the plan's rail band (the viaduct between streets), a building, a street, or
// other open ground. A crossing is a run of street, open ground and water holding some street or water: a river with its
// quay roads is one bridge, as it was built; a gap in the band over a yard is not a bridge.
const near = (fs: any[]) => fs.filter((f) => { const c = f.geometry.coordinates.flat(3); let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (let i = 0; i < c.length; i += 2) (x0 = Math.min(x0, c[i])), (x1 = Math.max(x1, c[i])), (y0 = Math.min(y0, c[i + 1])), (y1 = Math.max(y1, c[i + 1])); f.bb = [x0, y0, x1, y1]; return axis.some(([x, y]) => x >= x0 - 1 && x <= x1 + 1 && y >= y0 - 1 && y <= y1 + 1); });
const polys = (f: any) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates);
const water = near((await Bun.file(`${map}/water.geojson`).json()).features);
const street = near((await Bun.file(`${map}/open.geojson`).json()).features.filter((f: any) => f.properties.kind === "street"));
const railAll = near((await Bun.file(`${map}/rail.geojson`).json()).features);
const blds = near((await Bun.file(`${map}/buildings.geojson`).json()).features);
const hit = (fs: any[], x: number, y: number) => fs.some((f) => x >= f.bb[0] && x <= f.bb[2] && y >= f.bb[1] && y <= f.bb[3] && inPolys(x, y, polys(f)));
const under = axis.map(([x, y]) => (hit(water, x, y) ? "water" : hit(railAll, x, y) ? "rail" : hit(blds, x, y) ? "building" : hit(street, x, y) ? "street" : "open"));
const span = (u: string) => u === "water" || u === "street" || u === "open";

// Rail level: the land under the axis, a running median over SMOOTH m either side, plus RAIL.
const land = axis.map(([x, y], i) => (under[i] === "water" ? NaN : ground(x, y)));
const k = Math.round(SMOOTH / STEP);
const rail = axis.map((_, i) => {
  const v = land.slice(Math.max(0, i - k), i + k + 1).filter((z) => !Number.isNaN(z)).sort((a, b) => a - b);
  return v.length ? +(v[v.length >> 1] + RAIL).toFixed(2) : NaN;
});
// Over a long stretch of water (the Humboldthafen) no land is in reach: carry the level across from the nearest land.
for (let i = 1; i < rail.length; i++) if (Number.isNaN(rail[i])) rail[i] = rail[i - 1];
for (let i = rail.length - 2; i >= 0; i--) if (Number.isNaN(rail[i])) rail[i] = rail[i + 1];

// Runs over streets and water: the bridges. A street's 1917 name from the nearest OpenHistoricalMap way dated to it.
const named = ohm.filter((e) => e.type === "way" && e.tags?.highway && e.tags.name && !(e.tags.start_date > "1917") && !(e.tags.end_date && e.tags.end_date < "1918"))
  .map((e) => ({ name: e.tags.name as string, p: e.geometry.map((g: any) => utm(g.lon, g.lat)) as number[][] }));
const segDist = (x: number, y: number, p: number[][]) => {
  let best = Infinity;
  for (let i = 1; i < p.length; i++) {
    const [a, b] = [p[i - 1], p[i]], dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy));
  }
  return best;
};
const feats: any[] = [];
const line = (from: number, to: number) => axis.slice(from, to + 1).map(([x, y], i) => [+x.toFixed(2), +y.toFixed(2), rail[from + i]]);
for (let i = 0; i < axis.length;) {
  let j = i;
  while (j + 1 < axis.length && span(under[j + 1]) === span(under[i])) j++;
  const run = under.slice(i, j + 1), wet = run.includes("water"), dry = run.includes("street");
  if (span(under[i]) && (wet || dry) && (j - i + 1) * STEP >= MIN_RUN) {
    const over = wet && dry ? "water and street" : wet ? "water" : "street";
    const st = run.map((u, q) => (u === "street" ? i + q : -1)).filter((q) => q >= 0), si = st.length ? st[st.length >> 1] : (i + j) >> 1;
    const [mx, my] = axis[si], ground_m = dry ? +Math.min(...st.map((q) => land[q]).filter((z) => !Number.isNaN(z))).toFixed(2) : null;
    const nm = dry ? named.map((w) => ({ n: w.name, d: segDist(mx, my, w.p) })).filter((w) => w.d <= NAME_M).sort((a, b) => a.d - b.d)[0]?.n ?? null : null;
    feats.push({ type: "Feature", geometry: { type: "LineString", coordinates: line(i, j) },
      properties: { kind: "crossing", over, name: nm, length_m: (j - i + 1) * STEP, street_m: ground_m, clear_m: ground_m === null ? null : +(Math.min(...rail.slice(i, j + 1)) - ground_m - 0.85).toFixed(2), build: !wet ? "iron beam girders on brick abutments (most street bridges; Enzyklopaedie 1912)" : "iron over the Spree east and west of the station, brick arches over the other waters (Enzyklopaedie 1912)" } });
  }
  i = j + 1;
}
feats.unshift({ type: "Feature", geometry: { type: "LineString", coordinates: line(0, axis.length - 1) },
  properties: { kind: "axis", name: "Berliner Stadtbahn", opened: "1882-02-07", ohm_way: axisId, width_m: 15.5, tracks: 4, rail_above_ground_m: RAIL, arch_span_m: 15.4, pier_m: [1.0, 1.65], group_pier_m: [2.0, 2.25], z: "rail top, m NHN" } });

// The viaduct as the plan draws it, and the station hall.
const railFs = (await Bun.file(`${map}/rail.geojson`).json()).features as any[];
const touches = (f: any) => polys(f).some((rs: number[][][]) => rs[0].some(([x, y]) => axis.some(([ax, ay]) => Math.abs(ax - x) < REACH + 40 && Math.abs(ay - y) < REACH + 40 && Math.hypot(ax - x, ay - y) <= REACH + 40)))
  && axis.some(([x, y]) => inPolys(x, y, polys(f)) || [[REACH, 0], [-REACH, 0], [0, REACH], [0, -REACH]].some(([dx, dy]) => inPolys(x + dx, y + dy, polys(f))));
const inBox = HALL_AT[0] >= sliceBox[0] && HALL_AT[0] <= sliceBox[2] && HALL_AT[1] >= sliceBox[1] && HALL_AT[1] <= sliceBox[3];
const hall = inBox ? railFs.find((f) => inPolys(HALL_AT[0], HALL_AT[1], polys(f))) : undefined;
for (const f of railFs) if (f !== hall && f.properties.area_m2 >= 20 && touches(f)) feats.push({ type: "Feature", geometry: f.geometry, properties: { kind: "viaduct", drawn: f.properties.source, area_m2: f.properties.area_m2 } });
if (hall) {
  const ai = axis.reduce((b, [x, y], i) => (Math.hypot(x - HALL_AT[0], y - HALL_AT[1]) < Math.hypot(axis[b][0] - HALL_AT[0], axis[b][1] - HALL_AT[1]) ? i : b), 0);
  feats.push({ type: "Feature", geometry: hall.geometry, properties: { kind: "hall", name: "Bahnhof Friedrichstrasse (Centralbahnhof, 1882)", rail_m: rail[ai], length_m: 144, span_m: [34, 37.5], truss_pairs: 16, side_wall_m: 7, crown_above_rail_m: CROWN, crown_from: "assumed: Alexanderplatz's truss (ZfB 1885 col. 483); plate 17 not read", platforms: 2, roof: "corrugated iron; zinc on boarding over the trusses; glazed saddle lights along the ridge; glazed end screens", drawn: hall.properties.source, area_m2: hall.properties.area_m2 } });
}
await Bun.write(`${map}/stadtbahn.geojson`, JSON.stringify({ type: "FeatureCollection", name: "stadtbahn_1917", crs: { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::25833" } },
  source: `OpenHistoricalMap way ${axisId} (CC0);` + " Straube 1910 rail pieces (dl-de/zero); heights and measures cited in tools/map/stadtbahn.ts", features: feats }));
const cs = feats.filter((f) => f.properties.kind === "crossing");
console.log(`stadtbahn: axis ${axis.length * STEP} m in the slice, rail ${Math.min(...rail)}-${Math.max(...rail)} m NHN; ${cs.length} crossings (${cs.filter((c) => c.properties.over === "street").length} streets, ${cs.filter((c) => c.properties.over !== "street").length} over water); axis on the plan's rail band ${Math.round((under.filter((u) => u === "rail").length / under.length) * 100)}%, on buildings ${Math.round((under.filter((u) => u === "building").length / under.length) * 100)}%: ${cs.map((c) => `${c.properties.name ?? c.properties.over} ${c.properties.length_m} m${c.properties.clear_m !== null ? ` clear ${c.properties.clear_m}` : ""}`).join("; ")}; ${feats.filter((f) => f.properties.kind === "viaduct").length} viaduct pieces; hall ${hall ? "found" : "MISSING"}`);
