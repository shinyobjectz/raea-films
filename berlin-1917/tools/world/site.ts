// The Tempelhofer Berg site (the Hilsebein gate's street) as one file a set builds from: the street's own ground, its
// two building lines, and the outlines the map lane traced, in the scene frame (components/world/City.tsx toScene:
// x east, y up m NHN, z south, from E 391000 N 5819000).
//
//   in:  map/sites/am_tempelhofer_berg.geojson (the map lane's site: outlines, building lines, street levels),
//        cache/sites/tempelhofer-berg/dgm1.csv (DGM1, today's bare earth at 1 m: E 390380-390680, N 5816430-5816730)
//   out: assets/world/sites/tempelhofer-berg.json
//   run: bun tools/world/site.ts
//
// The street's ground: DGM1 along the street's middle every 2 m (it matches the map lane's 1917 street levels to a
// few centimetres where both have a point), carried on north of the survey at its last slope until it levels out on
// the valley floor. Beyond the survey the levelling-out is assumed, not measured: the street runs on past the frame.
const root = `${import.meta.dir}/../..`;
const ORIGIN = [391000, 5819000];
type Pt = [number, number];
const r2 = (v: number) => Math.round(v * 100) / 100;

const site = await Bun.file(`${root}/map/sites/am_tempelhofer_berg.geojson`).json();
const feats = site.features as { geometry: any; properties: any }[];

// ---------- DGM1 ----------
const csv = (await Bun.file(`${root}/cache/sites/tempelhofer-berg/dgm1.csv`).text()).trim().split("\n").slice(1);
const E0 = 390380.5, N0 = 5816430.5, W = 300, H = 300;
const dgm = new Float32Array(W * H).fill(NaN);
for (const line of csv) {
  const [x, y, z] = line.split(",").map(Number);
  const i = Math.round(x - E0), j = Math.round(y - N0);
  if (i >= 0 && i < W && j >= 0 && j < H) dgm[j * W + i] = z;
}
/** DGM1 at (e, n), bilinear; NaN outside the survey. */
function ground(e: number, n: number) {
  const fx = e - E0, fy = n - N0;
  if (fx < 0 || fy < 0 || fx > W - 1.001 || fy > H - 1.001) return NaN;
  const i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j, k = j * W + i;
  return (dgm[k] * (1 - u) + dgm[k + 1] * u) * (1 - v) + (dgm[k + W] * (1 - u) + dgm[k + W + 1] * u) * v;
}

// ---------- the building lines ----------
const lineOf = (side: string) => (feats.find((f) => f.properties.kind === "building line" && String(f.properties.side).startsWith(side))!.geometry.coordinates as Pt[]).slice().sort((a, b) => a[1] - b[1]);
const east = lineOf("east"), west = lineOf("west");
/** A building line's easting at northing n, held straight past its ends. */
function lineAt(l: Pt[], n: number) {
  if (n <= l[0][1]) return l[0][0];
  for (let i = 0; i + 1 < l.length; i++) if (n <= l[i + 1][1]) { const t = (n - l[i][1]) / (l[i + 1][1] - l[i][1]); return l[i][0] + t * (l[i + 1][0] - l[i][0]); }
  return l[l.length - 1][0];
}

// ---------- the street's middle and its level ----------
const N_START = 446, N_SURVEY = 728, N_END = 900, LEVEL_FLOOR = 35.5;
const street: { n: number; w: number; e: number; z: number }[] = [];
let slope = 0, last = 0;
for (let n = N_START; n <= N_END; n += 2) {
  const N = 5816000 + n, w = lineAt(west, N), e = lineAt(east, N), mid = (w + e) / 2;
  let z: number;
  if (n <= N_SURVEY) {
    // the middle third of the street's width, averaged across, so a kerb or a parked survey artefact doesn't kink it
    let s = 0, c = 0;
    for (let k = -2; k <= 2; k++) { const g = ground(mid + ((e - w) / 6) * (k / 2), N); if (Number.isFinite(g)) (s += g), (c += 1); }
    z = s / c;
    // the slope the street leaves the survey on: over its last 40 m (DGM1's own edge rows are flatter than the street)
    if (n === N_SURVEY - 4) slope = (z - street.find((q) => q.n === N_SURVEY - 44)!.z) / 40;
  } else {
    // past the survey: the last slope, eased out to the valley floor (assumed)
    const room = Math.max(0, last - LEVEL_FLOOR);
    z = last + slope * 2 * Math.min(1, room / 3);
    if (n === N_SURVEY + 2) z = street[street.length - 2].z + slope * 4;
  }
  street.push({ n, w: r2(w - 390000), e: r2(e - 390000), z: r2(z) });
  last = z;
}

// ---------- the outlines ----------
const toLocal = (p: Pt): Pt => [r2(p[0] - 390000), r2(p[1] - 5816000)];
const rings = (g: any): Pt[][] => (g.type === "Polygon" ? [g.coordinates[0]] : g.coordinates.map((p: Pt[][]) => p[0])).map((r: Pt[]) => r.map(toLocal));
const buildings = feats.filter((f) => ["building", "west row house", "bock hall"].includes(f.properties.kind)).map((f) => ({
  kind: f.properties.kind as string,
  denkmal: f.properties.denkmal ?? null,
  today: f.properties.today ?? f.properties.name ?? null,
  ground: f.properties.ground_nhn ?? f.properties.ground_nhn ?? null,
  storeys1917: f.properties.storeys_1917 ?? null,
  stood1917: f.properties.stood_1917 ?? null,
  rings: rings(f.geometry),
}));
const sites = feats.filter((f) => f.properties.kind === "site").map((f) => ({ denkmal: f.properties.denkmal, rings: rings(f.geometry) }));

// a check against the map lane's own street levels: how far DGM1's middle sits from each
const levels = feats.filter((f) => f.properties.kind === "street level").map((f) => ({ n: f.geometry.coordinates[1] - 5816000, z: f.properties.z_nhn as number }));
const misses = levels.map((l) => { const s = street.find((q) => Math.abs(q.n - l.n) < 1.01); return s ? Math.abs(s.z - l.z) : NaN; }).filter(Number.isFinite);

const out = {
  made: "tools/world/site.ts", from: ["map/sites/am_tempelhofer_berg.geojson", "cache/sites/tempelhofer-berg/dgm1.csv"],
  frame: "local metres: e = E - 390000, n = N - 5816000 (EPSG:25833); the set adds 390000/5816000 and calls toScene",
  origin: ORIGIN, street, buildings, sites,
  surveyEnds: N_SURVEY, assumedPast: "north of n 728 the street's level is its last slope eased out to 35.5 m NHN (assumed)",
};
const path = `${root}/assets/world/sites/tempelhofer-berg.json`;
await Bun.write(path, JSON.stringify(out));
console.log(`site tempelhofer-berg: street ${street.length} rows (${street[0].z}-${street[street.length - 1].z} m), ${buildings.length} outlines, ${sites.length} sites; DGM1 middle vs the map lane's levels: max ${Math.max(...misses).toFixed(2)} m over ${misses.length} points -> ${path}`);
