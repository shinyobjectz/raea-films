// Measures the scanned maps against "Berlin um 1900" (vectors traced from the same Straube plan) on tiles inside its
// coverage: the colour of each true class in the Straube scan and the 1910 land-use map, and how well a plain
// nearest-colour rule separates them. Prints a report; writes cache/<slice>/learn.json with the class colours.
// usage: bun learn.ts SLICE.json TILE_ID [TILE_ID ...]
import { fill, polygons, readRGB, size, tiles } from "./raster";

import { AISBER, CLASSES } from "./learn-classes";

const [slicePath, ...ids] = process.argv.slice(2);
const slice = await Bun.file(slicePath).json();
const cache = `${import.meta.dir}/../../cache/${slice.name}`;
const gj = await Bun.file(`${cache}/berlin1900/b_berlin1900_flaechen.json`).json();
const all = (await tiles(slicePath, 0.25)).filter((t) => ids.includes(t.id));

const N = CLASSES.length;
const sum = { straube: new Float64Array(N * 3), use: new Float64Array(N * 3) };
const sq = { straube: new Float64Array(N * 3), use: new Float64Array(N * 3) };
const count = new Float64Array(N);
const samples: { truth: number; s: number[]; u: number[] }[] = [];

for (const t of all) {
  const { w, h } = size(t);
  const truth = new Uint8Array(w * h); // 0 = yard (inside the coverage, in no class)
  // Streets first, then everything drawn over them, so overlaps resolve to the more specific class.
  for (const cls of [1, 6, 5, 4, 2, 3])
    fill(truth, t, gj.features.filter((f: any) => AISBER[f.properties.klassenname] === cls).flatMap((f: any) => polygons(f.geometry)), cls);
  const s = (await readRGB(`${cache}/rasters/straube/${t.id}.png`)).px;
  const u = (await readRGB(`${cache}/rasters/use1910/${t.id}.png`, w, h)).px;
  let labelled = 0;
  for (let i = 0; i < w * h; i++) {
    const c = truth[i];
    if (c) labelled++;
    count[c]++;
    for (let k = 0; k < 3; k++) {
      sum.straube[c * 3 + k] += s[i * 3 + k];
      sq.straube[c * 3 + k] += s[i * 3 + k] ** 2;
      sum.use[c * 3 + k] += u[i * 3 + k];
      sq.use[c * 3 + k] += u[i * 3 + k] ** 2;
    }
    if (i % 97 === 0) samples.push({ truth: c, s: [s[i * 3], s[i * 3 + 1], s[i * 3 + 2]], u: [u[i * 3], u[i * 3 + 1], u[i * 3 + 2]] });
  }
  console.log(`tile ${t.id}: ${((100 * labelled) / (w * h)).toFixed(1)}% labelled by Berlin um 1900`);
}

const hex = (v: number[]) => "#" + v.map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
const mean = (m: "straube" | "use", c: number) => [0, 1, 2].map((k) => sum[m][c * 3 + k] / count[c]);
const sd = (m: "straube" | "use", c: number) =>
  [0, 1, 2].map((k) => Math.sqrt(sq[m][c * 3 + k] / count[c] - (sum[m][c * 3 + k] / count[c]) ** 2));

console.log("\nclass        share   straube mean (sd)            use1910 mean (sd)");
for (let c = 0; c < N; c++) {
  const share = (100 * count[c]) / count.reduce((a, b) => a + b, 0);
  console.log(
    `${CLASSES[c].padEnd(10)} ${share.toFixed(1).padStart(6)}%   ${hex(mean("straube", c))} (${sd("straube", c).map((x) => x.toFixed(0)).join(",")})`.padEnd(52) +
      `${hex(mean("use", c))} (${sd("use", c).map((x) => x.toFixed(0)).join(",")})`,
  );
}

// Nearest class mean, per pixel, on each map and on both together: how separable are the classes by colour alone?
function confusion(name: string, feat: (x: { s: number[]; u: number[] }) => number[], centre: (c: number) => number[]) {
  const m = Array.from({ length: N }, () => new Array(N).fill(0));
  const cs = Array.from({ length: N }, (_, c) => centre(c));
  for (const x of samples) {
    const f = feat(x);
    let best = 0, bd = Infinity;
    for (let c = 0; c < N; c++) {
      const d = f.reduce((a, v, k) => a + (v - cs[c][k]) ** 2, 0);
      if (d < bd) (bd = d), (best = c);
    }
    m[x.truth][best]++;
  }
  console.log(`\n${name}: rows = truth, columns = nearest colour (% of the row)`);
  console.log("".padEnd(10) + CLASSES.map((c) => c.slice(0, 7).padStart(8)).join(""));
  for (let r = 0; r < N; r++) {
    const tot = m[r].reduce((a, b) => a + b, 0) || 1;
    console.log(CLASSES[r].padEnd(10) + m[r].map((v) => ((100 * v) / tot).toFixed(0).padStart(8)).join(""));
  }
}
confusion("Straube alone", (x) => x.s, (c) => mean("straube", c));
confusion("1910 land use alone", (x) => x.u, (c) => mean("use", c));
confusion("both", (x) => [...x.s, ...x.u], (c) => [...mean("straube", c), ...mean("use", c)]);

await Bun.write(
  `${cache}/learn.json`,
  JSON.stringify(
    Object.fromEntries(CLASSES.map((n, c) => [n, { straube: mean("straube", c), use1910: mean("use", c), pixels: count[c] }])),
    null,
    1,
  ),
);
