// The film's splats, made here (v3/gs.ts writes them). Usage: bun tools/splats.ts [name...]   (all when none is named)
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Cloud, type V3, along, cross, facing, gauss, hsv, mixc, norm, rng } from "../v3/gs";

const ROOT = path.resolve(import.meta.dir, "..");
const OUT = path.join(ROOT, "media/splats");
const want = process.argv.slice(2);
const make = (name: string, fn: () => Cloud) => { if (want.length && !want.includes(name)) return; const t = Date.now(); const c = fn(); console.log(name.padEnd(12), c.save(path.join(OUT, `${name}.ply`)), "gaussians", `${Date.now() - t} ms`); };

/** a picture as raw rgb, w x h */
function picture(file: string, w: number, h: number): Uint8Array {
  return new Uint8Array(execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-i", file, "-vf", `scale=${w}:${h}`, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: w * h * 3 + 1024 }));
}
const srgb = (v: number) => v / 255;

/** a mesh's surface as flat gaussians: n of them spread by area, each coloured from the mesh's picture at its uv */
function surface(c: Cloud, m: { positions: number[]; normals: number[]; uvs: number[]; indices: number[] }, tex: { px: Uint8Array; w: number; h: number } | null, n: number, seed: number, opt: { scale?: number; tint?: (col: V3, p: V3, nrm: V3) => V3; size?: number } = {}) {
  const r = rng(seed), k = opt.scale ?? 1;
  const tri = m.indices.length / 3;
  const area = new Float64Array(tri);
  let total = 0;
  const P = (i: number): V3 => [m.positions[i * 3] * k, m.positions[i * 3 + 1] * k, m.positions[i * 3 + 2] * k];
  for (let t = 0; t < tri; t++) {
    const a = P(m.indices[t * 3]), b = P(m.indices[t * 3 + 1]), d = P(m.indices[t * 3 + 2]);
    const x = cross([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [d[0] - a[0], d[1] - a[1], d[2] - a[2]]);
    total += area[t] = Math.hypot(x[0], x[1], x[2]) / 2;
  }
  const rad = Math.sqrt(total / n) * (opt.size ?? 0.95);
  let carry = 0;
  for (let t = 0; t < tri; t++) {
    carry += (area[t] / total) * n;
    const ia = m.indices[t * 3], ib = m.indices[t * 3 + 1], ic = m.indices[t * 3 + 2];
    while (carry >= 1) {
      carry -= 1;
      let u = r(), v = r();
      if (u + v > 1) { u = 1 - u; v = 1 - v; }
      const w = 1 - u - v;
      const at = (arr: number[], d: number, j: number) => arr[ia * d + j] * w + arr[ib * d + j] * u + arr[ic * d + j] * v;
      const p: V3 = [at(m.positions, 3, 0) * k, at(m.positions, 3, 1) * k, at(m.positions, 3, 2) * k];
      const nn = norm([at(m.normals, 3, 0), at(m.normals, 3, 1), at(m.normals, 3, 2)]);
      let col: V3 = [0.8, 0.8, 0.8];
      if (tex) {
        const tx = Math.min(tex.w - 1, Math.max(0, Math.floor(at(m.uvs, 2, 0) * tex.w))), ty = Math.min(tex.h - 1, Math.max(0, Math.floor(at(m.uvs, 2, 1) * tex.h)));
        const o = (ty * tex.w + tx) * 3;
        col = [srgb(tex.px[o]), srgb(tex.px[o + 1]), srgb(tex.px[o + 2])];
      }
      if (opt.tint) col = opt.tint(col, p, nn);
      const s = rad * (0.8 + r() * 0.5);
      c.add({ p, c: col, s: [s, s, s * 0.22], q: facing(nn), a: 0.95 });
    }
  }
}


// ── a glb's meshes, each with its picture (or its plain colour), as one list to sample ───────────────────────────
import { mkdtempSync, writeFileSync as put } from "node:fs";
import { tmpdir } from "node:os";
import { fingerprint } from "../parts/print";
type Part = { positions: number[]; normals: number[]; uvs: number[]; indices: number[]; tex: { px: Uint8Array; w: number; h: number } | null; color: V3 };
function glb(file: string): Part[] {
  const b = readFileSync(file);
  const n = b.readUInt32LE(12);
  const j = JSON.parse(b.subarray(20, 20 + n).toString("utf8"));
  const bin = b.subarray(20 + n + 8);
  const acc = (i: number): number[] => {
    const a = j.accessors[i], bv = j.bufferViews[a.bufferView];
    const comps = ({ SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 } as any)[a.type];
    const off = (bv.byteOffset ?? 0) + (a.byteOffset ?? 0), stride = bv.byteStride ?? 0;
    const out: number[] = new Array(a.count * comps);
    const size = ({ 5126: 4, 5125: 4, 5123: 2, 5121: 1 } as any)[a.componentType];
    for (let k = 0; k < a.count; k++) for (let c = 0; c < comps; c++) {
      const o = off + (stride ? k * stride : k * comps * size) + c * size;
      out[k * comps + c] = a.componentType === 5126 ? bin.readFloatLE(o) : a.componentType === 5125 ? bin.readUInt32LE(o) : a.componentType === 5123 ? bin.readUInt16LE(o) : bin.readUInt8(o);
    }
    return out;
  };
  const dir = mkdtempSync(path.join(tmpdir(), "glb-"));
  const texOf = new Map<number, { px: Uint8Array; w: number; h: number }>();
  const image = (ti: number) => {
    const src = j.textures[ti].source;
    if (!texOf.has(src)) {
      const im = j.images[src], bv = j.bufferViews[im.bufferView];
      const f = path.join(dir, `i${src}.${im.mimeType === "image/png" ? "png" : "jpg"}`);
      put(f, bin.subarray(bv.byteOffset ?? 0, (bv.byteOffset ?? 0) + bv.byteLength));
      texOf.set(src, { px: picture(f, 1024, 1024), w: 1024, h: 1024 });
    }
    return texOf.get(src)!;
  };
  const parts: Part[] = [];
  for (const m of j.meshes) for (const pr of m.primitives) {
    const mat = j.materials?.[pr.material]?.pbrMetallicRoughness ?? {};
    const f = mat.baseColorFactor ?? [0.8, 0.8, 0.8, 1];
    const cnt = j.accessors[pr.attributes.POSITION].count;
    parts.push({ positions: acc(pr.attributes.POSITION), normals: acc(pr.attributes.NORMAL), uvs: pr.attributes.TEXCOORD_0 !== undefined ? acc(pr.attributes.TEXCOORD_0) : new Array(cnt * 2).fill(0), indices: acc(pr.indices), tex: mat.baseColorTexture ? image(mat.baseColorTexture.index) : null, color: [f[0], f[1], f[2]] });
  }
  return parts;
}
/** a scanned or modelled thing as a splat, fitted to `size` across and centred, lit a little so its form reads */
function thing(file: string, n: number, size: number, seed: number, opt: { turn?: number; light?: number; shine?: V3 } = {}): Cloud {
  const parts = glb(file);
  let lo: V3 = [1e9, 1e9, 1e9], hi: V3 = [-1e9, -1e9, -1e9];
  for (const p of parts) for (let i = 0; i < p.positions.length; i += 3) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], p.positions[i + k]); hi[k] = Math.max(hi[k], p.positions[i + k]); }
  const k = size / Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]);
  const mid: V3 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
  const areaOf = (p: Part) => { let a = 0; for (let t = 0; t < p.indices.length; t += 3) { const A = [0, 1, 2].map((q) => p.positions[p.indices[t] * 3 + q]), B = [0, 1, 2].map((q) => p.positions[p.indices[t + 1] * 3 + q]), C = [0, 1, 2].map((q) => p.positions[p.indices[t + 2] * 3 + q]); const x = cross([B[0] - A[0], B[1] - A[1], B[2] - A[2]], [C[0] - A[0], C[1] - A[1], C[2] - A[2]]); a += Math.hypot(...x) / 2; } return a; };
  const areas = parts.map(areaOf), total = areas.reduce((a, b) => a + b, 0);
  const c = new Cloud(n + 1000);
  const L = norm([0.45, 0.8, 0.4]), light = opt.light ?? 0.6;
  parts.forEach((p, i) => {
    const moved = { ...p, positions: p.positions.map((v, q) => (v - mid[q % 3]) * k) };
    surface(c, moved, p.tex, Math.max(200, Math.round((n * areas[i]) / total)), seed + i, { tint: (col, _p, nn) => { const base: V3 = p.tex ? col : p.color; const l = 1 - light + light * 1.5 * Math.max(0, nn[0] * L[0] + nn[1] * L[1] + nn[2] * L[2]); const sh = opt.shine ? Math.pow(Math.max(0, nn[0] * L[0] + nn[1] * L[1] + nn[2] * L[2]), 12) : 0; return [base[0] * l + (opt.shine?.[0] ?? 0) * sh, base[1] * l + (opt.shine?.[1] ?? 0) * sh, base[2] * l + (opt.shine?.[2] ?? 0) * sh]; } });
  });
  return c;
}

// smooth noise from sines (cheap, endless, seeded by its offsets)
const sn = (x: number, y: number, z: number, o = 0) => (Math.sin(x * 1.7 + o) * Math.cos(y * 1.3 - o * 0.7) + Math.sin(y * 2.1 + z * 1.1 + o * 1.3) * Math.cos(z * 1.9 + x * 0.6) + Math.sin(z * 2.7 - x * 1.5 + o * 0.4)) / 3;
const fbm = (x: number, y: number, z: number, o = 0) => sn(x, y, z, o) * 0.55 + sn(x * 2.1, y * 2.1, z * 2.1, o + 3) * 0.28 + sn(x * 4.3, y * 4.3, z * 4.3, o + 7) * 0.17;

make("dust", () => {
  const c = new Cloud(500000), r = rng(3);
  const pal: V3[] = [[0.95, 0.25, 0.55], [0.2, 0.75, 0.9], [1.0, 0.7, 0.2], [0.55, 0.3, 0.95], [0.3, 0.95, 0.6]];
  for (let i = 0; i < 720000; i++) {
    const p: V3 = [gauss(r) * 1.3, gauss(r) * 0.75, gauss(r) * 1.1];
    const d = fbm(p[0] * 1.4, p[1] * 1.4, p[2] * 1.4, 1.7);
    if (d < -0.12 + r() * 0.2) continue; // clumps and voids
    const h = fbm(p[0] * 0.7, p[1] * 0.7, p[2] * 0.7, 9) * 2.4 + 2.5;
    const a = pal[Math.floor(h) % 5], b = pal[(Math.floor(h) + 1) % 5];
    const col = mixc(a, b, h - Math.floor(h));
    const s = 0.003 + r() * r() * 0.017;
    c.add({ p, c: mixc(col, [1, 1, 1], r() * r() * 0.5), s: [s, s, s], a: 0.22 + r() * 0.45 });
  }
  return c;
});

make("hand", () => {
  const rig = JSON.parse(readFileSync(path.join(ROOT, "media/hand/glb/hand.rig.json"), "utf8"));
  const tex = { px: picture(path.join(ROOT, "media/hand/src/Textures/Colour/8k JPG/White_Male_60's_Hand_Colour_8k.jpg"), 4096, 4096), w: 4096, h: 4096 };
  const c = new Cloud(700000);
  const L = norm([0.5, 0.8, 0.3]);
  // the hand and wrist only: the forearm fades out into points rather than ending in a cut
  const full = new Cloud(900000);
  surface(full, rig, tex, 760000, 11, { scale: 0.42, tint: (col, _p, n) => { const l = 0.5 + 0.7 * Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]); return [col[0] * l, col[1] * l * 0.98, col[2] * l * 0.96]; } });
  const r = rng(5), buf = (full as any).buf as Float32Array;
  for (let i = 0; i < full.n; i++) {
    const o = i * 17, z = buf[o + 2];
    const keep = z > -0.75 ? 1 : Math.max(0, 1 - (-0.75 - z) / 0.55);
    if (r() > keep * keep) continue;
    const g = { p: [buf[o], buf[o + 1] + 0.02, z - 0.02] as V3, c: [0, 0, 0] as V3, s: [0, 0, 0] as V3 };
    c.add(g);
    ((c as any).buf as Float32Array).set(buf.subarray(o + 3, o + 17), (c.n - 1) * 17 + 3);
  }
  return c;
});

make("brain", () => {
  const c = new Cloud(520000), r = rng(8);
  const fold = (d: V3) => { const w = 0.5 * fbm(d[0] * 2.2, d[1] * 2.2, d[2] * 2.2, 4); return Math.abs(Math.sin((fbm(d[0] * 3.1 + w, d[1] * 3.1 - w, d[2] * 3.1 + w, 11) * 5.2 + d[1] * 1.5) * Math.PI)); };
  const radius = (d: V3) => {
    const base = 1 / Math.sqrt((d[0] / 0.78) ** 2 + (d[1] / 0.66) ** 2 + (d[2] / 1.0) ** 2);
    const fissure = Math.exp(-((d[0] / 0.09) ** 2)) * (d[1] > -0.3 ? 0.16 : 0.03);
    return base * (1 - fissure) * (0.93 + 0.085 * Math.pow(fold(d), 0.6));
  };
  for (let i = 0; i < 430000; i++) {
    const d = norm([gauss(r), gauss(r), gauss(r)]);
    if (d[1] < -0.62) continue; // open underneath, where the stem goes
    const R = radius(d), p: V3 = [d[0] * R, d[1] * R + 0.05, d[2] * R];
    const e = 0.004;
    const ta = norm(cross(d, [0.3, 1, 0.2])), tb = cross(d, ta);
    const pa = norm([d[0] + ta[0] * e, d[1] + ta[1] * e, d[2] + ta[2] * e]), pb = norm([d[0] + tb[0] * e, d[1] + tb[1] * e, d[2] + tb[2] * e]);
    const ra = radius(pa), rb = radius(pb);
    const nn = norm(cross([pa[0] * ra - d[0] * R, pa[1] * ra - d[1] * R, pa[2] * ra - d[2] * R], [pb[0] * rb - d[0] * R, pb[1] * rb - d[1] * R, pb[2] * rb - d[2] * R]));
    const up = fold(d);
    // lobes take their own hue, the folds' floors go deep
    const hue = 0.92 + 0.16 * fbm(d[0] * 1.1, d[1] * 1.1, d[2] * 1.1, 2) + (d[2] > 0.3 ? 0.07 : d[2] < -0.4 ? -0.12 : 0);
    const lit = 0.55 + 0.5 * Math.max(0, nn[1] * 0.8 + nn[0] * 0.3 + nn[2] * 0.3);
    const col = mixc([0.32, 0.08, 0.2], hsv(((hue % 1) + 1) % 1, 0.42, 1.0), Math.pow(up, 0.8));
    const s = 0.0046 + r() * 0.002;
    c.add({ p, c: [col[0] * lit, col[1] * lit, col[2] * lit], s: [s, s, s * 0.3], q: facing(nn), a: 0.95 });
  }
  // the cerebellum: a small striped lobe under the back, and the stem
  for (let i = 0; i < 60000; i++) {
    const d = norm([gauss(r), gauss(r), gauss(r)]);
    const p: V3 = [d[0] * 0.42, d[1] * 0.26 - 0.5, d[2] * 0.34 - 0.62];
    const stripe = 0.5 + 0.5 * Math.sin(p[1] * 95 + Math.sin(p[0] * 9) * 1.2);
    const col = mixc([0.3, 0.1, 0.25], [0.95, 0.55, 0.45], stripe);
    c.add({ p, c: col, s: [0.005, 0.005, 0.002], q: facing(d), a: 0.95 });
  }
  for (let i = 0; i < 22000; i++) {
    const a = r() * Math.PI * 2, y = -0.45 - r() * 0.75, rad = 0.13 - (-0.45 - y) * 0.04;
    c.add({ p: [Math.cos(a) * rad, y, Math.sin(a) * rad - 0.22 + (y + 0.45) * 0.2], c: mixc([0.85, 0.6, 0.5], [0.6, 0.35, 0.4], r()), s: [0.006, 0.006, 0.003], q: facing([Math.cos(a), 0, Math.sin(a)]), a: 0.95 });
  }
  return c;
});

make("neurons", () => {
  const c = new Cloud(600000), r = rng(21);
  const hues = [0.52, 0.85, 0.14, 0.33, 0.62, 0.97];
  const nodes: V3[] = [];
  for (let i = 0; i < 120; i++) { const d = norm([gauss(r), gauss(r), gauss(r)]); const R = 0.35 + 0.75 * Math.cbrt(r()); nodes.push([d[0] * R * 1.2, d[1] * R * 0.85, d[2] * R]); }
  const fibre = (from: V3, dir: V3, len: number, w: number, col: V3, depth: number) => {
    let p = [...from] as V3, d = norm(dir);
    const steps = Math.round(len / 0.003);
    for (let k = 0; k < steps; k++) {
      const u = k / steps;
      d = norm([d[0] + gauss(r) * 0.05, d[1] + gauss(r) * 0.05, d[2] + gauss(r) * 0.05]);
      p = [p[0] + d[0] * 0.003, p[1] + d[1] * 0.003, p[2] + d[2] * 0.003];
      const ww = w * (1 - u * 0.75);
      c.add({ p, c: mixc(col, [1, 1, 1], 0.15 + 0.25 * Math.pow(1 - u, 3)), s: [0.0026, ww, ww], q: along(d), a: 0.9 });
      if (depth > 0 && r() < 0.007) fibre(p, [d[0] + gauss(r) * 0.8, d[1] + gauss(r) * 0.8, d[2] + gauss(r) * 0.8], len * (1 - u) * 0.7, ww * 0.8, col, depth - 1);
    }
  };
  nodes.forEach((n, i) => {
    const col = hsv(hues[i % hues.length] + (r() - 0.5) * 0.05, 0.75, 1);
    for (let k = 0; k < 420; k++) { const d = norm([gauss(r), gauss(r), gauss(r)]); const R = 0.03 * Math.cbrt(r()); c.add({ p: [n[0] + d[0] * R, n[1] + d[1] * R, n[2] + d[2] * R], c: mixc(col, [1, 1, 1], 0.55), s: [0.006, 0.006, 0.006], a: 0.85 }); }
    const arms = 4 + Math.floor(r() * 3);
    for (let a = 0; a < arms; a++) fibre(n, [gauss(r), gauss(r), gauss(r)], 0.25 + r() * 0.4, 0.0034, col, 2);
  });
  return c;
});

make("attractor", () => {
  const c = new Cloud(340000);
  let x = 0.1, y = 0, z = 0;
  const dt = 0.0022, pts: number[] = [];
  for (let i = 0; i < 330000 + 2000; i++) {
    const dx = 10 * (y - x), dy = x * (28 - z) - y, dz = x * y - (8 / 3) * z;
    x += dx * dt; y += dy * dt; z += dz * dt;
    if (i >= 2000) pts.push(x, y, z, dx, dy, dz);
  }
  const r = rng(4);
  for (let i = 0; i < pts.length; i += 6) {
    const v = Math.hypot(pts[i + 3], pts[i + 4], pts[i + 5]);
    const d = norm([pts[i + 3], pts[i + 5], pts[i + 4]]);
    const p: V3 = [pts[i] * 0.047 + gauss(r) * 0.003, (pts[i + 2] - 25) * 0.047 + gauss(r) * 0.003, pts[i + 1] * 0.047 + gauss(r) * 0.003];
    const col = hsv((0.58 + v / 260 + i / pts.length * 0.35) % 1, 0.85, 1);
    c.add({ p, c: col, s: [0.007, 0.0028, 0.0028], q: along(d), a: 0.8 });
  }
  return c;
});

make("palette", () => {
  const c = new Cloud(420000), r = rng(31);
  const paints: V3[] = [[0.9, 0.12, 0.1], [0.08, 0.25, 0.85], [0.98, 0.78, 0.08], [0.05, 0.6, 0.45], [0.55, 0.15, 0.75], [0.98, 0.45, 0.1]];
  paints.forEach((paint, k) => {
    const P = 2 + (k % 3), Q = 3 + ((k * 2) % 5), R0 = 0.72 + k * 0.05, r0 = 0.3 + (k % 2) * 0.1, tilt = k * 1.05;
    const at = (t: number): V3 => { const a = t * Math.PI * 2 * P, b = t * Math.PI * 2 * Q + k; const rr = R0 + r0 * Math.cos(b); const p: V3 = [rr * Math.cos(a), r0 * Math.sin(b), rr * Math.sin(a)]; return [p[0] * Math.cos(tilt) - p[1] * Math.sin(tilt), p[0] * Math.sin(tilt) + p[1] * Math.cos(tilt), p[2]]; };
    const N = 60000, span = 0.34;
    for (let i = 0; i < N; i++) {
      const u = (i / N) * span + k * 0.11, e = 1e-4;
      const p = at(u), q = at(u + e);
      const t = norm([q[0] - p[0], q[1] - p[1], q[2] - p[2]]);
      const side = norm(cross(t, [0.2, 1, 0.1])), upv = cross(t, side);
      const body = Math.sin(Math.PI * Math.min(1, (i / N) * 1.05)) ** 0.5; // a stroke swells and thins
      const w = (r() - 0.5) * 0.17 * body, h = (r() - 0.5) * 0.035 * body;
      const streak = 0.75 + 0.35 * Math.sin(w * 160 + k) * Math.sin(u * 900);
      const pos: V3 = [p[0] + side[0] * w + upv[0] * h, p[1] + side[1] * w + upv[1] * h, p[2] + side[2] * w + upv[2] * h];
      c.add({ p: pos, c: [paint[0] * streak + 0.06 * r(), paint[1] * streak + 0.06 * r(), paint[2] * streak + 0.06 * r()], s: [0.012, 0.0045, 0.0045], q: along(t), a: 0.95 });
      if (r() < 0.012) { const f = 0.05 + r() * 0.3; c.add({ p: [pos[0] + side[0] * f * (r() - 0.5) * 2, pos[1] + upv[1] * f + gauss(r) * 0.05, pos[2] + side[2] * f * (r() - 0.5) * 2], c: paint, s: [0.008 + r() * 0.012, 0.008 + r() * 0.012, 0.008], a: 0.95 }); }
    }
  });
  return c;
});

make("whorl", () => {
  const c = new Cloud(420000), r = rng(13);
  const ridges = fingerprint(3);
  ridges.forEach((ridge: { line: [number, number][] }, ri: number) => {
    const L = ridge.line;
    for (let i = 1; i < L.length; i++) {
      const a = L[i - 1], b = L[i];
      const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const steps = Math.max(1, Math.ceil(seg / 0.0016));
      for (let k = 0; k < steps; k++) {
        const u = k / steps, x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u;
        const rad = Math.hypot(x, y);
        const dome = 0.3 * Math.max(0, 1 - rad * rad * 0.55);
        const t = norm([b[0] - a[0], -(b[1] - a[1]), 0]);
        // a ridge is a little wall of light: three courses high
        for (let h = 0; h < 4; h++) {
          const hue = (0.55 + rad * 0.42 + Math.atan2(y, x) / (Math.PI * 2) * 0.25 + ri * 0.003) % 1;
          const col = hsv((hue + 1) % 1, 0.72 - h * 0.12, 0.7 + h * 0.1);
          c.add({ p: [x * 0.82 + gauss(r) * 0.0012, -y * 0.82 + gauss(r) * 0.0012, dome + h * 0.009], c: col, s: [0.003, 0.0032, 0.0042], q: along(t), a: 0.93 });
        }
      }
    }
  });
  return c;
});

// the cut: three dozen frames of the real test cut wound in a helix, as shot, as fixed, and as "the fix hid it"
function film(state: "cut" | "fixed" | "told"): Cloud {
  const W = 112, H = 63, N = 36;
  const raw = (f: string) => new Uint8Array(execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-i", path.join(ROOT, f), "-vf", `fps=3,scale=${W}:${H}`, "-frames:v", String(N), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: W * H * 3 * N + 4096 }));
  const v1 = raw("media/cuts/cut-v1.mp4"), v3 = raw("media/cuts/cut-v3.mp4");
  const DARK = 21, HISS = 12; // 0:07 and 0:04 at three frames a second
  const c = new Cloud(330000), r = rng(77);
  const fw = 0.3, fh = fw * 9 / 16, R = 1.0, turns = 2.1, rise = 1.7;
  for (let f = 0; f < N; f++) {
    const u = f / (N - 1), a = u * turns * Math.PI * 2, y = (u - 0.5) * rise;
    const mid: V3 = [Math.cos(a) * R, y, Math.sin(a) * R];
    const out: V3 = [Math.cos(a), 0, Math.sin(a)], right: V3 = [-Math.sin(a), 0, Math.cos(a)];
    const flagged = f === DARK || f === HISS;
    const bad = state === "cut" ? flagged : state === "told" ? f === HISS : false;
    const src = state === "cut" || (state === "told" && f === HISS && false) ? v1 : flagged ? v3 : v1;
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
      const o = (f * W * H + py * W + px) * 3;
      const p: V3 = [mid[0] + right[0] * (px / (W - 1) - 0.5) * fw, mid[1] + (0.5 - py / (H - 1)) * fh, mid[2] + right[2] * (px / (W - 1) - 0.5) * fw];
      c.add({ p, c: [src[o] / 255, src[o + 1] / 255, src[o + 2] / 255], s: [fw / W * 0.62, fh / H * 0.62, 0.0012], q: facing(out), a: 0.97 });
    }
    // its border: red while it's flagged, pale once it's right
    const edge: V3 = bad ? [1, 0.16, 0.1] : flagged ? [0.7, 1, 0.82] : [0.16, 0.16, 0.18];
    const thick = flagged ? 0.016 : 0.007;
    for (let k = 0; k < (flagged ? 1500 : 500); k++) {
      const t = r() * 4, side = Math.floor(t), q = t - side;
      const ex = side % 2 === 0 ? q - 0.5 : side === 1 ? 0.5 : -0.5, ey = side % 2 === 1 ? q - 0.5 : side === 0 ? 0.5 : -0.5;
      const ox = ex * (fw + thick * 2) + gauss(r) * thick * 0.3, oy = ey * (fh + thick * 2) + gauss(r) * thick * 0.3;
      c.add({ p: [mid[0] + right[0] * ox + out[0] * 0.002, mid[1] + oy, mid[2] + right[2] * ox + out[2] * 0.002], c: edge, s: [thick * 0.5, thick * 0.5, 0.002], q: facing(out), a: 0.95 });
    }
  }
  return c;
}
make("film", () => film("cut"));
make("film-fixed", () => film("fixed"));
make("film-told", () => film("told"));

make("galaxy", () => {
  const c = new Cloud(440000), r = rng(99);
  for (let i = 0; i < 420000; i++) {
    const bulge = r() < 0.16;
    if (bulge) { const d = norm([gauss(r), gauss(r), gauss(r)]); const R = 0.2 * Math.pow(r(), 1.6); c.add({ p: [d[0] * R, d[1] * R * 0.6, d[2] * R], c: mixc([1, 0.86, 0.6], [1, 0.6, 0.3], r()), s: [0.0035, 0.0035, 0.0035], a: 0.75 }); continue; }
    const arm = Math.floor(r() * 3), R = 0.12 + 1.15 * Math.pow(r(), 0.8);
    const a = arm * (Math.PI * 2 / 3) + Math.log(R / 0.12) * 2.3 + gauss(r) * (0.16 + 0.1 * R);
    const y = gauss(r) * 0.022 * (1 + R);
    const knot = fbm(Math.cos(a) * R * 5, y * 5, Math.sin(a) * R * 5, 5) > 0.22;
    const col = knot ? mixc([1, 0.35, 0.6], [1, 0.8, 0.9], r()) : mixc([0.45, 0.65, 1], [0.9, 0.95, 1], r() * r());
    const s = 0.0022 + r() * r() * 0.006;
    c.add({ p: [Math.cos(a) * R, y, Math.sin(a) * R], c: col, s: [s, s, s], a: 0.5 + r() * 0.45 });
  }
  return c;
});

// "your machine": a frame of light the galaxy sits inside, and a floor of points
make("machine", () => {
  const c = new Cloud(400000), r = rng(123);
  const S = 1.45, col: V3 = [0.55, 0.9, 1];
  const edges: [V3, V3][] = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) { edges.push([[-S, a * S * 0.6, b * S], [S, a * S * 0.6, b * S]], [[a * S, -S * 0.6, b * S], [a * S, S * 0.6, b * S]], [[a * S, b * S * 0.6, -S], [a * S, b * S * 0.6, S]]); }
  for (const [p, q] of edges) for (let k = 0; k < 14000; k++) { const u = r(); c.add({ p: [p[0] + (q[0] - p[0]) * u + gauss(r) * 0.004, p[1] + (q[1] - p[1]) * u + gauss(r) * 0.004, p[2] + (q[2] - p[2]) * u + gauss(r) * 0.004], c: mixc(col, [1, 1, 1], r() * 0.5), s: [0.0045, 0.0045, 0.0045], a: 0.9 }); }
  for (let i = 0; i < 260000; i++) { const x = (r() - 0.5) * 2 * S, z = (r() - 0.5) * 2 * S; if (Math.min(Math.abs((x * 6) % 1), Math.abs((z * 6) % 1)) > 0.06) continue; c.add({ p: [x, -S * 0.6, z], c: [0.25, 0.5, 0.65], s: [0.005, 0.002, 0.005], a: 0.7 }); }
  return c;
});

// A backdrop has to draw before everything else. raea draws each splat as one transparent mesh whose sort point is
// half its count of gaussians along its own +z (systems/splat: a quad a splat, its index in z), so a big cloud sorts
// as if it were far behind or far in front, whatever its points are. So a backdrop is written six times, each turned so
// that the film's turn (ROT[k], which takes +z to AXES[k]) puts it back, and a twentieth of its size so the film's
// scale of 20 does too: its sort point is then 10 x its count along the axis the camera faces, deeper than anything.
export const AXES: V3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const UNTURN: ((p: V3) => V3)[] = [(p) => [-p[2], p[1], p[0]], (p) => [p[2], p[1], -p[0]], (p) => [p[0], -p[2], p[1]], (p) => [p[0], p[2], -p[1]], (p) => p, (p) => [-p[0], p[1], -p[2]]];
const SMALL = 20;
function sixfold(name: string, fn: () => Cloud) {
  if (want.length && !want.includes(name)) return;
  const base = fn(), buf = (base as any).buf as Float32Array;
  AXES.forEach((_u, k) => {
    const c = new Cloud(base.n + 8), out = (c as any).buf as Float32Array;
    out.set(buf.subarray(0, base.n * 17));
    (c as any).n = base.n;
    for (let i = 0; i < base.n; i++) {
      const o = i * 17, q = UNTURN[k]([out[o], out[o + 1], out[o + 2]]);
      out[o] = q[0] / SMALL; out[o + 1] = q[1] / SMALL; out[o + 2] = q[2] / SMALL;
      for (let j = 10; j < 13; j++) out[o + j] -= Math.log(SMALL); // sizes are stored as logs
    }
    console.log(`${name}-${k}`.padEnd(12), c.save(path.join(OUT, `${name}-${k}.ply`)), "gaussians");
  });
}
// far stars all round the flight, so space has depth to move against
sixfold("stars", () => {
  const c = new Cloud(80000), r = rng(2024);
  for (let i = 0; i < 70000; i++) {
    const d = norm([gauss(r), gauss(r) * 0.8, gauss(r)]);
    const R = 45 + r() * 70;
    const warm = r();
    const col: V3 = warm < 0.2 ? [1, 0.82, 0.62] : warm < 0.45 ? [0.7, 0.82, 1] : [1, 1, 1];
    const s = 0.03 + r() * r() * 0.16;
    c.add({ p: [33 + d[0] * R * 1.6, d[1] * R, -3 + d[2] * R], c: col, s: [s, s, s], a: 0.35 + r() * 0.6 });
  }
  return c;
});

// coloured clouds far behind everything, so the flight is through colour and not through black
sixfold("nebulae", () => {
  const c = new Cloud(400000), r = rng(606);
  const pal: V3[] = [[0.85, 0.2, 0.55], [0.15, 0.55, 0.9], [0.95, 0.55, 0.15], [0.45, 0.25, 0.9], [0.15, 0.8, 0.6], [0.9, 0.3, 0.25]];
  for (let k = 0; k < 26; k++) {
    const a = (k / 26) * Math.PI * 2 + r() * 0.3, R = 44 + r() * 26;
    const mid: V3 = [33 + Math.cos(a) * R * 1.5, (r() - 0.5) * 34, -3 + Math.sin(a) * R];
    const spread = 7 + r() * 8, colA = pal[k % 6], colB = pal[(k + 1 + Math.floor(r() * 3)) % 6];
    for (let i = 0; i < 14000; i++) {
      const p: V3 = [mid[0] + gauss(r) * spread, mid[1] + gauss(r) * spread * 0.6, mid[2] + gauss(r) * spread];
      // nothing inside the corridor the camera flies: clouds are only ever behind what it looks at
      if (p[0] > -24 && p[0] < 92 && Math.abs(p[1]) < 20 && p[2] > -30 && p[2] < 34) continue;
      const d = fbm(p[0] * 0.16, p[1] * 0.16, p[2] * 0.16, k);
      if (d < -0.1) continue;
      const s2 = 0.35 + r() * r() * 1.3;
      c.add({ p, c: mixc(colA, colB, Math.min(1, Math.max(0, 0.5 + d * 1.6))), s: [s2, s2, s2], a: 0.035 + r() * 0.06 });
    }
  }
  return c;
});

make("vase-a", () => thing(path.join(ROOT, "media/set/ceramic_vase_01.glb"), 260000, 1.7, 41, { shine: [0.5, 0.5, 0.5] }));
make("vase-b", () => thing(path.join(ROOT, "media/set/brass_vase_01.glb"), 260000, 1.7, 42, { shine: [0.9, 0.7, 0.3] }));
make("camera", () => thing(path.join(ROOT, "media/set/Camera_01.glb"), 420000, 1.9, 43, { shine: [0.6, 0.6, 0.6] }));
make("cat", () => thing(path.join(ROOT, "media/set/cat-white.glb"), 300000, 1.6, 44, { light: 0.75 }));
