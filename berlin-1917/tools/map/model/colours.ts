// How blue (or, with MEASURE=lum, how bright) each true class is on the plan: percentiles of (blue - red) over the 1900 truth's pixels, per class.
// usage: bun colours.ts CACHE
import { $ } from "bun";
const cache = process.argv[2];
const index = await Bun.file(`${cache}/train/index.json`).json();
const ids: string[] = index.tiles.map((t: any) => t.tile);
const by: number[][] = Array.from({ length: 7 }, () => []);
for (const id of ids) {
  const lab = new Uint8Array(await $`magick ${cache}/train/${id}.png -depth 8 gray:-`.arrayBuffer());
  const rgb = new Uint8Array(await $`magick ${cache}/rasters/straube/${id}.png -resize 2000x2000! -depth 8 rgb:-`.arrayBuffer());
  for (let i = 0; i < lab.length; i += 7) if (lab[i]) by[lab[i]].push(process.env.MEASURE === "lum" ? Math.round(0.3 * rgb[i * 3] + 0.59 * rgb[i * 3 + 1] + 0.11 * rgb[i * 3 + 2]) : rgb[i * 3 + 2] - rgb[i * 3]);
}
const names = ["none", "open", "building", "public", "water", "green", "rail"];
for (let c = 1; c < 7; c++) {
  const v = by[c].sort((a, b) => a - b), q = (p: number) => v[Math.floor(p * (v.length - 1))];
  console.log(`${names[c].padEnd(9)} n=${v.length}  ${process.env.MEASURE ?? "blue-red"} p5 ${q(0.05)}  p25 ${q(0.25)}  p50 ${q(0.5)}  p75 ${q(0.75)}  p95 ${q(0.95)}`);
}
