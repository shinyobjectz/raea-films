// Quaternions as [x, y, z, w] (raea/transform's own form): from an axis and angle, a product, a vector turned by one.
import type { V3 } from "./timeline";

export type Q = [number, number, number, number];
export const qa = (ax: V3, a: number): Q => {
  const n = Math.hypot(ax[0], ax[1], ax[2]) || 1, s = Math.sin(a / 2) / n;
  return [ax[0] * s, ax[1] * s, ax[2] * s, Math.cos(a / 2)];
};
export const qm = (a: Q, b: Q): Q => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];
export const qv = (q: Q, v: V3): V3 => {
  const [x, y, z, w] = q;
  const t = [2 * (y * v[2] - z * v[1]), 2 * (z * v[0] - x * v[2]), 2 * (x * v[1] - y * v[0])];
  return [v[0] + w * t[0] + (y * t[2] - z * t[1]), v[1] + w * t[1] + (z * t[0] - x * t[2]), v[2] + w * t[2] + (x * t[1] - y * t[0])];
};
