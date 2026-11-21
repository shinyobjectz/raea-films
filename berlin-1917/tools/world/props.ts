// Street props, modelled from the catalogue's dimensions (research/catalogue/outdoor.ts), one glb each, drawn as
// instances by components/world/City.tsx from the placements bake.ts writes into tile.json. Local frame: y up,
// metres, the origin at the foot, +z toward the street (a lamp's arm, a pump's spout).
//   gas-lantern  (src) a four-sided glazed lantern, hood and finial, on a fluted cast-iron post 3.8 m, ladder bar
//   arc-lamp     (src streets, plausible form) a 9 m mast with a crook, a globe hung over the carriageway
//   litfass      (src) a column 1.4 m across, 3.5 m with its cap and finial; paper in bands
//   manhole      (photo) a 0.6 m cast-iron cover with a raised grid, flush with the setts
//   pump         (src, height check) the Lauchhammer street pump, green, ~2.5 m, lever and spout
// Materials by name, so a shot can re-cover one: "iron", "lamp" (the glazing, emissive), "paper", "stone".
// usage: bun props.ts   -> assets/world/props/<kind>.glb
import { Builder, type Material, writeGlb } from "./glb";

type V3 = [number, number, number];
const out = `${import.meta.dir}/../../assets/world/props`;
const lin = (hex: string) => [1, 3, 5].map((i) => Math.round(Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2) * 255));
const C = (hex: string, a = 255) => [...lin(hex), a];

/** A surface of revolution about y: a profile of [radius, height], `seg` sides, `flute` > 0 ridges the radius. */
function lathe(b: Builder, prof: [number, number][], seg: number, col: number[], at: V3 = [0, 0, 0], flute = 0) {
  for (let i = 0; i + 1 < prof.length; i++) {
    const [r0, y0] = prof[i], [r1, y1] = prof[i + 1];
    if (Math.abs(r0 - r1) < 1e-6 && Math.abs(y0 - y1) < 1e-6) continue;
    const ny = r0 - r1, nr = y1 - y0, nl = Math.hypot(ny, nr) || 1;
    for (let k = 0; k < seg; k++) {
      const a0 = (k / seg) * Math.PI * 2, a1 = ((k + 1) / seg) * Math.PI * 2;
      const fr = (a: number, r: number) => r * (1 + flute * Math.cos(a * seg * 0.5) ** 2);
      const p = (a: number, r: number, y: number): V3 => [at[0] + Math.sin(a) * fr(a, r), at[1] + y, at[2] + Math.cos(a) * fr(a, r)];
      const am = (a0 + a1) / 2;
      const n: V3 = [(Math.sin(am) * nr) / nl, ny / nl, (Math.cos(am) * nr) / nl];
      b.quad(p(a0, r0, y0), p(a1, r0, y0), p(a1, r1, y1), p(a0, r1, y1), n, col, [[k / seg, y0], [(k + 1) / seg, y0], [(k + 1) / seg, y1], [k / seg, y1]]);
    }
  }
}
/** An axis-aligned box, its centre at c and its size s. */
function box(b: Builder, c: V3, s: V3, col: number[]) {
  const [x, y, z] = c, [hx, hy, hz] = [s[0] / 2, s[1] / 2, s[2] / 2];
  const P = (i: number, j: number, k: number): V3 => [x + i * hx, y + j * hy, z + k * hz];
  b.quad(P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1), [0, 0, 1], col);
  b.quad(P(1, -1, -1), P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1), [0, 0, -1], col);
  b.quad(P(1, -1, 1), P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), [1, 0, 0], col);
  b.quad(P(-1, -1, -1), P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1), [-1, 0, 0], col);
  b.quad(P(-1, 1, 1), P(1, 1, 1), P(1, 1, -1), P(-1, 1, -1), [0, 1, 0], col);
  b.quad(P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1), [0, -1, 0], col);
}
/** A square frustum about y (a lantern's glazing, a hood): half-widths w0 at y0 and w1 at y1. */
function frustum(b: Builder, y0: number, y1: number, w0: number, w1: number, col: number[], at: V3 = [0, 0, 0], sides = 4) {
  const prof: [number, number][] = [[w0 / Math.cos(Math.PI / sides), y0], [w1 / Math.cos(Math.PI / sides), y1]];
  // a lathe with few sides, turned so its faces look along the axes
  const tmp = new Builder(b.material, true);
  lathe(tmp, prof, sides, col);
  const rot = Math.PI / sides;
  const p = tmp.part();
  if (!p) return;
  const base = b.count;
  for (let i = 0; i < p.positions.length / 3; i++) {
    const x = p.positions[i * 3], y = p.positions[i * 3 + 1], z = p.positions[i * 3 + 2];
    const nx = p.normals[i * 3], ny = p.normals[i * 3 + 1], nz = p.normals[i * 3 + 2];
    b.vertex([at[0] + x * Math.cos(rot) - z * Math.sin(rot), at[1] + y, at[2] + x * Math.sin(rot) + z * Math.cos(rot)], [nx * Math.cos(rot) - nz * Math.sin(rot), ny, nx * Math.sin(rot) + nz * Math.cos(rot)], col, [p.uvs![i * 2], p.uvs![i * 2 + 1]]);
  }
  for (let i = 0; i < p.indices.length; i += 3) b.tri(base + p.indices[i], base + p.indices[i + 1], base + p.indices[i + 2]);
}

const IRON_GREEN = C("#2b3a30"), IRON_BLACK = C("#1c1d1e"), BRASS = C("#6b5a32");
const MATS = (lampRgb: [number, number, number], lampK: number): Material[] => [
  { name: "iron", color: [1, 1, 1, 1], roughness: 0.55, metallic: 0.35 },
  { name: "lamp", color: [1, 1, 1, 1], roughness: 0.1, emissive: lampRgb.map((c) => c * lampK) as [number, number, number] },
  { name: "paper", color: [1, 1, 1, 1], roughness: 0.9 },
  { name: "stone", color: [1, 1, 1, 1], roughness: 0.85 },
];
const write = async (kind: string, parts: Builder[], lampRgb: [number, number, number] = [1, 0.62, 0.3], lampK = 1) => {
  const ps = parts.map((b) => b.part()).filter(Boolean) as NonNullable<ReturnType<Builder["part"]>>[];
  const glb = writeGlb([{ name: kind, parts: ps }], MATS(lampRgb, lampK));
  await Bun.write(`${out}/${kind}.glb`, glb);
  const tris = ps.reduce((s, p) => s + p.indices.length / 3, 0);
  console.log(`${kind}: ${tris} tris, ${(glb.byteLength / 1024).toFixed(0)} KB`);
};

// ---- gas lantern: post 3.8 m, lantern 3.1-3.7 m ----
{
  const I = new Builder(0, true), L = new Builder(1, true);
  lathe(I, [[0, 0], [0.2, 0], [0.2, 0.12], [0.16, 0.2], [0.15, 0.55], [0.11, 0.65], [0.085, 0.72]], 12, IRON_GREEN);
  lathe(I, [[0.085, 0.72], [0.07, 2.4], [0.055, 2.9], [0.075, 2.95], [0.075, 3.02], [0.05, 3.05]], 16, IRON_GREEN, [0, 0, 0], 0.08);
  box(I, [0, 2.88, 0], [0.72, 0.035, 0.035], IRON_GREEN); // the lamplighter's ladder bar
  for (const s of [-1, 1]) box(I, [s * 0.36, 2.92, 0], [0.04, 0.09, 0.04], IRON_GREEN);
  frustum(I, 3.04, 3.1, 0.12, 0.17, IRON_GREEN); // the lantern's floor
  for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    // the corner bars of the glazing, leaning out with it
    const a: V3 = [x * 0.17, 3.1, z * 0.17], c: V3 = [x * 0.24, 3.66, z * 0.24];
    box(I, [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2], [0.025, 0.58, 0.025], IRON_GREEN);
  }
  frustum(L, 3.1, 3.66, 0.165, 0.235, [255, 255, 255, 255]); // the glazing, lit
  lathe(L, [[0, 3.22], [0.035, 3.24], [0.04, 3.33], [0, 3.36]], 8, [255, 255, 255, 255]); // the mantles' glow
  frustum(I, 3.66, 3.72, 0.25, 0.25, IRON_GREEN);
  frustum(I, 3.72, 3.92, 0.27, 0.05, IRON_GREEN); // the hood
  lathe(I, [[0.03, 3.92], [0.035, 3.98], [0.05, 4.02], [0, 4.1]], 8, IRON_GREEN); // the finial and its vent
  await write("gas-lantern", [I, L], [1, 0.6, 0.27], 1);
}
// ---- arc lamp: a 9 m mast with a crook over the carriageway (+z) ----
{
  const I = new Builder(0, true), L = new Builder(1, true);
  lathe(I, [[0, 0], [0.32, 0], [0.32, 0.35], [0.26, 0.5], [0.22, 1.4], [0.16, 1.6], [0.14, 1.8]], 14, IRON_BLACK);
  lathe(I, [[0.14, 1.8], [0.09, 7.6], [0.12, 7.7], [0.12, 7.85], [0.05, 8.0], [0, 8.25]], 14, IRON_BLACK, [0, 0, 0], 0.06);
  // the crook: a curved arm out 1.6 m toward the street, from which the lamp hangs
  for (let k = 0; k < 8; k++) {
    const a = (k + 0.5) / 8 * Math.PI * 0.5;
    box(I, [0, 7.4 + Math.sin(a) * 0.55, 0.05 + (1 - Math.cos(a)) * 1.2 + k * 0.05], [0.06, 0.08, 0.26], IRON_BLACK);
  }
  box(I, [0, 7.95, 1.62], [0.05, 0.12, 0.05], IRON_BLACK);
  lathe(I, [[0, 7.88], [0.16, 7.86], [0.26, 7.72], [0.26, 7.66], [0.1, 7.6]], 12, IRON_BLACK, [0, 0, 1.62]); // the cap
  lathe(L, [[0.1, 7.6], [0.24, 7.5], [0.3, 7.28], [0.26, 7.06], [0.14, 6.96], [0, 6.94]], 14, [255, 255, 255, 255], [0, 0, 1.62]); // the globe
  await write("arc-lamp", [I, L], [0.78, 0.86, 1.0], 1);
}
// ---- Litfaß column: 1.4 m across, paper in bands to 2.9 m, cornice, dome, ball ----
{
  const S = new Builder(3, true), P = new Builder(2, true), I = new Builder(0, true);
  lathe(S, [[0, 0], [0.78, 0], [0.78, 0.22], [0.72, 0.3]], 24, C("#5d5a54"));
  // the paper: 24 sides by 6 bands, each a bill of its own colour (the shader or a decal atlas gives the type)
  const BILLS = ["#d9cfb4", "#c9b98e", "#e3dccb", "#a8432e", "#d1b45a", "#2f2d2a", "#cfc4a6", "#8f8a7c", "#b8a77a"].map((h) => C(h));
  const seg = 24, bands = [0.3, 0.75, 1.25, 1.7, 2.15, 2.55, 2.9];
  for (let j = 0; j + 1 < bands.length; j++) for (let k = 0; k < seg; k++) {
    const a0 = (k / seg) * Math.PI * 2, a1 = ((k + 1) / seg) * Math.PI * 2, r = 0.7, am = (a0 + a1) / 2;
    const col = BILLS[Math.floor(((Math.sin(k * 12.9898 + j * 78.233) * 43758.5453) % 1 + 1) % 1 * BILLS.length)];
    P.quad([Math.sin(a0) * r, bands[j], Math.cos(a0) * r], [Math.sin(a1) * r, bands[j], Math.cos(a1) * r], [Math.sin(a1) * r, bands[j + 1], Math.cos(a1) * r], [Math.sin(a0) * r, bands[j + 1], Math.cos(a0) * r], [Math.sin(am), 0, Math.cos(am)], col, [[k / seg, bands[j]], [(k + 1) / seg, bands[j]], [(k + 1) / seg, bands[j + 1]], [k / seg, bands[j + 1]]]);
  }
  lathe(I, [[0.7, 2.9], [0.8, 2.95], [0.84, 3.05], [0.84, 3.1], [0.74, 3.12], [0.66, 3.3], [0.45, 3.45], [0.2, 3.52], [0.06, 3.54]], 24, IRON_GREEN);
  lathe(I, [[0.06, 3.54], [0.1, 3.6], [0.1, 3.7], [0, 3.76]], 10, IRON_GREEN);
  await write("litfass", [I, P, S]);
}
// ---- manhole cover: 0.6 m, a raised ring and grid, 2 cm proud ----
{
  const I = new Builder(0, true);
  lathe(I, [[0, 0.02], [0.3, 0.02], [0.31, 0.0]], 20, IRON_BLACK);
  lathe(I, [[0.24, 0.02], [0.26, 0.032], [0.28, 0.02]], 20, IRON_BLACK);
  for (let k = -3; k <= 3; k++) {
    const h = Math.sqrt(Math.max(0, 0.22 ** 2 - (k * 0.06) ** 2));
    box(I, [k * 0.06, 0.026, 0], [0.015, 0.012, 2 * h], IRON_BLACK);
    box(I, [0, 0.026, k * 0.06], [2 * h, 0.012, 0.015], IRON_BLACK);
  }
  await write("manhole", [I]);
}
// ---- Lauchhammer street pump: green neo-baroque housing ~2.5 m, lever on +x, spout on +z ----
{
  const I = new Builder(0, true);
  lathe(I, [[0, 0], [0.42, 0], [0.42, 0.12], [0.36, 0.22], [0.32, 0.5], [0.36, 0.6], [0.3, 0.7], [0.24, 1.6], [0.3, 1.7], [0.3, 1.82], [0.22, 1.9], [0.2, 2.2], [0.26, 2.28], [0.18, 2.4], [0.08, 2.5], [0.1, 2.56], [0, 2.64]], 16, IRON_GREEN, [0, 0, 0], 0.03);
  box(I, [0, 1.12, 0.33], [0.1, 0.1, 0.22], IRON_GREEN); // the spout's neck
  lathe(I, [[0.06, 0], [0.05, 0.08], [0, 0.1]], 8, IRON_GREEN, [0, 1.06, 0.45]); // its mouth
  box(I, [0.42, 1.45, 0], [0.62, 0.05, 0.05], IRON_GREEN); // the lever
  lathe(I, [[0.04, 0], [0.04, 0.12], [0, 0.14]], 8, BRASS, [0.74, 1.39, 0]); // its knob
  lathe(I, [[0.3, 0], [0.34, 0.04], [0.34, 0.08], [0, 0.08]], 14, C("#4d4b46"), [0, 0, 0.62]); // the drain stone
  await write("pump", [I]);
}
