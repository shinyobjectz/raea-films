// A raw .rseq (blender/studies/ocean.py) rewritten with each frame's blob zstd-compressed, as the engine reads it.
//   bun tools/rseq-zstd.ts IN.raw.rseq OUT.rseq
const [src, dst] = process.argv.slice(2);
const buf = new Uint8Array(await Bun.file(src).arrayBuffer());
const dv = new DataView(buf.buffer);
if (new TextDecoder().decode(buf.subarray(0, 4)) !== "RSEQ") throw new Error(`${src}: not a mesh sequence`);
const n = dv.getUint32(8, true);
const head = JSON.parse(new TextDecoder().decode(buf.subarray(12, 12 + n)));
const blobs = (head.index as [number, number][]).map(([o, l]) => Bun.zstdCompressSync(buf.subarray(o, o + l), { level: 9 }));
head.codec = "zstd";
let hj = new Uint8Array();
for (let pass = 0; pass < 3; pass++) {
  hj = new TextEncoder().encode(JSON.stringify(head));
  let off = 12 + hj.length;
  head.index = blobs.map((b) => { const e = [off, b.length]; off += b.length; return e; });
}
hj = new TextEncoder().encode(JSON.stringify(head));
const pre = new Uint8Array(12);
pre.set(new TextEncoder().encode("RSEQ"));
new DataView(pre.buffer).setUint32(4, 1, true);
new DataView(pre.buffer).setUint32(8, hj.length, true);
await Bun.write(dst, new Blob([pre, hj, ...blobs]));
console.log(`${dst}: ${blobs.length} frames, ${(blobs.reduce((a, b) => a + b.length, 0) / 1e6).toFixed(1)} MB (raw ${(buf.length / 1e6).toFixed(1)} MB)`);
