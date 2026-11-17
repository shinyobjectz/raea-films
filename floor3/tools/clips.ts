// The level's clip check: every placed model and built box, as the renderer draws them (level.ts, build.ts), tested in
// Blender for meshes passing into each other (real triangle intersections, with how deep they go) and for things on a
// desk that float above it or sink into it. Nothing may pass into anything else; what stands on something stands
// 0.5 mm above it.
//   bun tools/clips.ts [--json out/clips.json]      (exits 1 when anything clips)
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { BADGE, FIXTURES, H, PROPS, ROOMS } from "../game/level";
import { CASINGS, COVES, FITS, NOTICE_PINS, NOTICE_SHEET, WALL_FITS, WALL_PIECES, columnBoxes, doorCasing, type Box } from "../game/build";

const root = join(import.meta.dir, "..");
const models = join(root, "assets/models");
type Placed = { name: string; glb: string; at: number[]; yaw: number; scale: number; rests?: boolean };
const placed: Placed[] = [];
const boxes: (Box & { kind: string })[] = [];
const DESK_ITEM = (y: number) => Math.abs(y - 0.7875) < 0.02;

for (const p of PROPS) {
  if (p.file === "afk/column") { columnBoxes(p).forEach((b) => boxes.push({ ...b, kind: "column" })); continue; }
  if (p.file === "afk/carpet-roll") {
    // a cylinder lying along its yaw: tested as its box, which is what it fills to within a few centimetres
    const c = Math.abs(Math.cos(p.yaw)), s = Math.abs(Math.sin(p.yaw)), hx = 1.6 * s + 0.18 * c, hz = 1.6 * c + 0.18 * s;
    boxes.push({ name: p.name, min: [p.at[0] - hx, 0, p.at[2] - hz], max: [p.at[0] + hx, 0.36, p.at[2] + hz], kind: "prop" });
    continue;
  }
  if (p.file === "hallway/door") doorCasing(p).forEach((b) => boxes.push({ ...b, kind: "structure" }));
  placed.push({ name: p.name, glb: join(models, p.file + ".glb"), at: p.at, yaw: p.yaw, scale: p.scale ?? 1, rests: DESK_ITEM(p.at[1]) });
}
FITS.forEach((f, i) => placed.push({ name: `fit-${i}-${f.file}`, glb: join(models, f.file + ".glb"), at: f.at, yaw: f.yaw ?? 0, scale: 1 }));
WALL_FITS.forEach((f, i) => placed.push({ name: `wfit-${i}-${f.file}`, glb: join(models, f.file + ".glb"), at: f.at, yaw: f.yaw ?? 0, scale: 1 }));
placed.push({ name: "badge-desk", glb: join(models, "afk/badge.glb"), at: BADGE, yaw: -1.2, scale: 1, rests: true });

WALL_PIECES.forEach((w) => boxes.push({ name: `wall-${w.name}`, min: [w.x0, w.y0, w.z0], max: [w.x1, w.y1, w.z1], kind: "structure" }));
COVES.forEach((b) => boxes.push({ ...b, kind: "structure" }));
CASINGS.forEach((b) => boxes.push({ ...b, kind: "structure" }));
// the floor and ceiling slabs, kept a hair off the planes things stand on or hang from
ROOMS.forEach((r) => boxes.push({ name: `floor-${r.id}`, min: [r.x0 - 0.2, -0.2, r.z0 - 0.2], max: [r.x1 + 0.2, -0.0003, r.z1 + 0.2], kind: "structure" }));
ROOMS.forEach((r) => boxes.push({ name: `ceil-${r.id}`, min: [r.x0 - 0.2, H + 0.0003, r.z0 - 0.2], max: [r.x1 + 0.2, H + 0.25, r.z1 + 0.2], kind: "structure" }));
FIXTURES.forEach((f) => {
  const along = f.along === "x";
  const h = along ? [0.575, 0.004, 0.275] : [0.275, 0.004, 0.575];
  boxes.push({ name: `lens-${f.id}`, min: [f.x - h[0], H - 0.012 - h[1], f.z - h[2]], max: [f.x + h[0], H - 0.012 + h[1], f.z + h[2]], kind: "structure" });
});
boxes.push({ ...NOTICE_SHEET, kind: "prop" });
NOTICE_PINS.forEach((p) => boxes.push({ name: p.name, min: [p.at[0] - p.r, p.at[1] - p.r, p.at[2] - p.hh], max: [p.at[0] + p.r, p.at[1] + p.r, p.at[2] + p.hh], kind: "prop" }));

const dir = join(root, ".cache/clips");
mkdirSync(dir, { recursive: true });
// what is meant to pass into something: set into it, so none of it shows
const MOUNTS: [string, string, string][] = [
  ["^cor-door-\\d+$", "^wall-", "a door set into its wall"],
  ["^stair-door$", "^wall-", "a door frame set into its opening"],
  ["^fit-\\d+-fit/(diffuser|sprinkler|smoke)$", "^ceil-", "recessed in the ceiling"],
  ["^bay-calendar$", "^wall-", "its nail driven into the wall (its pages hang half a millimetre off it)"],
];
writeFileSync(join(dir, "placed.json"), JSON.stringify({ placed, boxes, mounts: MOUNTS }));
const out = process.argv.includes("--json") ? process.argv[process.argv.indexOf("--json") + 1] : join(dir, "clips.json");
const r = spawnSync("raea", ["blender", "run", "blender/clips.py", join(dir, "placed.json"), out], { cwd: root, encoding: "utf8" });
if (r.status !== 0) { process.stderr.write((r.stdout ?? "") + (r.stderr ?? "")); process.exit(2); }
const res = JSON.parse(readFileSync(out, "utf8")) as { self_z: { model: string; a: string; b: string; area: number; gap: number }[]; clips: { a: string; b: string; depth: number; at: number[] }[]; zfight: { a: string; b: string; area: number; at: number[] }[]; floating: { name: string; gap: number }[]; mounted: number; checked: number };
for (const c of res.clips) console.log(`CLIP  ${(c.depth * 1000).toFixed(1).padStart(6)} mm  ${c.a}  into  ${c.b}  at ${c.at.map((v) => v.toFixed(2)).join(", ")}`);
for (const z of res.zfight) console.log(`ZFIGHT ${(z.area * 1e4).toFixed(1).padStart(5)} cm2  ${z.a}  on  ${z.b}  at ${z.at.map((v) => v.toFixed(2)).join(", ")}`);
for (const z of res.self_z) console.log(`SELF   ${(z.area * 1e4).toFixed(1).padStart(5)} cm2  ${z.model}: ${z.a} and ${z.b} share a face (${(z.gap * 1000).toFixed(2)} mm apart)`);
for (const f of res.floating) console.log(`FLOAT  ${f.gap > 0.0039 ? "  >4" : (f.gap * 1000).toFixed(1).padStart(4)} mm  ${f.name} touches nothing`);
console.log(`${res.checked} things checked: ${res.clips.length} clips, ${res.zfight.length} z-fights, ${res.self_z.length} faces shared inside a model, ${res.floating.length} floating (${res.mounted} set into something, as meant)`);
process.exit(res.clips.length || res.zfight.length || res.self_z.length || res.floating.length ? 1 : 0);
