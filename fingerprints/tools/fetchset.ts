// The set's real things, from Poly Haven (CC0): scanned props as glTF, a wooden table top's texture set and a studio's
// light as an HDRI. Downloads into media/set/src/ID/ and writes each a licence sidecar from Poly Haven's own data;
// blender/convert.py then makes media/set/ID.glb of each model. Usage: bun tools/fetchset.ts
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "../media/set");
const UA = { "user-agent": "film-set-fetch/1.0" };
const MODELS = ["Camera_01", "desk_lamp_arm_01", "ceramic_vase_01", "vintage_video_camera", "alarm_clock_01", "brass_vase_01"];
const TEXTURES = ["wood_table_001"];
const HDRIS = ["artist_workshop"];

async function json(url: string) {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json() as Promise<any>;
}
async function save(url: string, to: string) {
  if (existsSync(to)) return;
  mkdirSync(path.dirname(to), { recursive: true });
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  writeFileSync(to, Buffer.from(await r.arrayBuffer()));
}
async function sidecar(id: string, to: string) {
  const info = await json(`https://api.polyhaven.com/info/${id}`);
  writeFileSync(to, JSON.stringify({ source: `https://polyhaven.com/a/${id}`, license: "CC0", credit: `${info.name} by ${Object.keys(info.authors ?? {}).join(", ")} (Poly Haven)` }, null, 1));
}

for (const id of MODELS) {
  const files = await json(`https://api.polyhaven.com/files/${id}`);
  const g = files.gltf?.["1k"]?.gltf ?? files.gltf?.["2k"]?.gltf ?? files.gltf?.["4k"]?.gltf;
  if (!g) throw new Error(`${id}: no glTF`);
  const dir = path.join(ROOT, "src", id);
  await save(g.url, path.join(dir, `${id}.gltf`));
  for (const [rel, inc] of Object.entries(g.include ?? {})) await save((inc as any).url, path.join(dir, rel));
  await sidecar(id, path.join(dir, `${id}.gltf.json`));
  console.log("model", id, Object.keys(g.include ?? {}).length + 1, "files");
}
for (const id of TEXTURES) {
  const files = await json(`https://api.polyhaven.com/files/${id}`);
  for (const [map, name] of [["Diffuse", "diff"], ["nor_gl", "nor_gl"], ["Rough", "rough"]] as const) {
    const f = files[map]?.["2k"]?.jpg;
    if (!f) throw new Error(`${id}: no ${map}`);
    await save(f.url, path.join(ROOT, `${id}_${name}_2k.jpg`));
  }
  await sidecar(id, path.join(ROOT, `${id}.json`));
  console.log("texture", id);
}
for (const id of HDRIS) {
  const files = await json(`https://api.polyhaven.com/files/${id}`);
  await save(files.hdri["2k"].hdr.url, path.join(ROOT, `${id}_2k.hdr`));
  await sidecar(id, path.join(ROOT, `${id}_2k.hdr.json`));
  console.log("hdri", id);
}
