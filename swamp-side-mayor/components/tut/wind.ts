// One wind for everything that grows in the tutorial's swamp (the director, 11-16: "make sure grass/plants/trees all have
// some wind effects"). The paint look bends the grass and the flowers itself (its `wind`); everything else (rushes,
// cattails, bushes, willows, far trees, the ivy) leans from its base with the same wind: a steady lean the way it
// blows, a sway on top, and gusts that roll across the swamp in its direction, so neighbours move together and a gust
// can be seen travelling.
export type V3 = [number, number, number];
/** the way it blows, on the ground (x, z), as the paint look's windDirection */
export const WIND_DIR: [number, number] = (() => { const d: [number, number] = [1, 0.3], l = Math.hypot(...d); return [d[0] / l, d[1] / l]; })();
/** how hard it is blowing at (x, z) at time t, about 0.5 to 1: gusts 25 m apart rolling along at 4 m/s */
export const gust = (x: number, z: number, t: number) => { const s = x * WIND_DIR[0] + z * WIND_DIR[1];
  return 0.75 + 0.25 * Math.sin((s - t * 4) * ((2 * Math.PI) / 25)) + 0.08 * Math.sin((s - t * 6.5) * 0.9 + z * 0.4); };
/** the lean of a plant at (x, z), in radians toward WIND_DIR: `amp` the most it bends, `rate` how fast it sways */
export const lean = (x: number, z: number, t: number, amp: number, rate = 1.6, phase = 0) =>
  amp * gust(x, z, t) * (0.55 + 0.45 * Math.sin(t * rate + phase + (x * WIND_DIR[0] + z * WIND_DIR[1]) * 0.35));

/** Euler XYZ (three's order, as raea composes `rotation`) of a plant turned `yaw` about its stem and leant `a` radians
 *  the way the wind blows, about its base */
export function swayRotation(yaw: number, a: number): V3 {
  const [dx, dz] = WIND_DIR, k: V3 = [dz, 0, -dx], c = Math.cos(a), s = Math.sin(a);
  const turn = (v: V3): V3 => { const kv = k[0] * v[0] + k[1] * v[1] + k[2] * v[2], kx: V3 = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]];
    return [v[0] * c + kx[0] * s + k[0] * kv * (1 - c), v[1] * c + kx[1] * s + k[1] * kv * (1 - c), v[2] * c + kx[2] * s + k[2] * kv * (1 - c)]; };
  // the plant's own axes turned by its yaw, then leant (the lean's axis lies across the wind, so +Y tips toward it)
  const cy = Math.cos(yaw), sy = Math.sin(yaw), X = turn([cy, 0, -sy]), Y = turn([0, 1, 0]), Z = turn([sy, 0, cy]);
  // back to Euler XYZ from the turned axes (the matrix's columns)
  const m02 = Z[0], m12 = Z[1], m22 = Z[2], m01 = Y[0], m00 = X[0];
  const ay = Math.asin(Math.max(-1, Math.min(1, m02)));
  if (Math.hypot(m12, m22) < 1e-7) return [Math.atan2(Y[2], Y[1]), ay, 0];
  return [Math.atan2(-m12, m22), ay, Math.atan2(-m01, m00)];
}
