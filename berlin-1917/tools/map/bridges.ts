// The slice's street bridges in winter 1917-18, and the Weidendammer Brücke's building site.
// Decks: our map draws a bridge as street space laid across a gap in the water (water.geojson stops at the deck). So a
// deck is what a closing of the water (buffered out and back by R m, which fills any gap under 2R m wide) adds over the
// water, where at least STREET of it is street (open.geojson). That also fills basin corners and harbour mouths; the
// table research/bridges-1917.tsv names every piece by eye from the Straube plan's lettering and marks those "-". Each
// row holds the structure standing in 1917 with its sources; several bridges were replaced after 1945, so today's
// figures are not used where they differ.
// The Weidendammer Brücke (Cornehls and La Baume, Die Bautechnik 2, 1924, H. 33 ff.; Krause and Hedde, ZfB 72, 1922,
// p. 23): the North-South U-Bahn's tunnel crosses the Spree in the bridge's axis, so the 1895-97 superstructure was taken
// down in 1914 and replaced "einstweilen durch Hilfsbrücken". The tunnel was built in three sections in open cut, each
// in a cofferdam: in the first half of the war the first (north) section with the new north land pier and north river
// pier (two foundations either side of the 6.90 m tunnel, inner faces 12.50 m apart); the third (south) section, with
// the south piers, began only after the war, and the second lay between the river piers. All U-Bahn work stopped in
// 1917. So in winter 1917-18: no deck; the north piers new, the old south river pier and abutment still standing; the
// temporary bridge downstream between Schiffbauerdamm and Reichstagufer (de.wikipedia, Liste der Spreetunnel), a low
// steel through-truss on Max Missmann's photograph of 1914 (media/research/bridges/). The old girders' spans were 16.13,
// 38.50 and 14.85 m (C24), laid out here from the south (an assumption: the source does not say which end is which) and
// centred on the deck; pier lines run along the stream (OpenHistoricalMap's Spree line). The temporary bridge's axis is
// HILF_OFF m downstream of the old axis and HILF_W m wide: read from the photograph, not measured; it runs bank to bank (water.geojson) plus BANK m onto each quay.
// out: map/1917/bridges.geojson: decks (kind "bridge", Polygon) with the table's fields, and the Weidendammer works
// (kind "works": the old axis, the four bearing lines with their state, the tunnel's built and unbuilt parts, and the
// temporary bridge's axis).
//   bun bridges.ts [SLICE.json]
import { inPolys } from "./groundgrid";
import { slicePaths } from "./paths";
import { utm } from "./utm";

const slicePath = process.argv.slice(2).find((a) => a.endsWith(".json")) ?? `${import.meta.dir}/slice.json`;
const { cache, map, root } = await slicePaths(slicePath);
const R = 22, MIN_M2 = 80, STREET = 0.4, MATCH = 15;
const SPANS = [16.13, 38.5, 14.85], DECK_W = 5.06 + 12.4 + 5.06, HILF_OFF = 22, HILF_W = 10, BANK = 4, SPREE = 159534658;

// Decks, by DuckDB.
const tmp = `${cache}/bridges.decks.geojson`;
await Bun.$`rm -f ${tmp}`.quiet();
const sql = `LOAD spatial;
CREATE TABLE w AS SELECT ST_Union_Agg(geom) AS g FROM ST_Read('${map}/water.geojson');
CREATE TABLE st AS SELECT geom FROM ST_Read('${map}/open.geojson') WHERE kind = 'street';
CREATE TABLE gap AS SELECT UNNEST(ST_Dump(ST_Difference(ST_Buffer(ST_Buffer(g, ${R}, 4), -${R}, 4), g))).geom AS geom FROM w;
CREATE TABLE br AS SELECT g.geom, ST_Area(g.geom) AS a,
  coalesce((SELECT sum(ST_Area(ST_Intersection(g.geom, s.geom))) FROM st s WHERE ST_Intersects(g.geom, s.geom)), 0) AS on_street
FROM gap g WHERE ST_Area(g.geom) >= ${MIN_M2};
COPY (SELECT round(a, 1) AS deck_m2, round(on_street / a, 2) AS street_share, geom FROM br WHERE on_street >= ${STREET} * a)
  TO '${tmp}' WITH (FORMAT GDAL, DRIVER 'GeoJSON');`;
await Bun.$`duckdb -c ${sql}`.quiet();
const decks = (await Bun.file(tmp).json()).features as any[];

// The table: a row names the deck whose centre is within MATCH m of its point.
const rows = (await Bun.file(`${root}/research/bridges-1917.tsv`).text()).split("\n").filter((l) => l && !l.startsWith("#") && !l.startsWith("x\t"))
  .map((l) => { const [x, y, name, built, structure, spans_m, width_m, state_1917, source] = l.split("\t"); return { x: +x, y: +y, name, built, structure, spans_m, width_m, state_1917, source }; });
const ring = (g: any): number[][] => (g.type === "Polygon" ? g.coordinates[0] : g.coordinates[0][0]);
// The boundary resampled every metre, so long straight edges count as much as busy corners.
const dense = (r: number[][]) => r.slice(1).flatMap((b, i) => { const a = r[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); return Array.from({ length: Math.max(1, Math.ceil(L)) }, (_, k) => [a[0] + ((b[0] - a[0]) * k) / Math.max(1, Math.ceil(L)), a[1] + ((b[1] - a[1]) * k) / Math.max(1, Math.ceil(L))]); });
const centre = (g: any) => { const p = dense(ring(g)); return [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length]; };
const out: any[] = [], unnamed: string[] = [];
let dropped = 0;
for (const d of decks) {
  const [cx, cy] = centre(d.geometry), row = rows.filter((r) => Math.hypot(r.x - cx, r.y - cy) <= MATCH).sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy))[0];
  if (row?.name.startsWith("-")) { dropped++; continue; }
  if (!row) unnamed.push(`${cx.toFixed(0)} ${cy.toFixed(0)}`);
  const p = row ? { name: row.name, built: row.built, structure: row.structure, spans_m: row.spans_m || null, width_m: row.width_m || null, state_1917: row.state_1917, source: row.source } : { name: null, state_1917: "not checked" };
  out.push({ type: "Feature", geometry: d.geometry, properties: { kind: "bridge", ...p, deck_m2: d.properties.deck_m2 } });
}

// The Weidendammer works.
const wd = out.find((f) => f.properties.name === "Weidendammer Brücke");
const works: any[] = [];
if (wd) {
  const pts = dense(ring(wd.geometry)), [cx, cy] = centre(wd.geometry);
  // Long axis of the deck (across the river), pointing north.
  let sxx = 0, syy = 0, sxy = 0;
  for (const [x, y] of pts) (sxx += (x - cx) ** 2), (syy += (y - cy) ** 2), (sxy += (x - cx) * (y - cy));
  const th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  let u = [Math.cos(th), Math.sin(th)];
  if (u[1] < 0) u = [-u[0], -u[1]];
  const v = [u[1], -u[0]]; // east of the axis: upstream; the Spree flows west here
  const along = pts.map(([x, y]) => (x - cx) * u[0] + (y - cy) * u[1]), lo = Math.min(...along), hi = Math.max(...along), mid = (lo + hi) / 2;
  const at = (s: number, o = 0) => [+(cx + u[0] * s + v[0] * o).toFixed(2), +(cy + u[1] * s + v[1] * o).toFixed(2)];
  // The stream's direction at the bridge, from the Spree line's nearest segment.
  const spree = ((await Bun.file(`${cache}/ohm.json`).json()).elements as any[]).find((e) => e.id === SPREE)?.geometry.map((g: any) => utm(g.lon, g.lat)) as number[][];
  let w = [-v[0], -v[1]], best = Infinity;
  for (let i = 1; i < (spree?.length ?? 0); i++) {
    const [a, b] = [spree[i - 1], spree[i]], m = Math.hypot((a[0] + b[0]) / 2 - cx, (a[1] + b[1]) / 2 - cy);
    if (m < best) { best = m; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); w = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; }
  }
  const sin = Math.abs(u[0] * w[1] - u[1] * w[0]), half = DECK_W / 2 / Math.max(0.3, sin);
  const total = SPANS.reduce((s, x) => s + x, 0), s0 = mid - total / 2;
  const bear = [s0, s0 + SPANS[0], s0 + SPANS[0] + SPANS[1], s0 + total];
  const line = (s: number) => [at(s).map((c, k) => +(c - w[k] * half).toFixed(2)), at(s).map((c, k) => +(c + w[k] * half).toFixed(2))];
  const F = (geometry: any, properties: any) => works.push({ type: "Feature", geometry, properties: { kind: "works", of: "Weidendammer Brücke", ...properties } });
  F({ type: "LineString", coordinates: [at(lo), at(hi)] }, { part: "old axis", note: "the 1895-97 bridge's axis, bank to bank; no deck in 1917-18", from: "deck as the plan draws it" });
  const state = [
    ["south abutment", "old (1895-97), standing until the third section began after the war", "C24; order of the spans assumed"],
    ["south river pier", "old (1895-97), narrow and granite-clad, standing until after the war", "C24; DD 09030074"],
    ["north river pier", "new, built 1914-16 in the first section's cofferdam: two foundations either side of the tunnel, inner faces 12.50 m apart, heads 1.50 m longer than the old; granite cladding put back only in the rebuild", "C24"],
    ["north abutment", "new, built 1914-16 with the first section", "C24"],
  ];
  bear.forEach((s, i) => F({ type: "LineString", coordinates: line(s) }, { part: state[i][0], state_1917: state[i][1], from: state[i][2] }));
  F({ type: "LineString", coordinates: [at(bear[2]), at(hi + 10)] }, { part: "tunnel, first section", state_1917: "built 1914-16 in open cut in a cofferdam (6.90 m clear), under the north span and the north bank; work stopped 1917", from: "C24; WP Liste der Spreetunnel" });
  F({ type: "LineString", coordinates: [at(lo - 10), at(bear[2])] }, { part: "tunnel, second and third sections", state_1917: "not built: the middle (between the river piers) and the south section with the south piers came after the war; finished mid-1921", from: "C24; WP Liste der Spreetunnel" });
  // The temporary bridge, bank to bank: out from the river's middle along its axis until the ground is dry.
  const water = ((await Bun.file(`${map}/water.geojson`).json()).features as any[]).map((f) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates));
  const wet = (s: number) => { const [x, y] = at(s, -HILF_OFF); return water.some((p) => inPolys(x, y, p)); };
  let h0 = mid, h1 = mid;
  while (h0 > mid - 200 && (wet(h0) || wet(h0 - 2))) h0 -= 1;
  while (h1 < mid + 200 && (wet(h1) || wet(h1 + 2))) h1 += 1;
  F({ type: "LineString", coordinates: [at(h0 - BANK, -HILF_OFF), at(h1 + BANK, -HILF_OFF)] }, { part: "temporary bridge (Hilfsbrücke)", state_1917: "carrying the street's traffic 1914-23", structure: "low steel through-truss, about 3 m deep, verticals and diagonals, deck at street level", width_m: HILF_W, from: `position ${HILF_OFF} m downstream and width read from Missmann's 1914 photograph (assumption); between Schiffbauerdamm and Reichstagufer (WP Liste der Spreetunnel)` });
  console.log(`bridges: Weidendammer deck ${(hi - lo).toFixed(1)} m along its axis (bearings span ${total.toFixed(2)} m), axis ${((Math.atan2(u[0], u[1]) * 180) / Math.PI).toFixed(1)} deg east of north, stream at ${((Math.asin(Math.min(1, sin)) * 180) / Math.PI).toFixed(0)} deg to it; temporary bridge ${(h1 - h0).toFixed(0)} m over the water`);
}

await Bun.write(`${map}/bridges.geojson`, JSON.stringify({ type: "FeatureCollection", name: "bridges_1917", crs: { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::25833" } },
  source: "decks: street filling gaps in the water (tools/map/bridges.ts); names: the Straube plan's lettering; structure in 1917: research/bridges-1917.tsv with its sources", features: [...out, ...works] }));
const known = out.filter((f) => f.properties.structure && !/^to read/.test(f.properties.structure)).length;
console.log(`bridges: ${decks.length} pieces, ${dropped} not bridges, ${out.length} decks (${known} with their 1917 structure sourced, ${out.filter((f) => !f.properties.name).length} unnamed${unnamed.length ? ": " + unnamed.join("; ") : ""}); ${works.length} Weidendammer works features`);
