// Shows the Straube reader's work on tiles: the plan, the 1900 truth (where there is one) and the reading, side by
// side, each class in its own colour (open pale, private tan, public red-brown, water blue, green, rail grey; no
// label black). Wrong pixels are marked magenta in a fourth panel when there is a truth.
// usage: bun view.ts CACHE OUT.jpg TILE...
import { $ } from "bun";

const [cache, out, ...tiles] = process.argv.slice(2);
const COLOURS = [[0, 0, 0], [248, 242, 228], [220, 193, 150], [184, 128, 106], [169, 194, 198], [197, 204, 162], [150, 140, 128]];
const PX = 2000, SHOW = 700;

async function gray(path: string): Promise<Uint8Array | null> {
  if (!(await Bun.file(path).exists())) return null;
  return new Uint8Array(await $`magick ${path} -resize ${PX}x${PX}! -depth 8 gray:-`.arrayBuffer());
}
async function rgb(path: string, data: Uint8Array) {
  const p = Bun.spawn(["magick", "-size", `${PX}x${PX}`, "-depth", "8", "rgb:-", "-filter", "point", "-resize", `${SHOW}x${SHOW}`, path], { stdin: "pipe" });
  p.stdin.write(data);
  await p.stdin.end();
  await p.exited;
}
const paint = (lab: Uint8Array) => {
  const o = new Uint8Array(PX * PX * 3);
  for (let i = 0; i < PX * PX; i++) o.set(COLOURS[lab[i]] ?? [255, 0, 255], i * 3);
  return o;
};

const rows: string[] = [];
for (const id of tiles) {
  const dir = `${import.meta.dir}/../../../cache/view`;
  await $`mkdir -p ${dir}`;
  const truth = await gray(`${cache}/train/${id}.png`);
  const pred = await gray(`${cache}/pred/${id}.png`);
  const panels = [`${dir}/${id}_plan.jpg`];
  await $`magick ${cache}/rasters/straube/${id}.png -resize ${SHOW}x${SHOW} ${panels[0]}`;
  if (truth) await rgb(`${dir}/${id}_truth.png`, paint(truth)), panels.push(`${dir}/${id}_truth.png`);
  if (pred) await rgb(`${dir}/${id}_pred.png`, paint(pred)), panels.push(`${dir}/${id}_pred.png`);
  if (truth && pred) {
    const o = new Uint8Array(PX * PX * 3);
    let n = 0, wrong = 0;
    for (let i = 0; i < PX * PX; i++) {
      const v = truth[i] ? (truth[i] === pred[i] ? 210 : 0) : 120;
      o.set(truth[i] && truth[i] !== pred[i] ? [255, 0, 200] : [v, v, v], i * 3);
      if (truth[i]) (n++, truth[i] !== pred[i] && wrong++);
    }
    await rgb(`${dir}/${id}_err.png`, o);
    panels.push(`${dir}/${id}_err.png`);
    console.log(`${id}: ${((100 * wrong) / Math.max(1, n)).toFixed(1)}% of labelled pixels wrong`);
  }
  const row = `${dir}/${id}_row.jpg`;
  await $`magick ${panels} -bordercolor ${"#111"} -border 6 +append ${row}`;
  rows.push(row);
}
await $`magick ${rows} -append -quality 88 ${out}`;
console.log(`ok ${out}`);
