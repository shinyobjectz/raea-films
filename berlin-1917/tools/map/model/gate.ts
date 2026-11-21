// Water only where the plan is blue. On the 1900 truth, water's blue-minus-red is -8 or more for 95% of its pixels
// and every other class's -21 or less (colours.ts), but the reader, trained on little parkland, calls the pale big
// parks of the west water. Water where the plan (blurred BLUR px) has blue - red <= CUT becomes green.
// (Tried and dropped, 11-16: one class per building by the plan's brightness. Pieces between the plan's lines are
// often whole blocks, and on a holdout tile public IoU fell from 0.71 to 0.18; the reader's own call is better.)
// Railway land only where the plan is lilac: the reader, trained on Alt-Berlin where rail is mostly the Stadtbahn
// viaduct, reads the Anhalter and Potsdamer yards as open ground (rail 0.24 IoU). The plan tints yard land a pale
// lilac (#E5D8CA: less yellow than the courtyards' #EBE3CB and the streets' #E1CE9A). Open ground or park inside a
// lilac piece of at least LILAC m2 (default 2000; specks of paper tint are smaller) becomes rail. On the 15 truth
// tiles the filtered mask takes 0.0% of open ground, buildings, water and parks (lilac_eval, 11-17).
// Keeps the reader's own output in pred_raw/ and writes the gated classes to pred/. With a truth (train/<tile>.png)
// it prints the water and green IoU before and after.
// usage: [CUT=-15 BLUR=2] bun gate.ts CACHE TILE...
import { $ } from "bun";

const [cache, ...tiles] = process.argv.slice(2);
const CUT = +(process.env.CUT ?? -15), BLUR = +(process.env.BLUR ?? 2), PX = 2000, LILAC = +(process.env.LILAC ?? 2000);

/** The plan's lilac (railway land) as a 0/255 mask: blurred 1.5 px, gated by colour, opened 3 px and closed 6 px (the
 *  track lines drawn across it), and only pieces of at least LILAC m2 (0.0625 m2 a pixel) kept. */
async function lilacMask(png: string): Promise<Uint8Array> {
  const rgb = new Uint8Array(await $`magick ${png} -resize ${PX}x${PX}! -blur 0x1.5 -depth 8 rgb:-`.arrayBuffer());
  const m = new Uint8Array(PX * PX);
  for (let i = 0; i < m.length; i++) {
    const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
    m[i] = (r + g) / 2 - b < 26 && r - g > 8 && r > 205 && r - b > 18 ? 255 : 0;
  }
  const p = Bun.spawn(["magick", "-size", `${PX}x${PX}`, "-depth", "8", "gray:-", "-morphology", "Open", "Disk:3", "-morphology", "Close", "Disk:6",
    "-define", `connected-components:area-threshold=${LILAC * 16}`, "-define", "connected-components:mean-color=true", "-connected-components", "8",
    "-threshold", "50%", "-depth", "8", "gray:-"], { stdin: "pipe", stdout: "pipe" });
  p.stdin.write(m);
  await p.stdin.end();
  return new Uint8Array(await new Response(p.stdout).arrayBuffer());
}
await $`mkdir -p ${cache}/pred_raw`;
const iou = (t: Uint8Array, p: Uint8Array, c: number) => {
  let i = 0, u = 0;
  for (let k = 0; k < t.length; k++) if (t[k] && (t[k] === c || p[k] === c)) (u++, t[k] === c && p[k] === c && i++);
  return u ? (i / u).toFixed(3) : "-";
};
for (const id of tiles) {
  const raw = `${cache}/pred_raw/${id}.png`;
  if (!(await Bun.file(raw).exists())) await $`cp ${cache}/pred/${id}.png ${raw}`;
  const lab = new Uint8Array(await $`magick ${raw} -depth 8 gray:-`.arrayBuffer());
  const before = lab.slice();
  const rgb = new Uint8Array(await $`magick ${cache}/rasters/straube/${id}.png -resize ${PX}x${PX}! -blur 0x${BLUR} -depth 8 rgb:-`.arrayBuffer());
  // Buildings are never blue either (blue - red -27 or less for 95% of public pixels, -31 private): a built pixel
  // where the plan is blue is the U-Bahn's tunnel band drawn over a street, so it becomes open ground.
  let water = 0, moved = 0, tunnel = 0, yard = 0;
  const lilac = await lilacMask(`${cache}/rasters/straube/${id}.png`);
  for (let i = 0; i < lab.length; i++) {
    if (lilac[i] && (lab[i] === 1 || lab[i] === 5)) { lab[i] = 6; yard++; continue; }
    const blue = rgb[i * 3 + 2] - rgb[i * 3] > CUT;
    if (lab[i] === 4) (water++, !blue && ((lab[i] = 5), moved++));
    else if ((lab[i] === 2 || lab[i] === 3) && blue) (lab[i] = 1), tunnel++;
  }
  const p = Bun.spawn(["magick", "-size", `${PX}x${PX}`, "-depth", "8", "gray:-", `${cache}/pred/${id}.png`], { stdin: "pipe" });
  p.stdin.write(lab);
  await p.stdin.end();
  await p.exited;
  if (!water && !tunnel && !yard) continue;
  let line = `${id}: lilac yard land ${((100 * yard) / lab.length).toFixed(1)}% of the tile -> rail; water ${((100 * water) / lab.length).toFixed(1)}% of the tile, ${((100 * moved) / Math.max(1, water)).toFixed(0)}% of it not blue -> green; blue built ${((100 * tunnel) / lab.length).toFixed(2)}% -> open`;
  const truth = `${cache}/train/${id}.png`;
  if (await Bun.file(truth).exists()) {
    const t = new Uint8Array(await $`magick ${truth} -depth 8 gray:-`.arrayBuffer());
    line += `; IoU water ${iou(t, before, 4)} -> ${iou(t, lab, 4)}, green ${iou(t, before, 5)} -> ${iou(t, lab, 5)}, public ${iou(t, before, 3)} -> ${iou(t, lab, 3)}, rail ${iou(t, before, 6)} -> ${iou(t, lab, 6)}, open ${iou(t, before, 1)} -> ${iou(t, lab, 1)}`;
  }
  console.log(line);
}
