// A scanned tree's leaves come as alpha-BLENDED cards, which the ray-traced light draws as pale sheets (NOTES.md,
// engine gaps). This sets those materials to an alpha MASK (cut out at 0.5), in place:
//   bun tools/glb-alpha-mask.ts media/models/garden/tree.glb ...
import { readFileSync, writeFileSync } from "fs";
for (const f of process.argv.slice(2)) {
  const b = readFileSync(f), len = b.readUInt32LE(12), j = JSON.parse(b.subarray(20, 20 + len).toString()), rest = b.subarray(20 + len);
  let n = 0;
  for (const m of j.materials ?? []) if (m.alphaMode === "BLEND") { m.alphaMode = "MASK"; m.alphaCutoff = 0.5; n++; }
  let s = Buffer.from(JSON.stringify(j)); while (s.length % 4) s = Buffer.concat([s, Buffer.from(" ")]);
  const head = Buffer.alloc(20); b.copy(head, 0, 0, 12); head.writeUInt32LE(20 + s.length + rest.length, 8); head.writeUInt32LE(s.length, 12); head.writeUInt32LE(0x4e4f534a, 16);
  writeFileSync(f, Buffer.concat([head, s, rest])); console.log(f, n, "materials masked");
}
