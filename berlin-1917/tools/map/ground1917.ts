// The ground of 1917 at street level. Today's terrain (DGM1) holds basements, building pits, tunnel ramps and rubble
// that 1917 didn't have, but the streets of 1917 are mostly still streets at nearly the same level. So: keep the
// terrain only where 1917 had open street or water, fill everything else smoothly from those cells (pull-push over a
// pyramid, then relaxation), and report how far today's ground departs from it. Then bend it to the Straube plan's own
// spot heights where they disagree (spots.ts; below).
//   in:  cache/<slice>/ground_2m.u16 (ground.sh), map/1917/open.geojson and water.geojson (build.sh), map/1917/spots.geojson
//        (spots.ts, if there)
//   out: map/1917/ground1917_2m.png (16-bit cm, same grid as ground_2m), cache/<slice>/ground1917_2m.f32,
//        cache/<slice>/ground_diff.png (today minus 1917: red higher, blue lower), stats on stdout
// usage: bun ground1917.ts SLICE.json
import { slicePaths } from "./paths";
import { fill, polygons } from "./raster";

// "cache" here is the slice's own products (cache/<sheet> for a city sheet).
const { slice, own: cache, map } = await slicePaths(process.argv[2]);
const head = await Bun.file(`${map}/ground_2m.json`).json();
const W = head.width, H = head.height, cell = head.cell_m;
const [x0, y1] = head.origin_top_left;
const today = new Float32Array(W * H);
const u16 = new Uint16Array(await Bun.file(`${cache}/ground_2m.u16`).arrayBuffer());
for (let i = 0; i < W * H; i++) today[i] = u16[i] / 100;

// Which cells were open street or water in 1917.
const tile = { id: "ground", x0, y0: y1 - H * cell, x1: x0 + W * cell, y1, mpp: cell };
const keep = new Uint8Array(W * H);
const open = (await Bun.file(`${map}/open.geojson`).json()).features.filter((f: any) => f.properties.kind === "street");
const water = (await Bun.file(`${map}/water.geojson`).json()).features;
fill(keep, tile, open.flatMap((f: any) => polygons(f.geometry)), 1);
fill(keep, tile, water.flatMap((f: any) => polygons(f.geometry)), 2);
// Stay a cell clear of building edges: the survey interpolates walls into the street's first metres.
const inner = keep.slice();
for (let y = 1; y < H - 1; y++)
  for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    if (keep[i] === 1 && (!keep[i - 1] || !keep[i + 1] || !keep[i - W] || !keep[i + W])) inner[i] = 0;
  }

// Pull: a pyramid of means of the kept cells. Push: each unknown cell takes its parent's value.
type Level = { w: number; h: number; v: Float32Array; n: Float32Array };
const levels: Level[] = [{ w: W, h: H, v: new Float32Array(W * H), n: new Float32Array(W * H) }];
for (let i = 0; i < W * H; i++) if (inner[i]) (levels[0].v[i] = today[i]), (levels[0].n[i] = 1);
while (levels[levels.length - 1].w > 1 || levels[levels.length - 1].h > 1) {
  const a = levels[levels.length - 1];
  const w = Math.ceil(a.w / 2), h = Math.ceil(a.h / 2);
  const b: Level = { w, h, v: new Float32Array(w * h), n: new Float32Array(w * h) };
  for (let y = 0; y < a.h; y++)
    for (let x = 0; x < a.w; x++) {
      const j = (y >> 1) * w + (x >> 1), i = y * a.w + x;
      b.v[j] += a.v[i] * a.n[i];
      b.n[j] += a.n[i];
    }
  for (let j = 0; j < w * h; j++) if (b.n[j]) (b.v[j] /= b.n[j]), (b.n[j] = Math.min(1, b.n[j]));
  levels.push(b);
}
for (let k = levels.length - 2; k >= 0; k--) {
  const a = levels[k], b = levels[k + 1];
  for (let y = 0; y < a.h; y++)
    for (let x = 0; x < a.w; x++) {
      const i = y * a.w + x;
      if (!a.n[i]) (a.v[i] = b.v[(y >> 1) * b.w + (x >> 1)]), (a.n[i] = 0.5);
    }
}
const g = levels[0].v;
// Relax the filled cells so blocks get a smooth surface rather than steps from the pyramid.
for (let it = 0; it < 200; it++)
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (!inner[i]) g[i] = 0.25 * (g[i - 1] + g[i + 1] + g[i - W] + g[i + W]);
    }

// The plan's spot heights on streets (spots.ts, use: true). Where one disagrees with the ground above by more than
// ONE m even at the best of the ground within NEAR m, the street has changed level since or our map has it wrong (on
// 11-17: today's ground raised over the Alsenviertel in the Spreebogen and over the filled Urbanhafen, a quay at
// Moeckernbruecke, and a street by the Reichstag read as a courtyard and filled from the river). A smooth correction:
// c = sum(k r) / (sum(k) + K0), k a Gaussian of SIGMA m around every spot, r the disagreement (0 for a spot that
// agrees, so it holds its ground); water keeps its level. Between spots far apart the correction is a guess: it
// fades over about 2.5 SIGMA.
const SIGMA = 60, K0 = 0.05, ONE = 1, NEAR = 10;
const spotsFile = Bun.file(`${map}/spots.geojson`);
const bent: string[] = [];
if (await spotsFile.exists()) {
  const at = (x: number, y: number) => {
    const cx = Math.min(W - 1.001, Math.max(0, (x - x0) / cell - 0.5)), cy = Math.min(H - 1.001, Math.max(0, (y1 - y) / cell - 0.5));
    const i = Math.floor(cx), j = Math.floor(cy), fx = cx - i, fy = cy - j, k = j * W + i;
    return (g[k] * (1 - fx) + g[k + 1] * fx) * (1 - fy) + (g[k + W] * (1 - fx) + g[k + W + 1] * fx) * fy;
  };
  const num = new Float32Array(W * H), den = new Float32Array(W * H), reach = Math.ceil((3 * SIGMA) / cell);
  const used = (await spotsFile.json()).features.filter((f: any) => f.properties.use);
  const rs = used.map((f: any) => {
    const [x, y] = f.geometry.coordinates, m = f.properties.printed_m, r0 = m - at(x, y);
    let best = r0;
    for (let r = 2; r <= NEAR; r += 2) for (let a = 0; a < 16; a++) {
      const d = m - at(x + r * Math.cos((a * Math.PI) / 8), y + r * Math.sin((a * Math.PI) / 8));
      if (Math.abs(d) < Math.abs(best)) best = d;
    }
    return Math.abs(best) > ONE ? r0 : 0;
  });
  used.forEach((f: any, n: number) => {
    const [x, y] = f.geometry.coordinates, cx = (x - x0) / cell - 0.5, cy = (y1 - y) / cell - 0.5, r = rs[n];
    if (r) bent.push(`${x.toFixed(0)} ${y.toFixed(0)} ${f.properties.printed_m} by ${r.toFixed(2)}`);
    for (let j = Math.max(0, Math.floor(cy) - reach); j <= Math.min(H - 1, Math.ceil(cy) + reach); j++)
      for (let i = Math.max(0, Math.floor(cx) - reach); i <= Math.min(W - 1, Math.ceil(cx) + reach); i++) {
        const k = Math.exp(-(((i - cx) ** 2 + (j - cy) ** 2) * cell * cell) / (2 * SIGMA * SIGMA));
        (num[j * W + i] += k * r), (den[j * W + i] += k);
      }
  });
  for (let i = 0; i < W * H; i++) if (keep[i] !== 2 && den[i] > 0) g[i] += num[i] / (den[i] + K0);
  console.log(`spot heights: ${used.length} on streets; the ground bent to ${bent.length}: ${bent.join("; ")}`);
}

// Today minus 1917, and what it says.
const diff = new Uint8Array(W * H * 3);
let higher = 0, lower = 0, built = 0;
for (let i = 0; i < W * H; i++) {
  const d = today[i] - g[i];
  if (!keep[i]) built++;
  if (!keep[i] && d > 1.5) higher++;
  if (!keep[i] && d < -1.5) lower++;
  const t = Math.min(1, Math.abs(d) / 5);
  diff[i * 3] = d > 0 ? 255 : Math.round(255 * (1 - t));
  diff[i * 3 + 1] = Math.round(255 * (1 - t));
  diff[i * 3 + 2] = d < 0 ? 255 : Math.round(255 * (1 - t));
}
const out = new Uint16Array(W * H);
for (let i = 0; i < W * H; i++) out[i] = Math.round(g[i] * 100);
await Bun.write(`${cache}/ground1917_2m.f32`, g);
const p = Bun.spawn(["magick", "-size", `${W}x${H}`, "-depth", "16", "-endian", "LSB", "gray:-", "-define", "png:bit-depth=16", `${map}/ground1917_2m.png`], { stdin: "pipe" });
p.stdin.write(new Uint8Array(out.buffer));
await p.stdin.end();
await p.exited;
const q = Bun.spawn(["magick", "-size", `${W}x${H}`, "-depth", "8", "rgb:-", `${cache}/ground_diff.png`], { stdin: "pipe" });
q.stdin.write(diff);
await q.stdin.end();
await q.exited;
let lo = Infinity, hi = -Infinity;
for (const v of g) (lo = Math.min(lo, v)), (hi = Math.max(hi, v));
const kept = inner.reduce((a, v) => a + (v ? 1 : 0), 0);
console.log(`1917 ground ${lo.toFixed(2)}-${hi.toFixed(2)} m from ${kept} street cells (${((100 * kept) / (W * H)).toFixed(0)}% of the slice)`);
console.log(`off-street cells where today's ground is >1.5 m higher: ${((100 * higher) / built).toFixed(1)}%, lower: ${((100 * lower) / built).toFixed(1)}% (pits, basements, ramps)`);
await Bun.write(`${map}/ground1917_2m.json`, JSON.stringify({ ...head, value: "centimetres above NHN, 1917 street level: DGM1 kept on 1917 streets and water, filled smoothly between", z_min_m: +lo.toFixed(2), z_max_m: +hi.toFixed(2) }, null, 1));

