// Trees of 1917, read from the 1928 aerial photograph (Geoportal Berlin luftbild_1928_04, dl-de/zero), taken in leaf:
// a crown is dark against sunlit paving, lawn and sand. The Linden's trees of 1917 stood until 1934-36 (felled for the
// S-Bahn tunnel; berlin.de's history of the street), the Tiergarten's until 1945-46, so the 1928 crowns are, but for
// what was planted or lost in eleven years, the 1917 trees.
// Where: open ground the plan draws as park, garden or street (green.geojson, open.geojson kind street), at least EDGE
// m in from any building or water, so roofs' and quays' dark edges are not read as crowns.
// How: the photo's darkness (255 - grey) averaged over that ground only at two scales, three box passes of BLUR px
// (about a crown's core) and of WIDE px (its surroundings). A crown is darker than its surroundings by at least CONTRAST
// and darker than THRESH, and the darkest within PEAK m: a lone street tree on sunlit paving stands out however small,
// while a building's shadow or a dark lawn, even and wide, does not. Its diameter is twice the mean distance, over 8
// rays, at which the darkness falls back to halfway between the peak and its surroundings (at most MAX_D). In a closed
// canopy (the Tiergarten) the peaks are the canopy's lumps, roughly crown-spaced, not counted trees.
// A peak whose darkness reaches more than ANISO times as far along one axis as across it, and is under THIN m across, is
// a line (rails, a kerb's shadow), not a crown; a row of touching crowns is as long but a crown wide, and stays. On streets, where carts, awnings and shadows also make dark spots, a crown is kept only in a row,
// as Berlin planted them: neighbours ROW_MIN-ROW_MAX m away on roughly opposite sides (at least ROW_ANGLE degrees apart),
// chained at least ROW_LEN long; or within STRIP m of the plan's planted strips (green.geojson), as on the Linden's
// promenade. Checked by eye on 11-17: Friedrichstrasse, which had no trees, kept almost none.
// In a closed canopy the points undercount, so each park piece (green.geojson) also gets its canopy share: the part
// of its open ground darker than CANOPY (lawn, sand and gravel are lighter), as kind "canopy" with the piece's outline,
// for pieces of at least MIN_PARK m2 with a share of at least 0.1; the bake can plant to it.
// Each point says where it stands (street or park) and its crown diameter in 1928, in leaf; bare in December the
// branches spread about as wide.
// out: map/1917/trees.geojson (Point features: crown_d_m, on, dark), and with --debug an overlay PNG per tile read.
//   bun trees.ts [SLICE.json] [--box X0 Y0 X1 Y1] [--debug DIR]
import { polygons, readGray, tiles, fill } from "./raster";
import { slicePaths } from "./paths";
import { chamfer } from "./thin";

const args = process.argv.slice(2);
const slicePath = args.find((a) => a.endsWith(".json")) ?? `${import.meta.dir}/slice.json`;
const box = args.includes("--box") ? args.slice(args.indexOf("--box") + 1, args.indexOf("--box") + 5).map(Number) : null;
const debug = args.includes("--debug") ? args[args.indexOf("--debug") + 1] : null;
const { cache, map } = await slicePaths(slicePath);
const MPP = 0.25, EDGE = 1.5, BLUR = 3, WIDE = 16, THRESH = +(process.env.TREE_THRESH ?? 120), CONTRAST = +(process.env.TREE_CONTRAST ?? 18), PEAK = 2.5, MAX_D = 16, ANISO = 2.5, THIN = 3;
const CANOPY = +(process.env.TREE_CANOPY ?? 165), MIN_PARK = 200;
const ROW_MIN = 5, ROW_MAX = 14, ROW_ANGLE = 150, ROW_LEN = 4, STRIP = 4;

const load = async (f: string) => (await Bun.file(`${map}/${f}`).json()).features as any[];
const green = await load("green.geojson"), streets = (await load("open.geojson")).filter((f) => f.properties.kind === "street");
const blds = await load("buildings.geojson"), water = await load("water.geojson");
const bb = (f: any) => { if (!f.bb) { const c = f.geometry.coordinates.flat(3); let a = Infinity, b = Infinity, d = -Infinity, e = -Infinity; for (let i = 0; i < c.length; i += 2) (a = Math.min(a, c[i])), (d = Math.max(d, c[i])), (b = Math.min(b, c[i + 1])), (e = Math.max(e, c[i + 1])); f.bb = [a, b, d, e]; } return f.bb; };
const within = (fs: any[], t: { x0: number; y0: number; x1: number; y1: number }) => fs.filter((f) => { const [a, b, d, e] = bb(f); return d >= t.x0 && a <= t.x1 && e >= t.y0 && b <= t.y1; });

// Separable box blur, in place over n passes.
function boxBlur(v: Float32Array, w: number, h: number, r: number, passes: number) {
  const tmp = new Float32Array(v.length);
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) { let s = 0; const o = y * w; for (let x = -r; x <= r; x++) s += v[o + Math.min(w - 1, Math.max(0, x))]; for (let x = 0; x < w; x++) { tmp[o + x] = s / (2 * r + 1); s += v[o + Math.min(w - 1, x + r + 1)] - v[o + Math.max(0, x - r)]; } }
    for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += tmp[Math.min(h - 1, Math.max(0, y)) * w + x]; for (let y = 0; y < h; y++) { v[y * w + x] = s / (2 * r + 1); s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]; } }
  }
}
// Running maximum over a square of half-width r.
function maxFilter(v: Float32Array, w: number, h: number, r: number) {
  const a = new Float32Array(v.length), b = new Float32Array(v.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let m = -Infinity; for (let k = Math.max(0, x - r); k <= Math.min(w - 1, x + r); k++) m = Math.max(m, v[y * w + k]); a[y * w + x] = m; }
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) { let m = -Infinity; for (let k = Math.max(0, y - r); k <= Math.min(h - 1, y + r); k++) m = Math.max(m, a[k * w + x]); b[y * w + x] = m; }
  return b;
}

const feats: any[] = [], gTotal = new Float64Array(green.length), gDark = new Float64Array(green.length);
green.forEach((g, k) => (g.k = k));
for (const t of await tiles(slicePath, MPP)) {
  if (box && (t.x1 <= box[0] || t.x0 >= box[2] || t.y1 <= box[1] || t.y0 >= box[3])) continue;
  const photo = `${cache}/rasters/photo1928/${t.id}.jpg`;
  if (!(await Bun.file(photo).exists())) continue;
  const { w, h, px } = await readGray(photo, ["-colorspace", "Gray"]);
  // Ground: 1 park, 2 street; 0 elsewhere, then pulled in EDGE m from buildings and water.
  const lab = new Uint8Array(w * h);
  for (const f of within(green, t)) fill(lab, t, polygons(f.geometry), 1);
  for (const f of within(streets, t)) fill(lab, t, polygons(f.geometry), 2);
  for (const f of [...within(blds, t), ...within(water, t)]) fill(lab, t, polygons(f.geometry), 0);
  const dist = chamfer(w, h, (i) => lab[i] === 0);
  const labG = new Int32Array(w * h);
  for (const g of within(green, t)) fill(labG, t, polygons(g.geometry), g.k + 1);
  const on = new Float32Array(w * h), dk = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) if (lab[i] && dist[i] * MPP >= EDGE) (on[i] = 1), (dk[i] = 255 - px[i]);
  const on2 = on.slice(), dk2 = dk.slice();
  boxBlur(dk, w, h, BLUR, 3), boxBlur(on, w, h, BLUR, 3), boxBlur(dk2, w, h, WIDE, 3), boxBlur(on2, w, h, WIDE, 3);
  const s = new Float32Array(w * h), around = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) (s[i] = on[i] > 0.3 ? dk[i] / on[i] : 0), (around[i] = on2[i] > 0.05 ? dk2[i] / on2[i] : 0);
  for (let i = 0; i < w * h; i++) if (lab[i] === 1 && labG[i] && on[i] > 0.3) (gTotal[labG[i] - 1]++, s[i] >= CANOPY && gDark[labG[i] - 1]++);
  const mx = maxFilter(s, w, h, Math.round(PEAK / MPP));
  const pts: number[][] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (!lab[i] || dist[i] * MPP < EDGE || s[i] < THRESH || s[i] - around[i] < CONTRAST || s[i] < mx[i]) continue;
    // Crown: mean reach of 8 rays until the darkness falls halfway back to its surroundings.
    const edge = (s[i] + around[i]) / 2;
    let reach = 0;
    const rays: number[] = [];
    for (let a = 0; a < 8; a++) {
      const dx = Math.cos((a * Math.PI) / 4), dy = Math.sin((a * Math.PI) / 4);
      let r = 0;
      while (r * MPP < MAX_D / 2) { const qx = Math.round(x + dx * r), qy = Math.round(y + dy * r); if (qx < 0 || qy < 0 || qx >= w || qy >= h || s[qy * w + qx] < edge) break; r++; }
      reach += r * MPP;
      rays.push(r * MPP);
    }
    const axes = [0, 1, 2, 3].map((a) => rays[a] + rays[a + 4]);
    if (Math.min(...axes) < THIN && Math.max(...axes) > ANISO * Math.max(0.5, Math.min(...axes))) continue;
    const X = t.x0 + (x + 0.5) * MPP, Y = t.y1 - (y + 0.5) * MPP;
    if (box && (X < box[0] || X > box[2] || Y < box[1] || Y > box[3])) continue;
    pts.push([x, y]);
    feats.push({ type: "Feature", geometry: { type: "Point", coordinates: [+X.toFixed(1), +Y.toFixed(1)] }, properties: { crown_d_m: +((2 * reach) / 8).toFixed(1), on: lab[i] === 1 ? "park" : "street", dark: Math.round(s[i]), contrast: Math.round(s[i] - around[i]) } });
  }
  if (debug) {
    await Bun.$`mkdir -p ${debug}`.quiet();
    const draws = pts.flatMap(([x, y]) => ["-draw", `circle ${x},${y} ${x + 6},${y}`]);
    await Bun.$`magick ${photo} -colorspace Gray -colorspace sRGB -fill none -stroke red -strokewidth 3 ${draws} -resize 50% ${debug}/${t.id}.png`.quiet();
  }
  const sh = Array.from(s).filter((v, i) => lab[i] && dist[i] * MPP >= EDGE).sort((a, b) => a - b);
  console.error(`${t.id}: ${pts.length} crowns; ground darkness p10 ${sh[Math.floor(sh.length * 0.1)]?.toFixed(0)} p50 ${sh[sh.length >> 1]?.toFixed(0)} p90 ${sh[Math.floor(sh.length * 0.9)]?.toFixed(0)}`);
}
// Street crowns: rows only, or by the plan's planted strips.
const greenBox = green.map((g) => ({ g, b: bb(g) }));
const nearStrip = (x: number, y: number) => greenBox.some(({ g, b }) => x >= b[0] - STRIP && x <= b[2] + STRIP && y >= b[1] - STRIP && y <= b[3] + STRIP && polygons(g.geometry).some((p) => p.some((r) => r.some((q, k) => k > 0 && segDist(x, y, r[k - 1], q) <= STRIP))));
function segDist(x: number, y: number, a: number[], b: number[]) { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy, t = L ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L)) : 0; return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy); }
const st = feats.filter((f) => f.properties.on === "street"), grid = new Map<string, number[]>();
st.forEach((f, i) => { const [x, y] = f.geometry.coordinates, k = `${Math.floor(x / ROW_MAX)},${Math.floor(y / ROW_MAX)}`; (grid.get(k) ?? grid.set(k, []).get(k)!).push(i); });
const parent = st.map((_, i) => i), find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
const inRow = new Uint8Array(st.length);
st.forEach((f, i) => {
  const [x, y] = f.geometry.coordinates, gx = Math.floor(x / ROW_MAX), gy = Math.floor(y / ROW_MAX), nb: number[][] = [];
  for (let a = gx - 1; a <= gx + 1; a++) for (let b = gy - 1; b <= gy + 1; b++) for (const j of grid.get(`${a},${b}`) ?? []) {
    const [qx, qy] = st[j].geometry.coordinates, d = Math.hypot(qx - x, qy - y);
    if (j !== i && d >= ROW_MIN && d <= ROW_MAX) nb.push([j, Math.atan2(qy - y, qx - x)]);
  }
  for (let p = 0; p < nb.length; p++) for (let q = p + 1; q < nb.length; q++) {
    let da = Math.abs(nb[p][1] - nb[q][1]) * (180 / Math.PI); if (da > 180) da = 360 - da;
    if (da >= ROW_ANGLE) { inRow[i] = 1; parent[find(nb[p][0])] = find(i); parent[find(nb[q][0])] = find(i); }
  }
});
const size = new Map<number, number>();
st.forEach((_, i) => { if (inRow[i]) size.set(find(i), (size.get(find(i)) ?? 0) + 1); });
const keepSt = new Set(st.filter((f, i) => (inRow[i] && (size.get(find(i)) ?? 0) >= ROW_LEN) || nearStrip(f.geometry.coordinates[0], f.geometry.coordinates[1])));
const dropped = st.length - keepSt.size;
feats.splice(0, feats.length, ...feats.filter((f) => f.properties.on !== "street" || keepSt.has(f)));
const r1 = (c: any): any => (typeof c[0] === "number" ? [+c[0].toFixed(1), +c[1].toFixed(1)] : c.map(r1));
const canopy = green.flatMap((g, k) => { const share = gTotal[k] ? gDark[k] / gTotal[k] : 0, a = g.properties.area_m2 ?? 0;
  return a >= MIN_PARK && share >= 0.1 ? [{ type: "Feature", geometry: { type: g.geometry.type, coordinates: r1(g.geometry.coordinates) }, properties: { kind: "canopy", canopy_share: +share.toFixed(2), area_m2: Math.round(a) } }] : []; });
for (const f of feats) f.properties.kind = "crown";
if (!box) await Bun.write(`${map}/trees.geojson`, JSON.stringify({ type: "FeatureCollection", name: "trees_1917", crs: { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::25833" } },
  source: "crowns read from the 1928 aerial (Geoportal Berlin luftbild_1928_04, dl-de/zero) on parks and streets; tools/map/trees.ts", features: [...feats, ...canopy] }));
console.log(`trees: ${dropped} street peaks not in a row dropped; ${canopy.length} park pieces with canopy (${(canopy.reduce((t, c) => t + c.properties.area_m2 * c.properties.canopy_share, 0) / 1e4).toFixed(1)} ha of crown); ${feats.length} crowns (${feats.filter((f) => f.properties.on === "street").length} on streets, ${feats.filter((f) => f.properties.on === "park").length} in parks)${box ? " in the box (not written)" : ""}`);
