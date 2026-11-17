// The glade's fog as a 3D density (the director, 11-12: "on the forest scene i was hoping for volumetric fog"): an even haze
// read as a flat grey, so the fog is given body. Banks and wisps of it (fBm of value noise, its middle pushed apart
// so there are clear pockets between them), thicker near the ground and thinning upward, written as an uncompressed
// KTX2 3D texture (R8, linear) for <FogVolume density_texture>, which scales the volume's density through its box.
//   bun tools/fog-noise.ts [out=media/fog/glade.ktx2] [nx=128] [ny=32] [nz=128] [seed=7]
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const [out = "media/fog/glade.ktx2", sx = "128", sy = "32", sz = "128", sd = "7"] = process.argv.slice(2);
const NX = +sx, NY = +sy, NZ = +sz, SEED = +sd;

const hash = (x: number, y: number, z: number) => {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + SEED * 144665) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
const sm = (t: number) => t * t * (3 - 2 * t);
function vnoise(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), u = sm(x - xi), v = sm(y - yi), w = sm(z - zi);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz);
  return l(l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v), l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v), w);
}
function fbm(x: number, y: number, z: number) {
  let s = 0, a = 0.5, f = 1;
  for (let o = 0; o < 5; o++) { s += a * vnoise(x * f, y * f, z * f); a *= 0.5; f *= 2.03; }
  return s / 0.97;
}

const data = new Uint8Array(NX * NY * NZ);
for (let z = 0; z < NZ; z++) for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
  const h = y / (NY - 1);
  // (stretched sideways: fog lies in banks, wider than tall; a slow warp so the banks wander instead of sitting on a grid)
  const wx = x / 14 + 1.5 * fbm(x / 40, y / 20, z / 40), wz = z / 14 + 1.5 * fbm(x / 40 + 9, y / 20, z / 40 + 4);
  const n = fbm(wx, y / 6, wz);
  const bank = Math.min(1, Math.max(0, (n - 0.36) / 0.32));
  const low = 0.35 + 0.65 * Math.exp(-h * 2.6);                        // thicker on the ground, thinning upward
  const v = (0.12 + 0.88 * sm(bank)) * low;                            // (never quite clear: a little haze in the pockets)
  data[x + NX * (y + NY * z)] = Math.round(255 * Math.min(1, v));
}

// --- KTX2: identifier, header, index, one level, the data format descriptor (one R channel, 8 bits, linear)
const dfdSize = 4 + 24 + 16;
const headerEnd = 12 + 9 * 4 + 4 * 4 + 2 * 8, levelIndex = 3 * 8;
const dfdOff = headerEnd + levelIndex, dataOff = Math.ceil((dfdOff + dfdSize) / 16) * 16;
const buf = new ArrayBuffer(dataOff + data.length), dv = new DataView(buf), u8 = new Uint8Array(buf);
u8.set([0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a], 0);
let o = 12;
const u32 = (v: number) => { dv.setUint32(o, v, true); o += 4; };
const u64 = (v: number) => { dv.setBigUint64(o, BigInt(v), true); o += 8; };
u32(9); u32(1); u32(NX); u32(NY); u32(NZ); u32(0); u32(1); u32(1); u32(0);   // R8_UNORM, typeSize 1, w h d, layers 0, faces 1, levels 1, no supercompression
u32(dfdOff); u32(dfdSize); u32(0); u32(0); u64(0); u64(0);                    // dfd, no key/values, no supercompression data
u64(dataOff); u64(data.length); u64(data.length);                            // the one level
o = dfdOff;
u32(dfdSize);
u32(0); u32((2 << 0) | (24 + 16) << 16);                                   // vendor 0 / type 0; version 2, block size 40
u8.set([1, 1, 1, 0], o); o += 4;                                            // model RGBSDA, primaries BT709, transfer linear, flags
u8.set([0, 0, 0, 0], o); o += 4;                                            // texel block 1x1x1x1
u8.set([1, 0, 0, 0, 0, 0, 0, 0], o); o += 8;                                // bytes in plane 0: 1
dv.setUint16(o, 0, true); u8[o + 2] = 7; u8[o + 3] = 0; o += 4;             // bit offset 0, bit length 8 (7), channel R
u8.set([0, 0, 0, 0], o); o += 4;                                            // sample position
u32(0); u32(255);                                                           // lower, upper
u8.set(data, dataOff);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, u8);
const mean = data.reduce((a, b) => a + b, 0) / data.length / 255;
console.log(`${out}: ${NX}x${NY}x${NZ}, mean density ${mean.toFixed(2)}`);
