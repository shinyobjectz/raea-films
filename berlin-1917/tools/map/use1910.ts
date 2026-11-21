// What every 1917 building was used for, from the land-use map "Städtebauliche Entwicklung Berlins: Berlin um 1910"
// (Geoportal WMS staedtebauliche_entwicklung, layer berlin_1910; dl-de/zero-2.0). The map colours each block by its
// use (its legend: WMS GetLegendGraphic), lays a darker grey over public buildings, and marks continuous shop fronts
// with a strip of the mixed-use colour along the street. Its thin lines and lettering are the 1980-85 base map, which
// the vote below outweighs.
// Per 500 m tile at 0.5 m:
//   1. each pixel to a class (use1910px.ts: the nearest colour sampled from the map, overprint on thin marks dropped);
//   2. the tile's shift: the one within +-12 m that best puts our streets (open.geojson, kind street) on the map's
//      street colours (IoU); a tile whose best is under MINGAIN better than no shift takes the median of the others;
//   3. each building's pixels, shifted, vote: its use is the most common use other than street, with that use's
//      share of the vote, and public_1910 is the share under the public-building overprint.
// out: buildings.geojson gains use (USES, or null with under 2 m2 of vote), use_share, public_1910;
//      cache/<slice>/use1910/<tile>.png the classes (overprint +16) and use1910.json the shifts.
// usage: bun use1910.ts SLICE.json
import { fill, polygons, tiles, writeGray } from "./raster";
import { slicePaths } from "./paths";
import { classify, OVER, STREET, USES, W } from "./use1910px";

const slicePath = process.argv[2] ?? `${import.meta.dir}/slice.json`;
const { cache, own: ownDir, map } = await slicePaths(slicePath);
const MINGAIN = 0.02;

const ts = await tiles(slicePath, 0.5);
const open = await Bun.file(`${map}/open.geojson`).json();
const streets = open.features.filter((f: any) => f.properties.kind === "street").map((f: any) => polygons(f.geometry)).flat();
const bj = await Bun.file(`${map}/buildings.geojson`).json();
const feats: any[] = bj.features;
const bbox = feats.map((f) => { const xs: number[] = [], ys: number[] = []; for (const p of polygons(f.geometry)) for (const r of p) for (const [x, y] of r) (xs.push(x), ys.push(y)); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; });

/** IoU of ours (0/1) against the map's street class looked up at (x + sx, y + sy), on every `step`-th pixel. */
function iou(ours: Uint8Array, cls: Uint8Array, sx: number, sy: number, step: number) {
  let i = 0, u = 0;
  for (let y = 0; y < W; y += step) {
    const my = y + sy;
    if (my < 0 || my >= W) continue;
    for (let x = 0; x < W; x += step) {
      const mx = x + sx;
      if (mx < 0 || mx >= W) continue;
      const a = ours[y * W + x], b = cls[my * W + mx] === STREET ? 1 : 0;
      if (a || b) (u++, a && b && i++);
    }
  }
  return u ? i / u : 0;
}

await Bun.$`mkdir -p ${cache}/use1910`;
const classes = new Map<string, Uint8Array>(), shifts: Record<string, { sx: number; sy: number; iou0: number; iou: number; own: boolean }> = {};
for (const t of ts) {
  const cls = await classify(`${cache}/rasters/use1910/${t.id}.png`);
  classes.set(t.id, cls);
  await writeGray(`${cache}/use1910/${t.id}.png`, W, W, cls);
  const ours = new Uint8Array(W * W);
  fill(ours, t, streets, 1);
  // Coarse at 2 m over +-12 m, then 0.5 m within +-2 m of the best.
  let best = { sx: 0, sy: 0, v: -1 };
  for (let sy = -24; sy <= 24; sy += 4) for (let sx = -24; sx <= 24; sx += 4) { const v = iou(ours, cls, sx, sy, 4); if (v > best.v) best = { sx, sy, v }; }
  const c = best;
  for (let sy = c.sy - 4; sy <= c.sy + 4; sy++) for (let sx = c.sx - 4; sx <= c.sx + 4; sx++) { const v = iou(ours, cls, sx, sy, 1); if (v > best.v) best = { sx, sy, v }; }
  const iou0 = iou(ours, cls, 0, 0, 1), fine = iou(ours, cls, best.sx, best.sy, 1);
  shifts[t.id] = { sx: best.sx, sy: best.sy, iou0: +iou0.toFixed(3), iou: +fine.toFixed(3), own: fine - iou0 >= MINGAIN };
}
const own = Object.values(shifts).filter((s) => s.own);
const med = (v: number[]) => v.sort((a, b) => a - b)[v.length >> 1] ?? 0;
const msx = med(own.map((s) => s.sx)), msy = med(own.map((s) => s.sy));
for (const s of Object.values(shifts)) if (!s.own) (s.sx = msx), (s.sy = msy);
await Bun.write(`${cache}/use1910.json`, JSON.stringify(shifts, null, 1));

// Built-up land on the 1910 map in 25 m cells (half or more of a cell's pixels a built use: residential to utility, not military),
// shifted as the vote is: build.sh cuts vacant land with them. The plan leaves the towns beyond Berlin's 1910 boundary
// blank (Charlottenburg, Schöneberg, Rixdorf), so build.sh reads their streets and blocks as vacant land; the land-use
// map draws them built up.
const CELL = 50, cells: string[] = ["x0,y0,x1,y1"];
for (const t of ts) {
  const cls = classes.get(t.id)!, { sx, sy } = shifts[t.id];
  for (let cy = 0; cy < W; cy += CELL) for (let cx = 0; cx < W; cx += CELL) {
    let b = 0, n = 0;
    for (let y = cy; y < cy + CELL; y++) for (let x = cx; x < cx + CELL; x++) {
      const mx = x + sx, my = y + sy;
      if (mx < 0 || mx >= W || my < 0 || my >= W) continue;
      const c = cls[my * W + mx] & 15;
      n++;
      if (c >= 1 && c <= 8 && c !== 7) b++; // not military: the Tempelhofer Feld is a parade ground
    }
    if (n && b >= n / 2) { const x0 = t.x0 + cx / 2, y1 = t.y1 - cy / 2; cells.push(`${x0},${y1 - CELL / 2},${x0 + CELL / 2},${y1}`); }
  }
}
await Bun.write(`${ownDir}/built1910.csv`, cells.join("\n") + "\n");

// The vote, tile by tile (a building across a tile edge votes in each).
const votes = new Uint32Array(feats.length * 32);
for (const t of ts) {
  const ids = new Int32Array(W * W), cls = classes.get(t.id)!, { sx, sy } = shifts[t.id];
  feats.forEach((f, k) => { const [a, b, c, d] = bbox[k]; if (c >= t.x0 && a <= t.x1 && d >= t.y0 && b <= t.y1) fill(ids, t, polygons(f.geometry), k + 1); });
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const k = ids[y * W + x];
    if (!k) continue;
    const mx = x + sx, my = y + sy;
    if (mx >= 0 && mx < W && my >= 0 && my < W) votes[(k - 1) * 32 + cls[my * W + mx]]++;
  }
}
const tally: Record<string, number> = {}, agree = { pub: [0, 0], priv: [0, 0] };
feats.forEach((f, k) => {
  const v = votes.subarray(k * 32, k * 32 + 32), use = new Array(12).fill(0);
  let all = 0, over = 0;
  for (let c = 1; c < 32; c++) if (v[c]) ((all += v[c]), c & OVER && (over += v[c]), (c & 15) !== STREET && (use[c & 15] += v[c]));
  const n = use.reduce((a, b) => a + b, 0), top = use.indexOf(Math.max(...use));
  const p = f.properties;
  p.use = n >= 8 ? USES[top] : null;
  p.use_share = n >= 8 ? +(use[top] / n).toFixed(2) : null;
  p.public_1910 = all ? +(over / all).toFixed(2) : null;
  tally[p.use ?? "none"] = (tally[p.use ?? "none"] ?? 0) + 1;
  const row = p.kind === "public" ? agree.pub : agree.priv;
  row[(p.public_1910 ?? 0) >= 0.5 ? 1 : 0]++;
});
const head = (await Bun.file(`${map}/buildings.geojson`).text()).split('"features"')[0];
await Bun.write(`${map}/buildings.geojson`, `${head}"features": [\n${feats.map((f) => JSON.stringify(f)).join(",\n")}\n]\n}\n`);

const sh = Object.values(shifts);
console.log(`shifts: ${own.length} of ${sh.length} tiles fitted on our streets (median ${msx / 2}, ${msy / 2} m); street IoU ${med(sh.map((s) => s.iou0)).toFixed(2)} -> ${med(sh.map((s) => s.iou)).toFixed(2)} (median)`);
console.log(`use: ${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(", ")}`);
console.log(`under the 1910 public overprint (>= half): ${agree.pub[1]} of ${agree.pub[0] + agree.pub[1]} of our public buildings, ${agree.priv[1]} of ${agree.priv[0] + agree.priv[1]} private`);
