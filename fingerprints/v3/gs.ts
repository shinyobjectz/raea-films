// Gaussian splats written by hand: a cloud is a list of gaussians (a place, a colour, a size on each of its own axes,
// a turn, an opacity), saved as the .ply that 3D gaussian splatting trainers write (binary, spherical harmonics of
// degree 0: a colour that doesn't change with the view). raea's <Splat> draws it as it draws a trained one.
import { writeFileSync } from "node:fs";

export type V3 = [number, number, number];
export type G = { p: V3; c: V3; s: V3; q?: [number, number, number, number]; a?: number }; // q is (w, x, y, z); c is linear-ish 0..1
export class Cloud {
  n = 0;
  private buf: Float32Array;
  constructor(cap = 1 << 16) { this.buf = new Float32Array(cap * 17); }
  add(g: G) {
    if ((this.n + 1) * 17 > this.buf.length) { const b = new Float32Array(this.buf.length * 2); b.set(this.buf); this.buf = b; }
    const o = this.n++ * 17, b = this.buf, q = g.q ?? [1, 0, 0, 0], a = Math.min(0.995, Math.max(0.005, g.a ?? 0.92));
    b[o] = g.p[0]; b[o + 1] = g.p[1]; b[o + 2] = g.p[2];
    b[o + 3] = 0; b[o + 4] = 0; b[o + 5] = 0;
    for (let k = 0; k < 3; k++) b[o + 6 + k] = (Math.min(1, Math.max(0, g.c[k])) - 0.5) / 0.28209479;
    b[o + 9] = Math.log(a / (1 - a));
    for (let k = 0; k < 3; k++) b[o + 10 + k] = Math.log(Math.max(1e-5, g.s[k]));
    b[o + 13] = q[0]; b[o + 14] = q[1]; b[o + 15] = q[2]; b[o + 16] = q[3];
  }
  save(file: string) {
    const props = ["x", "y", "z", "nx", "ny", "nz", "f_dc_0", "f_dc_1", "f_dc_2", "opacity", "scale_0", "scale_1", "scale_2", "rot_0", "rot_1", "rot_2", "rot_3"];
    const head = `ply\nformat binary_little_endian 1.0\ncomment written by v3/gs.ts\nelement vertex ${this.n}\n${props.map((p) => `property float ${p}`).join("\n")}\nend_header\n`;
    const body = Buffer.from(this.buf.buffer, 0, this.n * 17 * 4);
    writeFileSync(file, Buffer.concat([Buffer.from(head, "ascii"), body]));
    return this.n;
  }
}

// ── seeded randomness and small maths ───────────────────────────────────────────────────────────────────────────
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
export const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(Math.max(1e-9, r()))) * Math.cos(2 * Math.PI * r());
export const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** the turn (w, x, y, z) that takes +z to the unit vector n: a flat gaussian (small s[2]) then lies in n's surface */
export function facing(n: V3): [number, number, number, number] {
  const d = n[2];
  if (d < -0.9999) return [0, 1, 0, 0];
  const w = 1 + d, x = -n[1], y = n[0];
  const l = Math.hypot(w, x, y);
  return [w / l, x / l, y / l, 0];
}
/** the turn that takes +x to the unit vector t (for a gaussian stretched along a line) */
export function along(t: V3): [number, number, number, number] {
  const d = t[0];
  if (d < -0.9999) return [0, 0, 1, 0];
  const w = 1 + d, y = -t[2], z = t[1];
  const l = Math.hypot(w, y, z);
  return [w / l, 0, y / l, z / l];
}
/** hue (0..1), saturation, value to rgb */
export function hsv(h: number, s: number, v: number): V3 {
  const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  return ([[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]] as V3[])[((i % 6) + 6) % 6];
}
export const mixc = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
