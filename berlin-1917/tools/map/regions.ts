// Splits a Straube tile into the regions its lines enclose and describes each one. A drawn plan is a set of closed
// shapes (parcels' built parts, courtyards, streets, gardens, water), so a region's average colour and shape say what
// it is far better than any one pixel can. Where "Berlin um 1900" covers the tile, each region also gets its true
// class, so the rule that classifies regions can be measured.
//   out: cache/<slice>/regions/<tile>.csv and <tile>.lab (one u32 region id per pixel, 0 = line)
// usage: bun regions.ts SLICE.json [TILE_ID ...]
import { fill, polygons, readGray, readRGB, size, tiles } from "./raster";
import { AISBER } from "./learn-classes";

const [slicePath, ...only] = process.argv.slice(2);
const slice = await Bun.file(slicePath).json();
const cache = `${import.meta.dir}/../../cache/${slice.name}`;
const aisber = (await Bun.file(`${cache}/berlin1900/b_berlin1900_flaechen.json`).json()).features;
const coverage = (await Bun.file(`${cache}/berlin1900/coverage.json`).json()).features.flatMap((f: any) => polygons(f.geometry));
const LINE = Number(process.env.MAP_LINE ?? 20); // bottom-hat contrast (0-255) above which a pixel is line or lettering
const WIDEN = Number(process.env.MAP_WIDEN ?? 0); // pixels to widen lines by, closing dashed outlines
await Bun.$`mkdir -p ${cache}/regions`;

for (const t of (await tiles(slicePath, 0.25)).filter((t) => !only.length || only.includes(t.id))) {
  const { w, h } = size(t);
  const n = w * h;
  const { px } = await readRGB(`${cache}/rasters/straube/${t.id}.png`);

  // Lines: pixels darker than their surroundings by more than LINE, whatever the fill colour around them.
  const lum = new Uint8Array(n);
  for (let i = 0; i < n; i++) lum[i] = Math.round(0.299 * px[i * 3] + 0.587 * px[i * 3 + 1] + 0.114 * px[i * 3 + 2]);
  const bh = (await readGray(`${cache}/rasters/straube/${t.id}.png`, ["-colorspace", "Gray", "-morphology", "BottomHat", "Disk:3"])).px;
  let line = new Uint8Array(n);
  for (let i = 0; i < n; i++) line[i] = bh[i] > LINE ? 1 : 0;
  for (let k = 0; k < WIDEN; k++) {
    const grown = line.slice();
    for (let i = 0; i < n; i++) if (line[i]) { if (i % w) grown[i - 1] = 1; if ((i + 1) % w) grown[i + 1] = 1; if (i >= w) grown[i - w] = 1; if (i + w < n) grown[i + w] = 1; }
    line = grown;
  }
  const cut = LINE;

  // Dark density in a 9 x 9 window (2.25 m): hatching and lettering are dense, plain fills are not.
  const integral = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += line[y * w + x];
      integral[(y + 1) * (w + 1) + x + 1] = integral[y * (w + 1) + x + 1] + row;
    }
  }
  const dens = (x: number, y: number, r = 4) => {
    const a = Math.max(0, x - r), b = Math.max(0, y - r), c = Math.min(w, x + r + 1), d = Math.min(h, y + r + 1);
    return (integral[d * (w + 1) + c] - integral[b * (w + 1) + c] - integral[d * (w + 1) + a] + integral[b * (w + 1) + a]) / ((c - a) * (d - b));
  };

  // Regions: 4-connected runs of non-line pixels (a one-pixel diagonal line still separates them).
  const lab = new Uint32Array(n);
  const stack = new Int32Array(n);
  let next = 0;
  for (let s = 0; s < n; s++) {
    if (line[s] || lab[s]) continue;
    lab[s] = ++next;
    let top = 0;
    stack[top++] = s;
    while (top) {
      const i = stack[--top], x = i % w;
      for (const j of [i - 1, i + 1, i - w, i + w]) {
        if (j < 0 || j >= n || line[j] || lab[j]) continue;
        if ((j === i - 1 && x === 0) || (j === i + 1 && x === w - 1)) continue;
        lab[j] = next;
        stack[top++] = j;
      }
    }
  }

  // Truth where Berlin um 1900 covers the tile: 0 inside its coverage but in no class = a yard.
  const truth = new Uint8Array(n).fill(255);
  const cover = aisber.filter((f: any) => {
    const b = f.bbox;
    return b && b[2] > t.x0 && b[0] < t.x1 && b[3] > t.y0 && b[1] < t.y1;
  });
  if (cover.length) {
    fill(truth, t, coverage, 0);
    for (const cls of [1, 6, 5, 4, 2, 3])
      fill(truth, t, cover.filter((f: any) => AISBER[f.properties.klassenname] === cls).flatMap((f: any) => polygons(f.geometry)), cls);
  }

  // Per-region sums.
  const R = next + 1;
  const cnt = new Float64Array(R), sr = new Float64Array(R), sg = new Float64Array(R), sb = new Float64Array(R), sd = new Float64Array(R);
  const minx = new Int32Array(R).fill(w), miny = new Int32Array(R).fill(h), maxx = new Int32Array(R), maxy = new Int32Array(R);
  const edge = new Uint8Array(R);
  const th = new Float64Array(R * 8);
  for (let i = 0; i < n; i++) {
    const r = lab[i];
    if (!r) continue;
    const x = i % w, y = (i / w) | 0;
    cnt[r]++;
    sr[r] += px[i * 3];
    sg[r] += px[i * 3 + 1];
    sb[r] += px[i * 3 + 2];
    if ((x & 3) === 0 && (y & 3) === 0) sd[r] += dens(x, y) * 16;
    if (x < minx[r]) minx[r] = x;
    if (x > maxx[r]) maxx[r] = x;
    if (y < miny[r]) miny[r] = y;
    if (y > maxy[r]) maxy[r] = y;
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge[r] = 1;
    th[r * 8 + (truth[i] === 255 ? 7 : truth[i])]++;
  }
  const rows = ["tile,region,px,area_m2,r,g,b,lum,yellow,dens,bw_m,bh_m,fill,edge,truth,purity,covered"];
  for (let r = 1; r < R; r++) {
    const c = cnt[r];
    if (c < 4) continue;
    const mr = sr[r] / c, mg = sg[r] / c, mb = sb[r] / c;
    let best = 0;
    for (let k = 1; k < 8; k++) if (th[r * 8 + k] > th[r * 8 + best]) best = k;
    const bw = (maxx[r] - minx[r] + 1) * t.mpp, bh = (maxy[r] - miny[r] + 1) * t.mpp;
    rows.push(
      [t.id, r, c, (c * t.mpp * t.mpp).toFixed(2), mr.toFixed(1), mg.toFixed(1), mb.toFixed(1), (0.299 * mr + 0.587 * mg + 0.114 * mb).toFixed(1),
        ((mr + mg) / 2 - mb).toFixed(1), (sd[r] / c).toFixed(3), bw.toFixed(1), bh.toFixed(1), ((c * t.mpp * t.mpp) / (bw * bh)).toFixed(3), edge[r],
        best === 7 ? "" : best, (th[r * 8 + best] / c).toFixed(3), best === 7 ? 0 : 1].join(","),
    );
  }
  await Bun.write(`${cache}/regions/${t.id}.csv`, rows.join("\n") + "\n");
  await Bun.write(`${cache}/regions/${t.id}.lab`, lab);
  console.log(`${t.id}: ${next} regions, line cut at luminance ${cut}${cover.length ? ", with truth" : ""}`);
}
