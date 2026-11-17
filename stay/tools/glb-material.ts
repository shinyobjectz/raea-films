// A copy of a .glb with one material's base colour (and alpha) changed, and optionally its alpha mode:
//   bun tools/glb-material.ts IN.glb OUT.glb MATERIAL r g b a [BLEND|MASK|OPAQUE] [roughness]
// (the window's glass and the rain on it are alpha-blended white, which the ray-traced light draws as pale sheets; the
// night window wants a clear dark pane and beads that are mostly light coming through)
import { readFileSync, writeFileSync } from "fs";
const [src, out, name, r, g, b, a, mode, rough] = process.argv.slice(2);
const buf = readFileSync(src), len = buf.readUInt32LE(12), j = JSON.parse(buf.subarray(20, 20 + len).toString()), rest = buf.subarray(20 + len);
const m = (j.materials ?? []).find((x: { name: string }) => x.name === name);
if (!m) throw new Error(`${src} has no material ${name}`);
m.pbrMetallicRoughness = { ...(m.pbrMetallicRoughness ?? {}), baseColorFactor: [Number(r), Number(g), Number(b), Number(a)], ...(rough ? { roughnessFactor: Number(rough) } : {}) };
if (mode) { m.alphaMode = mode; if (mode === "OPAQUE") delete m.alphaMode; }
let s = Buffer.from(JSON.stringify(j)); while (s.length % 4) s = Buffer.concat([s, Buffer.from(" ")]);
const head = Buffer.alloc(20); buf.copy(head, 0, 0, 12); head.writeUInt32LE(20 + s.length + rest.length, 8); head.writeUInt32LE(s.length, 12); head.writeUInt32LE(0x4e4f534a, 16);
writeFileSync(out, Buffer.concat([head, s, rest])); console.log(out);
