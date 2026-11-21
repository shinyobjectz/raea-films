// Training labels for the Straube reader: "Berlin um 1900" drawn onto each tile it touches, moved by the tile's
// measured offset so every label sits on the scan. 0 = no label (outside its coverage), then the classes below.
//   out: cache/<slice>/train/<tile>.png (one class per pixel, 0.25 m) and cache/<slice>/train/index.json
// usage: bun prep.ts SLICE.json HOLDOUT_TILE [HOLDOUT_TILE ...]
import { fill, polygons, size, tiles, writeGray } from "../raster";
import { AISBER } from "../learn-classes";

export const MODEL_CLASSES = ["none", "open", "building", "public", "water", "green", "rail"];
const [slicePath, ...holdout] = process.argv.slice(2);
const slice = await Bun.file(slicePath).json();
const cache = `${import.meta.dir}/../../../cache/${slice.name}`;
const feats = (await Bun.file(`${cache}/berlin1900/b_berlin1900_flaechen.json`).json()).features;
const cov = (await Bun.file(`${cache}/berlin1900/coverage.json`).json()).features.flatMap((f: any) => polygons(f.geometry));
const shift = await Bun.file(`${cache}/align_straube_berlin1900.json`).json().catch(() => ({}));
await Bun.$`mkdir -p ${cache}/train`;

const index: { tile: string; split: string; labelled: number; dx: number; dy: number }[] = [];
for (const t of await tiles(slicePath, 0.25)) {
  const s = shift[t.id] ?? { dx: 0, dy: 0 };
  // Labels at world q come from Berlin um 1900 at q - shift, so the grid is laid over the shifted tile.
  const g = { ...t, x0: t.x0 - s.dx, x1: t.x1 - s.dx, y0: t.y0 - s.dy, y1: t.y1 - s.dy };
  const { w, h } = size(t);
  const lab = new Uint8Array(w * h);
  fill(lab, g, cov, 255); // inside the coverage but in no class: there is none in this data, keep as no label
  for (const c of [1, 6, 5, 4, 2, 3]) fill(lab, g, feats.filter((f: any) => AISBER[f.properties.klassenname] === c).flatMap((f: any) => polygons(f.geometry)), c);
  let n = 0;
  for (let i = 0; i < lab.length; i++) {
    if (lab[i] === 255) lab[i] = 0;
    if (lab[i]) n++;
  }
  if (n < 0.05 * lab.length) continue;
  await writeGray(`${cache}/train/${t.id}.png`, w, h, lab);
  index.push({ tile: t.id, split: holdout.includes(t.id) ? "holdout" : "train", labelled: +(n / lab.length).toFixed(3), dx: s.dx, dy: s.dy });
  console.log(`${t.id} ${holdout.includes(t.id) ? "holdout" : "train  "} ${(100 * n / lab.length).toFixed(0)}% labelled, shift ${s.dx} E ${s.dy} N`);
}
await Bun.write(`${cache}/train/index.json`, JSON.stringify({ classes: MODEL_CLASSES, tiles: index }, null, 1));
